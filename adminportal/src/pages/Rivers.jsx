import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CloudRain,
  Download,
  MapPin,
  MessageSquareText,
  Radio,
  Send,
  ShieldAlert,
  Signal,
  Waves,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { cn, downloadCsv, formatDateTime } from '../utils/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { Gauge } from '../components/ui/Gauge'
import { Progress } from '../components/ui/Progress'
import { Sparkline } from '../components/ui/Sparkline'
import { Modal } from '../components/ui/Overlay'
import { RiverHydrograph } from '../components/charts'

const TONE_HEX = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#0891b2',
  success: '#16a34a',
}

const severityRank = { major: 0, warning: 1, watch: 2, normal: 3 }

export function Rivers() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { RIVER_STATIONS, RIVER_SUMMARY, FLOOD_ALERTS, TOP_RAINFALL } = useData()
  const initialStation =
    searchParams.get('station') || FLOOD_ALERTS[0]?.id || RIVER_STATIONS[0]?.id
  const [selectedId, setSelectedId] = useState(initialStation)
  const [tableFilter, setTableFilter] = useState('all')
  const [protocolOpen, setProtocolOpen] = useState(false)

  useEffect(() => {
    const fromUrl = searchParams.get('station')
    if (fromUrl && RIVER_STATIONS.some((station) => station.id === fromUrl)) {
      setSelectedId(fromUrl)
    }
  }, [searchParams, RIVER_STATIONS])

  const selected =
    RIVER_STATIONS.find((station) => station.id === selectedId) || RIVER_STATIONS[0]

  const selectStation = (station) => {
    setSelectedId(station.id)
    const params = new URLSearchParams(searchParams)
    params.set('station', station.id)
    setSearchParams(params, { replace: true })
  }

  const tableStations = useMemo(() => {
    const list =
      tableFilter === 'alerts' ? RIVER_STATIONS.filter((station) => station.status !== 'normal') : RIVER_STATIONS
    return [...list].sort((a, b) => {
      const rank = severityRank[a.status] - severityRank[b.status]
      return rank !== 0 ? rank : b.percentOfMajor - a.percentOfMajor
    })
  }, [tableFilter, RIVER_STATIONS])

  if (!selected) {
    return (
      <div className="page rivers-page">
        <PageHeader eyebrow="Hydrology" title="River monitoring & flood watch" description="No river gauge readings have been loaded yet." />
      </div>
    )
  }

  const stats = [
    {
      label: 'Monitored gauges',
      value: RIVER_SUMMARY.total,
      hint: `On ${RIVER_SUMMARY.rivers} rivers`,
      icon: Radio,
      tone: 'primary',
    },
    {
      label: 'Above alert level',
      value: FLOOD_ALERTS.length,
      hint: `${RIVER_SUMMARY.warning} minor flood · ${RIVER_SUMMARY.major} major flood`,
      icon: AlertTriangle,
      tone: 'critical',
    },
    {
      label: 'Gauges reporting',
      value: RIVER_SUMMARY.total ? `${Math.round((RIVER_SUMMARY.reporting / RIVER_SUMMARY.total) * 100)}%` : '—',
      hint: `${RIVER_SUMMARY.total - RIVER_SUMMARY.reporting} without a reading in the last 3 hours`,
      icon: Signal,
      tone: 'teal',
    },
    {
      label: 'Highest rainfall · 24 h',
      value: TOP_RAINFALL?.rainfall != null ? `${TOP_RAINFALL.rainfall.toFixed(1)} mm` : '—',
      hint: TOP_RAINFALL ? `${TOP_RAINFALL.station} · ${TOP_RAINFALL.river}` : 'No rainfall reading',
      icon: CloudRain,
      tone: 'info',
    },
  ]

  const handleExport = () => {
    downloadCsv(
      `YalaMaha-river-gauges-${new Date().toLocaleDateString('en-CA')}.csv`,
      RIVER_STATIONS.map((station) => ({
        Station: station.name,
        River: station.river,
        'Level (m)': station.level,
        'Alert level (m)': station.warning,
        'Minor flood level (m)': station.minor,
        'Major flood level (m)': station.major,
        'Change (m/3h)': station.change,
        'Rainfall (mm)': station.rainfall,
        Status: station.statusMeta.label,
        'Reading at': station.readingAt ? station.readingAt.toISOString() : '',
      })),
    )
    toast('River gauge report downloaded.', { title: 'Export complete', tone: 'success' })
  }

  const sendAdvisory = (station = selected) => {
    navigate(`/sms?template=flood&station=${station.id}`)
  }

  const selectedHistory = selected.history.map((point) => point.level)
  const lastChange = selected.change
  const trendUp = lastChange >= 0

  return (
    <div className="page rivers-page">
      <PageHeader
        eyebrow={`Hydrology · Latest reading ${formatDateTime(RIVER_SUMMARY.updatedAt)}`}
        badge={
          <Badge tone={FLOOD_ALERTS.length ? 'warning' : 'success'} dot>
            {FLOOD_ALERTS.length} above alert level
          </Badge>
        }
        title="River monitoring & flood watch"
        description={`Water levels against the alert, minor flood and major flood levels at ${RIVER_SUMMARY.total} river gauges.`}
        actions={
          <>
            <Button icon={Download} variant="secondary" onClick={handleExport}>
              Export gauge report
            </Button>
            <Button icon={Send} variant="primary" onClick={() => sendAdvisory()}>
              Broadcast flood alert
            </Button>
          </>
        }
      />

      {FLOOD_ALERTS.length > 0 && (
        <div className="flood-banner">
          <span className="flood-banner-icon">
            <ShieldAlert size={22} />
          </span>
          <div className="flood-banner-copy">
            <strong>
              {FLOOD_ALERTS[0].statusMeta.label} · {FLOOD_ALERTS[0].river} at {FLOOD_ALERTS[0].name}
            </strong>
            <span>
              {FLOOD_ALERTS[0].level.toFixed(2)} m (alert {FLOOD_ALERTS[0].warning.toFixed(1)} m, minor flood{' '}
              {FLOOD_ALERTS[0].minor.toFixed(1)} m, major flood {FLOOD_ALERTS[0].major.toFixed(1)} m).{' '}
              {FLOOD_ALERTS.length} gauge{FLOOD_ALERTS.length > 1 ? 's are' : ' is'} above the alert level.
            </span>
          </div>
          <div className="flood-banner-actions">
            <Button variant="ghost" size="sm" onClick={() => setProtocolOpen(true)}>
              View protocol
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={MessageSquareText}
              onClick={() => sendAdvisory(FLOOD_ALERTS[0])}
            >
              Alert farmers
            </Button>
          </div>
        </div>
      )}

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

      <Card className="station-strip-card">
        <div className="station-strip-head">
          <div>
            <strong>Gauge network</strong>
            <span>Select a station to load its hydrograph</span>
          </div>
          <Badge tone="success" dot>
            {RIVER_SUMMARY.reporting} of {RIVER_SUMMARY.total} reporting
          </Badge>
        </div>
        <div className="station-strip">
          {RIVER_STATIONS.map((station) => (
            <button
              type="button"
              key={station.id}
              className={cn(
                'station-chip',
                selected.id === station.id && 'is-active',
                `station-${station.status}`,
              )}
              onClick={() => selectStation(station)}
            >
              <span className="station-chip-top">
                <i />
                <span>{station.river}</span>
                {station.status !== 'normal' && (
                  <span className={cn('station-alert-dot', `tone-${station.statusMeta.tone}`)} />
                )}
              </span>
              <strong>{station.name}</strong>
              <span className="station-river">{station.statusMeta.label}</span>
              <span className="station-reading">
                <strong>{station.level.toFixed(2)} m</strong>
                <small className={station.change >= 0 ? 'is-rising' : 'is-falling'}>
                  {station.change >= 0 ? '+' : ''}
                  {station.change.toFixed(2)}
                </small>
              </span>
            </button>
          ))}
        </div>
      </Card>

      <section className="river-grid">
        <Card className="span-8 chart-card river-chart-card">
          <CardHeader
            icon={Waves}
            title={`${selected.name} · ${selected.river}`}
            subtitle={`Water level over the 24 hours to ${formatDateTime(selected.readingAt)}`}
            action={<StatusBadge meta={selected.statusMeta} />}
          />
          <div className="hydro-metrics">
            <div>
              <span>Current level</span>
              <strong>{selected.level.toFixed(2)} m</strong>
              <small className={trendUp ? 'is-rising' : 'is-falling'}>
                {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {selected.change >= 0 ? '+' : ''}
                {selected.change.toFixed(2)} m / 3h
              </small>
            </div>
            <div>
              <span>Alert level</span>
              <strong>{selected.warning.toFixed(2)} m</strong>
              <small>Minor flood {selected.minor.toFixed(2)} m</small>
            </div>
            <div>
              <span>Major flood</span>
              <strong>{selected.major.toFixed(2)} m</strong>
              <small>{selected.thresholdHeadroom.toFixed(2)} m headroom</small>
            </div>
            <div>
              <span>Rainfall</span>
              <strong>{selected.rainfall} mm</strong>
              <small>Measured at the gauge</small>
            </div>
          </div>
          <div className="chart-box" style={{ height: 286 }}>
            <RiverHydrograph
              data={selected.history}
              warning={selected.warning}
              major={selected.major}
            />
          </div>
          <div className="chart-caption">
            <span>
              <i style={{ background: TONE_HEX[selected.statusMeta.tone] }} />
              {selected.river} · {selected.history.length} readings
            </span>
            <span>Dashed lines: alert and major flood levels</span>
          </div>
        </Card>

        <Card className="span-4 station-snapshot">
          <CardHeader
            icon={MapPin}
            title="Station snapshot"
            subtitle={
              selected.latitude !== null
                ? `${selected.latitude.toFixed(4)}° N, ${selected.longitude.toFixed(4)}° E`
                : selected.river
            }
          />
          <div className="snapshot-body">
            <div className="snapshot-gauge">
              <Gauge
                value={selected.percentOfMajor}
                label="of major flood level"
                tone={TONE_HEX[selected.statusMeta.tone]}
                size="md"
              />
            </div>
            <div className="snapshot-status">
              <StatusBadge meta={selected.statusMeta} />
              <p>{selected.statusMeta.description}</p>
            </div>
            <div className="snapshot-stats">
              <div>
                <span>Water level</span>
                <strong>{selected.level.toFixed(2)} m</strong>
              </div>
              <div>
                <span>Minor flood level</span>
                <strong>{selected.minor.toFixed(2)} m</strong>
              </div>
              <div>
                <span>Below major flood</span>
                <strong>{selected.thresholdHeadroom.toFixed(2)} m</strong>
              </div>
              <div>
                <span>Rainfall</span>
                <strong>{selected.rainfall} mm</strong>
              </div>
            </div>
            <div className="snapshot-spark">
              <div className="snapshot-spark-head">
                <span>24-hour trend</span>
                <strong className={trendUp ? 'is-rising' : 'is-falling'}>
                  {trendUp ? 'Rising' : 'Falling'}
                </strong>
              </div>
              <Sparkline
                data={selectedHistory}
                width={320}
                height={52}
                color={TONE_HEX[selected.statusMeta.tone]}
              />
            </div>
          </div>
          <div className="snapshot-actions">
            <Button
              variant="secondary"
              size="sm"
              icon={MessageSquareText}
              onClick={() => sendAdvisory(selected)}
            >
              Send advisory
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={ShieldAlert}
              onClick={() => setProtocolOpen(true)}
            >
              Flood protocol
            </Button>
          </div>
        </Card>
      </section>

      <Card className="table-card river-table-card">
        <CardHeader
          icon={Radio}
          title="All gauge readings"
          subtitle="Latest level and flood thresholds for each gauge"
          action={
            <div className="segmented">
              <button
                type="button"
                className={tableFilter === 'all' ? 'active' : ''}
                onClick={() => setTableFilter('all')}
              >
                All gauges
              </button>
              <button
                type="button"
                className={tableFilter === 'alerts' ? 'active' : ''}
                onClick={() => setTableFilter('alerts')}
              >
                Above alert level
              </button>
            </div>
          }
        />
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>River</th>
                <th>Level</th>
                <th>Alert</th>
                <th>Minor flood</th>
                <th>Major flood</th>
                <th>Below major</th>
                <th>Rainfall</th>
                <th>Trend</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {tableStations.map((station) => (
                <tr
                  key={station.id}
                  className={cn('clickable-row', selected.id === station.id && 'is-selected')}
                  onClick={() => selectStation(station)}
                >
                  <td>
                    <div className="cell-primary">
                      <span className={cn('cell-avatar', `tone-${station.statusMeta.tone}`)}>
                        <Waves size={15} />
                      </span>
                      <div>
                        <strong>{station.name}</strong>
                        <small>{formatDateTime(station.readingAt)}</small>
                      </div>
                    </div>
                  </td>
                  <td className="muted-cell">{station.river}</td>
                  <td>
                    <span className="level-value">{station.level.toFixed(2)} m</span>
                  </td>
                  <td className="muted-cell">{station.warning.toFixed(1)} m</td>
                  <td className="muted-cell">{station.minor.toFixed(1)} m</td>
                  <td className="muted-cell">{station.major.toFixed(1)} m</td>
                  <td>
                    <div className="headroom-cell">
                      <Progress
                        value={station.percentOfMajor}
                        tone={station.statusMeta.tone}
                        size="xs"
                      />
                      <small>{station.thresholdHeadroom.toFixed(2)} m</small>
                    </div>
                  </td>
                  <td className="numeric-cell">{station.rainfall} mm</td>
                  <td>
                    <span className={cn('trend-cell', station.change >= 0 ? 'is-rising' : 'is-falling')}>
                      {station.change >= 0 ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {station.change >= 0 ? '+' : ''}
                      {station.change.toFixed(2)} m
                    </span>
                  </td>
                  <td>
                    <StatusBadge meta={station.statusMeta} />
                  </td>
                  <td>
                    <ArrowRight size={15} className="row-chevron" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>
            <span className="status-dot" />
            Readings from the Irrigation Department river gauge network
          </span>
        </div>
      </Card>

      <Modal
        open={protocolOpen}
        onClose={() => setProtocolOpen(false)}
        title="Flood response protocol"
        description="Standard operating procedure for gauges above the alert level."
        icon={ShieldAlert}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setProtocolOpen(false)}>
              Close
            </Button>
            <Button variant="primary" icon={Send} onClick={() => sendAdvisory(FLOOD_ALERTS[0] || selected)}>
              Send farmer advisory
            </Button>
          </>
        }
      >
        <ol className="protocol-list">
          <li>
            <span>01</span>
            <div>
              <strong>Verify the reading</strong>
              <p>Cross-check the telemetry value with the manual gauge and confirm the timestamp.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Notify the district disaster unit</strong>
              <p>Share the station code, level, trend and threshold breach with the DMC duty officer.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Issue the SMS advisory</strong>
              <p>Target farmers in the downstream GN divisions and advise evacuation of low-lying fields.</p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <strong>Monitor every 15 minutes</strong>
              <p>Escalate to major flood response if the level continues to rise above the major threshold.</p>
            </div>
          </li>
        </ol>
      </Modal>
    </div>
  )
}
