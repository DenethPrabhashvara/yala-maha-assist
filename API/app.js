const express = require('express')
const cors = require('cors')
const apiroute = require('./routes/apiroutes.js')
const alertroutes = require('./routes/alertroutes.js')
const errorHandle = require('./middleware/errorHandles.js')
const rateLimit = require('express-rate-limit')
const slowDownReq = require('express-slow-down')

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
    max:56,
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
app.use(express.json())
app.use(slowDown)
app.use(limiter)

app.use(express.urlencoded({ extended: true }))

// Enable CORS for public API consumption across origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}))

// Root health & service discovery
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Yala-Maha Assist API Server',
        endpoints: {
            mahaweli: '/api/mahaweli (Public CSV)',
            mahaweliJson: '/api/mahaweli?format=json',
            mahaweliCsv: '/api/mahaweli/csv',
            mahaweliById: '/api/mahaweli/:id',
            reservoir:'/api/reservoir',
            resorvoirById: '/api/reservoir'
        }
    })
})

// Convenience alias for /mahaweli-data
app.get('/mahaweli-data', (req, res) => {
    res.redirect(307, '/api/mahaweli?format=csv')
})



app.use('/api', apiroute)
app.use('/sms', alertroutes)

// Error handling middleware
app.use(errorHandle)

app.all('/*splat', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports = app
