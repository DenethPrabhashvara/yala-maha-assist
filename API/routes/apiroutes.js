const express = require('express')
const mahaweli = require('../models/mahaweliModel.js')
const reservoir = require('../models/reserviorModel.js')

apirouter = express.Router()



const reservoir = require('../models/reserviorModel.js')

const { runAlertCheck } = require('../services/alertservice.js')
const {
  sendSms,
  generateAndSendOtp,
  verifyOtpCode,
  sendRegistrationConfirmation
} = require('../services/smsService.js')

const apirouter = express.Router()


apirouter.route('/').get((req,res)=>{
    res.status(200).end("Welcome to Our API")
})



apirouter.route('/mahaweli').get(mahaweli.getAllTanks)
apirouter.route('/mahaweli/:id').get(mahaweli.getTankbyId)
apirouter.route('/reservoir').get(reservoir.getAllResvData)
apirouter.route('/reservoir/:id').get(reservoir.getResById)



module.exports = apirouter