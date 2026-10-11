const express =require('express')
const path = require('path')
const app = express()

app.use(express.static(path.join(__dirname, 'public')));

app.get(['/river-config.js', '/farm-config.js', '/river-page.js', '/js/river-page.js'], (req, res, next) => {
    res.sendFile(path.join(__dirname, req.path.endsWith('/river-page.js') ? 'river-page.js' : req.path.slice(1)), err => {
        if (err) next(err)
    })
})

app.get([
    '/',
    '/dashboard',
    '/river',
    '/map',
    '/sms',
    '/portal',
    '/coverage-map',
    '/sms-gateway',
    '/farmer-portal'
], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'yala-maha-assist.html'))
})

module.exports = app