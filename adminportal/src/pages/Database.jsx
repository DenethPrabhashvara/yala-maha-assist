import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Database as DatabaseIcon,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Table2,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api/client'
import { cn, formatNumber } from '../utils/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Overlay'

const PAGE_SIZE = 50

// How a value shows in the grid and in the editor
const toText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function Cell({ value }) {
  if (value === null || value === undefined) return <span className="db-null">NULL</span>
  const text = toText(value)
  return <span title={text.length > 48 ? text : undefined}>{text.length > 48 ? `${text.slice(0, 47)}…` : text}</span>
}

// Row editor for one table. row is null when adding.
function RowEditor({ table, row, canWrite, onClose, onSaved }) {
  const { toast } = useToast()
  const key = table.primaryKey.length === 1 ? table.primaryKey[0] : null
  const columns = table.columns.filter((column) => row || !column.generated)
  const [values, setValues] = useState(() =>
    Object.fromEntries(columns.map((column) => [column.name, row ? toText(row[column.name]) : ''])),
  )
  const [nulls, setNulls] = useState(() =>
    Object.fromEntries(columns.map((column) => [column.name, row ? row[column.name] === null : false])),
  )
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const editable = canWrite && (!row || key)

  const changes = () => {
    const body = {}
    for (const column of columns) {
      if (column.generated) continue
      const value = nulls[column.name] ? null : values[column.name]
      if (row) {
        const before = row[column.name] === null ? null : toText(row[column.name])
        if (value !== before) body[column.name] = value
      } else if (value !== '' || nulls[column.name]) {
        // Left empty when adding: the database default applies
        body[column.name] = value
      }
    }
    return body
  }

  const save = async (event) => {
    event.preventDefault()
    const body = changes()
    if (row && Object.keys(body).length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      if (row) {
        await api(`/admin/db/tables/${table.name}/rows/${encodeURIComponent(row[key])}`, { method: 'PATCH', body })
        toast(`Row ${row[key]} of ${table.name} updated.`, { tone: 'success' })
      } else {
        await api(`/admin/db/tables/${table.name}`, { method: 'POST', body })
        toast(`Row added to ${table.name}.`, { tone: 'success' })
      }
      onSaved()
    } catch (error) {
      toast(error.message, { title: 'Not saved', tone: 'error' })
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await api(`/admin/db/tables/${table.name}/rows/${encodeURIComponent(row[key])}`, { method: 'DELETE' })
      toast(`Row ${row[key]} deleted from ${table.name}.`, { tone: 'success' })
      onSaved()
    } catch (error) {
      toast(error.message, { title: 'Not deleted', tone: 'error' })
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title={row ? `${table.name} · ${key ? row[key] : 'row'}` : `New row in ${table.name}`}
      description={
        !editable
          ? 'View only'
          : row
            ? 'Change values and save. Tick NULL to clear a value.'
            : 'Empty fields get the column default.'
      }
      icon={Table2}
      size="lg"
      footer={
        confirmDelete ? (
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>
              Keep row
            </Button>
            <Button variant="danger" icon={Trash2} loading={saving} onClick={remove}>
              Delete permanently
            </Button>
          </>
        ) : (
          <>
            {editable && row && (
              <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              {editable ? 'Cancel' : 'Close'}
            </Button>
            {editable && (
              <Button variant="primary" icon={Save} type="submit" form="db-row" loading={saving}>
                {row ? 'Save changes' : 'Add row'}
              </Button>
            )}
          </>
        )
      }
    >
      {confirmDelete ? (
        <div className="detail-banner warning">
          <Trash2 size={17} />
          <div>
            <strong>Delete this row?</strong>
            <span>Rows in other tables that point to it may be deleted too or block the delete.</span>
          </div>
        </div>
      ) : (
        <form id="db-row" className="form-grid db-form" onSubmit={save}>
          {columns.map((column) => {
            const locked = !editable || column.generated
            return (
              <label className="field" key={column.name}>
                <span>
                  {column.name}
                  <small className="db-type">
                    {column.type}
                    {table.primaryKey.includes(column.name) ? ' · key' : ''}
                  </small>
                </span>
                <input
                  value={nulls[column.name] ? '' : values[column.name]}
                  placeholder={nulls[column.name] ? 'NULL' : column.default && !row ? `default: ${column.default}` : ''}
                  disabled={locked || nulls[column.name]}
                  onChange={(event) => setValues((current) => ({ ...current, [column.name]: event.target.value }))}
                />
                {!locked && column.nullable && (
                  <span className="db-null-toggle">
                    <input
                      type="checkbox"
                      checked={nulls[column.name]}
                      onChange={(event) => setNulls((current) => ({ ...current, [column.name]: event.target.checked }))}
                    />
                    NULL
                  </span>
                )}
              </label>
            )
          })}
        </form>
      )}
    </Modal>
  )
}

export function Database() {
  const { canEdit } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tables, setTables] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState({ key: null, direction: 'asc' })
  const [editor, setEditor] = useState(null)
  const tableName = searchParams.get('table')
  const table = tables.find((item) => item.name === tableName) || null

  useEffect(() => {
    api('/admin/db/tables')
      .then((response) => setTables(response.data))
      .catch((error) => toast(error.message, { title: 'Tables not loaded', tone: 'error' }))
  }, [toast])

  // Open the first table when none is chosen
  useEffect(() => {
    if (!tableName && tables.length) setSearchParams({ table: tables[0].name }, { replace: true })
  }, [tableName, tables, setSearchParams])

  const loadRows = useCallback(async () => {
    if (!tableName) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (sort.key) {
      params.set('sort', sort.key)
      params.set('order', sort.direction)
    }
    try {
      setResult(await api(`/admin/db/tables/${tableName}?${params}`))
    } catch (error) {
      setResult(null)
      toast(error.message, { title: 'Rows not loaded', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }, [tableName, page, sort, toast])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const chooseTable = (name) => {
    setPage(1)
    setSort({ key: null, direction: 'asc' })
    setResult(null)
    setSearchParams({ table: name })
  }

  const toggleSort = (key) => {
    setPage(1)
    setSort((current) =>
      current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' },
    )
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1
  const canWrite = canEdit && Boolean(table?.editable)

  return (
    <div className="page database-page">
      <PageHeader
        eyebrow="Administration"
        title="Database"
        description="Every table in the API database. Password, token and NIC hashes are never shown."
        badge={
          <Badge tone={canEdit ? 'warning' : 'info'} dot>
            {canEdit ? 'Changes are saved immediately' : 'View only'}
          </Badge>
        }
        actions={
          <>
            <Button icon={RefreshCw} variant="secondary" loading={loading} onClick={loadRows}>
              Reload
            </Button>
            {canWrite && (
              <Button icon={Plus} variant="primary" onClick={() => setEditor({ row: null })}>
                Add row
              </Button>
            )}
          </>
        }
      />

      <section className="db-layout">
        <Card className="db-tables">
          <CardHeader icon={DatabaseIcon} title="Tables" subtitle={`${tables.length} in the public schema`} />
          <div className="db-table-list">
            {tables.map((item) => (
              <button
                type="button"
                key={item.name}
                className={cn('db-table-item', item.name === tableName && 'is-active')}
                onClick={() => chooseTable(item.name)}
              >
                <span>
                  {item.name}
                  {!item.editable && <Lock size={11} />}
                </span>
                <small>{item.rowEstimate >= 0 ? `~${formatNumber(item.rowEstimate)}` : '—'}</small>
              </button>
            ))}
          </div>
        </Card>

        <Card className="table-card db-rows">
          <CardHeader
            icon={Table2}
            title={tableName || 'Choose a table'}
            subtitle={
              table
                ? `${table.columns.length} columns · key ${table.primaryKey.join(', ') || 'none'}${
                    table.editable ? '' : ' · super administrators only'
                  }`
                : ''
            }
            action={result && <Badge tone="info">{formatNumber(result.total)} rows</Badge>}
          />
          <div className="table-scroll">
            <table className="data-table compact db-grid">
              <thead>
                <tr>
                  {table?.columns.map((column) => {
                    const active = sort.key === column.name
                    return (
                      <th key={column.name} className={active ? 'sorted' : undefined}>
                        <button type="button" className="sort-btn" onClick={() => toggleSort(column.name)}>
                          {column.name}
                          {active ? (
                            sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          ) : (
                            <ArrowUpDown size={12} className="sort-idle" />
                          )}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {result?.data.map((row, index) => (
                  <tr key={index} className="clickable-row" onClick={() => setEditor({ row })}>
                    {table.columns.map((column) => (
                      <td key={column.name}>
                        <Cell value={row[column.name]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result && result.data.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <Table2 size={22} />
              </span>
              <strong>This table is empty</strong>
            </div>
          )}
          <div className="table-footer pagination-footer">
            <span>
              {result
                ? `Rows ${result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, result.total)} of ${formatNumber(result.total)}`
                : loading
                  ? 'Loading…'
                  : ''}
            </span>
            <div className="pagination">
              <button
                type="button"
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                <ArrowLeft size={15} />
              </button>
              <span className="page-ellipsis">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Card>
      </section>

      {editor && table && (
        <RowEditor
          key={editor.row ? JSON.stringify(editor.row) : 'new'}
          table={table}
          row={editor.row}
          canWrite={canWrite}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null)
            loadRows()
          }}
        />
      )}
    </div>
  )
}
