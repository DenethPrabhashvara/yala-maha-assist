const express = require('express')
const db = require('../../config/db.js')
const smsrouter = express.Router()
const { runAlertCheck } = require('../../services/alertservice.js')
const {
  sendSms,
  sendRegistrationConfirmation
} = require('../../services/smsService.js')


// Safe to hit as often as you like: shows what WOULD be sent, costs nothing
smsrouter.route('/alerts/preview').get(async (req, res, next) => {
  try {
    res.json(await runAlertCheck({ send: false }))
  } catch (e) {
    next(e)
  }
})

// Actually sends the SMS
smsrouter.route('/alerts/check').post(async (req, res, next) => {
  try {
    res.json(await runAlertCheck({ send: true }))
  } catch (e) {
    next(e)
  }
})

// Send Registration Confirmation SMS
smsrouter.route('/confirm-registration').post(async (req, res, next) => {
  try {
    const { phone, farmerName, farmId, acres, forceLive } = req.body || {}
    if (!phone) {
      return res.status(400).json({ status: 'fail', message: 'Phone number is required.' })
    }
    const result = await sendRegistrationConfirmation(phone, { farmerName, farmId, acres }, { forceLive })
    res.status(200).json({ status: 'success', data: result })
  } catch (e) {
    next(e)
  }
})

// Gateway settings the portal shows (never the token itself)
smsrouter.route('/status').get((req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      provider: 'Text.lk',
      senderId: process.env.TEXTLK_SENDER_ID || 'TextLKDemo',
      configured: Boolean(process.env.TEXTLK_API_TOKEN),
      dryRun: process.env.SMS_DRY_RUN === 'true',
      alertThreshold: Number(process.env.ALERT_THRESHOLD) || 90
    }
  })
})

// Who a campaign can go to. Only active farmers get messages.
// { type: 'all' } | { type: 'district', value } | { type: 'reservoir', value: id } | { type: 'tank', value: id } | { type: 'farmer', value: farmer_id }
async function audienceFarmers(audience) {
  const type = audience?.type
  const value = audience?.value
  if (type === 'all') {
    return db.query('SELECT full_name, phone FROM farmers WHERE is_active')
  }
  if (type === 'district' && value) {
    return db.query('SELECT full_name, phone FROM farmers WHERE is_active AND district ILIKE $1', [String(value)])
  }
  if ((type === 'reservoir' || type === 'tank') && Number.isInteger(Number(value))) {
    return db.query(`SELECT full_name, phone FROM farmers WHERE is_active AND ${type}_id = $1`, [Number(value)])
  }
  if (type === 'farmer' && value) {
    return db.query('SELECT full_name, phone FROM farmers WHERE farmer_id::text = $1', [String(value)])
  }
  return null
}

smsrouter.route('/audiences').get(async (req, res, next) => {
  try {
    const [all, districts, reservoirs, tanks] = await Promise.all([
      db.query('SELECT count(*)::int AS n FROM farmers WHERE is_active'),
      db.query(`SELECT initcap(district) AS name, count(*)::int AS farmers FROM farmers WHERE is_active
                GROUP BY initcap(district) ORDER BY farmers DESC, name`),
      db.query(`SELECT r.id, r.name, count(*)::int AS farmers FROM farmers f JOIN reservoirs r ON r.id = f.reservoir_id
                WHERE f.is_active GROUP BY r.id ORDER BY farmers DESC, r.name`),
      db.query(`SELECT t.id, t.tank_name AS name, count(*)::int AS farmers FROM farmers f JOIN mahawelitanks t ON t.id = f.tank_id
                WHERE f.is_active GROUP BY t.id ORDER BY farmers DESC, t.tank_name`)
    ])
    res.status(200).json({
      status: 'success',
      data: {
        all: all.rows[0].n,
        districts: districts.rows,
        reservoirs: reservoirs.rows,
        tanks: tanks.rows
      }
    })
  } catch (e) {
    next(e)
  }
})

smsrouter.route('/campaigns').get(async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.audience, c.message, c.recipients, c.delivered, c.failed, c.dry_run, c.created_at,
              a.full_name AS sent_by
       FROM sms_campaigns c LEFT JOIN admins a ON a.admin_id = c.admin_id
       ORDER BY c.created_at DESC LIMIT 200`
    )
    res.status(200).json({ status: 'success', data: result.rows })
  } catch (e) {
    next(e)
  }
})

const MAX_CAMPAIGN_RECIPIENTS = 500

// Body: { audience: {type, value}, audienceLabel, message }
// Sends one SMS per farmer ({{name}} is replaced with their name) and logs the campaign.
smsrouter.route('/campaigns').post(async (req, res, next) => {
  try {
    const { audience, audienceLabel, message } = req.body || {}
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ status: 'fail', message: 'Write a message first.' })
    }
    if (message.length > 640) {
      return res.status(400).json({ status: 'fail', message: 'Keep the message to 640 characters (4 SMS).' })
    }
    const farmers = await audienceFarmers(audience)
    if (!farmers) {
      return res.status(400).json({ status: 'fail', message: 'Choose who gets the message.' })
    }
    if (farmers.rows.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No active farmers in this group.' })
    }
    if (farmers.rows.length > MAX_CAMPAIGN_RECIPIENTS) {
      return res.status(400).json({ status: 'fail', message: `This group has ${farmers.rows.length} farmers; send to at most ${MAX_CAMPAIGN_RECIPIENTS} at a time.` })
    }

    let delivered = 0
    let failed = 0
    let dryRun = false
    for (const farmer of farmers.rows) {
      try {
        const result = await sendSms(farmer.phone, message.trim().replace(/\{\{\s*name\s*\}\}/g, farmer.full_name))
        if (result?.dryRun) dryRun = true
        delivered += 1
      } catch (error) {
        console.error(`[SMS campaign] ${farmer.phone}: ${error.message}`)
        failed += 1
      }
    }

    const label = typeof audienceLabel === 'string' && audienceLabel.trim() ? audienceLabel.trim().slice(0, 120) : audience.type
    const saved = await db.query(
      `INSERT INTO sms_campaigns (admin_id, audience, message, recipients, delivered, failed, dry_run)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [req.admin.admin_id, label, message.trim(), farmers.rows.length, delivered, failed, dryRun]
    )
    res.status(201).json({
      status: 'success',
      data: { ...saved.rows[0], audience: label, recipients: farmers.rows.length, delivered, failed, dry_run: dryRun }
    })
  } catch (e) {
    next(e)
  }
})

// Custom SMS Broadcast / Direct message
smsrouter.route('/send-custom').post(async (req, res, next) => {
  try {
    const { recipients, message, forceLive } = req.body || {}
    if (!recipients || !message) {
      return res.status(400).json({ status: 'fail', message: 'Recipients and message are required.' })
    }
    const result = await sendSms(recipients, message, { forceLive })
    res.status(200).json({ status: 'success', data: result })
  } catch (e) {
    next(e)
  }
})



module.exports = smsrouter