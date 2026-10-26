const db =require('../config/db.js')
const bcrypt =require('bcryptjs')
const express =require('express')
async function createAdmin(username, password, full_name, role){
    try{
    const password_hash =bcrypt.hash(password, 12)
    const result = await db.query('INSERT INTO admin (full_name,username,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING admin_id', [full_name,username,password_hash,role])
    if(!result.rows[0]){
        return {rstatus: "failed", message: "Can not Add the User"} 
    }


    return {rstatus: "success", message: "User Created"}

    }
    catch(error){
        return {rstatus: "err0r" , message: error.message }
    }
}


