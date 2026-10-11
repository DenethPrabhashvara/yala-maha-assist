const express = require('express')
const mahaweli = require('../models/mahaweliModel.js')
const { runAlertCheck } = require('../services/alertservice.js')

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

module.exports = apirouter
