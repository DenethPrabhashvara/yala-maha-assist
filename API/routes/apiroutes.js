const express = require('express')
const mahaweli = require('../models/mahawelicsvModel.js')
const reservoir = require('../models/reserviorModel.js')
const forecast = require('../models/forecastModel.js')


const apirouter = express.Router()

apirouter.route('/').get((req, res) => {
  res.status(200).end("Welcome to Our API")
})




apirouter.route('/mahaweli').get(mahaweli.getAllTanks)
apirouter.route('/mahaweli/csv').get(mahaweli.getAllTanks)
apirouter.route('/mahaweli.csv').get(mahaweli.getAllTanks)
apirouter.route('/mahaweli/:id').get(mahaweli.getTankbyId)
apirouter.route('/forecast/:id').get(forecast.getForecastByTankId)
apirouter.route('/reservoir').get(reservoir.getAllResvData)
apirouter.route('/reservoir/:id').get(reservoir.getResById)
apirouter.route('/reservoir/:id/history').get(reservoir.getReslevels)

module.exports = apirouter
