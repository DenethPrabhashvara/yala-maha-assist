const express = require('express')
const cors = require('cors')
const apiroute = require('./routes/apiroutes.js')
const alertroutes = require('./routes/ADMIN/alertroutes.js')
const errorHandle = require('./middleware/errorHandles.js')
const rateLimit = require('express-rate-limit')
const slowDownReq = require('express-slow-down')
const helmet =require('helmet')  //Security
const cookieparser = require('cookie-parser')
const authrouter = require('./routes/authroutes.js')
const adminrouter =require('./routes/ADMIN/authroutes.js')

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
app.use(slowDown)
app.use(limiter)


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}))



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
            resorvoirHistoryByDays: '/api/data/reservoir/:id/history?days=30'
        }
    })
})

// Convenience alias for /mahaweli-data
app.get('/mahaweli-data', (req, res) => {
    res.redirect(307, '/api/mahaweli?format=csv') 
})


app.use('/sms', alertroutes)

app.use('/api/data', apiroute) // for resevoirs and tanks
app.use('/api/auth', authrouter)   //for l0gin auth
app.use('/admin', adminrouter)

// Error handling middleware
app.use(errorHandle)

app.all('/*splat', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports = app
