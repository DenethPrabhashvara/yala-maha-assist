
const db = require('../config/db.js')
const crypto = require('crypto')
const { withTransaction, saveFarm, getFarm, cropSummary } = require('./farmService.js')

// farm_id is a random 6-hex code, so on the rare clash with another farmer it is drawn again
const FARM_ID_ATTEMPTS = 5



//Check if farmer already exists
async function findFarmerByPhone(phone) {
    const result = await db.query(
        'SELECT farmer_id, full_name, phone FROM farmers WHERE phone = $1 LIMIT 1',
        [phone]
    )
    return result.rows[0] || null
}

async function createFarmer(farmer) {
    // farm: { water_source, water_name, location_label, crops } from validateFarm, optional
    const { nic, land_acres, primary_crop, farm } = farmer

    if (!process.env.NIC_PEPPER) throw new Error('NIC_PEPPER is not set')

    const hashedNic = crypto
        .createHmac('sha256', process.env.NIC_PEPPER)
        .update(nic.trim().toUpperCase())
        .digest('hex')

    // With a crop list, the totals on the farmers row come from it
    const summary = farm?.crops ? cropSummary(farm.crops) : { land_acres, primary_crop }
  
    const farmDetails = farm?.crops || !(summary.primary_crop && Number(summary.land_acres) > 0)
        ? farm
        : { ...farm, crops: [{ category: null, crop_type: summary.primary_crop, variety: null, acres: Number(summary.land_acres), last_yield: null, yield_unit: null }] }

    for (let attempt = 1; ; attempt++) {
        try {
            return await withTransaction(async (client) => {
                const result = await insertFarmer(client, { ...farmer, ...summary }, hashedNic)
                await saveFarm(client, result.farm_id, {
                    water_source: null, water_name: null, location_label: null, ...farmDetails
                })
                return { result, hashedNic }
            })
        } catch (error) {
            if (error.code === '23505' && error.constraint === 'farmers_farm_id_key' && attempt < FARM_ID_ATTEMPTS) continue
            throw error
        }
    }
}

async function insertFarmer(client, farmer, hashedNic) {
    const { full_name, phone, address, district, division, farm_latitude, farm_longitude, reservoir_id, tank_id, land_acres, primary_crop } = farmer
    const result = await client.query(
        `INSERT INTO farmers (
            full_name, hashed_nic, phone, address, district, division,
            farm_latitude, farm_longitude, reservoir_id, tank_id,
            land_acres, primary_crop
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING farmer_id, farm_id, full_name, phone`,
        [
            full_name,
            hashedNic,
            phone,
            address,
            district,
            division || null,
            farm_latitude ?? null,
            farm_longitude ?? null,
            reservoir_id ?? null,
            tank_id ?? null,
            land_acres ?? null,
            primary_crop || null
        ]
    )
    return result.rows[0]
}

const FARMER_COLUMNS = 'farmer_id, farm_id, full_name,phone,address,district,division,farm_latitude, farm_longitude,reservoir_id, tank_id,land_acres, primary_crop, created_at, updated_at'

// Needs the requireFarmer middleware in front of it
async function getFarmerDetails(req,res){
    const result = await db.query(`SELECT ${FARMER_COLUMNS} FROM farmers WHERE farmer_id =$1`, [req.farmerId])
    const farmers = await Promise.all(result.rows.map(async (row) => ({ ...row, farm: await getFarm(row.farm_id) })))
    res.status(200).json(
        {
            status: "success",
            data: farmers
        }
    )
}

// Fields a farmer may change themselves. Phone and NIC are their identity, so they stay fixed.
const UPDATABLE_FIELDS = [
    'full_name', 'address', 'district', 'division', 'farm_latitude', 'farm_longitude',
    'reservoir_id', 'tank_id', 'land_acres', 'primary_crop'
]

// Fields only an admin may change, on top of UPDATABLE_FIELDS
const ADMIN_UPDATABLE_FIELDS = [...UPDATABLE_FIELDS, 'phone', 'hashed_nic', 'is_active']

// Checks the profile fields in a request body. Returns { error } or { changes } holding only
// the fields that were sent, cleaned up (empty optional text becomes null).
function validateFarmerChanges(body) {
    const changes = {}
    for (const field of UPDATABLE_FIELDS) {
        if (body[field] !== undefined) changes[field] = body[field]
    }
    for (const field of ['full_name', 'address', 'district']) {
        if (changes[field] === undefined) continue
        if (typeof changes[field] !== 'string' || !changes[field].trim()) return { error: `${field} cannot be empty.` }
        changes[field] = changes[field].trim()
    }
    for (const field of ['division', 'primary_crop']) {
        if (changes[field] === undefined) continue
        if (changes[field] != null && typeof changes[field] !== 'string') return { error: `${field} must be text.` }
        changes[field] = changes[field]?.trim() || null
    }
    for (const field of ['farm_latitude', 'farm_longitude', 'reservoir_id', 'tank_id', 'land_acres']) {
        if (changes[field] != null && !Number.isFinite(Number(changes[field]))) return { error: `${field} must be a number.` }
    }
    if (changes.reservoir_id != null && changes.tank_id != null) {
        return { error: 'A farmer can be linked to a reservoir or a tank, not both.'}
    }
    return { changes }
}

async function updateFarmer(farmerId, changes, { fields: allowed = UPDATABLE_FIELDS, client = db } = {}) {
    const fields = allowed.filter(field => changes[field] !== undefined)
    if (fields.length === 0) {
        const result = await client.query(`SELECT ${FARMER_COLUMNS} FROM farmers WHERE farmer_id = $1`, [farmerId])
        return result.rows[0] || null
    }

    const sets = fields.map((field, i) => `${field} = $${i + 2}`)
    const result = await client.query(
        `UPDATE farmers SET ${sets.join(', ')} WHERE farmer_id = $1 RETURNING ${FARMER_COLUMNS}`,
        [farmerId, ...fields.map(field => changes[field])]
    )
    return result.rows[0] || null
}

function hashNic(nic) {
    if (!process.env.NIC_PEPPER) throw new Error('NIC_PEPPER is not set')
    return crypto.createHmac('sha256', process.env.NIC_PEPPER).update(nic.trim().toUpperCase()).digest('hex')
}


module.exports = {
    findFarmerByPhone, createFarmer, getFarmerDetails, updateFarmer, validateFarmerChanges, hashNic,
    FARMER_COLUMNS, UPDATABLE_FIELDS, ADMIN_UPDATABLE_FIELDS
}


