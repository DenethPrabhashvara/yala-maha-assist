const db = require('../config/db.js')
const { sendSms } = require('./smsService.js')

async function findHighTanks(threshold) {
  const result = await db.query(
    `SELECT tank_name, storage_percentage, last_update
     FROM mahawelitanks
     WHERE storage_percentage >= $1
     ORDER BY storage_percentage DESC`,
    [threshold]
  )
  return result.rows
}

// Plain ASCII keeps it to one 160-character SMS segment
function buildMessage(tanks) {
  const top = tanks.slice(0, 4)
  const list = top.map(t => `${t.tank_name} ${Math.round(t.storage_percentage)}%`).join(', ')
  const more = tanks.length > top.length ? ` +${tanks.length - top.length} more` : ''
  return `YalaMaha ALERT: High tank levels: ${list}${more}. Check downstream fields.`
}

async function runAlertCheck({ send }) {
  const threshold = Number(process.env.ALERT_THRESHOLD) || 90
  const tanks = await findHighTanks(threshold)

  if (tanks.length === 0) {
    return { threshold, tanks, sent: false, reason: 'No tanks above threshold' }
  }

  const message = buildMessage(tanks)
  if (!send) return { threshold, tanks, message, sent: false, reason: 'Preview only' }

  const recipients = (process.env.ALERT_RECIPIENTS || '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (recipients.length === 0) throw new Error('ALERT_RECIPIENTS is empty')

  const result = await sendSms(recipients, message)
  return { threshold, tanks, message, recipients: recipients.length, sent: true, result }
}

module.exports = { runAlertCheck }