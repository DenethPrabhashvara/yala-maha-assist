const express = require('express')
const adminrouter = express.Router()
const bcrypt =require('bcryptjs')
const db =require('../config/db.js')
adminrouter.route('/verify').post( async (req,res,next)=>{
    const username = req.body.username || ''
    const password = req.body.password || ''


    console.log(username)
    console.log(password)
    const result = await db.query('SELECT * FROM admins WHERE username = $1 AND password_hash = $2', [username ,password])
    console.log(result.rows[0])
    res.end()

})

module.exports =adminrouter
