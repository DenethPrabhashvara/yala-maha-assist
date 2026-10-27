const express = require('express')
const crypto = require('crypto')
const redisClient = require('../config/redis.js')
const { sendSms, validateSriLankanMobile } = require('../services/smsService.js')
const { findFarmerByPhone, createFarmer, getFarmerDetails, updateFarmer, validateFarmerChanges, FARMER_COLUMNS, UPDATABLE_FIELDS } = require('../services/userService.js')
const jwt = require('jsonwebtoken')
const db =require('../config/db.js')
const requireFarmer = require('../middleware/requireFarmer.js')
const { validateFarm, saveFarm, getFarm, withTransaction } = require('../services/farmService.js')


const JWT_SECRET = process.env.JWT_SECRET

const authrouter = express.Router()
const OTP_TTL_SECONDS = 3 * 60
const VERIFIED_PHONE_TTL_SECONDS = 15 * 60
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000  //7days

// Secure cookies need https, so they are only required in production.
// Set COOKIE_SAMESITE=none (with https) if the portal and API are on different sites.
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SAMESITE === 'none',
  sameSite: process.env.COOKIE_SAMESITE || 'strict',
  path: '/api/auth'
}

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
      // /login checks this key, so the account can only be opened by whoever has the phone
      await redisClient.set(
        `verified-login:${phoneCheck.normalized}`,
        '1',
        'EX',
        VERIFIED_PHONE_TTL_SECONDS
      )
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

    // Farm details: water source, location label and the crop list (optional here)
    const farmCheck = validateFarm(req.body)
    if (farmCheck.error) {
      return res.status(400).json({ status: 'fail', message: farmCheck.error })
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
      primary_crop,
      farm: farmCheck.farm
    })

    //JWT AUTHENITACTION!!!
    const hashedNic = farmer.hashedNic
    const farmer_id = farmer.result.farmer_id
    const refreshToken = jwt.sign({ id:farmer_id  }, JWT_SECRET, { expiresIn: '7d', jwtid: crypto.randomUUID() })
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

    res.cookie("refreshToken", refreshToken , { ...refreshCookieOptions, maxAge: REFRESH_TOKEN_MS })
    res.status(201).json({ status: 'success', message: 'Farmer registered.', data: farmer.result , accessToken: accessToken})
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ status: 'fail', message: 'A farmer with this phone or NIC already exists.' })
    }
    return next(error)
  }



    

})


authrouter.route('/profile')
  .get(requireFarmer, getFarmerDetails)
  .patch(requireFarmer, async (req, res, next) => {
    try {
      if (!UPDATABLE_FIELDS.some(field => req.body?.[field] !== undefined)) {
        return res.status(400).json({ status: 'fail', message: 'Nothing to update.' })
      }
      const { error, changes } = validateFarmerChanges(req.body)
      if (error) {
        return res.status(400).json({ status: 'fail', message: error })
      }

      const farmer = await updateFarmer(req.farmerId, changes)
      if (!farmer) {
        return res.status(404).json({ status: 'fail', message: 'Farmer account not found.' })
      }
      return res.status(200).json({ status: 'success', message: 'Profile updated.', data: farmer })
    } catch (error) {
      // 23514 = CHECK constraint (e.g. both water sources set), 23503 = unknown reservoir/tank id
      if (error.code === '23514' || error.code === '23503') {
        return res.status(400).json({ status: 'fail', message: 'Invalid farm location or water source.' })
      }
      return next(error)
    }
  })


// The signed-in farmer's farm details. PUT replaces them, including the whole crop list.
authrouter.route('/farm')
  .get(requireFarmer, async (req, res, next) => {
    try {
      const farmer = await db.query('SELECT farm_id FROM farmers WHERE farmer_id = $1', [req.farmerId])
      if (!farmer.rows[0]) {
        return res.status(404).json({ status: 'fail', message: 'Farmer account not found.' })
      }
      const farm = await getFarm(farmer.rows[0].farm_id)
      return res.status(200).json({ status: 'success', data: farm || { farm_id: farmer.rows[0].farm_id, crops: [] } })
    } catch (error) {
      return next(error)
    }
  })
  .put(requireFarmer, async (req, res, next) => {
    try {
      const farmCheck = validateFarm(req.body, { requireCrops: true })
      if (farmCheck.error) {
        return res.status(400).json({ status: 'fail', message: farmCheck.error })
      }
      const farm = await withTransaction(async (client) => {
        const farmer = await client.query('SELECT farm_id FROM farmers WHERE farmer_id = $1 FOR UPDATE', [req.farmerId])
        if (!farmer.rows[0]) return null
        await saveFarm(client, farmer.rows[0].farm_id, farmCheck.farm)
        return getFarm(farmer.rows[0].farm_id, client)
      })
      if (!farm) {
        return res.status(404).json({ status: 'fail', message: 'Farmer account not found.' })
      }
      return res.status(200).json({ status: 'success', message: 'Farm updated.', data: farm })
    } catch (error) {
      return next(error)
    }
  })


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
  let decoded
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET)
  } catch {
    return res.status(401).json({ status: "failed", message: "refreshToken invalid or expired" })
  }

  const refreshTokenHash =crypto.createHash('sha256').update(refreshToken).digest('hex')

  const session = await db.query('SELECT id from farmer_sessions WHERE refresh_token_hash= $1 AND revoked=$2 AND expires_at > NOW()', [refreshTokenHash, false])

  if(!session.rows[0]){
      return res.status(401).json(
        {
          status: "failed",
          message: "Invalid refresh t0ken"
        }
      )
  }
  const sessionId = session.rows[0].id

  const accessToken =jwt.sign({id: decoded.id, sessionId}, JWT_SECRET, { expiresIn: "15m"})

  const newRotatedRefreshToken = jwt.sign({id:decoded.id}, JWT_SECRET, { expiresIn: "7d", jwtid: crypto.randomUUID() })
  const newRotatedRefreshTokenHash = crypto.createHash('sha256').update(newRotatedRefreshToken).digest('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS)
  await db.query(
    "UPDATE farmer_sessions SET refresh_token_hash = $1, expires_at = $2, last_used_at = NOW() WHERE id=$3",
    [newRotatedRefreshTokenHash, expiresAt, sessionId]
  )

  res.cookie('refreshToken', newRotatedRefreshToken, { ...refreshCookieOptions, maxAge: REFRESH_TOKEN_MS })
  
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

    await db.query("UPDATE farmer_sessions SET revoked = $1, revoked_at = NOW() WHERE refresh_token_hash = $2", [true, refreshTokenHash])
    res.clearCookie("refreshToken", refreshCookieOptions)
    res.status(200).json(
      {
        status: "success",
        message: "Successfully Logged Out"
      }
    )
})



authrouter.route('/login').post( async (req,res,next)=>{
  try {
    const {nic, phone} = req.body || {}
    if (typeof nic !== 'string' || !nic.trim()) {
      return res.status(400).json({ status: 'fail', message: 'NIC is required.' })
    }

    const phoneCheck = validateSriLankanMobile(phone)
    if (!phoneCheck.valid) {
      return res.status(400).json({ status: 'fail', message: phoneCheck.error })
    }

    // Set by /verify-otp for a registered number: the OTP is required to sign in
    const loginKey = `verified-login:${phoneCheck.normalized}`
    if (!await redisClient.get(loginKey)) {
      return res.status(403).json({ status: 'fail', message: 'Verify this phone number with the SMS code before signing in.' })
    }

    function hashNic(Usrnic) {
    if (!process.env.NIC_PEPPER) throw new Error('NIC_PEPPER is not set');
    return crypto
      .createHmac('sha256', process.env.NIC_PEPPER)
      .update(Usrnic)
      .digest('hex');
    }

    const hashedNic = hashNic(nic.trim().toUpperCase())

    const validusr = await db.query(`SELECT ${FARMER_COLUMNS} FROM farmers WHERE phone= $1 AND hashed_nic= $2`, [phoneCheck.normalized, hashedNic])

    if(!validusr.rows[0]){
          return res.status(401).json(
            {
              status: "failed",
              message: "That NIC does not match the one registered with this phone number."
            }
          )
    }
    const farmer = { ...validusr.rows[0], farm: await getFarm(validusr.rows[0].farm_id) }
    const farmer_id = farmer.farmer_id
    const refreshToken = jwt.sign({id: farmer_id}, JWT_SECRET,{expiresIn:"7d", jwtid: crypto.randomUUID()})
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

    
    const ip = req.ip
    const userAgent = req.headers['user-agent'] || 'unknown'
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS)


     const session = await db.query('INSERT INTO farmer_sessions (farmer_id, refresh_token_hash, ip,user_agent,expires_at ) VALUES($1,$2,$3,$4,$5) RETURNING id, family_id, farmer_id, expires_at', [farmer_id, refreshTokenHash, ip,userAgent, expiresAt])


     const accessToken = jwt.sign(
      { id: farmer_id, sessionId: session.rows[0].id },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

     await redisClient.del(loginKey)
     res.cookie("refreshToken", refreshToken , { ...refreshCookieOptions, maxAge: REFRESH_TOKEN_MS })

    res.status(200).json(
      {
          status: "success",
          message: "Logged in Successfully",
          farmer,
          accessToken
      }
    )
  } catch (error) {
    return next(error)
  }
})

module.exports = authrouter
