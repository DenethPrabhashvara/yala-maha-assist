import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  Droplets,
  Leaf,
  MapPin,
  MessageSquareText,
  Pencil,
  Search,
  Sprout,
  Trash2,
  UserCheck,
  UserPlus,
  UserRound,
  UserX,
  Users,
  Wheat,
  X,
} from 'lucide-react'
import { WATER_SOURCE_LABELS, farmerFromApi, formatPhone } from '../data/farmers'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api/client'
import { cn, downloadCsv, formatDate, formatNumber } from '../utils/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Progress } from '../components/ui/Progress'
import { Modal } from '../components/ui/Overlay'
import { FarmerGrowthChart, CropDonut } from '../components/charts'

const FARMERS_PER_PAGE = 10

const STATUS_TONE = {
  Active: 'success',
  Inactive: 'neutral',
}

const SCHEDULE_TONE = {
  Releasing: 'success',
  Starting: 'info',
  Scheduled: 'warning',
  Completed: 'neutral',
}

const EDIT_FIELDS = ['full_name', 'phone', 'address', 'district', 'division', 'primary_crop']

function getPageNumbers(total, current) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  return [...pages].filter((page) => page > 0 && page <= total).sort((a, b) => a - b)
}

// One page of GET /admin/farmers for the current filters, searched after typing stops
function useFarmerList({ query, district, status, page }) {
  const [state, setState] = useState({ rows: [], total: 0, loading: true, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ page: String(page), limit: String(FARMERS_PER_PAGE) })
    if (query.trim()) params.set('q', query.trim())
    if (district !== 'all') params.set('district', district)
    if (status !== 'all') params.set('is_active', status === 'Active' ? 'true' : 'false')
    setState((current) => ({ ...current, loading: true }))
    const timer = setTimeout(() => {
      api(`/admin/farmers?${params}`)
        .then((result) => {
          if (!cancelled) setState({ rows: result.data.map(farmerFromApi), total: result.total, loading: false, error: null })
        })
        .catch((error) => {
          if (!cancelled) setState({ rows: [], total: 0, loading: false, error: error.message })
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, district, status, page, version])

  return { ...state, refresh: () => setVersion((value) => value + 1) }
}

export function FarmerPortal() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { canEdit } = useAuth()
  const {
    FARMER_SUMMARY,
    FARMER_REGISTRATION_TREND,
    FARMER_CROP_DISTRIBUTION,
    FARMER_WATER_SOURCES,
    DISTRICT_FARMERS,
    IRRIGATION_SCHEDULES,
    SCHEDULE_SUMMARY,
    reload,
  } = useData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'calendar' ? 'calendar' : 'farmers')
  const [farmerQuery, setFarmerQuery] = useState(searchParams.get('q') || '')
  const [district, setDistrict] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [scheduleQuery, setScheduleQuery] = useState('')
  const [scheduleStatus, setScheduleStatus] = useState('all')
  const [scheduleLimit, setScheduleLimit] = useState(10)

  const list = useFarmerList({ query: farmerQuery, district, status, page })

  useEffect(() => {
    const query = searchParams.get('q')
    const urlTab = searchParams.get('tab')
    if (urlTab === 'calendar' || urlTab === 'farmers') setTab(urlTab)
    if (query !== null) {
      setFarmerQuery(query)
      setTab('farmers')
    }
  }, [searchParams])

  useEffect(() => {
    setPage(1)
  }, [farmerQuery, district, status])

  const totalPages = Math.max(1, Math.ceil(list.total / FARMERS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)

  const changeTab = (nextTab) => {
    setTab(nextTab)
    const params = new URLSearchParams(searchParams)
    params.set('tab', nextTab)
    params.delete('q')
    setSearchParams(params, { replace: true })
  }

  const filteredSchedules = useMemo(() => {
    const search = scheduleQuery.trim().toLowerCase()
    return IRRIGATION_SCHEDULES.filter((schedule) => {
      if (search && !`${schedule.system} ${schedule.id}`.toLowerCase().includes(search)) return false
      if (scheduleStatus === 'releasing' && !['Releasing', 'Starting'].includes(schedule.status)) return false
      if (scheduleStatus === 'scheduled' && schedule.status !== 'Scheduled') return false
      if (scheduleStatus === 'completed' && schedule.status !== 'Completed') return false
      return true
    })
  }, [IRRIGATION_SCHEDULES, scheduleQuery, scheduleStatus])

  useEffect(() => {
    setScheduleLimit(10)
  }, [scheduleQuery, scheduleStatus])

  const openFarmer = async (farmer) => {
    setSelected(farmer)
    setEditing(null)
    try {
      const result = await api(`/admin/farmers/${farmer.id}`)
      setSelected(farmerFromApi(result.data))
    } catch (error) {
      toast(error.message, { title: 'Farm details not loaded', tone: 'error' })
    }
  }

  const closeFarmer = () => {
    setSelected(null)
    setEditing(null)
    setConfirmDelete(false)
  }

  // Every farmer matching the filters, 200 at a time
  const handleExportFarmers = async () => {
    const params = new URLSearchParams({ limit: '200' })
    if (farmerQuery.trim()) params.set('q', farmerQuery.trim())
    if (district !== 'all') params.set('district', district)
    if (status !== 'all') params.set('is_active', status === 'Active' ? 'true' : 'false')
    try {
      const rows = []
      for (let next = 1; ; next += 1) {
        params.set('page', String(next))
        const result = await api(`/admin/farmers?${params}`)
        rows.push(...result.data.map(farmerFromApi))
        if (rows.length >= result.total || result.data.length === 0) break
      }
      downloadCsv(
        'YalaMaha-farmer-registry.csv',
        rows.map((farmer) => ({
          'Farm ID': farmer.farm_id,
          Name: farmer.name,
          Phone: farmer.phoneLabel,
          District: farmer.district,
          Division: farmer.division,
          'Water source': farmer.scheme,
          'Primary crop': farmer.crop,
          'Land (acres)': farmer.landAcres ?? '',
          Crops: farmer.crop_count,
          Status: farmer.status,
          Registered: farmer.joinedLabel,
        })),
      )
      toast(`${rows.length} farmers exported as CSV.`, { title: 'Export complete', tone: 'success' })
    } catch (error) {
      toast(error.message, { title: 'Export failed', tone: 'error' })
    }
  }

  const afterChange = () => {
    list.refresh()
    reload(['farmerStats'])
  }

  const saveFarmer = async (changes) => {
    setSaving(true)
    try {
      const result = await api(`/admin/farmers/${selected.id}`, { method: 'PATCH', body: changes })
      setSelected(farmerFromApi(result.data))
      setEditing(null)
      afterChange()
      toast(`${result.data.full_name}'s record was updated.`, { title: 'Farmer updated', tone: 'success' })
    } catch (error) {
      toast(error.message, { title: 'Not saved', tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const submitEdit = (event) => {
    event.preventDefault()
    const changes = {}
    for (const field of EDIT_FIELDS) {
      const value = editing[field].trim()
      const before = field === 'phone' ? formatPhone(selected.phone) : selected[field] || ''
      if (value !== before) changes[field] = value
    }
    if (Object.keys(changes).length === 0) {
      setEditing(null)
      return
    }
    saveFarmer(changes)
  }

  const deleteFarmer = async () => {
    setSaving(true)
    try {
      await api(`/admin/farmers/${selected.id}`, { method: 'DELETE' })
      toast(`${selected.name} and their farm records were deleted.`, { title: 'Farmer deleted', tone: 'success' })
      closeFarmer()
      afterChange()
    } catch (error) {
      toast(error.message, { title: 'Not deleted', tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const growth = FARMER_SUMMARY.newThisMonth - FARMER_SUMMARY.newLastMonth
  const stats = [
    {
      label: 'Registered farmers',
      value: formatNumber(FARMER_SUMMARY.registered),
      hint: `In ${FARMER_SUMMARY.districts} district${FARMER_SUMMARY.districts === 1 ? '' : 's'}`,
      icon: Users,
      tone: 'primary',
    },
    {
      label: 'Active',
      value: formatNumber(FARMER_SUMMARY.active),
      hint: FARMER_SUMMARY.registered
        ? `${((FARMER_SUMMARY.active / FARMER_SUMMARY.registered) * 100).toFixed(0)}% of the registry`
        : 'No farmers yet',
      icon: UserCheck,
      tone: 'success',
    },
    {
      label: 'New this month',
      value: formatNumber(FARMER_SUMMARY.newThisMonth),
      hint: `${growth >= 0 ? '+' : ''}${growth} vs last month`,
      icon: UserPlus,
      tone: 'teal',
    },
    {
      label: 'Land registered',
      value: `${formatNumber(Math.round(FARMER_SUMMARY.totalAcres))} ac`,
      hint: FARMER_SUMMARY.registered
        ? `${(FARMER_SUMMARY.totalAcres / FARMER_SUMMARY.registered).toFixed(1)} acres per farmer`
        : '—',
      icon: Wheat,
      tone: 'violet',
    },
  ]

  const scheduleStats = [
    {
      label: 'Canal sections',
      value: SCHEDULE_SUMMARY.total,
      hint: `Under ${SCHEDULE_SUMMARY.schemes} schemes`,
      icon: Droplets,
      tone: 'primary',
    },
    {
      label: 'Cultivation target',
      value: formatNumber(Math.round(SCHEDULE_SUMMARY.totalArea)),
      hint: 'Hectares, all crops',
      icon: Wheat,
      tone: 'teal',
    },
    {
      label: 'Receiving water now',
      value: SCHEDULE_SUMMARY.releasing,
      hint: `${SCHEDULE_SUMMARY.scheduled} start later`,
      icon: CalendarDays,
      tone: 'success',
    },
    {
      label: 'Paddy target',
      value: formatNumber(Math.round(SCHEDULE_SUMMARY.paddyArea)),
      hint: 'Hectares of paddy',
      icon: Sprout,
      tone: 'warning',
    },
  ]

  const topCrops = FARMER_CROP_DISTRIBUTION

  return (
    <div className="page farmers-page">
      <PageHeader
        eyebrow="Farmer services"
        badge={
          <Badge tone="success" dot>
            {formatNumber(FARMER_SUMMARY.registered)} registered
          </Badge>
        }
        title="Farmers & water schedule"
        description="Farmers registered through the farmer portal, and when each canal section receives water."
        actions={
          <>
            <Button icon={Download} variant="secondary" onClick={handleExportFarmers}>
              Export registry
            </Button>
            <Button icon={MessageSquareText} variant="primary" onClick={() => navigate('/sms')}>
              Message farmers
            </Button>
          </>
        }
      />

      <div className="page-tabs" role="tablist" aria-label="Farmer portal sections">
        {[
          { id: 'farmers', label: 'Farmer registry', icon: Users, count: FARMER_SUMMARY.registered },
          { id: 'calendar', label: 'Water issue schedule', icon: CalendarDays, count: SCHEDULE_SUMMARY.total },
        ].map((item) => {
          const Icon = item.icon
          return (
            <button
              type="button"
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              className={cn('page-tab', tab === item.id && 'active')}
              onClick={() => changeTab(item.id)}
            >
              <Icon size={14} />
              {item.label}
              <span className="page-tab-count">{item.count}</span>
            </button>
          )
        })}
      </div>

      {tab === 'farmers' && (
        <>
          <div className="mini-stat-grid">
            {stats.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label} className="mini-stat">
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

          <section className="farmer-charts">
            <Card className="span-7 chart-card">
              <CardHeader
                icon={UserPlus}
                title="Registrations per month"
                subtitle="New registrations over the last 12 months, and how many are still active"
                action={<Badge tone="success">+{formatNumber(FARMER_SUMMARY.newThisMonth)} this month</Badge>}
              />
              <div className="chart-box" style={{ height: 236 }}>
                <FarmerGrowthChart data={FARMER_REGISTRATION_TREND} />
              </div>
              <div className="table-footer">
                <span>
                  Water sources:{' '}
                  {FARMER_WATER_SOURCES.map((row) => `${row.label} ${row.farmers}`).join(' · ') || '—'}
                </span>
              </div>
            </Card>

            <Card className="span-5 chart-card">
              <CardHeader
                icon={Leaf}
                title="Crops grown"
                subtitle="Share of farmers growing each crop (a farmer can grow several)"
              />
              <div className="farmer-crop-body">
                <CropDonut
                  data={topCrops}
                  total={formatNumber(FARMER_SUMMARY.registered)}
                  centerLabel="Farmers"
                />
                <div className="crop-legend">
                  {topCrops.map((crop) => (
                    <div className="crop-legend-row" key={crop.name}>
                      <span>
                        <i style={{ background: crop.color }} />
                        {crop.name}
                      </span>
                      <strong>{crop.value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
              {DISTRICT_FARMERS[0] && (
                <div className="farmer-insight">
                  <MapPin size={13} />
                  <span>
                    <strong>{DISTRICT_FARMERS[0].district}</strong> has the most farmers:{' '}
                    {formatNumber(DISTRICT_FARMERS[0].farmers)}
                  </span>
                </div>
              )}
            </Card>
          </section>

          <Card className="table-card">
            <CardHeader
              icon={Users}
              title="Farmer registry"
              subtitle="Newest registrations first. Click a farmer to see their farm and crops."
              action={<Badge tone="info">{formatNumber(list.total)} records</Badge>}
            />
            <div className="schedule-toolbar">
              <label className="search-field">
                <Search size={15} />
                <input
                  value={farmerQuery}
                  onChange={(event) => setFarmerQuery(event.target.value)}
                  placeholder="Search by name, phone, farm ID, district…"
                  aria-label="Search farmers"
                />
                {farmerQuery && (
                  <button type="button" onClick={() => setFarmerQuery('')} aria-label="Clear search">
                    <X size={13} />
                  </button>
                )}
              </label>
              <label className="select-field">
                <span>District</span>
                <select value={district} onChange={(event) => setDistrict(event.target.value)}>
                  <option value="all">All districts</option>
                  {DISTRICT_FARMERS.map((item) => (
                    <option key={item.district} value={item.district}>
                      {item.district}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-field">
                <span>Status</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>District / water source</th>
                    <th>Crop</th>
                    <th>Land</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((farmer) => (
                    <tr key={farmer.id} className="clickable-row" onClick={() => openFarmer(farmer)}>
                      <td>
                        <div className="farmer-cell">
                          <Avatar name={farmer.name} size="sm" />
                          <div>
                            <strong>{farmer.name}</strong>
                            <small>{farmer.farm_id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-stack">
                          <strong>{farmer.district}</strong>
                          <small>{farmer.scheme}</small>
                        </div>
                      </td>
                      <td>
                        <Badge tone="neutral">
                          {farmer.crop}
                          {farmer.crop_count > 1 ? ` +${farmer.crop_count - 1}` : ''}
                        </Badge>
                      </td>
                      <td className="muted-cell">{farmer.landAcres === null ? '—' : `${farmer.landAcres} ac`}</td>
                      <td className="muted-cell">{farmer.phoneLabel}</td>
                      <td>
                        <Badge tone={STATUS_TONE[farmer.status]} dot>
                          {farmer.status}
                        </Badge>
                      </td>
                      <td className="muted-cell">{farmer.joinedLabel}</td>
                      <td>
                        <ChevronRight size={15} className="row-chevron" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!list.loading && list.rows.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">
                  <Search size={22} />
                </span>
                <strong>{list.error ? 'Farmers could not be loaded' : 'No farmers match this search'}</strong>
                <span>{list.error || 'Try another name, phone number, district or farm ID.'}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFarmerQuery('')
                    setDistrict('all')
                    setStatus('all')
                    list.refresh()
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}

            <div className="table-footer">
              <span>
                {list.loading ? (
                  'Loading…'
                ) : (
                  <>
                    Showing{' '}
                    <strong>
                      {list.total === 0 ? 0 : (currentPage - 1) * FARMERS_PER_PAGE + 1}–
                      {Math.min(currentPage * FARMERS_PER_PAGE, list.total)}
                    </strong>{' '}
                    of {formatNumber(list.total)} farmers
                  </>
                )}
              </span>
              <div className="pagination">
                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Previous page"
                >
                  ‹
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
                  ›
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'calendar' && (
        <>
          <div className="schedule-banner">
            <span className="schedule-banner-icon">
              <Droplets size={20} />
            </span>
            <div>
              <strong>Mahaweli water issue schedule</strong>
              <span>
                {SCHEDULE_SUMMARY.total} canal sections under {SCHEDULE_SUMMARY.schemes} schemes ·{' '}
                {formatNumber(Math.round(SCHEDULE_SUMMARY.totalArea))} hectares to cultivate
              </span>
            </div>
            <Badge tone="success" dot>
              From the database
            </Badge>
          </div>

          <div className="mini-stat-grid">
            {scheduleStats.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label} className="mini-stat">
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

          <Card className="table-card">
            <CardHeader
              icon={CalendarDays}
              title="Water release by canal section"
              subtitle="When each section receives water, its crop targets and how far the season has gone"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Download}
                  onClick={() => {
                    downloadCsv(
                      'YalaMaha-water-issue-schedule.csv',
                      IRRIGATION_SCHEDULES.map((schedule) => ({
                        Scheme: schedule.scheme,
                        Section: schedule.section ?? '',
                        'Water from': schedule.startLabel,
                        'Water until': schedule.endLabel,
                        'Duration (days)': schedule.durationDays,
                        'Paddy target (ha)': schedule.paddyArea,
                        'Total target (ha)': schedule.totalArea,
                        Status: schedule.status,
                        'Progress (%)': schedule.progress,
                      })),
                    )
                    toast('Water issue schedule downloaded.', { tone: 'success' })
                  }}
                >
                  Download schedule
                </Button>
              }
            />
            <div className="schedule-toolbar">
              <label className="search-field">
                <Search size={15} />
                <input
                  value={scheduleQuery}
                  onChange={(event) => setScheduleQuery(event.target.value)}
                  placeholder="Search scheme or canal…"
                  aria-label="Search canal sections"
                />
              </label>
              <div className="segmented">
                {[
                  ['all', 'All'],
                  ['releasing', 'Receiving water'],
                  ['scheduled', 'Not started'],
                  ['completed', 'Finished'],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={scheduleStatus === value ? 'active' : ''}
                    onClick={() => setScheduleStatus(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="schedule-area" style={{ marginLeft: 'auto' }}>
                {filteredSchedules.length} sections
              </span>
            </div>

            <div className="schedule-list">
              {filteredSchedules.slice(0, scheduleLimit).map((schedule) => (
                <div className="schedule-item" key={schedule.id}>
                  <div className="schedule-main">
                    <strong>{schedule.system}</strong>
                    <span>{formatNumber(schedule.extent)} ha initial extent</span>
                    <div className="schedule-crops">
                      {schedule.crops.map((crop) => (
                        <span className="crop-pill" key={`${schedule.id}-${crop.name}`}>
                          {crop.name}
                          {crop.duration ? ` · ${crop.duration}d` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="schedule-date">
                    <span>Water issue</span>
                    <strong>
                      {schedule.startLabel} → {schedule.endLabel}
                    </strong>
                    <small style={{ fontSize: 8.4, color: 'var(--muted-2)' }}>{schedule.durationDays} days</small>
                  </div>
                  <div className="schedule-progress">
                    <Progress
                      value={schedule.progress}
                      tone={SCHEDULE_TONE[schedule.status] || 'primary'}
                      size="sm"
                      showLabel
                      label={`${schedule.progress}%`}
                    />
                    <small>
                      {schedule.status === 'Scheduled'
                        ? `Starts ${formatDate(schedule.start, { year: undefined })}`
                        : schedule.status === 'Completed'
                          ? 'Finished'
                          : `${schedule.progress}% of the water issue period gone`}
                    </small>
                  </div>
                  <div className="schedule-status">
                    <div className="schedule-area">
                      {formatNumber(schedule.totalArea)} ha
                      <br />
                      <small style={{ fontSize: 8.4, color: 'var(--muted-2)' }}>{schedule.primaryCrop}</small>
                    </div>
                    <Badge tone={SCHEDULE_TONE[schedule.status] || 'neutral'} dot>
                      {schedule.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="schedule-foot">
              <span>
                Showing {Math.min(scheduleLimit, filteredSchedules.length)} of {filteredSchedules.length} sections
              </span>
              {scheduleLimit < filteredSchedules.length ? (
                <Button variant="secondary" size="sm" onClick={() => setScheduleLimit((current) => current + 10)}>
                  Show more
                </Button>
              ) : (
                <span className="composer-hint">
                  <CheckCircle2 size={12} /> All sections shown
                </span>
              )}
            </div>
          </Card>
        </>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={closeFarmer}
        title={selected?.name || 'Farmer'}
        description={selected ? `${selected.farm_id} · Registered ${selected.joinedLabel}` : ''}
        icon={UserRound}
        size="lg"
        footer={
          selected &&
          (editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="farmer-edit" loading={saving}>
                Save changes
              </Button>
            </>
          ) : confirmDelete ? (
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>
                Keep farmer
              </Button>
              <Button variant="danger" icon={Trash2} loading={saving} onClick={deleteFarmer}>
                Delete permanently
              </Button>
            </>
          ) : (
            <>
              {canEdit && (
                <>
                  <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    icon={selected.is_active ? UserX : UserCheck}
                    loading={saving}
                    onClick={() => saveFarmer({ is_active: !selected.is_active })}
                  >
                    {selected.is_active ? 'Deactivate' : 'Reactivate'}
                  </Button>
                  <Button
                    variant="primary"
                    icon={Pencil}
                    onClick={() =>
                      setEditing(
                        Object.fromEntries(
                          EDIT_FIELDS.map((field) => [
                            field,
                            field === 'phone' ? formatPhone(selected.phone) : selected[field] || '',
                          ]),
                        ),
                      )
                    }
                  >
                    Edit
                  </Button>
                </>
              )}
            </>
          ))
        }
      >
        {selected && confirmDelete && (
          <div className="detail-banner warning">
            <Trash2 size={17} />
            <div>
              <strong>Delete {selected.name}?</strong>
              <span>
                This removes the farmer, their farm, crops and sign-in sessions. It cannot be undone. To stop
                messages and sign-ins but keep the record, deactivate the farmer instead.
              </span>
            </div>
          </div>
        )}

        {selected && editing && (
          <form id="farmer-edit" className="form-grid" onSubmit={submitEdit}>
            {[
              ['full_name', 'Full name', true],
              ['phone', 'Mobile number', true],
              ['address', 'Address', true],
              ['district', 'District', true],
              ['division', 'Division', false],
              ['primary_crop', 'Primary crop', false],
            ].map(([field, label, required]) => (
              <label className={cn('field', field === 'address' && 'span-2')} key={field}>
                <span>{label}</span>
                <input
                  value={editing[field]}
                  required={required}
                  onChange={(event) => setEditing((current) => ({ ...current, [field]: event.target.value }))}
                />
              </label>
            ))}
            <div className="form-note span-2">
              <Pencil size={15} />
              Crops and the farm's water source are edited by the farmer in the farmer portal.
            </div>
          </form>
        )}

        {selected && !editing && !confirmDelete && (
          <div className="farmer-detail">
            <div className="farmer-profile">
              <Avatar name={selected.name} size="xl" />
              <div>
                <strong>{selected.name}</strong>
                <span>
                  {selected.farm_id} · Registered {selected.joinedLabel}
                </span>
                <Badge tone={STATUS_TONE[selected.status]} dot>
                  {selected.status}
                </Badge>
              </div>
            </div>

            <div className="farmer-meta-grid">
              <div className="farmer-meta">
                <span>District</span>
                <strong>{selected.district}</strong>
                <small>{selected.division || 'Division not given'}</small>
              </div>
              <div className="farmer-meta">
                <span>Mobile</span>
                <strong>{selected.phoneLabel}</strong>
                <small>{selected.is_active ? 'Receives SMS' : 'No SMS while inactive'}</small>
              </div>
              <div className="farmer-meta">
                <span>Land</span>
                <strong>{selected.landAcres === null ? '—' : `${selected.landAcres} acres`}</strong>
                <small>Total of all crops</small>
              </div>
              <div className="farmer-meta">
                <span>Water source</span>
                <strong>
                  {selected.farm?.water_source ? WATER_SOURCE_LABELS[selected.farm.water_source] : selected.scheme}
                </strong>
                <small>{selected.farm?.water_name || selected.scheme}</small>
              </div>
              <div className="farmer-meta">
                <span>Farm location</span>
                <strong>
                  {selected.farm_latitude !== null && selected.farm_latitude !== undefined
                    ? `${Number(selected.farm_latitude).toFixed(4)}, ${Number(selected.farm_longitude).toFixed(4)}`
                    : 'Not pinned'}
                </strong>
                <small>{selected.farm?.location_label || 'GPS pin from registration'}</small>
              </div>
              <div className="farmer-meta">
                <span>Address</span>
                <strong>{selected.address}</strong>
                <small>Last updated {formatDate(selected.updated_at)}</small>
              </div>
            </div>

            <div className="farmer-detail-section">
              <strong>Crops</strong>
              {selected.farm?.crops?.length ? (
                <div className="detail-meta-list">
                  {selected.farm.crops.map((crop, index) => (
                    <div key={index}>
                      <span>
                        {crop.crop_type}
                        {crop.variety ? ` · ${crop.variety}` : ''}
                        {crop.category ? ` (${crop.category})` : ''}
                      </span>
                      <strong>
                        {Number(crop.acres)} ac
                        {crop.last_yield !== null ? ` · last yield ${Number(crop.last_yield)} ${crop.yield_unit || ''}` : ''}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-cell">{selected.farm ? 'No crops recorded.' : 'Loading farm details…'}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
