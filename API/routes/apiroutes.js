const express = require('express')
const mahaweli = require('../models/mahaweliModel.js')


apirouter = express.Router()


apirouter.route('/').get((req,res)=>{
    res.status(200).end("Welcome to Our API")
})

apirouter.route('/mahaweli').get(mahaweli.getAllTanks)
apirouter.route('/mahaweli/:id').get(mahaweli.getTankbyId)


module.exports = apirouter