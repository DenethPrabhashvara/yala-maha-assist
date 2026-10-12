const express = require('express')
const mahaweli = require('../models/mahaweliModel.js')
const reservoir = require('../models/reserviorModel.js')

apirouter = express.Router()


apirouter.route('/').get((req,res)=>{
    res.status(200).end("Welcome to Our API")
})

apirouter.route('/mahaweli').get(mahaweli.getAllTanks)
apirouter.route('/mahaweli/:id').get(mahaweli.getTankbyId)
apirouter.route('/reservoir').get(reservoir.getAllResvData)


module.exports = apirouter