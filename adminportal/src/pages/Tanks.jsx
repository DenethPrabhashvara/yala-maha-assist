import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  ClipboardPlus,
  Download,
  Droplets,
  Gauge,
  LayoutGrid,
  List,
  MapPin,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Ruler,
  Search,
  Waves,
  X,
} from 'lucide-react'
import { TANK_STATUS_META } from '../data/tanks'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { cn, downloadCsv, formatNumber } from '../utils/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button, IconButton } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'
import { Gauge as GaugeChart } from '../components/ui/Gauge'
import { Sparkline } from '../components/ui/Sparkline'
import { Drawer, Modal } from '../components/ui/Overlay'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 9

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'critical', label: 'Critical (<10%)' },
  { value: 'low', label: 'Low (10–25%)' },
  { value: 'watch', label: 'Watch (25–50%)' },
  { value: 'healthy', label: 'Healthy (50%+)' },
  { value: 'spilling', label: 'Spilling now' },
]

const TONE_HEX = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  success: '#16a34a',
  primary: '#2563eb',
  neutral: '#a1a1aa',
}

const today = () => new Date().toLocaleDateString('en-CA')

const SRI_LANKA = [
  [9.83, 80.24], [9.68, 80.05], [9.42, 79.98], [9.15, 79.86], [8.95, 79.8],
  [8.75, 79.92], [8.55, 79.85], [8.2, 79.82], [7.98, 79.86], [7.7, 79.78],
  [7.32, 79.84], [7.1, 79.82], [6.86, 79.86], [6.6, 79.93], [6.34, 80.08],
  [6.05, 80.22], [5.92, 80.45], [5.87, 80.6], [6.02, 80.86], [6.14, 81.12],
  [6.28, 81.35], [6.45, 81.55], [6.72, 81.72], [7.02, 81.78], [7.32, 81.78],
  [7.62, 81.72], [7.92, 81.68], [8.2, 81.58], [8.45, 81.4], [8.62, 81.24],
  [8.85, 81.12], [9.05, 80.98], [9.3, 80.85], [9.55, 80.72], [9.72, 80.5],
]

const MAP_WIDTH = 460
const MAP_HEIGHT = 590
const MAP_PAD = 22

const projectPoint = (lat, lon) => {
  const x = MAP_PAD + ((lon - 79.55) / (81.95 - 79.55)) * (MAP_WIDTH - MAP_PAD * 2)
  const y = MAP_PAD + ((9.95 - lat) / (9.95 - 5.75)) * (MAP_HEIGHT - MAP_PAD * 2)
  return [x, y]
}

function getPageNumbers(total, current) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  return [...pages].filter((page) => page > 0 && page <= total).sort((a, b) => a - b)
}

function SortHeader({ label, field, sort, onSort, className }) {
  const active = sort.key === field
  return (
    <th className={cn(className, active && 'sorted')}>
      <button type="button" className="sort-btn" onClick={() => onSort(field)}>
        {label}
        {active ? (
          sort.direction === 'asc' ? (
            <ArrowUp size={13} />
          ) : (
            <ArrowDown size={13} />
          )
        ) : (
          <ArrowUpDown size={13} className="sort-idle" />
        )}
      </button>
    </th>
  )
}

function TankMap({ tanks: allTanks, atRisk, selected, onSelect, onHoverChange }) {
  const [hovered, setHovered] = useState(null)
  const tanks = allTanks.filter((tank) => tank.latitude !== null && tank.longitude !== null)
  const spotlights = atRisk.slice(0, 5)
  const focus = hovered || selected || spotlights[0] || tanks[0]

  const outline = SRI_LANKA.map(([lat, lon]) => projectPoint(lat, lon))
  const outlinePath = `${outline
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')} Z`

  return (
    <div className="map-layout">
      <div className="map-canvas">
        <div className="map-canvas-head">
          <div>
            <strong>Reservoir network</strong>
            <span>{tanks.length} tanks plotted by GPS position</span>
          </div>
          <Badge tone="info" icon={MapPin}>
            GPS positions
          </Badge>
        </div>
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="tank-map" role="img" aria-label="Map of reservoirs across Sri Lanka">
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="var(--map-ocean)" rx="20" />
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="var(--primary)" opacity="0.06" rx="20" />
          {[0, 1, 2, 3, 4, 5].map((line) => (
            <line
              key={`h-${line}`}
              x1="0"
              x2={MAP_WIDTH}
              y1={(MAP_HEIGHT / 5) * line}
              y2={(MAP_HEIGHT / 5) * line}
              className="map-grid-line"
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((line) => (
            <line
              key={`v-${line}`}
              y1="0"
              y2={MAP_HEIGHT}
              x1={(MAP_WIDTH / 5) * line}
              x2={(MAP_WIDTH / 5) * line}
              className="map-grid-line"
            />
          ))}
          <path d={outlinePath} fill="var(--map-land)" stroke="var(--map-coast)" strokeWidth="1.6" />
          <path d={outlinePath} fill="none" stroke="var(--map-coast)" strokeWidth="10" opacity="0.08" />
          {tanks.map((tank) => {
            const [x, y] = projectPoint(tank.latitude, tank.longitude)
            const radius = 3.2 + Math.min(3.8, tank.capacityAcft / 1600)
            const isActive = focus?.id === tank.id
            const fill = TONE_HEX[tank.statusMeta.tone] || '#2563eb'
            return (
              <g
                key={tank.id}
                transform={`translate(${x}, ${y})`}
                className="map-point"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(tank)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSelect(tank)
                }}
                onMouseEnter={() => {
                  setHovered(tank)
                  onHoverChange?.(tank)
                }}
                onMouseLeave={() => {
                  setHovered(null)
                  onHoverChange?.(null)
                }}
              >
                {isActive && <circle r={radius + 6} fill={fill} opacity="0.18" />}
                {tank.isSpilling && (
                  <circle r={radius + 3} fill="none" stroke={fill} strokeWidth="1" opacity="0.6" className="spill-pulse" />
                )}
                <circle r={radius} fill={fill} stroke="var(--map-point-stroke)" strokeWidth="1.2" />
                {isActive && (
                  <g transform={`translate(${Math.min(80, Math.max(-80, MAP_WIDTH - x - 90))}, ${-radius - 26})`}>
                    <rect x="-4" y="-18" width="150" height="36" rx="7" className="map-tooltip-bg" />
                    <text x="4" y="-3" className="map-tooltip-title">
                      {tank.name.length > 20 ? `${tank.name.slice(0, 19)}…` : tank.name}
                    </text>
                    <text x="4" y="12" className="map-tooltip-sub">
                      {tank.district} · {tank.percent.toFixed(1)}%
                    </text>
                  </g>
                )}
              </g>
            )
          })}
          <text x="18" y={MAP_HEIGHT - 22} className="map-label">INDIAN OCEAN</text>
          <text x={MAP_WIDTH - 78} y="48" className="map-coord">81°E</text>
          <text x="18" y="30" className="map-coord">9°N</text>
        </svg>
        <div className="map-legend">
          {Object.entries({
            healthy: 'Healthy 50%+',
            watch: 'Watch 25–50%',
            low: 'Low 10–25%',
            critical: 'Critical <10%',
          }).map(([key, label]) => (
            <span key={key} className="map-legend-item">
              <i style={{ background: TONE_HEX[TANK_STATUS_META[key].tone] }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="map-side">
        {focus && (
        <div className="map-focus">
          <span className="map-focus-eyebrow">Selected reservoir</span>
          <div className="map-focus-head">
            <div>
              <strong>{focus.name}</strong>
              <span>
                {focus.district} · {focus.division}
              </span>
            </div>
            <StatusBadge meta={focus.statusMeta} />
          </div>
          <div className="map-focus-gauge">
            <GaugeChart
              value={focus.percent}
              label="Usable storage"
              tone={TONE_HEX[focus.statusMeta.tone]}
              size="sm"
            />
          </div>
          <div className="map-focus-stats">
            <div>
              <span>Capacity</span>
              <strong>{formatNumber(focus.capacityAcft)} AF</strong>
            </div>
            <div>
              <span>Water depth</span>
              <strong>{focus.waterDepth.toFixed(1)} ft</strong>
            </div>
            <div>
              <span>Rainfall</span>
              <strong>{focus.rainfall ?? '—'} mm</strong>
            </div>
            <div>
              <span>Farmland</span>
              <strong>{formatNumber(focus.farmlandAcres)} ac</strong>
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => onSelect(focus)}>
            Open reservoir details
          </Button>
        </div>
        )}

        <div className="map-list">
          <div className="map-list-head">
            <strong>At-risk reservoirs</strong>
            <Badge tone="critical">{atRisk.length}</Badge>
          </div>
          {spotlights.map((tank) => (
            <button
              type="button"
              key={tank.id}
              className={cn('map-list-item', focus?.id === tank.id && 'is-active')}
              onClick={() => onSelect(tank)}
              onMouseEnter={() => {
                setHovered(tank)
                onHoverChange?.(tank)
              }}
              onMouseLeave={() => {
                setHovered(null)
                onHoverChange?.(null)
              }}
            >
              <div>
                <strong>{tank.name}</strong>
                <span>{tank.district}</span>
              </div>
              <div className="map-list-bar">
                <Progress value={tank.percent} tone={tank.statusMeta.tone} size="xs" />
                <small>{tank.percent.toFixed(1)}%</small>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Tanks() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const { TANKS: tanks, TANK_SUMMARY, DISTRICT_OPTIONS, AT_RISK_TANKS, reload } = useData()
  const { canEdit } = useAuth()
  const [query, setQuery] = useState(initialQuery)
  const [district, setDistrict] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ key: 'percent', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [view, setView] = useState('table')
  const [selectedId, setSelectedId] = useState(null)
  const [readingOpen, setReadingOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reading, setReading] = useState({ tankId: '', depth: '', percent: '', rainfall: '', date: today() })

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return tanks
      .filter((tank) => {
        if (search) {
          const haystack = `${tank.name} ${tank.district} ${tank.division} ${tank.id}`.toLowerCase()
          if (!haystack.includes(search)) return false
        }
        if (district !== 'all' && tank.district !== district) return false
        if (type !== 'all' && tank.type.toLowerCase() !== type) return false
        if (status === 'spilling' && !tank.isSpilling) return false
        if (status !== 'all' && status !== 'spilling' && tank.status !== status) return false
        return true
      })
      .sort((a, b) => {
        const direction = sort.direction === 'asc' ? 1 : -1
        const left = a[sort.key]
        const right = b[sort.key]
        if (typeof left === 'string') return left.localeCompare(right) * direction
        if (left === null || left === undefined) return 1
        if (right === null || right === undefined) return -1
        return (left - right) * direction
      })
  }, [tanks, query, district, type, status, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageTanks = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = tanks.find((tank) => tank.id === selectedId) || null
  const selectedPoints = selected ? selected.history.filter((point) => point.percent !== null) : []
  const selectedTrend =
    selectedPoints.length >= 2
      ? { points: selectedPoints, change: selectedPoints.at(-1).percent - selectedPoints[0].percent }
      : null

  useEffect(() => {
    setPage(1)
  }, [query, district, type, status, sort])

  useEffect(() => {
    if (initialQuery) {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams)
        params.delete('q')
        setSearchParams(params, { replace: true })
      }, 400)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [initialQuery, searchParams, setSearchParams])

  const updateParam = (value) => {
    setQuery(value)
    const params = new URLSearchParams(searchParams)
    if (value) params.set('q', value)
    else params.delete('q')
    setSearchParams(params, { replace: true })
  }

  const resetFilters = () => {
    setQuery('')
    setDistrict('all')
    setType('all')
    setStatus('all')
    setSearchParams({}, { replace: true })
    toast('Filters cleared — showing all monitored reservoirs.', { tone: 'info' })
  }

  const openReading = (tank = null) => {
    const target = tank || selected || AT_RISK_TANKS[0] || tanks[0]
    setReading({
      tankId: target.id,
      depth: target.waterDepth.toFixed(2),
      percent: target.percent.toFixed(1),
      rainfall: target.rainfall ?? '',
      date: today(),
    })
    setReadingOpen(true)
  }

  const handleSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
  }

  const handleExport = () => {
    downloadCsv(
      `YalaMaha-reservoirs-${filtered.length}.csv`,
      filtered.map((tank) => ({
        ID: tank.id,
        Reservoir: tank.name,
        District: tank.district,
        Division: tank.division,
        Type: tank.type,
        'Capacity (AFT)': tank.capacityAcft,
        'Storage (AFT)': tank.storageAcft,
        'Storage (%)': tank.percent,
        'Water depth (ft)': tank.waterDepth,
        'Full depth (ft)': tank.fullDepth,
        'Rainfall (mm)': tank.rainfall ?? '',
        Spilling: tank.isSpilling ? 'Yes' : 'No',
        Status: tank.statusMeta.label,
        'Reading date': tank.reading_date,
      })),
    )
    toast(`${filtered.length} reservoir records exported.`, { title: 'CSV ready', tone: 'success' })
  }

  const saveReading = async (event) => {
    event.preventDefault()
    const percent = Number(reading.percent)
    if (reading.percent === '' || Number.isNaN(percent) || percent < 0 || percent > 150) {
      toast('Usable storage must be a percentage between 0 and 150.', { tone: 'error' })
      return
    }
    const target = tanks.find((tank) => tank.id === reading.tankId)
    if (!target) return

    setSaving(true)
    try {
      await api(`/admin/data/reservoirs/${target.dbId}/readings`, {
        method: 'POST',
        body: {
          usable_storage_percent: percent,
          water_depth_ft: reading.depth,
          rainfall_prev_day_mm: reading.rainfall,
          reading_date: reading.date,
        },
      })
      await reload(['reservoirs'])
      setReadingOpen(false)
      toast(`Field reading of ${formatDate(reading.date)} saved for ${target.name}.`, {
        title: 'Reading recorded',
        tone: 'success',
      })
    } catch (error) {
      toast(error.message, { title: 'Reading not saved', tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const summaryStats = [
    {
      label: 'Monitored reservoirs',
      value: TANK_SUMMARY.total,
      hint: `${TANK_SUMMARY.major} major · ${TANK_SUMMARY.medium} medium · ${TANK_SUMMARY.reporting} reporting`,
      icon: Droplets,
      tone: 'primary',
    },
    {
      label: 'Average storage',
      value: `${TANK_SUMMARY.averageStorage.toFixed(1)}%`,
      hint: `${(TANK_SUMMARY.totalStorageAcft / 1000).toFixed(0)}k AFT held`,
      icon: Gauge,
      tone: 'teal',
    },
    {
      label: 'Critical storage',
      value: TANK_SUMMARY.critical,
      hint: 'Below the 10% threshold',
      icon: AlertTriangle,
      tone: 'critical',
      onClick: () => setStatus('critical'),
    },
    {
      label: 'Spilling now',
      value: TANK_SUMMARY.spilling,
      hint: 'Spillway discharge active',
      icon: Waves,
      tone: 'info',
    },
  ]

  const activeFilters =
    (query ? 1 : 0) +
    (district !== 'all' ? 1 : 0) +
    (type !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0)

  return (
    <div className="page tanks-page">
      <PageHeader
        eyebrow={`Water resources · Latest readings ${formatDate(TANK_SUMMARY.latestReading)}`}
        badge={
          <Badge tone="info" dot>
            {TANK_SUMMARY.total} reservoirs
          </Badge>
        }
        title="Tank & reservoir register"
        description={`Usable storage, spilling reservoirs and field readings for the ${TANK_SUMMARY.total} monitored reservoirs.`}
        actions={
          <>
            <Button icon={Download} variant="secondary" onClick={handleExport}>
              Export CSV
            </Button>
            {canEdit && (
              <Button icon={ClipboardPlus} variant="primary" onClick={() => openReading()}>
                Log field reading
              </Button>
            )}
          </>
        }
      />

      <div className="mini-stat-grid">
        {summaryStats.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.label}
              className={cn('mini-stat', item.onClick && 'mini-stat-action')}
              onClick={item.onClick}
            >
              <span className={`mini-stat-icon tone-${item.tone}`}>
                <Icon size={17} />
              </span>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.hint}</small>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="filter-card">
        <div className="filter-row">
          <label className="search-field">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => updateParam(event.target.value)}
              placeholder="Search by tank, district, division or ID…"
              aria-label="Search reservoirs"
            />
            {query && (
              <button type="button" onClick={() => updateParam('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </label>

          <label className="select-field">
            <span>District</span>
            <select value={district} onChange={(event) => setDistrict(event.target.value)}>
              <option value="all">All districts</option>
              {DISTRICT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="select-field">
            <span>Type</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">All types</option>
              <option value="major">Major</option>
              <option value="medium">Medium</option>
            </select>
          </label>

          <label className="select-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUS_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <IconButton label="Reset filters" onClick={resetFilters}>
            <RotateCcw size={16} />
          </IconButton>

          <div className="view-toggle">
            <button
              type="button"
              className={view === 'table' ? 'active' : ''}
              onClick={() => setView('table')}
              title="Table view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={view === 'map' ? 'active' : ''}
              onClick={() => setView('map')}
              title="Map view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
        <div className="filter-meta">
          <span>
            Showing <strong>{filtered.length}</strong> of {tanks.length} reservoirs
            {activeFilters > 0 && ` · ${activeFilters} filter${activeFilters > 1 ? 's' : ''} applied`}
          </span>
          <span className="filter-meta-right">
            <span className="status-dot" />
            Daily readings from the Irrigation Department
          </span>
        </div>
      </Card>

      {view === 'map' ? (
        <Card className="map-card">
          <TankMap
            tanks={filtered}
            atRisk={AT_RISK_TANKS}
            selected={selected}
            onSelect={(tank) => setSelectedId(tank.id)}
          />
        </Card>
      ) : (
        <Card className="table-card tanks-table-card">
          <CardHeader
            icon={Droplets}
            title="Reservoir register"
            subtitle="Click any row to inspect storage, spillway status and field history"
            action={
              <Badge tone={filtered.length ? 'neutral' : 'warning'}>
                {filtered.length} records
              </Badge>
            }
          />
          <div className="table-scroll">
            <table className="data-table tanks-table">
              <thead>
                <tr>
                  <SortHeader label="Reservoir" field="name" sort={sort} onSort={handleSort} />
                  <SortHeader label="District" field="district" sort={sort} onSort={handleSort} />
                  <th>Type</th>
                  <SortHeader label="Capacity" field="capacityAcft" sort={sort} onSort={handleSort} className="numeric" />
                  <SortHeader label="Storage" field="percent" sort={sort} onSort={handleSort} />
                  <SortHeader label="Depth" field="waterDepth" sort={sort} onSort={handleSort} />
                  <th>Rainfall</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {pageTanks.map((tank) => (
                  <tr key={tank.id} className="clickable-row" onClick={() => setSelectedId(tank.id)}>
                    <td>
                      <div className="cell-primary">
                        <span className={cn('cell-avatar', `tone-${tank.statusMeta.tone}`)}>
                          <Droplets size={15} />
                        </span>
                        <div>
                          <strong>
                            {tank.name}
                            {tank.isSpilling && <span className="spill-tag">Spilling</span>}
                          </strong>
                          <small>
                            {tank.id} · {tank.division}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">{tank.district}</td>
                    <td>
                      <Badge tone={tank.type === 'Major' ? 'info' : 'neutral'}>{tank.type}</Badge>
                    </td>
                    <td className="numeric-cell">{formatNumber(tank.capacityAcft)} AF</td>
                    <td>
                      <div className="storage-cell">
                        <Progress
                          value={tank.percent}
                          tone={tank.statusMeta.tone}
                          size="sm"
                          showLabel
                          label={`${tank.percent.toFixed(1)}%`}
                        />
                      </div>
                    </td>
                    <td className="muted-cell">
                      {tank.waterDepth.toFixed(1)} / {tank.fullDepth.toFixed(0)} ft
                    </td>
                    <td className="muted-cell">{tank.rainfall === null ? '—' : `${tank.rainfall} mm`}</td>
                    <td>
                      <StatusBadge meta={tank.statusMeta} />
                    </td>
                    <td>
                      <ChevronRight size={16} className="row-chevron" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageTanks.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <Search size={22} />
              </span>
              <strong>No reservoirs match these filters</strong>
              <span>Try a different district, status, or search term.</span>
              <Button variant="secondary" size="sm" icon={RotateCcw} onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          )}

          <div className="table-footer pagination-footer">
            <span>
              Showing{' '}
              <strong>
                {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </strong>{' '}
              of {filtered.length}
            </span>
            <div className="pagination">
              <button
                type="button"
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <ArrowLeft size={15} />
              </button>
              {getPageNumbers(totalPages, currentPage).map((item, index, array) => (
                <span key={item} className="page-number-wrap">
                  {index > 0 && item - array[index - 1] > 1 && <span className="page-ellipsis">…</span>}
                  <button
                    type="button"
                    className={cn('page-btn', item === currentPage && 'active')}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Card>
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name || 'Reservoir'}
        description={
          selected
            ? `${selected.district} district · ${selected.division} division · ${selected.id}`
            : ''
        }
        icon={Droplets}
        width="md"
        footer={
          selected && (
            <div className="drawer-actions">
              <Button
                variant="secondary"
                icon={MessageSquareText}
                onClick={() => navigate('/sms')}
              >
                Notify farmers
              </Button>
              {canEdit && (
                <Button variant="primary" icon={ClipboardPlus} onClick={() => openReading(selected)}>
                  Log reading
                </Button>
              )}
            </div>
          )
        }
      >
        {selected && (
          <div className="tank-detail">
            <div className="tank-detail-top">
              <div className="tank-detail-gauge">
                <GaugeChart
                  value={selected.percent}
                  label="Usable storage"
                  tone={TONE_HEX[selected.statusMeta.tone]}
                />
              </div>
              <div className="tank-detail-summary">
                <StatusBadge meta={selected.statusMeta} />
                <p>{selected.statusMeta.description}</p>
                <div className="detail-pill-row">
                  <Badge tone={selected.type === 'Major' ? 'info' : 'neutral'}>
                    {selected.type} tank
                  </Badge>
                  {selected.isSpilling && (
                    <Badge tone="warning" dot>
                      Spilling · {selected.spillRate} cusec
                    </Badge>
                  )}
                </div>
                <div className="capacity-lines">
                  <div>
                    <span>Storage held</span>
                    <strong>{formatNumber(selected.storageAcft)} AF</strong>
                  </div>
                  <div>
                    <span>Gross capacity</span>
                    <strong>{formatNumber(selected.capacityAcft)} AF</strong>
                  </div>
                </div>
              </div>
            </div>

            {selected.isSpilling && (
              <div className="detail-banner warning">
                <Waves size={17} />
                <div>
                  <strong>Spillway active</strong>
                  <span>
                    Discharging {selected.spillRate} cusec. Downstream impact:{' '}
                    {selected.ds_impact || 'monitored by the divisional office'}.
                  </span>
                </div>
              </div>
            )}

            <div className="detail-stat-grid">
              <div className="detail-stat">
                <span className="detail-stat-icon"><Ruler size={15} /></span>
                <span>Water depth</span>
                <strong>{selected.waterDepth.toFixed(2)} ft</strong>
                <small>of {selected.fullDepth.toFixed(1)} ft full depth</small>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-icon"><Droplets size={15} /></span>
                <span>Rainfall · previous day</span>
                <strong>{selected.rainfall === null ? '—' : `${selected.rainfall} mm`}</strong>
                <small>Measured at the reservoir</small>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-icon"><MapPin size={15} /></span>
                <span>Farmland served</span>
                <strong>{formatNumber(selected.farmlandAcres)} ac</strong>
                <small>{selected.division} command area</small>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-icon"><RefreshCw size={15} /></span>
                <span>Last reading</span>
                <strong>{formatDate(selected.reading_date, { month: 'short' })}</strong>
                <small>{selected.hasReading ? 'Irrigation Department reading' : 'No reading yet'}</small>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-head">
                <div>
                  <strong>Storage trajectory</strong>
                  <span>Readings of the last 30 days · % usable storage</span>
                </div>
                {selectedTrend && (
                  <Badge tone={selectedTrend.change >= 0 ? 'success' : 'warning'}>
                    {selectedTrend.change >= 0 ? 'Rising' : 'Falling'} {Math.abs(selectedTrend.change).toFixed(1)} pts
                  </Badge>
                )}
              </div>
              {selectedTrend ? (
                <div className="detail-chart">
                  <Sparkline
                    data={selectedTrend.points.map((point) => point.percent)}
                    width={420}
                    height={86}
                    color={TONE_HEX[selected.statusMeta.tone]}
                    strokeWidth={2.4}
                    className="detail-sparkline"
                  />
                  <div className="detail-chart-axis">
                    <span>{formatDate(selectedTrend.points[0].date, { year: undefined })}</span>
                    <span>{formatDate(selectedTrend.points.at(-1).date, { year: undefined })} · {selected.percent.toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <p className="muted-cell">Not enough readings in the last 30 days to draw a trend.</p>
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-head">
                <strong>Location & telemetry</strong>
              </div>
              <div className="detail-meta-list">
                <div>
                  <span>Coordinates</span>
                  <strong>
                    {selected.latitude !== null
                      ? `${selected.latitude.toFixed(4)}° N, ${selected.longitude.toFixed(4)}° E`
                      : 'Not recorded'}
                  </strong>
                </div>
                <div>
                  <span>Monitoring source</span>
                  <strong>Irrigation Department daily feed</strong>
                </div>
                <div>
                  <span>Command area</span>
                  <strong>{formatNumber(selected.farmlandAcres)} acres</strong>
                </div>
                <div>
                  <span>Reservoir ID</span>
                  <strong>{selected.id}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={readingOpen}
        onClose={() => setReadingOpen(false)}
        title="Log a field reading"
        description="Record gauge values for a day. A reading for a day that already has one replaces it."
        icon={ClipboardPlus}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReadingOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={ClipboardPlus} loading={saving} onClick={saveReading}>
              Save reading
            </Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={saveReading}>
          <label className="field span-2">
            <span>Tank / reservoir</span>
            <select
              value={reading.tankId}
              onChange={(event) => {
                const tank = tanks.find((item) => item.id === event.target.value)
                setReading((current) => ({
                  tankId: event.target.value,
                  depth: tank ? tank.waterDepth.toFixed(2) : '',
                  percent: tank ? tank.percent.toFixed(1) : '',
                  rainfall: tank?.rainfall ?? '',
                  date: current.date,
                }))
              }}
            >
              {tanks.map((tank) => (
                <option key={tank.id} value={tank.id}>
                  {tank.name} · {tank.district}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Water depth (ft)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={reading.depth}
              onChange={(event) => setReading((current) => ({ ...current, depth: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Usable storage (%)</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="150"
              value={reading.percent}
              onChange={(event) => setReading((current) => ({ ...current, percent: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Rainfall · previous day (mm)</span>
            <input
              type="number"
              step="0.1"
              min="0"
              value={reading.rainfall}
              onChange={(event) => setReading((current) => ({ ...current, rainfall: event.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label className="field">
            <span>Reading date</span>
            <input
              type="date"
              max={today()}
              value={reading.date}
              onChange={(event) => setReading((current) => ({ ...current, date: event.target.value }))}
              required
            />
          </label>
          <div className="form-note span-2">
            <AlertTriangle size={15} />
            Readings below 10% show the reservoir as critical on the dashboard and in alerts.
          </div>
        </form>
      </Modal>
    </div>
  )
}
