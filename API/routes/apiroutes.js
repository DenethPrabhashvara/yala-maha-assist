const express = require('express')
const mahaweli = require('../models/mahaweliModel.js')
const { runAlertCheck } = require('../services/alertservice.js')
const {
  sendSms,
  generateAndSendOtp,
  verifyOtpCode,
  sendRegistrationConfirmation
} = require('../services/smsService.js')

const apirouter = express.Router()

apirouter.route('/').get((req, res) => {
  res.status(200).end("Welcome to Our API")
})

apirouter.route('/mahaweli').get(mahaweli.getAllTanks)
apirouter.route('/mahaweli/:id').get(mahaweli.getTankbyId)

// Safe to hit as often as you like: shows what WOULD be sent, costs nothing
apirouter.route('/alerts/preview').get(async (req, res, next) => {
  try {
    res.json(await runAlertCheck({ send: false }))
  } catch (e) {
    next(e)
  }
})

// Actually sends the SMS
apirouter.route('/alerts/check').post(async (req, res, next) => {
  try {
    res.json(await runAlertCheck({ send: true }))
  } catch (e) {
    next(e)
  }
})

// Send OTP code to Farmer phone
apirouter.route('/sms/send-otp').post(async (req, res, next) => {
  try {
    const { phone, forceLive } = req.body || {}
    if (!phone) {
      return res.status(400).json({ status: 'fail', message: 'Phone number is required.' })
    }
    const result = await generateAndSendOtp(phone, { forceLive })
    res.status(200).json({ status: 'success', data: result })
  } catch (e) {
    next(e)
  }
})

// Verify OTP code entered by Farmer
apirouter.route('/sms/verify-otp').post((req, res, next) => {
  try {
    const { phone, otp } = req.body || {}
    if (!phone || !otp) {
      return res.status(400).json({ status: 'fail', message: 'Phone and OTP are required.' })
    }
    const result = verifyOtpCode(phone, otp)
    if (!result.valid) {
      return res.status(400).json({ status: 'fail', message: result.message })
    }
    res.status(200).json({ status: 'success', data: result })
  } catch (e) {
    next(e)
  }
})

// Send Registration Confirmation SMS
apirouter.route('/sms/confirm-registration').post(async (req, res, next) => {
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
apirouter.route('/sms/send-custom').post(async (req, res, next) => {
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

module.exports = apirouter
