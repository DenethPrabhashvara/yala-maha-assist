const express = require('express')
const smsrouter = express.Router()
const { runAlertCheck } = require('../services/alertservice.js')
const {
  sendSms,
  generateAndSendOtp,
  verifyOtpCode,
  sendRegistrationConfirmation
} = require('../services/smsService.js')


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

// Send OTP code to Farmer phone (Protected by Cooldown & Rate Limiting)
smsrouter.route('/send-otp').post(async (req, res, next) => {
  try {
    const { phone, forceLive } = req.body || {}
    if (!phone) {
      return res.status(400).json({ status: 'fail', message: 'Phone number is required.' })
    }
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const result = await generateAndSendOtp(phone, { forceLive, clientIp })
    res.status(200).json({ status: 'success', data: result })
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ status: 'fail', message: e.message })
    }
    next(e)
  }
})

// Verify OTP code entered by Farmer (Protected against Brute-Force)
smsrouter.route('/verify-otp').post((req, res, next) => {
  try {
    const { phone, otp } = req.body || {}
    if (!phone || !otp) {
      return res.status(400).json({ status: 'fail', message: 'Phone and OTP are required.' })
    }
    const result = verifyOtpCode(phone, otp)
    if (!result.valid) {
      return res.status(result.status || 400).json({ status: 'fail', message: result.message })
    }
    res.status(200).json({ status: 'success', data: result })
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