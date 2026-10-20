const db = require('../config/db.js')

const ACFT_PER_MCM = 810.713
const FORECAST_API_URL = process.env.FORECAST_API_URL || 'http://localhost:5000'

exports.getForecastByTankId = async (req, res, next) => {
  const { id } = req.params
  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Tank ID must be a positive integer.'
    })
  }

  try {
    const result = await db.query(
      `SELECT t.id, t.tank_name,
              l.reading_date AS date,
              l.storage_mcm * $2 AS storage_acft
       FROM mahawelitanks t
       JOIN mahaweli_water_level l ON l.tank_id = t.id
       WHERE t.id = $1
         AND l.reading_date >= CURRENT_DATE - INTERVAL '90 days'
         AND l.storage_mcm IS NOT NULL
       ORDER BY l.reading_date ASC`,
      [id, ACFT_PER_MCM]
    )

    if (result.rows.length === 0) {
      const tankResult = await db.query(
        'SELECT id, tank_name FROM mahawelitanks WHERE id = $1',
        [id]
      )
      if (tankResult.rows.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: `Tank with ID ${id} not found.`
        })
      }
      return res.status(404).json({
        status: 'fail',
        message: `Tank with ID ${id} has no stored water-level readings from the last 90 days.`
      })
    }

    const tank = result.rows[0].tank_name
    const readings = result.rows.map(({ date, storage_acft }) => ({
      date: date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10),
      storage_acft: Number(storage_acft)
    }))

    let forecastResponse
    try {
      forecastResponse = await fetch(`${FORECAST_API_URL}/api/forecast/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tank, readings })
      })
    } catch (error) {
      return res.status(503).json({
        status: 'fail',
        message: 'Forecast service is unavailable.',
        error: error.message
      })
    }

    let forecast
    try {
      forecast = await forecastResponse.json()
    } catch (error) {
      return res.status(502).json({
        status: 'fail',
        message: 'Forecast service returned an invalid response.'
      })
    }

    if (!forecastResponse.ok) {
      return res.status(forecastResponse.status).json({
        status: 'fail',
        message: forecast.error || forecast.message || 'Unable to calculate the tank forecast.'
      })
    }

    return res.status(200).json({
      status: 'success',
      tank_id: Number(id),
      data: forecast
    })
  } catch (error) {
    next(error)
  }
}
