import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CloudRain,
  Download,
  Droplets,
  MessageSquareText,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  Waves,
  ChevronRight,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { downloadCsv, formatDate, formatDateTime, formatNumber } from '../utils/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'
import {
  CHART_COLORS,
  DistrictFarmersChart,
  RainfallSpillChart,
  StatusDonut,
  StorageTrendChart,
} from '../components/charts'

const STATUS_COLORS = {
  healthy: 'green',
  watch: 'primary',
  low: 'amber',
  critical: 'red',
}

const ALERT_ICON = {
  Reservoir: Droplets,
  River: Waves,
  SMS: MessageSquareText,
  Season: TrendingUp,
}

function buildKpis({ TANK_SUMMARY, STORAGE_TREND, FLOOD_ALERTS, RIVER_SUMMARY, TOP_RAINFALL, FARMER_SUMMARY }) {
  // Change in average storage over the last 7 days of the trend
  const weekAgo = STORAGE_TREND.at(-8) || STORAGE_TREND[0]
  const latest = STORAGE_TREND.at(-1)
  const storageChange = weekAgo && latest ? latest.storage - weekAgo.storage : null
  const riverAlerts = FLOOD_ALERTS.filter((station) => station.status !== 'watch').length
  return [
    {
      id: 'storage',
      label: 'Average reservoir storage',
      value: TANK_SUMMARY.averageStorage.toFixed(1),
      unit: '%',
      icon: Droplets,
      trend: storageChange === null ? 'No history yet' : `${storageChange >= 0 ? '+' : ''}${storageChange.toFixed(1)} pts`,
      trendDirection: storageChange < 0 ? 'down' : 'up',
      hint: 'change over the last 7 days',
    },
    {
      id: 'alerts',
      label: 'Open alerts',
      value: String(TANK_SUMMARY.critical + FLOOD_ALERTS.length),
      unit: '',
      icon: AlertTriangle,
      trend: `${TANK_SUMMARY.critical} reservoir · ${FLOOD_ALERTS.length} river`,
      trendDirection: 'up',
      deltaTone: TANK_SUMMARY.critical + FLOOD_ALERTS.length ? 'danger' : undefined,
      hint: 'reservoirs below 10% and gauges above their alert level',
    },
    {
      id: 'rivers',
      label: 'River gauges on alert',
      value: String(FLOOD_ALERTS.length),
      unit: `/ ${RIVER_SUMMARY.total}`,
      icon: Waves,
      trend: `${riverAlerts} at flood level`,
      trendDirection: 'up',
      deltaTone: riverAlerts ? 'danger' : undefined,
      hint: 'gauges at minor or major flood level',
    },
    {
      id: 'rainfall',
      label: 'Highest rainfall · last 24 h',
      value: TOP_RAINFALL?.rainfall != null ? TOP_RAINFALL.rainfall.toFixed(1) : '—',
      unit: 'mm',
      icon: CloudRain,
      trend: TOP_RAINFALL ? TOP_RAINFALL.station : 'No reading',
      trendDirection: 'up',
      hint: TOP_RAINFALL ? `${TOP_RAINFALL.river} · ${formatDateTime(TOP_RAINFALL.at)}` : '',
    },
    {
      id: 'farmers',
      label: 'Registered farmers',
      value: formatNumber(FARMER_SUMMARY.registered),
      unit: '',
      icon: Users,
      trend: `${formatNumber(FARMER_SUMMARY.newThisMonth)} this month`,
      trendDirection: 'up',
      hint: `${formatNumber(FARMER_SUMMARY.active)} active`,
    },
  ]
}

function KpiCard({ item }) {
  const Icon = item.icon
  const DeltaIcon = item.trendDirection === 'down' ? ArrowDown : ArrowUp
  return (
    <Card className="kpi-card">
      <span className="kpi-icon" aria-hidden="true">
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <div className="kpi-content">
        <span className="kpi-label" title={item.label}>{item.label}</span>
        <strong className="kpi-value">
          {item.value}
          {item.unit && <span className="kpi-unit">{item.unit}</span>}
        </strong>
        <small
          className={`kpi-delta${item.deltaTone === 'danger' ? ' is-danger' : ''}`}
          title={item.hint}
        >
          <DeltaIcon size={12} strokeWidth={2.4} aria-hidden="true" />
          {item.trend}
        </small>
      </div>
    </Card>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const data = useData()
  const {
    TANKS,
    TANK_SUMMARY,
    STORAGE_TREND,
    RAINFALL_SERIES,
    TANK_STATUS_BREAKDOWN,
    AT_RISK_TANKS,
    SPILLING_TANKS,
    DISTRICT_FARMERS,
    FARMER_SUMMARY,
    SYSTEM_ALERTS,
    SCHEDULE_SUMMARY,
    RIVER_SUMMARY,
    loading,
    reload,
  } = data
  const [range, setRange] = useState('30D')
  const [tableTab, setTableTab] = useState('risk')

  const kpis = buildKpis(data)
  const trendData = range === '7D' ? STORAGE_TREND.slice(-7) : STORAGE_TREND
  const peak = STORAGE_TREND.reduce((best, point) => (!best || point.storage > best.storage ? point : best), null)
  const districtFarmers = useMemo(
    () => [...DISTRICT_FARMERS].sort((a, b) => b.farmers - a.farmers).slice(0, 8),
    [DISTRICT_FARMERS],
  )
  const donutData = useMemo(
    () =>
      TANK_STATUS_BREAKDOWN.map((item) => ({
        ...item,
        label: item.label,
        color: STATUS_COLORS[item.key],
      })),
    [TANK_STATUS_BREAKDOWN],
  )
  const tableTanks = tableTab === 'risk' ? AT_RISK_TANKS.slice(0, 5) : SPILLING_TANKS.slice(0, 5)

  const handleRefresh = async () => {
    await reload()
    toast(`Reloaded ${TANK_SUMMARY.total} reservoirs and ${RIVER_SUMMARY.total} river gauges.`, {
      title: 'Data is up to date',
      tone: 'success',
    })
  }

  const handleExport = () => {
    downloadCsv(
      `yalamaha-reservoir-storage-${new Date().toLocaleDateString('en-CA')}.csv`,
      TANKS.map((tank) => ({
        Reservoir: tank.name,
        District: tank.district,
        Division: tank.division,
        Type: tank.type,
        'Capacity (AFT)': tank.capacityAcft,
        'Storage (AFT)': tank.storageAcft,
        'Storage (%)': tank.percent,
        'Water depth (ft)': tank.waterDepth,
        'Rainfall (mm)': tank.rainfall ?? '',
        Spilling: tank.isSpilling ? 'Yes' : 'No',
        Status: tank.statusMeta.label,
        'Reading date': tank.reading_date ?? '',
      })),
    )
    toast('Reservoir storage report exported as CSV.', {
      title: 'Report downloaded',
      tone: 'success',
    })
  }

  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow={new Date().toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        badge={
          <Badge tone="success" dot>
            {SCHEDULE_SUMMARY.releasing} canal sections receiving water
          </Badge>
        }
        title="Dashboard"
        description={`Reservoir storage, river gauges and farmer registrations. Reservoir readings of ${formatDate(TANK_SUMMARY.latestReading)}.`}
        actions={
          <>
            <Button icon={Download} variant="secondary" onClick={handleExport}>
              Export report
            </Button>
            <Button
              icon={RefreshCw}
              variant="primary"
              loading={loading}
              onClick={handleRefresh}
            >
              {loading ? 'Refreshing' : 'Refresh data'}
            </Button>
          </>
        }
      />

      <section className="kpi-grid" aria-label="Key indicators">
        {kpis.map((item) => (
          <KpiCard key={item.id} item={item} />
        ))}
      </section>

      <section className="dashboard-grid">
        <Card className="span-8 chart-card">
          <CardHeader
            icon={TrendingUp}
            title="Average reservoir storage"
            subtitle={`Average usable storage (%) of the ${TANK_SUMMARY.total} monitored reservoirs, by day`}
            action={
              <div className="segmented">
                <button
                  type="button"
                  className={range === '7D' ? 'active' : ''}
                  onClick={() => setRange('7D')}
                >
                  7D
                </button>
                <button
                  type="button"
                  className={range === '30D' ? 'active' : ''}
                  onClick={() => setRange('30D')}
                >
                  30D
                </button>
              </div>
            }
          />
          <div className="chart-legend">
            <span className="legend-item">
              <i style={{ background: CHART_COLORS.primary }} />
              Average storage
            </span>
            <span className="legend-spacer" />
            {peak && (
              <span className="chart-note">
                Highest {peak.storage.toFixed(1)}% · {peak.month}
              </span>
            )}
          </div>
          <div className="chart-box" style={{ height: 258 }}>
            <StorageTrendChart data={trendData} />
          </div>
        </Card>

        <Card className="span-4 chart-card">
          <CardHeader
            icon={Users}
            title="Registered farmers by district"
            subtitle="Districts with the most registered farmers"
            action={
              <button type="button" className="text-btn" onClick={() => navigate('/farmers')}>
                View all
                <ChevronRight size={14} />
              </button>
            }
          />
          <div className="chart-box" style={{ height: 274 }}>
            <DistrictFarmersChart data={districtFarmers} />
          </div>
          <div className="district-foot">
            <span>
              <strong>{formatNumber(FARMER_SUMMARY.registered)} farmers</strong> registered across{' '}
              {FARMER_SUMMARY.districts} districts.
            </span>
          </div>
        </Card>

        <Card className="span-7 chart-card">
          <CardHeader
            icon={CloudRain}
            title="Rainfall & spilling reservoirs"
            subtitle="Highest rainfall reported at a reservoir each day (mm), and how many reservoirs spilled"
            action={
              <div className="chart-legend inline">
                <span className="legend-item">
                  <i style={{ background: CHART_COLORS.indigo }} />
                  Highest Rainfall
                </span>
                <span className="legend-item">
                  <i style={{ background: CHART_COLORS.amber }} />
                  Spilling
                </span>
              </div>
            }
          />
          <div className="chart-box" style={{ height: 246 }}>
            <RainfallSpillChart data={RAINFALL_SERIES} />
          </div>
        </Card>

        <Card className="span-5 status-card">
          <CardHeader
            icon={Droplets}
            title="Reservoir status"
            subtitle="Number of reservoirs at each storage level"
            action={<Badge tone="info">{TANK_SUMMARY.total} tanks</Badge>}
          />
          <div className="status-body">
            <StatusDonut data={donutData} total={TANK_SUMMARY.total} centerLabel="Reservoirs" />
            <div className="status-legend">
              {donutData.map((item) => (
                <div className="status-legend-row" key={item.key}>
                  <span className="status-legend-label">
                    <i style={{ background: CHART_COLORS[STATUS_COLORS[item.key]] || CHART_COLORS.primary }} />
                    {item.label}
                  </span>
                  <span className="status-legend-value">
                    <strong>{item.value}</strong>
                    <small>{((item.value / TANK_SUMMARY.total) * 100).toFixed(0)}%</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="spill-strip">
            <span className="spill-icon">
              <Waves size={15} />
            </span>
            <div>
              <strong>{TANK_SUMMARY.spilling} reservoirs spilling</strong>
              <span>
                {SPILLING_TANKS.length
                  ? `Highest discharge ${formatNumber(SPILLING_TANKS[0].spillRate)} cusec at ${SPILLING_TANKS[0].name}`
                  : 'No spillway is discharging'}
              </span>
            </div>
            <button type="button" className="text-btn" onClick={() => navigate('/tanks')}>
              Review
              <ArrowRight size={14} />
            </button>
          </div>
        </Card>

        <Card className="span-8 table-card">
          <CardHeader
            icon={TANK_SUMMARY.critical ? AlertTriangle : Droplets}
            title="Reservoir watchlist"
            subtitle={
              tableTab === 'risk'
                ? 'Lowest storage positions requiring intervention'
                : 'Active spillway discharges across the network'
            }
            action={
              <div className="segmented">
                <button
                  type="button"
                  className={tableTab === 'risk' ? 'active' : ''}
                  onClick={() => setTableTab('risk')}
                >
                  At risk
                </button>
                <button
                  type="button"
                  className={tableTab === 'spilling' ? 'active' : ''}
                  onClick={() => setTableTab('spilling')}
                >
                  Spilling
                </button>
              </div>
            }
          />
          <div className="table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Reservoir</th>
                  <th>District</th>
                  <th>Storage</th>
                  <th>Depth</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {(tableTanks.length ? tableTanks : AT_RISK_TANKS.slice(0, 5)).map((tank) => (
                  <tr
                    key={tank.id}
                    className="clickable-row"
                    onClick={() => navigate(`/tanks?q=${encodeURIComponent(tank.name)}`)}
                  >
                    <td>
                      <div className="cell-primary">
                        <span className="cell-avatar">
                          <Droplets size={15} />
                        </span>
                        <div>
                          <strong>{tank.name}</strong>
                          <small>{tank.division} division</small>
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">{tank.district}</td>
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
                    <td>
                      <StatusBadge meta={tank.statusMeta} />
                    </td>
                    <td>
                      <ChevronRight size={15} className="row-chevron" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer table-footer">
            <span>
              Showing {Math.min(5, tableTanks.length)} of{' '}
              {tableTab === 'risk' ? TANK_SUMMARY.critical : TANK_SUMMARY.spilling} reservoirs
            </span>
            <button type="button" className="text-btn" onClick={() => navigate('/tanks')}>
              Open full register
              <ArrowRight size={14} />
            </button>
          </div>
        </Card>

        <Card className="span-4 alerts-card">
          <CardHeader
            icon={AlertTriangle}
            title="Latest alerts"
            subtitle="Worked out from the latest reservoir, river and SMS data"
            action={<Badge tone={SYSTEM_ALERTS.length ? 'critical' : 'success'}>{SYSTEM_ALERTS.length}</Badge>}
          />
          <div className="alert-list">
            {SYSTEM_ALERTS.length === 0 && (
              <p className="muted-cell" style={{ padding: '12px 16px', margin: 0 }}>
                Nothing needs attention: reservoirs and rivers are within normal levels.
              </p>
            )}
            {SYSTEM_ALERTS.slice(0, 4).map((alert) => {
              const Icon = ALERT_ICON[alert.category] || AlertTriangle
              return (
                <button
                  type="button"
                  className="alert-item"
                  key={alert.id}
                  onClick={() => navigate(alert.path)}
                >
                  <span className={`alert-icon tone-${alert.severity}`}>
                    <Icon size={16} />
                  </span>
                  <span className="alert-copy">
                    <strong>{alert.title}</strong>
                    <span>{alert.time}</span>
                  </span>
                  <ChevronRight size={15} className="alert-chevron" />
                </button>
              )
            })}
          </div>
          <div className="card-footer alert-footer">
            <button type="button" className="text-btn" onClick={() => navigate('/sms')}>
              <Send size={14} />
              Message farmers
            </button>
            <span>{formatNumber(FARMER_SUMMARY.active)} active farmers</span>
          </div>
        </Card>
      </section>
    </div>
  )
}
