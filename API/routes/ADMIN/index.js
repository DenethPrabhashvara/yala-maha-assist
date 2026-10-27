// Everything under /admin. Only /admin/auth/login, /refresh_token and /logout are open;
// every other route needs an admin access token (requireAdmin). Farmer tokens never pass:
// they are signed with a different secret and lack the admin audience and role.
const express = require('express')
const { requireAdmin, canEdit } = require('../../middleware/requireAdmin.js')
const adminauthrouter = require('./authroutes.js')
const farmerrouter = require('./farmerroutes.js')
const dbrouter = require('./dbroutes.js')
const smsrouter = require('./alertroutes.js')
const datarouter = require('./dataroutes.js')

const adminrouter =express.Router()

adminrouter.use('/auth', adminauthrouter)
adminrouter.use('/farmers', requireAdmin, farmerrouter)  
adminrouter.use('/db',requireAdmin, dbrouter)
adminrouter.use('/data', requireAdmin, datarouter)

adminrouter.use('/sms', requireAdmin, (req, res, next) => (req.method === 'GET' ? next() : canEdit(req, res, next)), smsrouter)


adminrouter.use((req, res) => res.status(404).json({ status: 'fail', message: 'Not found.' }))

module.exports = adminrouter
