const express = require('express')
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