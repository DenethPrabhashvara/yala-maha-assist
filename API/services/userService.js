
const db = require('../config/db.js')
const crypto = require('crypto')
const jwt =require('jsonwebtoken')



//Check if farmer already exists
async function findFarmerByPhone(phone) {
    const result = await db.query(
        'SELECT farmer_id, full_name, phone FROM farmers WHERE phone = $1 LIMIT 1',
        [phone]
    )
    return result.rows[0] || null
}

async function createFarmer(farmer) {
    const {
        full_name,
        nic,
        phone,
        address,
        district,
        division,
        farm_latitude,
        farm_longitude,
        reservoir_id,
        tank_id,
        land_acres,
        primary_crop
    } = farmer

    if (!process.env.NIC_PEPPER) throw new Error('NIC_PEPPER is not set')

    const hashedNic = crypto
        .createHmac('sha256', process.env.NIC_PEPPER)
        .update(nic.trim().toUpperCase())
        .digest('hex')
    const result = await db.query(
        `INSERT INTO farmers (
            full_name, hashed_nic, phone, address, district, division,
            farm_latitude, farm_longitude, reservoir_id, tank_id,
            land_acres, primary_crop
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING farmer_id, full_name, phone`,
        [
            full_name,
            hashedNic,
            phone,
            address,
            district,
            division || null,
            farm_latitude ?? null,
            farm_longitude ?? null,
            reservoir_id ?? null,
            tank_id ?? null,
            land_acres ?? null,
            primary_crop || null
        ]
    )

    return {result: result.rows[0], hashedNic}

}

async function getFarmerDetails(req,res){
    const token =req.headers.authorization?.split(" ")[ 1 ]

    if(!token){
        return res.status(401).json(
            {
                status: "error",
                message: "token not found"
            }
        )

    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    result = await db.query('SELECT farmer_id, full_name,phone,address,district,division,farm_latitude, farm_longitude,reservoir_id, tank_id,land_acres, primary_crop, created_at, updated_at  FROM farmers WHERE farmer_id =$1', [decoded.id])
    res.status(200).json(
        {
            status: "success",
            data: result.rows
        }
    )
}


module.exports = { findFarmerByPhone, createFarmer , getFarmerDetails}