const express =require('express')
const path = require('path')
const app = express()


app.use(express.static(path.join(dirname, 'public')));

app.get(['/river-config.js', '/farm-config.js', '/river-page.js', '/js/river-page.js'], (req, res, next) => {
    res.sendFile(path.join(dirname, req.path.endsWith('/river-page.js') ? 'river-page.js' : req.path.slice(1)), err => {
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


const { Pool } = require('pg');


const pool = new Pool({
    user:"postgres",
    password:"postgres",
    host:"localhost",
    database:"yala-maha-api",
    port:5432
})

app.get('/mahaweli-data' , async (req,res)=>{
    const result = await pool.query('SELECT * FROM mahawelitanks')
    const headers = result.fields.map(field => field.name)
    const csv = [
        headers,
        ...result.rows.map(row => headers.map(header => row[header]))
    ].map(row => row.map(value => {
        const cell = value == null
            ? ''
            : typeof value === 'object' && !(value instanceof Date)
                ? JSON.stringify(value)
                : String(value)
        return "${cell.replace(/"/g, '""')}"
    }).join(',')).join('\r\n')

    res.type('text/csv').send(csv)
})

module.exports = app
