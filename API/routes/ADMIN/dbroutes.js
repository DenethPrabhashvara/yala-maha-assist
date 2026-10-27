// Every table in the database for the admin portal (mounted at /admin/db, behind requireAdmin).
//
//   GET    /admin/db/tables                       tables with their columns, primary key and row count
//   GET    /admin/db/tables/:table                rows: ?page=&limit=&sort=&order=asc|desc&<column>=<value>
//   GET    /admin/db/tables/:table/rows/:id       one row by primary key
//   POST   /admin/db/tables/:table                insert a row (JSON body: column -> value)
//   PATCH  /admin/db/tables/:table/rows/:id       update columns of one row
//   DELETE /admin/db/tables/:table/rows/:id       delete one row
//
// Table and column names are only ever taken from the database's own catalog, never from the
// request as-is. Secret columns (password and token hashes, hashed NICs) are never returned or
// written here. Changes need the admin or super_admin role; the admin account tables need super_admin.
const express = require('express')
const db =require('../../config/db.js')
const { canEdit } = require('../../middleware/requireAdmin.js')
const { sendDbError } = require('./dbErrors.js')

const dbrouter = express.Router()

const SECRET_COLUMNS = {
  admins: ['password_hash'],
  admin_sessions: ['refresh_token_hash'],
  farmer_sessions: ['refresh_token_hash'],
  farmers: ['hashed_nic']
}
// Admin accounts are managed by super_admin only (create accounts with POST /admin/auth/admins)
const SUPER_ADMIN_TABLES = ['admins', 'admin_sessions']
const PAGING_PARAMS = new Set(['page', 'limit', 'sort', 'order'])
const MAX_PAGE_SIZE = 500

const quote = (name) => `"${name.replace(/"/g, '""')}"`

// Table name -> { name, columns: [{ name, type, nullable, default, generated }], primaryKey: [..] }
async function loadTables() {
  const columns = await db.query(
    `SELECT c.table_name, c.column_name, c.data_type, c.is_nullable = 'YES' AS nullable, c.column_default,
            (c.is_identity = 'YES' AND c.identity_generation = 'ALWAYS') OR c.is_generated = 'ALWAYS' AS generated
     FROM information_schema.columns c
     JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
     WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
     ORDER BY c.table_name, c.ordinal_position`
  )
  const keys = await db.query(
    `SELECT tc.table_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
     WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
     ORDER BY kcu.ordinal_position`
  )

  const tables = {}
  for (const row of columns.rows) {
    const table = tables[row.table_name] ||= { name: row.table_name, columns: [], primaryKey: [] }
    if ((SECRET_COLUMNS[row.table_name] || []).includes(row.column_name)) continue
    table.columns.push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.nullable,
      default: row.column_default,
      generated: row.generated
    })
  }
  for (const row of keys.rows) tables[row.table_name]?.primaryKey.push(row.column_name)
  return tables
}

// Finds :table, or answers 404. Also checks the role for changes to admin tables.
async function resolveTable(req, res) {
  const table = (await loadTables())[req.params.table]
  if (!table) {
    res.status(404).json({ status: 'fail', message: `No table called '${req.params.table}'.` })
    return null
  }
  if (req.method !== 'GET' && SUPER_ADMIN_TABLES.includes(table.name) && req.admin.role !== 'super_admin') {
    res.status(403).json({ status: 'fail', message: 'Only a super_admin can change admin accounts.' })
    return null
  }
  return table
}

// Rows are addressed by a single-column primary key
function keyColumn(table, res){
  if (table.primaryKey.length !== 1) {
    res.status(400).json({ status: 'fail', message: `Table '${table.name}' has no single-column primary key.` })
    return null
  }
  return table.primaryKey[0]
}

// The body's column -> value pairs, checked against the table. Returns { error } or { entries }.
function bodyEntries(table, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Send a JSON object of column: value.' }
  const known = new Map(table.columns.map(column => [column.name, column]))
  const entries = Object.entries(body)
  for (const [name] of entries) {
    const column = known.get(name)
    if (!column) return { error: `Unknown or protected column '${name}'.` }
    if (column.generated) return { error: `Column '${name}' is filled in by the database.` }
  }
  return { entries }
}

const selectList = (table) => table.columns.map(column => quote(column.name)).join(', ')

dbrouter.get('/tables', async(req,res,next)=>{
  try {
    const tables = Object.values(await loadTables())
    // Planner estimates: quick even for big tables (-1 means never analysed)
    const counts = await db.query(
      `SELECT relname, reltuples::bigint AS estimate FROM pg_class
       WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace`
    )
    const estimate = Object.fromEntries(counts.rows.map(row => [row.relname, Number(row.estimate)]))
    return res.status(200).json({
      status: 'success',
      data: tables.map(table => ({
        ...table,
        rowEstimate: estimate[table.name] ?? null,
        editable: !SUPER_ADMIN_TABLES.includes(table.name) || req.admin.role === 'super_admin'
      }))
    })
  } catch (error) {
    return next(error)
  }
})

dbrouter.get('/tables/:table', async (req, res, next) => {
  try {
    const table = await resolveTable(req, res)
    if (!table) return
    const columnNames = new Set(table.columns.map(column => column.name))

    // Any other query parameter that names a column filters on it (equality; "null" matches NULL)
    const where = []
    const params = []
    for (const [name, value] of Object.entries(req.query)) {
      if (PAGING_PARAMS.has(name)) continue
      if (!columnNames.has(name)) {
        return res.status(400).json({ status: 'fail', message: `Cannot filter on '${name}'.` })
      }
      if (value === 'null') {
        where.push(`${quote(name)} IS NULL`)
      } else {
        params.push(String(value))
        where.push(`${quote(name)}::text = $${params.length}`)
      }
    }

    const sort = req.query.sort || table.primaryKey[0] || table.columns[0]?.name
    if (sort && !columnNames.has(sort)) {
      return res.status(400).json({ status: 'fail', message: `Cannot sort by '${sort}'.` })
    }
    const order = String(req.query.order).toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), MAX_PAGE_SIZE)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const total = await db.query(`SELECT count(*)::int AS n FROM ${quote(table.name)} ${whereSql}`, params)
    const rows = await db.query(
      `SELECT ${selectList(table)} FROM ${quote(table.name)} ${whereSql}
       ${sort ? `ORDER BY ${quote(sort)} ${order} NULLS LAST` : ''}
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    )
    return res.status(200).json({
      status: 'success', table: table.name, primaryKey: table.primaryKey, page, limit,
      total: total.rows[0].n, data: rows.rows
    })
  } catch (error) {
    return sendDbError(res, next, error)
  }
})

dbrouter.get('/tables/:table/rows/:id', async (req, res, next) => {
  try {
    const table = await resolveTable(req, res)
    if (!table) return
    const key = keyColumn(table, res)
    if (!key) return
    const result = await db.query(
      `SELECT ${selectList(table)} FROM ${quote(table.name)} WHERE ${quote(key)} = $1`,
      [req.params.id]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ status: 'fail', message: 'Row not found.' })
      }
    return res.status(200).json({ status: 'success', data: result.rows[0] })
  }catch(error){
    return sendDbError(res, next, error)
  }
})

dbrouter.post('/tables/:table', canEdit, async (req, res, next) => {
  try {
    const table = await resolveTable(req, res)
    if (!table) return
    const { error, entries } = bodyEntries(table, req.body)
    if (error) {
      return res.status(400).json({ status: 'fail', message: error })
    }
    const result = entries.length
      ? await db.query(
        `INSERT INTO ${quote(table.name)} (${entries.map(([name]) => quote(name)).join(', ')})
         VALUES (${entries.map((_, i) => `$${i + 1}`).join(', ')})
         RETURNING ${selectList(table)}`,
        entries.map(([, value]) => value)
      )
      : await db.query(`INSERT INTO ${quote(table.name)} DEFAULT VALUES RETURNING ${selectList(table)}`)
    return res.status(201).json({ status: 'success', message: 'Row added.', data: result.rows[0] })
  } catch (error) {
    return sendDbError(res, next, error)
  }
})

dbrouter.patch('/tables/:table/rows/:id', canEdit, async (req, res, next) => {
  try {
    const table = await resolveTable(req, res)
    if (!table) return
    const key = keyColumn(table, res)
    if (!key) return
    const { error, entries } = bodyEntries(table, req.body)
    if (error || entries.length === 0) {
      return res.status(400).json({ status: 'fail', message: error || 'Nothing to update.' })
    }
    const result = await db.query(
      `UPDATE ${quote(table.name)} SET ${entries.map(([name], i) => `${quote(name)} = $${i + 2}`).join(', ')}
       WHERE ${quote(key)} = $1 RETURNING ${selectList(table)}`,
      [req.params.id, ...entries.map(([, value]) => value)]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ status: 'fail', message: 'Row not found.' })
    }
    return res.status(200).json({ status: 'success', message: 'Row updated.', data: result.rows[0] })
  }catch(error){
    return sendDbError(res, next, error)
  }
})

dbrouter.delete('/tables/:table/rows/:id', canEdit, async (req, res, next) => {
  try {
    const table = await resolveTable(req, res)
    if (!table) return
    const key = keyColumn(table, res)
    if (!key) return
    if (table.name === 'admins' && req.params.id === req.admin.admin_id) {
      return res.status(400).json({ status: 'fail', message: 'You cannot delete your own admin account.' })
    }
    const result = await db.query(
      `DELETE FROM ${quote(table.name)} WHERE ${quote(key)} = $1 RETURNING ${selectList(table)}`,
      [req.params.id]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ status: 'fail', message: 'Row not found.' })
    }
    return res.status(200).json({ status: 'success', message: 'Row deleted.', data: result.rows[0] })
  } catch (error) {
    return sendDbError(res, next, error)
  }
})



module.exports = dbrouter
