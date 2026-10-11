const express = require('express')
const app =express()
const cors = require('cors')
const db = require('./config/db.js')
const apiroute = require('./routes/apiroutes.js')
const errorHandle =require('./middleware/errorHandles.js')
//MIDDLEWARE
app.use(express.json())
app.use(cors())



//Routess

app.get('/', async (req,res)=>{
    resul = await db.query('SELECT current_database()')
    console.log(resul.rows[0].current_database)
    res.end()
})

app.use('/api/', apiroute)


//ERROR Handling Midleware
app.use(errorHandle);


module.exports = app
