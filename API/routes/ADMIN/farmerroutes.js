// Farmer records for the admin portal (mounted at /admin/farmers, behind requireAdmin)
const express = require('express')
const db =require('../../config/db.js')
const { canEdit } = require('../../middleware/requireAdmin.js')
const { validateSriLankanMobile } = require('../../services/smsService.js')
const {
  FARMER_COLUMNS, ADMIN_UPDATABLE_FIELDS, validateFarmerChanges, updateFarmer, hashNic
} = require('../../services/userService.js')
const { validateFarm, saveFarm, getFarm, withTransaction } = require('../../services/farmService.js')
const { sendDbError } = require('./dbErrors.js')

const farmerrouter = express.Router()

const F_COLUMNS = FARMER_COLUMNS.split(',').map(column => `f.${column.trim()}`).join(', ')
const FARM_FIELDS = ['water_source', 'water_name', 'location_label', 'crops']
const MAX_PAGE_SIZE = 200

function paging(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), MAX_PAGE_SIZE)
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  return { limit, page, offset: (page - 1) * limit }
}

// GET /admin/farmers?q=&district=&reservoir_id=&tank_id=&is_active=&page=&limit=
// q matches name, phone, farm ID, district or division.
farmerrouter.get('/', async(req, res, next)=>{
  try {
    const { q, district, reservoir_id, tank_id, is_active } = req.query
    const where = []
    const params = []
    const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)) }

    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`
      params.push(like)
      const n = params.length
      where.push(`(f.full_name ILIKE $${n} OR f.phone ILIKE $${n} OR f.farm_id ILIKE $${n} OR f.district ILIKE $${n} OR f.division ILIKE $${n})`)
    }
    if (district) add('f.district ILIKE ?', String(district))
    if (reservoir_id) add('f.reservoir_id = ?', Number(reservoir_id))
    if (tank_id) add('f.tank_id = ?', Number(tank_id))
    if (is_active === 'true' || is_active === 'false') add('f.is_active = ?', is_active === 'true')
    if (params.some(value => Number.isNaN(value))) {
      return res.status(400).json({ status: 'fail', message: 'reservoir_id and tank_id must be numbers.' })
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const { limit, page, offset } = paging(req.query)
    const total = await db.query(`SELECT count(*)::int AS n FROM farmers f ${whereSql}`, params)
    const rows = await db.query(
      `SELECT ${F_COLUMNS}, f.is_active, r.name AS reservoir_name, t.tank_name,
              (SELECT count(*)::int FROM farm_crops c WHERE c.farm_id = f.farm_id) AS crop_count
       FROM farmers f
       LEFT JOIN reservoirs r ON r.id = f.reservoir_id
       LEFT JOIN mahawelitanks t ON t.id = f.tank_id
       ${whereSql}
       ORDER BY f.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    return res.status(200).json({ status: 'success', page, limit, total: total.rows[0].n, data: rows.rows })
  } catch (error) {
    return next(error)
  }
})

async function loadFarmer(farmerId, client = db) {
  const result = await client.query(
    `SELECT ${F_COLUMNS}, f.is_active, r.name AS reservoir_name, t.tank_name
     FROM farmers f
     LEFT JOIN reservoirs r ON r.id = f.reservoir_id
     LEFT JOIN mahawelitanks t ON t.id = f.tank_id
     WHERE f.farmer_id = $1`,
    [farmerId]
  )
  const farmer = result.rows[0]
  return farmer ? { ...farmer, farm: await getFarm(farmer.farm_id, client) } : null
}

// GET /admin/farmers/:farmerId: the farmer with their farm and crops
farmerrouter.get('/:farmerId', async (req, res, next) => {
  try {
    const farmer = await loadFarmer(req.params.farmerId)
    if (!farmer) {
      return res.status(404).json({ status: 'fail', message: 'Farmer not found.' })
      }
    return res.status(200).json({ status: 'success', data: farmer })
  }catch(error){
    return sendDbError(res, next, error)
  }
})

// PATCH /admin/farmers/:farmerId
// Any profile field, plus phone, nic and is_active, plus farm details
// (water_source, water_name, location_label, crops). crops, when sent, replaces the whole list.
farmerrouter.patch('/:farmerId', canEdit, async (req, res, next) => {
  try {
    const body = req.body || {}
    if (![...ADMIN_UPDATABLE_FIELDS, 'nic', ...FARM_FIELDS].some(field => body[field] !== undefined)) {
      return res.status(400).json({ status: 'fail', message: 'Nothing to update.' })
    }

    const { error, changes } = validateFarmerChanges(body)
    if (error) {
      return res.status(400).json({ status: 'fail', message: error })
    }
    if (body.phone !== undefined) {
      const phoneCheck = validateSriLankanMobile(body.phone)
      if (!phoneCheck.valid) return res.status(400).json({ status: 'fail', message: phoneCheck.error })
      changes.phone = phoneCheck.normalized
    }
    if (body.nic !== undefined) {
      if (typeof body.nic !== 'string' || !/^([0-9]{9}[VvXx]|[0-9]{12})$/.test(body.nic.trim())) {
        return res.status(400).json({ status: 'fail', message: 'NIC format is invalid.' })
      }
      changes.hashed_nic = hashNic(body.nic)
    }
    if(body.is_active !== undefined){
      if (typeof body.is_active !== 'boolean') return res.status(400).json({ status: 'fail', message: 'is_active must be true or false.' })
      changes.is_active = body.is_active
    }

    const farmSent = FARM_FIELDS.some(field => body[field] !== undefined)

    const farmer = await withTransaction(async (client) => {
      const current = await client.query('SELECT farm_id FROM farmers WHERE farmer_id = $1 FOR UPDATE', [req.params.farmerId])
      if (!current.rows[0]) return null
      const farmId = current.rows[0].farm_id

      // The check constraint only allows one water source, so setting one clears the other
      if (changes.reservoir_id != null && changes.tank_id === undefined) changes.tank_id = null
      if (changes.tank_id != null && changes.reservoir_id === undefined) changes.reservoir_id = null
      await updateFarmer(req.params.farmerId, changes, { fields: ADMIN_UPDATABLE_FIELDS, client })

      if (farmSent) {
        // Fields not sent keep their saved values
        const saved = (await getFarm(farmId, client)) || {}
        const merged = {}
        for (const field of ['water_source', 'water_name', 'location_label']) {
          merged[field] = body[field] !== undefined ? body[field] : saved[field] ?? null
        }
        if (body.crops !== undefined) merged.crops = body.crops
        const farmCheck = validateFarm(merged)
        if (farmCheck.error) {
          const err = new Error(farmCheck.error)
          err.status = 400
          throw err
        }
        await saveFarm(client, farmId, farmCheck.farm)
      }

      // A deactivated farmer is signed out everywhere
      if (changes.is_active === false) {
        await client.query(
          'UPDATE farmer_sessions SET revoked = TRUE, revoked_at = NOW() WHERE farmer_id = $1 AND NOT revoked',
          [req.params.farmerId]
        )
      }
      return loadFarmer(req.params.farmerId, client)
    })

    if (!farmer) {
      return res.status(404).json({ status: 'fail', message: 'Farmer not found.' })
    }
    return res.status(200).json({ status: 'success', message: 'Farmer updated.', data: farmer })
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ status: 'fail', message: error.message })
    }
    return sendDbError(res, next, error)
  }
})

// DELETE /admin/farmers/:farmerId: removes the farmer with their farm, crops and sessions
farmerrouter.delete('/:farmerId', canEdit, async (req,res,next) => {
  try {
    const result = await db.query(
      'DELETE FROM farmers WHERE farmer_id = $1 RETURNING farmer_id, farm_id, full_name',
      [req.params.farmerId]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ status: 'fail', message: 'Farmer not found.' })
    }
    return res.status(200).json({ status: 'success', message: 'Farmer deleted.', data: result.rows[0] })
  } catch (error) {
    return sendDbError(res, next, error)
  }
})

module.exports = farmerrouter
