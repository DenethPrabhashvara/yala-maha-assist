const express = require('express')
const crypto = require('crypto')
const redisClient = require('../config/redis.js')
const { sendSms, validateSriLankanMobile } = require('../services/smsService.js')
const { findFarmerByPhone, createFarmer, getFarmerDetails } = require('../services/userService.js')
const jwt = require('jsonwebtoken')
const db =require('../config/db.js')


const JWT_SECRET = process.env.JWT_SECRET

const authrouter = express.Router()
const OTP_TTL_SECONDS = 3 * 60
const VERIFIED_PHONE_TTL_SECONDS = 15 * 60

authrouter.post('/send-otp', async (req, res, next) => {
  try {
    const { phone } = req.body || {}
    if (!phone) {
      return res.status(400).json({ status: 'fail', message: 'Phone number required.' })
    }

    const phoneCheck = validateSriLankanMobile(phone)
    if (!phoneCheck.valid) {
      return res.status(400).json({ status: 'fail', message: phoneCheck.error })
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
    await sendSms(
      phoneCheck.normalized,
      `Yala-Maha Assist verification code: ${otp}.expires in 3 minutes.`
    )
    await redisClient.set(`otp:${phoneCheck.normalized}`, otp, 'EX', OTP_TTL_SECONDS)

    return res.status(200).json({ status: 'success', message: 'OTP sent.' })
    
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ status: 'fail', message: error.message })
    }
    return next(error)
  }
})

authrouter.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp } = req.body || {}
    if (!phone || !otp) {
      return res.status(400).json({ status: 'fail', message: 'Phone and OTP are required.' })
    }

    const phoneCheck = validateSriLankanMobile(phone)
    if (!phoneCheck.valid) {
      return res.status(400).json({ status: 'fail', message: phoneCheck.error })
    }

    const submittedOtp = String(otp).trim()
    if (!/^\d{6}$/.test(submittedOtp)) {
      return res.status(400).json({ status: 'fail', message: 'OTP must be a 6-digit numeric code.' })
    }

    const key = `otp:${phoneCheck.normalized}`
    const storedOtp = await redisClient.get(key)
    if (!storedOtp) {
      return res.status(400).json({ status: 'fail', message: 'OTP is invalid or has expired.' })
    }

    const isValid = submittedOtp.length === storedOtp.length &&
      crypto.timingSafeEqual(Buffer.from(submittedOtp), Buffer.from(storedOtp))
    if (!isValid) {
      return res.status(400).json({ status: 'fail', message: 'OTP is invalid or has expired.' })
    }

    const existingFarmer = await findFarmerByPhone(phoneCheck.normalized)
    await redisClient.del(key)

    if (existingFarmer) {
      return res.status(200).json({
        status: 'success',
        message: 'Phone verified. A farmer account already exists for this number.',
        alreadyRegistered: true
      })
    }

    await redisClient.set(
      `verified-phone:${phoneCheck.normalized}`,
      '1',
      'EX',
      VERIFIED_PHONE_TTL_SECONDS
    )
    return res.status(200).json({
      status: 'success',
      message: 'OTP verified. Complete registration to create your farmer account.',
      alreadyRegistered: false
    })
  } catch (error) {
    return next(error)
  }
})

authrouter.post('/register', async (req, res, next) => {
  try {
    const {
      phone,
      full_name,
      nic,
      address,
      district,
      division,
      farm_latitude,
      farm_longitude,
      reservoir_id,
      tank_id,
      land_acres,
      primary_crop
    } = req.body || {}

    const phoneCheck = validateSriLankanMobile(phone)
    if (!phoneCheck.valid) {
      return res.status(400).json({ status: 'fail', message: phoneCheck.error })
    }

    if ([full_name, nic, address, district].some(value => typeof value !== 'string' || !value.trim())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Full name, NIC, address, and district are required.'
      })
    }

    if (division != null && typeof division !== 'string') {
      return res.status(400).json({ status: 'fail', message: 'Division must be text.' })
    }

    if (!/^([0-9]{9}[VvXx]|[0-9]{12})$/.test(nic.trim())) {
      return res.status(400).json({ status: 'fail', message: 'NIC format is invalid.' })
    }

    if (reservoir_id != null && tank_id != null) {
      return res.status(400).json({
        status: 'fail',
        message: 'A farmer can be linked to a reservoir or a tank, not both.'
      })
    }

    const verified = await redisClient.get(`verified-phone:${phoneCheck.normalized}`)
    if (!verified) {
      return res.status(403).json({ status: 'fail', message: 'Verify this phone number before registering.' })
    }

    const existingFarmer = await findFarmerByPhone(phoneCheck.normalized)
    if (existingFarmer) {
      await redisClient.del(`verified-phone:${phoneCheck.normalized}`)
      return res.status(409).json({ status: 'fail', message: 'A farmer account already exists for this phone number.' })
    }

    const farmer = await createFarmer({
      full_name: full_name.trim(),
      nic: nic.trim(),
      phone: phoneCheck.normalized,
      address: address.trim(),
      district: district.trim(),
      division: division?.trim(),
      farm_latitude,
      farm_longitude,
      reservoir_id,
      tank_id,
      land_acres,
      primary_crop
    })

    //JWT AUTHENITACTION!!!
    const hashedNic = farmer.hashedNic
    const farmer_id = farmer.result.farmer_id
    const refreshToken = jwt.sign({ id:farmer_id  }, JWT_SECRET, { expiresIn: '7d' })
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const ip = req.ip
    const userAgent = req.headers['user-agent'] || 'unknown'
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    const family_id = null
    console.log(farmer ,"DBF : Farmer OBj")
    const sessionResult = await db.query(
      `INSERT INTO farmer_sessions
        (farmer_id, refresh_token_hash,family_id, ip, user_agent, expires_at)
        VALUES ($1, $2, COALESCE($3, gen_random_uuid()), $4, $5, $6)
        RETURNING id, family_id, farmer_id, expires_at`,
      [farmer_id, refreshTokenHash, family_id, ip, userAgent, expiresAt]
    )

    const accessToken = jwt.sign(
      { id: farmer_id, sessionId: sessionResult.rows[0].id },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    await redisClient.del(`verified-phone:${phoneCheck.normalized}`)

    res.cookie("refreshToken", refreshToken , {
      httpOnly:true,
      secure:true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000  //7days maxAGe

    })
    res.status(201).json({ status: 'success', message: 'Farmer registered.', data: farmer.result , accessToken: accessToken})
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ status: 'fail', message: 'A farmer with this phone or NIC already exists.' })
    }
    return next(error)
  }



    

})


authrouter.route('/profile').get(getFarmerDetails)


authrouter.route('/refresh_token').get(async (req,res)=>{
  const refreshToken =  req.cookies.refreshToken
  if(!refreshToken){
      return res.status(401).json(
        {
          status: "failed",
          message: "refreshToken not found"
        }
      )
  }
  const decoded =jwt.verify(refreshToken, JWT_SECRET)

  const refreshTokenHash =crypto.createHash('sha256').update(refreshToken).digest('hex')

  const session = await db.query('SELECT * from farmer_sessions WHERE refresh_token_hash= $1 AND revoked=$2', [refreshTokenHash, false])

  if(!session.rows[0]){
      return res.status(401).json(
        {
          status: "failed",
          message: "Invalid refresh t0ken"
        }
      )
  }
  
  const accessToken =jwt.sign({id: decoded.id}, JWT_SECRET, { expiresIn: "15m"})

  const newRotatedRefreshToken = jwt.sign({id:decoded.id}, JWT_SECRET, { expiresIn: "7d"})
  res.cookie('refreshToken', newRotatedRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  })



  const newRotatedRefreshTokenHash = crypto.createHash('sha256').update(newRotatedRefreshToken).digest('hex')
  console.log(session.rows)
  await db.query("UPDATE farmer_sessions SET refresh_token_hash = $1 WHERE id=$2", [newRotatedRefreshTokenHash, session.rows[0].id])
  
  res.status(200).json(
    {

      message: "Access Token refreshed sucessfully",
      accessToken
    }
  )
})

authrouter.route('/logout').post( async(req, res)=>{

    const refreshToken =req.cookies.refreshToken
    if(!refreshToken){
        return res.status(401).json({
          status: "failed",
          message: "refreshToken was not Provided"
        }
        )
    }
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest('hex')
    console.log(refreshTokenHash)
    const session = await db.query('SELECT * from farmer_sessions WHERE refresh_token_hash= $1 AND revoked=$2', [refreshTokenHash, false])
    console.log(session.rows.length)
    if(!session || session.rows.length === 0){
      return res.status(400).json(
        {
          status: "failed",
          message: "invalid refreshToken"
        }
      )
    }

    await db.query("UPDATE farmer_sessions SET revoked = $1 WHERE refresh_token_hash = $2", [true, refreshTokenHash])
    res.clearCookie("refreshToken")
    res.status(200).json(
      {
        status: "success",
        message: "Successfully Logged Out"
      }
    )
})



authrouter.route('/login').post( async (req,res)=>{
    const {nic, phone} = req.body
    const Usrnic = nic.trim().toUpperCase()
    

    const phoneCheck = validateSriLankanMobile(phone).normalized
    console.log(Usrnic)
    console.log(phoneCheck)
    function hashNic(Usrnic) {
    if (!process.env.NIC_PEPPER) throw new Error('NIC_PEPPER is not set');
    return crypto
      .createHmac('sha256', process.env.NIC_PEPPER)
      .update(Usrnic)
      .digest('hex');
    }
  
    const hashedNic = hashNic(Usrnic)
    console.log(hashedNic)

    const usr = await db.query('SELECT farmer_id, full_name,phone,address,district,division,farm_latitude, farm_longitude,reservoir_id, tank_id,land_acres, primary_crop, created_at, updated_at  FROM farmers WHERE hashed_nic= $1', [hashedNic])

    if(!usr.rows[0]){
        return res.status(400).json(
          {
            status: "failed",
            message: "Farmer with that NIC Not Registered!"
          }
        )
    }
    const validusr = await db.query('SELECT farmer_id FROM farmers WHERE phone= $1 AND hashed_nic= $2', [phoneCheck, hashedNic])

    if(!validusr.rows[0]){
          return res.status(401).json(
            {
              status: "failed",
              message: "Wrong Phone Number, Make sure you provide the same number used for Registering"
            }
          )
    }

    const farmer_id = validusr.rows[0].farmer_id
    const refreshToken = jwt.sign({id: farmer_id}, JWT_SECRET,{expiresIn:"7d"})
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

    
    const ip = req.ip
    const userAgent = req.headers['user-agent'] || 'unknown'
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    console.log(validusr.rows[0])
    
    const family_id = null


     const session = await db.query('INSERT INTO farmer_sessions (farmer_id, refresh_token_hash, ip,user_agent,expires_at ) VALUES($1,$2,$3,$4,$5) RETURNING id, family_id, farmer_id, expires_at', [farmer_id, refreshTokenHash, ip,userAgent, expiresAt])


     const accessToken = jwt.sign(
      { id: farmer_id, sessionId: session.rows[0].id },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

     res.cookie("refreshToken", refreshToken , {
      httpOnly:true,
      secure:true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000  //7days maxAGe

    })

    res.status(200).json(
      {
          status: "success",
          message: "Logged in Successfully",
          farmer: usr.rows[0],
          accessToken
      }
    )
   
})

module.exports = authrouter
