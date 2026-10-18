const express = require('express')
const cors = require('cors')
const apiroute = require('./routes/apiroutes.js')
const alertroutes = require('./routes/alertroutes.js')
const errorHandle = require('./middleware/errorHandles.js')

const app = express()

// Global Middleware
app.use(express.json())
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
