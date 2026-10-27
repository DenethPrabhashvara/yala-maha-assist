const express = require('express')
const cors = require('cors')
const apiroute = require('./routes/apiroutes.js')
const errorHandle = require('./middleware/errorHandles.js')
const rateLimit = require('express-rate-limit')
const slowDownReq = require('express-slow-down')
const helmet =require('helmet')  //Security
const cookieparser = require('cookie-parser')
const authrouter = require('./routes/authroutes.js')
const adminrouter =require('./routes/ADMIN/index.js')

// Admin and farmer tokens must never be interchangeable
if (!process.env.JWT_SECRET || !process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET === process.env.JWT_ADMIN_SECRET) {
    throw new Error('JWT_SECRET and JWT_ADMIN_SECRET must both be set and must be different')
}

const ALLOWED_IP = '::ffff:127.0.0.1' // skip rate limit for localhost for dev purposes


//Note to self:
//rewrite these when implementing nginx for load balancing
//otherwise every req would be blocked 
// reason : req.ip becomes the proxy ip
// and address potential vulns with the
// X-Forwarded-For header

//SLOWDOWN AFTER 30 requests
const slowDown = slowDownReq({
    windowMs: 5*60*1000,
    delayAfter: 33,
    delayMs: ()=> 20000
    
})


//IMplement Rate LImiting for API
const limiter = rateLimit({
    windowMs: 5*60 *1000,
    max:53,
    message: {error: 'Too many requests, please try again later.'},
    skip: (req)=>{
        if(ALLOWED_IP.includes(req.ip)){
            return true
        }
        else{
            return false
            
        }
    }
})

const app = express()

// Global Middleware
app.use(helmet())
app.use(cookieparser())
app.use(express.json( {limit: '10mb'}))
app.use(express.urlencoded( {extended: true, limit: '10mb'}))


const CREDENTIAL_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174')
    .split(',').map(origin => origin.trim()).filter(Boolean)

app.use(cors((req, callback) => {
    const trusted = CREDENTIAL_ORIGINS.includes(req.header('Origin'))
    callback(null, {
        origin: trusted ? req.header('Origin') : '*',
        credentials: trusted,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    })
}))

// The admin portal loads several data sets per page, so it is mounted before the public
// slow-down and gets its own limit. Admin sign-in has its own lockout (routes/ADMIN/authroutes.js).
const adminLimiter = rateLimit({
    windowMs: 5*60*1000,
    max: 600,
    message: {error: 'Too many requests, please try again later.'}
})
app.use('/admin', adminLimiter, adminrouter)   // admin portal only, see routes/ADMIN/index.js

app.use(slowDown)
app.use(limiter)



// health & service discovery
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Yala-Maha Assist API Server',
        endpoints: {
            mahaweli: '/api/data/mahaweli',
            mahaweliJson: '/api/data/mahaweli?format=csv', 
            mahaweliCsv: '/api/data/mahaweli/csv',
            mahaweliById: '/api/data/mahaweli/:id',
            forecastByTankId: '/api/forecast/:id',
            reservoir:'/api/data/reservoir',
            resorvoirById: '/api/data/reservoir',
            resorvoirHistoryByDays: '/api/data/reservoir/:id/history?days=30',
            rivers: '/api/data/rivers',
            canals: '/api/data/canals'
        }
    })
})

// Convenience alias for /mahaweli-data
app.get('/mahaweli-data', (req, res) => {
    res.redirect(307, '/api/mahaweli?format=csv') 
})



app.use('/api/data', apiroute) // for resevoirs and tanks
app.use('/api/auth', authrouter)   //for l0gin auth

// Error handling middleware
app.use(errorHandle)

app.all('/*splat', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports = app
