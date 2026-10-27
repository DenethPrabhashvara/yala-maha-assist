// Read-outs for the admin portal pages (mounted at /admin/data, behind requireAdmin).
//
//   GET  /admin/data/reservoirs                  every reservoir, its latest reading and 30 days of history
//   POST /admin/data/reservoirs/:id/readings     log a field reading (admin, super_admin)
//   GET  /admin/data/rivers                      river gauges: latest reading and the last 24 hours
//   GET  /admin/data/schedule                    the Mahaweli water issue schedule
//   GET  /admin/data/farmer-stats                farmer counts by district, month, crop and water source
const express = require('express')
const db = require('../../config/db.js')
const { canEdit } = require('../../middleware/requireAdmin.js')
const { sendDbError } = require('./dbErrors.js')

const datarouter = express.Router()

const HISTORY_DAYS = 30
// Days where fewer reservoirs reported than this are left out of the network average
const MIN_DAILY_READINGS = 20

datarouter.get('/reservoirs', async(req, res, next)=>{
  try {
    const reservoirs = await db.query(
      `SELECT r.id, r.name, r.district, r.division, r.latitude, r.longitude, r.type,
              r.farmland_acres, r.full_depth_ft, r.gross_capacity_acft, r.dead_storage_acft, r.active_capacity_acft,
              to_char(l.reading_date, 'YYYY-MM-DD') AS reading_date, l.water_depth_ft, l.gross_storage_acft,
              l.usable_storage_acft, l.usable_storage_percent, l.rainfall_prev_day_mm, l.is_spilling,
              l.ds_impact, l.spilling_rate_cusec
       FROM reservoirs r
       LEFT JOIN LATERAL (
         SELECT * FROM reservoir_levels WHERE reservoir_id = r.id ORDER BY reading_date DESC LIMIT 1
       ) l ON true
       ORDER BY r.name`
    )
    const history = await db.query(
      `SELECT reservoir_id, to_char(reading_date, 'YYYY-MM-DD') AS date,
              usable_storage_percent AS percent, water_depth_ft AS depth, rainfall_prev_day_mm AS rainfall
       FROM reservoir_levels
       WHERE reading_date >= CURRENT_DATE - $1::int
       ORDER BY reading_date`,
      [HISTORY_DAYS]
    )
    // Not every reservoir reports every day, so each day uses each reservoir's latest reading from
    // the week before it. Rainfall is the highest reported that day.
    const daily = await db.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS date, count(*)::int AS reservoirs,
              round(avg(l.usable_storage_percent), 1) AS storage,
              count(*) FILTER (WHERE l.is_spilling = 'Yes' AND l.reading_date = d)::int AS spilling,
              (SELECT max(rainfall_prev_day_mm) FROM reservoir_levels WHERE reading_date = d) AS rainfall
       FROM generate_series(CURRENT_DATE - $1::int, CURRENT_DATE, interval '1 day') AS g(day)
       CROSS JOIN LATERAL (SELECT g.day::date AS d) dd
       CROSS JOIN reservoirs r
       JOIN LATERAL (
         SELECT usable_storage_percent, is_spilling, reading_date FROM reservoir_levels
         WHERE reservoir_id = r.id AND reading_date <= d AND reading_date > d - 7
         ORDER BY reading_date DESC LIMIT 1
       ) l ON true
       GROUP BY d HAVING count(*) >= $2
       ORDER BY d`,
      [HISTORY_DAYS, MIN_DAILY_READINGS]
    )

    const byReservoir = {}
    for (const row of history.rows) {
      (byReservoir[row.reservoir_id] ||= []).push({ date: row.date, percent: row.percent, depth: row.depth, rainfall: row.rainfall })
    }
    return res.status(200).json({
      status: 'success',
      data: reservoirs.rows.map(row => ({ ...row, history: byReservoir[row.id] || [] })),
      daily: daily.rows
    })
  } catch (error) {
    return next(error)
  }
})

const toNumber = (value) => (value === '' || value === null || value === undefined ? null : Number(value))

// Body: { usable_storage_percent, water_depth_ft, rainfall_prev_day_mm?, reading_date? (YYYY-MM-DD, default today) }
// A reading for a day that already has one replaces it.
datarouter.post('/reservoirs/:id/readings', canEdit, async (req, res, next) => {
  try {
    const body = req.body || {}
    const percent = toNumber(body.usable_storage_percent)
    const depth = toNumber(body.water_depth_ft)
    const rainfall = toNumber(body.rainfall_prev_day_mm)
    if (percent === null || !Number.isFinite(percent) || percent < 0 || percent > 150) {
      return res.status(400).json({ status: 'fail', message: 'Usable storage must be a percentage between 0 and 150.' })
    }
    if (depth === null || !Number.isFinite(depth) || depth < 0) {
      return res.status(400).json({ status: 'fail', message: 'Water depth must be 0 ft or more.' })
    }
    if (rainfall !== null && (!Number.isFinite(rainfall) || rainfall < 0)) {
      return res.status(400).json({ status: 'fail', message: 'Rainfall must be 0 mm or more.' })
      }
    const date = body.reading_date || new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || Date.parse(date) > Date.now()) {
      return res.status(400).json({ status: 'fail', message: 'Reading date must be a past date (YYYY-MM-DD).' })
    }

    const reservoir = await db.query('SELECT id, active_capacity_acft, dead_storage_acft FROM reservoirs WHERE id = $1', [req.params.id])
    if (!reservoir.rows[0]) {
      return res.status(404).json({ status: 'fail', message: 'Reservoir not found.' })
    }
    const { active_capacity_acft: active, dead_storage_acft: dead } = reservoir.rows[0]
    const usable = active != null ? Math.round((percent / 100) * Number(active)) : null
    const gross = usable != null ? usable + Number(dead || 0) : null

    const result = await db.query(
      `INSERT INTO reservoir_levels (reservoir_id, reading_date, water_depth_ft, gross_storage_acft, usable_storage_acft,
                                     usable_storage_percent, rainfall_prev_day_mm, is_spilling)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (reservoir_id, reading_date) DO UPDATE SET
         water_depth_ft = EXCLUDED.water_depth_ft, gross_storage_acft = EXCLUDED.gross_storage_acft,
         usable_storage_acft = EXCLUDED.usable_storage_acft, usable_storage_percent = EXCLUDED.usable_storage_percent,
         rainfall_prev_day_mm = EXCLUDED.rainfall_prev_day_mm, is_spilling = EXCLUDED.is_spilling, fetched_at = now()
       RETURNING reservoir_id, to_char(reading_date, 'YYYY-MM-DD') AS reading_date, water_depth_ft, gross_storage_acft,
                 usable_storage_acft, usable_storage_percent, rainfall_prev_day_mm, is_spilling`,
      [req.params.id, date, depth, gross, usable, percent, rainfall, percent >= 100 ? 'Yes' : 'No']
    )
    return res.status(201).json({ status: 'success', message: 'Reading saved.', data: result.rows[0] })
  } catch(error){
    return sendDbError(res, next, error)
  }
})

datarouter.get('/rivers', async (req, res, next) => {
  try {
    const latest = await db.query(
      `SELECT DISTINCT ON (basin, station)
              basin, station, latitude, longitude, water_level, rain_fall,
              alertpull, minorpull, majorpull, creation_date
       FROM river_level_realtime
       WHERE basin IS NOT NULL AND station IS NOT NULL
       ORDER BY basin, station, creation_date DESC`
    )
    // The 24 hours before the newest reading, so the charts still have data when the loader is behind
    const history = await db.query(
      `SELECT basin, station, water_level, rain_fall, creation_date
       FROM river_level_realtime
       WHERE station IS NOT NULL
         AND creation_date >= (SELECT max(creation_date) FROM river_level_realtime) - interval '24 hours'
       ORDER BY creation_date`
    )
    const rainfall = await db.query(
      `SELECT station, basin, rain_fall, creation_date
       FROM rainfall_realtime
       WHERE rain_fall IS NOT NULL
         AND creation_date >= (SELECT max(creation_date) FROM rainfall_realtime) - interval '24 hours'
       ORDER BY rain_fall DESC, creation_date DESC LIMIT 1`
    )

    const series = {}
    for (const row of history.rows) {
      (series[`${row.basin}|${row.station}`] ||= []).push({ level: row.water_level, rainfall: row.rain_fall, at: row.creation_date })
    }
    return res.status(200).json({
      status: 'success',
      data: latest.rows.map(row => ({
        river: row.basin,
        station: row.station,
        latitude: row.latitude,
        longitude: row.longitude,
        water_level: row.water_level,
        rain_fall: row.rain_fall,
        alert_level: row.alertpull,
        minor_flood_level: row.minorpull,
        major_flood_level: row.majorpull,
        reading_at: row.creation_date,
        history: series[`${row.basin}|${row.station}`] || []
      })),
      topRainfall: rainfall.rows[0] || null
    })
  }catch(error){
    return next(error)
  }
})

datarouter.get('/schedule', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, no, tank_name, section, initial_extent_ha,
              to_char(water_start, 'YYYY-MM-DD') AS water_start, to_char(water_end, 'YYYY-MM-DD') AS water_end,
              paddy_target_days, paddy_target_area, paddy_area_percentage,
              other_crops_target_days, other_crops_target_area, other_crops_area_percentage
       FROM water_issue_schedule
       ORDER BY water_start NULLS LAST, tank_name, section NULLS FIRST`
    )
    return res.status(200).json({ status: 'success', data: result.rows })
  } catch (error) {
    return next(error)
  }
})

datarouter.get('/farmer-stats', async (req,res,next) => {
  try {
    const [totals, districts, months, crops, sources] = await Promise.all([
      db.query(
        `SELECT count(*)::int AS registered,
                count(*) FILTER (WHERE is_active)::int AS active,
                count(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS new_this_month,
                count(*) FILTER (WHERE created_at >= date_trunc('month', now()) - interval '1 month'
                                   AND created_at < date_trunc('month', now()))::int AS new_last_month,
                count(DISTINCT district)::int AS districts,
                coalesce(sum(land_acres), 0) AS total_acres
         FROM farmers`
      ),
      db.query(
        `SELECT initcap(district) AS district, count(*)::int AS farmers, count(*) FILTER (WHERE is_active)::int AS active
         FROM farmers GROUP BY initcap(district) ORDER BY farmers DESC, district`
      ),
      db.query(
        `SELECT to_char(m, 'YYYY-MM') AS month,
                count(f.farmer_id)::int AS farmers,
                count(f.farmer_id) FILTER (WHERE f.is_active)::int AS active
         FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m
         LEFT JOIN farmers f ON date_trunc('month', f.created_at) = m
         GROUP BY m ORDER BY m`
      ),
      // A farmer growing two crops counts once for each
      db.query(
        `SELECT coalesce(nullif(c.crop_type, ''), nullif(f.primary_crop, ''), 'Not given') AS crop,
                count(DISTINCT f.farmer_id)::int AS farmers
         FROM farmers f LEFT JOIN farm_crops c ON c.farm_id = f.farm_id
         GROUP BY 1 ORDER BY farmers DESC, crop`
      ),
      db.query(
        `SELECT coalesce(fm.water_source, 'unknown') AS source, count(*)::int AS farmers
         FROM farmers f LEFT JOIN farms fm ON fm.farm_id = f.farm_id
         GROUP BY 1 ORDER BY farmers DESC`
      )
    ])
    return res.status(200).json({
      status: 'success',
      data: {
        ...totals.rows[0],
        byDistrict: districts.rows,
        byMonth: months.rows,
        crops: crops.rows,
        waterSources: sources.rows
      }
    })
  }catch(error){
    return next(error)
  }
})

module.exports = datarouter
