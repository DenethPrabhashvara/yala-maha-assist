import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  BellRing,
  CheckCheck,
  Download,
  Megaphone,
  MessageSquareText,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wifi,
} from 'lucide-react'
import { SMS_TEMPLATES } from '../data/sms'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api/client'
import { cn, downloadCsv, formatDate, formatDateTime, formatNumber } from '../utils/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'
import { Modal } from '../components/ui/Overlay'
import { SmsVolumeChart } from '../components/charts'
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const STATUS_TONE = {
  Delivered: 'success',
  Partial: 'warning',
  Failed: 'critical',
}

// Groups shown as buttons; the rest of the districts, reservoirs and tanks are in the select
const GROUP_BUTTONS = 5

function DeliveryDonut({ data, total }) {
  return (
    <div className="donut-wrap donut-sm" style={{ maxWidth: 158 }}>
      <ResponsiveContainer width="100%" height={158}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="96%"
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatNumber(value), name]}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              boxShadow: 'var(--shadow-lg)',
              fontSize: 11,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <strong>{total === null ? '—' : `${total}%`}</strong>
        <span>Delivered</span>
      </div>
    </div>
  )
}

// Recipient groups from GET /admin/sms/audiences
function buildGroups(audiences) {
  if (!audiences) return []
  return [
    { id: 'all', audience: { type: 'all' }, name: 'All active farmers', description: 'Everyone registered and active', count: audiences.all },
    ...audiences.districts.map((row) => ({
      id: `district:${row.name}`,
      audience: { type: 'district', value: row.name },
      name: `${row.name} district`,
      description: 'Farmers registered in this district',
      count: row.farmers,
    })),
    ...audiences.reservoirs.map((row) => ({
      id: `reservoir:${row.id}`,
      audience: { type: 'reservoir', value: row.id },
      name: row.name,
      description: 'Farmers using this reservoir',
      count: row.farmers,
    })),
    ...audiences.tanks.map((row) => ({
      id: `tank:${row.id}`,
      audience: { type: 'tank', value: row.id },
      name: row.name,
      description: 'Farmers using this Mahaweli tank',
      count: row.farmers,
    })),
  ]
}

export function SmsGateway() {
  const { toast } = useToast()
  const { canEdit } = useAuth()
  const [searchParams] = useSearchParams()
  const { CAMPAIGNS, SMS_SUMMARY, SMS_VOLUME_TREND, RIVER_STATIONS, FLOOD_ALERTS, AT_RISK_TANKS, IRRIGATION_SCHEDULES, reload } =
    useData()
  const [audiences, setAudiences] = useState(null)
  const [gateway, setGateway] = useState(null)
  const [groupId, setGroupId] = useState('all')
  const [message, setMessage] = useState('')
  const [templateId, setTemplateId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [tankAlert, setTankAlert] = useState(null)
  const [checkingAlert, setCheckingAlert] = useState(false)

  useEffect(() => {
    api('/admin/sms/audiences')
      .then((result) => setAudiences(result.data))
      .catch((error) => toast(error.message, { title: 'Recipient groups not loaded', tone: 'error' }))
    api('/admin/sms/status')
      .then((result) => setGateway(result.data))
      .catch(() => setGateway(null))
  }, [toast])

  const groups = useMemo(() => buildGroups(audiences), [audiences])
  const activeGroup = groups.find((item) => item.id === groupId) || groups[0]
  const parts = Math.max(1, Math.ceil(message.length / 160))

  // Fills a template from the latest data
  const fillTemplate = (template, station) => {
    const flood = station || FLOOD_ALERTS[0] || RIVER_STATIONS[0]
    const nextRelease = IRRIGATION_SCHEDULES.find((item) => item.status === 'Scheduled') || IRRIGATION_SCHEDULES[0]
    const tank = AT_RISK_TANKS[0]
    return template.body
      .replace('{{river}}', flood?.river || 'the river')
      .replace('{{station}}', flood?.name || 'the gauge')
      .replace('{{scheme}}', nextRelease?.system || 'your scheme')
      .replace('{{date}}', nextRelease ? formatDate(nextRelease.start, { year: undefined }) : 'the announced date')
      .replace('{{tank}}', tank?.name || 'Your tank')
      .replace('{{percent}}', tank ? tank.percent.toFixed(0) : '—')
  }

  const applyTemplate = (template, station) => {
    setTemplateId(template.id)
    setMessage(fillTemplate(template, station))
  }

  // Opened from the Rivers page with ?template=flood&station=<id>
  const templateParam = searchParams.get('template')
  const stationParam = searchParams.get('station')
  useEffect(() => {
    if (templateParam !== 'flood') return
    const station = RIVER_STATIONS.find((item) => item.id === stationParam)
    applyTemplate(SMS_TEMPLATES[0], station)
    // Only when the link changes, not on every data reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateParam, stationParam])

  const filteredCampaigns = useMemo(() => {
    if (campaignFilter === 'all') return CAMPAIGNS
    return CAMPAIGNS.filter((item) => item.status === campaignFilter)
  }, [CAMPAIGNS, campaignFilter])

  const askToSend = () => {
    if (!message.trim()) {
      toast('Write a message before sending.', { tone: 'error' })
      return
    }
    if (!activeGroup?.count) {
      toast('There are no active farmers in this group.', { tone: 'error' })
      return
    }
    setConfirmOpen(true)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const result = await api('/admin/sms/campaigns', {
        method: 'POST',
        body: { audience: activeGroup.audience, audienceLabel: activeGroup.name, message },
      })
      const sent = result.data
      await reload(['campaigns'])
      setConfirmOpen(false)
      setMessage('')
      setTemplateId(null)
      toast(
        sent.failed
          ? `${formatNumber(sent.delivered)} sent, ${formatNumber(sent.failed)} failed. See the campaign history.`
          : `Sent to ${formatNumber(sent.delivered)} farmer${sent.delivered === 1 ? '' : 's'}${sent.dry_run ? ' (dry run, nothing left the server)' : ''}.`,
        { title: sent.failed ? 'Sent with failures' : 'Message sent', tone: sent.failed ? 'warning' : 'success' },
      )
    } catch (error) {
      toast(error.message, { title: 'Message not sent', tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  const checkTankAlert = async () => {
    setCheckingAlert(true)
    try {
      setTankAlert(await api('/admin/sms/alerts/preview'))
    } catch (error) {
      toast(error.message, { tone: 'error' })
    } finally {
      setCheckingAlert(false)
    }
  }

  const handleExport = () => {
    downloadCsv(
      `YalaMaha-sms-campaigns-${new Date().toLocaleDateString('en-CA')}.csv`,
      CAMPAIGNS.map((campaign) => ({
        ID: campaign.id,
        Message: campaign.message,
        Audience: campaign.audience,
        Recipients: campaign.recipients,
        Sent: campaign.delivered,
        Failed: campaign.failed,
        'Dry run': campaign.dry_run ? 'Yes' : 'No',
        'Sent by': campaign.sent_by ?? '',
        'Sent at': campaign.sentAt.toISOString(),
      })),
    )
    toast('Campaign history downloaded.', { title: 'Export complete', tone: 'success' })
  }

  const totals = CAMPAIGNS.reduce(
    (sum, campaign) => ({ delivered: sum.delivered + campaign.delivered, failed: sum.failed + campaign.failed }),
    { delivered: 0, failed: 0 },
  )
  const deliveryBreakdown = [
    { name: 'Sent', value: totals.delivered, color: '#16a34a' },
    { name: 'Failed', value: totals.failed, color: '#dc2626' },
  ]

  const stats = [
    {
      label: 'Sent today',
      value: formatNumber(SMS_SUMMARY.sentToday),
      hint: SMS_SUMMARY.lastSent ? `Last campaign ${formatDateTime(SMS_SUMMARY.lastSent)}` : 'No campaign sent yet',
      icon: Send,
      tone: 'primary',
    },
    {
      label: 'Sent this month',
      value: formatNumber(SMS_SUMMARY.sentMonth),
      hint: `${formatNumber(SMS_SUMMARY.failedMonth)} failed`,
      icon: MessageSquareText,
      tone: 'teal',
    },
    {
      label: 'Delivery rate',
      value: SMS_SUMMARY.deliveryRate === null ? '—' : `${SMS_SUMMARY.deliveryRate}%`,
      hint: 'Accepted by the gateway, all campaigns',
      icon: CheckCheck,
      tone: 'success',
    },
    {
      label: 'Farmers reachable',
      value: audiences ? formatNumber(audiences.all) : '—',
      hint: 'Active farmers with a phone number',
      icon: Users,
      tone: 'violet',
    },
  ]

  const mode = !gateway
    ? { tone: 'neutral', label: 'Gateway status unknown' }
    : !gateway.configured
      ? { tone: 'critical', label: 'No API token configured' }
      : gateway.dryRun
        ? { tone: 'warning', label: 'Dry run: messages are only logged' }
        : { tone: 'success', label: 'Live: messages are sent' }

  return (
    <div className="page sms-page">
      <PageHeader
        eyebrow={`Farmer communications · ${gateway?.provider || 'SMS gateway'}`}
        badge={
          <Badge tone={mode.tone} dot>
            {mode.label}
          </Badge>
        }
        title="SMS to farmers"
        description="Send flood warnings, water release notices and advisories to registered farmers, and see what was sent."
        actions={
          <>
            <Button icon={Download} variant="secondary" onClick={handleExport} disabled={!CAMPAIGNS.length}>
              Export history
            </Button>
            {canEdit && (
              <Button
                icon={Megaphone}
                variant="primary"
                onClick={() => document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth' })}
              >
                New message
              </Button>
            )}
          </>
        }
      />

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

      <section className="sms-grid">
        <Card className="span-7 composer-card" id="composer">
          <CardHeader
            icon={Megaphone}
            title="Compose message"
            subtitle={canEdit ? 'Write one message and choose which farmers get it' : 'Officers can view messages but not send them'}
          />
          <div className="composer-body">
            <div>
              <div className="composer-label">
                <span>Recipients</span>
                <span>{activeGroup ? `${formatNumber(activeGroup.count)} active farmers` : 'Loading…'}</span>
              </div>
              <div className="group-grid">
                {groups.slice(0, GROUP_BUTTONS).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={cn('group-option', groupId === item.id && 'is-active')}
                    onClick={() => setGroupId(item.id)}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.description}</span>
                    <small>{formatNumber(item.count)} recipients</small>
                  </button>
                ))}
              </div>
              {groups.length > GROUP_BUTTONS && (
                <label className="select-field" style={{ marginTop: 8 }}>
                  <span>More groups</span>
                  <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                    {groups.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatNumber(item.count)})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div>
              <div className="composer-label">
                <span>Start from a template</span>
                <span>Filled in from the latest readings</span>
              </div>
              <div className="template-row">
                {SMS_TEMPLATES.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    className={cn('template-chip', templateId === template.id && 'is-active')}
                    onClick={() => applyTemplate(template)}
                  >
                    <i />
                    {template.name}
                    <span>{template.category}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="composer-label">
                <span>Message</span>
                <span>Plain English text costs the fewest SMS parts</span>
              </div>
              <div className="message-wrap">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, 640))}
                  placeholder="Write the message for farmers…"
                  aria-label="Message"
                  readOnly={!canEdit}
                />
                <div className="message-meta">
                  <strong className={message.length > 160 ? 'warn' : ''}>{message.length} chars</strong>
                  <span>·</span>
                  <span>
                    {parts} SMS part{parts > 1 ? 's' : ''}
                  </span>
                  <span>·</span>
                  <span>640 max</span>
                </div>
              </div>
              <div className="composer-row" style={{ marginTop: 8 }}>
                <span className="composer-hint">
                  <Sparkles size={12} />
                  <code>{'{{name}}'}</code> is replaced with each farmer&apos;s name
                </span>
                <span className="composer-hint">
                  <ShieldCheck size={12} /> Only active farmers receive messages
                </span>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="composer-footer">
              <div className="credit-estimate">
                <span>Messages to send</span>
                <strong>
                  {formatNumber((activeGroup?.count || 0) * parts)} SMS
                  <span style={{ fontWeight: 500, fontSize: 9, color: 'var(--muted-2)', marginLeft: 6 }}>
                    · {formatNumber(activeGroup?.count || 0)} farmers × {parts}
                  </span>
                </strong>
              </div>
              <Button variant="primary" size="md" icon={Send} loading={sending} onClick={askToSend}>
                Send message
              </Button>
            </div>
          )}
        </Card>

        <div className="side-stack">
          <Card className="phone-preview-card">
            <CardHeader
              icon={Smartphone}
              title="Message preview"
              subtitle="How the message looks on a farmer's phone"
              action={activeGroup && <Badge tone="neutral">{activeGroup.name}</Badge>}
            />
            <div className="phone-preview">
              <div className="phone-frame">
                <div className="phone-speaker" />
                <div className="phone-screen">
                  <div className="phone-statusbar">
                    <span>
                      {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      <Wifi size={9} /> ▮▮
                    </span>
                  </div>
                  <div className="phone-app-head">
                    <div className="phone-avatar">YM</div>
                    <div>
                      <strong>{gateway?.senderId || 'YalaMaha'}</strong>
                      <span>Text message</span>
                    </div>
                  </div>
                  <div className="phone-thread">
                    <span className="phone-day">TODAY</span>
                    <div className="phone-bubble">
                      {message.trim().replace(/\{\{\s*name\s*\}\}/g, 'Nimal Perera') ||
                        'Your message preview appears here as you type…'}
                    </div>
                    <div className="phone-meta">
                      <span>
                        {message.length} chars · {parts} SMS
                      </span>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="phone-caption">{'{{name}}'} is shown with an example name.</p>
            </div>
          </Card>

          <Card className="gateway-card">
            <div className="gateway-head">
              <div className="gateway-brand">
                <span className="gateway-logo">SMS</span>
                <div>
                  <strong>{gateway?.provider || 'SMS gateway'}</strong>
                  <span>Sender ID {gateway?.senderId || '—'}</span>
                </div>
              </div>
              <Badge tone={mode.tone} dot>
                {gateway?.dryRun ? 'Dry run' : gateway?.configured ? 'Live' : 'Off'}
              </Badge>
            </div>
            <div className="gateway-rows">
              <div className="gateway-row">
                <span>API token</span>
                <strong>{gateway?.configured ? 'Configured' : 'Missing (TEXTLK_API_TOKEN)'}</strong>
              </div>
              <div className="gateway-row">
                <span>Mode</span>
                <strong>{gateway?.dryRun ? 'Dry run (SMS_DRY_RUN=true)' : 'Live'}</strong>
              </div>
              <div className="gateway-row">
                <span>High tank alert</span>
                <strong>At {gateway?.alertThreshold ?? '—'}% storage</strong>
              </div>
            </div>
            {tankAlert && (
              <div className="composer-row" style={{ padding: '6px 17px 10px', display: 'block' }}>
                {tankAlert.tanks.length === 0 ? (
                  <span className="composer-hint">No Mahaweli tank is at {tankAlert.threshold}% or above.</span>
                ) : (
                  <>
                    <span className="composer-hint">
                      <BellRing size={12} /> {tankAlert.tanks.length} tank{tankAlert.tanks.length > 1 ? 's' : ''} at{' '}
                      {tankAlert.threshold}% or above. The alert would say:
                    </span>
                    <p className="phone-caption" style={{ textAlign: 'left', marginTop: 6 }}>
                      {tankAlert.message}
                    </p>
                  </>
                )}
              </div>
            )}
            <div className="gateway-actions">
              <Button variant="secondary" size="sm" icon={BellRing} loading={checkingAlert} onClick={checkTankAlert}>
                Check high tank alert
              </Button>
            </div>
          </Card>
        </div>

        <Card className="span-8 chart-card">
          <CardHeader
            icon={MessageSquareText}
            title="Messages · last 7 days"
            subtitle="Messages sent and failed, from campaigns sent in this portal"
            action={
              <div className="chart-legend inline">
                <span className="legend-item">
                  <i style={{ background: '#2563eb' }} />
                  Sent
                </span>
                <span className="legend-item">
                  <i style={{ background: '#dc2626' }} />
                  Failed
                </span>
              </div>
            }
          />
          <div className="chart-box" style={{ height: 224 }}>
            <SmsVolumeChart data={SMS_VOLUME_TREND} />
          </div>
          <div className="table-footer">
            <span>
              <strong>{formatNumber(SMS_VOLUME_TREND.reduce((total, day) => total + day.delivered, 0))}</strong>{' '}
              messages sent this week
            </span>
          </div>
        </Card>

        <Card className="span-4 delivery-card">
          <CardHeader
            icon={CheckCheck}
            title="Delivery"
            subtitle="Every message sent from this portal"
            action={SMS_SUMMARY.deliveryRate !== null && <Badge tone="success">{SMS_SUMMARY.deliveryRate}%</Badge>}
          />
          <div className="delivery-body">
            <DeliveryDonut data={deliveryBreakdown} total={SMS_SUMMARY.deliveryRate} />
            <div className="delivery-legend">
              {deliveryBreakdown.map((item) => (
                <div className="delivery-legend-row" key={item.name}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="span-12 campaigns-card">
          <CardHeader
            icon={Users}
            title="Campaign history"
            subtitle="Every message sent from this portal, newest first"
            action={
              <div className="segmented">
                {['all', 'Delivered', 'Partial', 'Failed'].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={campaignFilter === value ? 'active' : ''}
                    onClick={() => setCampaignFilter(value)}
                  >
                    {value === 'all' ? 'All' : value}
                  </button>
                ))}
              </div>
            }
          />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Audience</th>
                  <th>Recipients</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => {
                  const progress = campaign.recipients ? Math.round((campaign.delivered / campaign.recipients) * 100) : 0
                  return (
                    <tr key={campaign.id}>
                      <td>
                        <div className="campaign-name">
                          <span className={cn('cell-avatar', `tone-${STATUS_TONE[campaign.status] || 'neutral'}`)}>
                            <MessageSquareText size={14} />
                          </span>
                          <div>
                            <strong title={campaign.message}>
                              {campaign.message.length > 60 ? `${campaign.message.slice(0, 59)}…` : campaign.message}
                            </strong>
                            <small>
                              #{campaign.id}
                              {campaign.sent_by ? ` · ${campaign.sent_by}` : ''}
                              {campaign.dry_run ? ' · dry run' : ''}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="muted-cell">{campaign.audience}</td>
                      <td className="numeric-cell">{formatNumber(campaign.recipients)}</td>
                      <td>
                        <div className="campaign-progress">
                          <Progress value={progress} tone={STATUS_TONE[campaign.status] || 'primary'} size="xs" />
                          <small>
                            {formatNumber(campaign.delivered)} sent · {formatNumber(campaign.failed)} failed
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge tone={STATUS_TONE[campaign.status] || 'neutral'} dot={campaign.status === 'Delivered'}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="muted-cell">{formatDateTime(campaign.sentAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredCampaigns.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <MessageSquareText size={22} />
              </span>
              <strong>{CAMPAIGNS.length ? 'No campaigns with this status' : 'No messages sent yet'}</strong>
              <span>Messages you send from this page are listed here.</span>
            </div>
          )}
          <div className="table-footer">
            <span>
              Showing <strong>{filteredCampaigns.length}</strong> of {CAMPAIGNS.length} campaigns
            </span>
          </div>
        </Card>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title="Send this message?"
        description={
          gateway?.dryRun
            ? 'Dry run is on: the message is logged, not sent.'
            : 'This sends real SMS to farmers. It cannot be recalled.'
        }
        icon={gateway?.dryRun ? Send : AlertTriangle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button variant="primary" icon={Send} loading={sending} onClick={handleSend}>
              Send to {formatNumber(activeGroup?.count || 0)} farmer{activeGroup?.count === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <div className="detail-meta-list">
          <div>
            <span>Recipients</span>
            <strong>{activeGroup?.name}</strong>
          </div>
          <div>
            <span>SMS parts per farmer</span>
            <strong>{parts}</strong>
          </div>
        </div>
        <p className="advisory-body" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
          {message}
        </p>
      </Modal>
    </div>
  )
}
