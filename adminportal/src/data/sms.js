// SMS campaigns sent from this portal (GET /admin/sms/campaigns)

export const SMS_TEMPLATES = [
  {
    id: 'tpl-flood',
    name: 'Flood warning',
    category: 'Emergency',
    body:
      'YalaMaha ALERT: {{river}} is above its flood level at {{station}}. Move livestock to higher ground and keep away from low-lying fields and roads.',
  },
  {
    id: 'tpl-release',
    name: 'Water release notice',
    category: 'Irrigation',
    body:
      'YalaMaha: Water release for {{scheme}} begins on {{date}}. Please prepare your field channels.',
  },
  {
    id: 'tpl-tank',
    name: 'Tank level',
    category: 'Irrigation',
    body:
      'YalaMaha: {{tank}} is at {{percent}}% storage. Plan your water use with your farmer organisation.',
  },
  {
    id: 'tpl-advisory',
    name: 'Crop advisory',
    category: 'Agronomy',
    body: 'YalaMaha ADVISORY: Dear {{name}}, ',
  },
]

const STATUS = (campaign) => {
  if (campaign.failed === 0) return 'Delivered'
  if (campaign.delivered === 0) return 'Failed'
  return 'Partial'
}

// Local calendar day, YYYY-MM-DD
const dayKey = (date) => date.toLocaleDateString('en-CA')

export function buildSms(rows = [], now = new Date()) {
  const CAMPAIGNS = rows.map((row) => ({
    ...row,
    sentAt: new Date(row.created_at),
    status: STATUS(row),
  }))

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sumOf = (items, field) => items.reduce((total, item) => total + item[field], 0)
  const today = CAMPAIGNS.filter((campaign) => campaign.sentAt >= startOfToday)
  const month = CAMPAIGNS.filter((campaign) => campaign.sentAt >= startOfMonth)
  const sent = sumOf(CAMPAIGNS, 'recipients')

  // The last 7 days, oldest first
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfToday)
    date.setDate(date.getDate() - (6 - index))
    return date
  })
  const SMS_VOLUME_TREND = days.map((date) => {
    const items = CAMPAIGNS.filter((campaign) => dayKey(campaign.sentAt) === dayKey(date))
    return {
      day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      sent: sumOf(items, 'recipients'),
      delivered: sumOf(items, 'delivered'),
      failed: sumOf(items, 'failed'),
    }
  })

  return {
    CAMPAIGNS,
    SMS_VOLUME_TREND,
    SMS_SUMMARY: {
      campaigns: CAMPAIGNS.length,
      sentToday: sumOf(today, 'delivered'),
      sentMonth: sumOf(month, 'delivered'),
      failedMonth: sumOf(month, 'failed'),
      deliveryRate: sent ? Number(((sumOf(CAMPAIGNS, 'delivered') / sent) * 100).toFixed(1)) : null,
      lastSent: CAMPAIGNS[0]?.sentAt || null,
    },
  }
}
