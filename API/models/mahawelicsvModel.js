const db = require('../config/db.js')



function formatCsvCell(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowsToCSV(rows, fields) {
  const headers = (fields && fields.length > 0)
    ? fields
    : (rows && rows.length > 0 ? Object.keys(rows[0]) : [])

  if (headers.length === 0) {
    return ''
  }

  const headerLine = headers.map(formatCsvCell).join(',')
  if (!rows || rows.length === 0) {
    return headerLine + '\r\n'
  }

  const dataLines = rows.map(row =>
    headers.map(header => formatCsvCell(row[header])).join(',')
  )

  return [headerLine, ...dataLines].join('\r\n')
}

exports.getAllTanks = async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM mahawelitanks ORDER BY id ASC")

    // Allow opting into csv using ?format=csv
    const isCSVRequested = req.query.format === 'csv' ||
      (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/csv') && !req.headers.accept.includes('*/*'))

    if (isCSVRequested) {
            // Default to public CSV format
        const headers = result.fields ? result.fields.map(f => f.name) : []
        const csvData = rowsToCSV(result.rows, headers)
        const isDownload = req.query.download === 'true' || req.query.download === '1'

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        res.setHeader('Cache-Control', 'public, max-age=60')
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader(
          'Content-Disposition',
          isDownload
            ? 'attachment; filename="mahaweli_tanks.csv"'
            : 'inline; filename="mahaweli_tanks.csv"'
        )

        return res.status(200).send(csvData)
  } 

   
  return res.status(200).json({
        status: "success",
        count: result.rows.length,
        data: result.rows
      })
 }
catch (error) {
    next(error)
  }

}

exports.getTankbyId = async (req, res, next) => {
  try {
    let id = req.params.id
    let format = req.query.format

    if (id && id.endsWith('.csv')) {
      id = id.replace(/\.csv$/, '')
      format = 'csv'
    }
    const result = await db.query("SELECT * FROM mahawelitanks WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: `Tank with ID ${id} not found`
      })
    }

    if (format === 'csv') {
      const headers = result.fields ? result.fields.map(f => f.name) : []
      const csvData = rowsToCSV(result.rows, headers)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      res.setHeader('Cache-Control', 'public, max-age=60')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `inline; filename="mahaweli_tank_${id}.csv"`)
      return res.status(200).send(csvData)
    }

    return res.status(200).json({
      status: "success",
      data: result.rows[0]
    })
  } catch (error) {
    next(error)
  }
}


exports.getmahaweli_levels_history = (req, res , next)=>{
    reslevel = db.query('SELECT * FROM mahaweli_levels')
}


exports.rowsToCSV = rowsToCSV
exports.formatCsvCell = formatCsvCell
