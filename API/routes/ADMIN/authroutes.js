//ADMIN Auth Routes (mounted at /admin/auth)
const express = require('express')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const db =require('../../config/db.js')
const redisClient = require('../../config/redis.js')
const {
  ADMIN_ROLES, validatePassword, verifyAdminLogin, createAdmin, changeAdminPassword, findAdminById
} = require('../../services/adminService.js')
const { requireAdmin, superAdminOnly, ADMIN_TOKEN_ROLE, ADMIN_TOKEN_AUDIENCE } = require('../../middleware/requireAdmin.js')

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET

const adminauthrouter = express.Router()
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000  //7days
const LOGIN_FAIL_LIMIT = 5
const LOGIN_LOCK_SECONDS = 15 * 60


const REFRESH_COOKIE = 'adminRefreshToken'
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SAMESITE === 'none',
  sameSite: process.env.COOKIE_SAMESITE || 'strict',
  path: '/admin/auth'
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

function signAccessToken(admin, sessionId) {
  return jwt.sign(
    { sub: admin.admin_id, role: ADMIN_TOKEN_ROLE, access: admin.role, sessionId },
    JWT_ADMIN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL, audience: ADMIN_TOKEN_AUDIENCE }
  )
}

function signRefreshToken(adminId) {
  return jwt.sign({ sub: adminId, type: 'admin-refresh' }, JWT_ADMIN_SECRET, {
    expiresIn: '7d', audience: ADMIN_TOKEN_AUDIENCE, jwtid: crypto.randomUUID()
  })
}

const loginFailKey = (username) => `admin-login-fail:${username.toLowerCase()}`

adminauthrouter.post('/login', async (req,res,next)=>{
  try {
    const { username, password } = req.body || {}
    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ status: 'fail', message: 'Username and password are required.' })
    }
    const name = username.trim()

    // Too many wrong passwords for this username: wait before trying again
    const failKey = loginFailKey(name)
    const fails = Number(await redisClient.get(failKey)) || 0
    if (fails >= LOGIN_FAIL_LIMIT) {
      const wait = Math.ceil((await redisClient.ttl(failKey)) / 60)
      return res.status(429).json({ status: 'fail', message: `Too many failed sign-ins. Try again in ${wait} minutes.` })
      }

    const admin = await verifyAdminLogin(name, password)
    if (!admin) {
      await redisClient.multi().incr(failKey).expire(failKey, LOGIN_LOCK_SECONDS).exec()
      return res.status(401).json({ status: 'fail', message: 'Wrong username or password.' })
    }
    await redisClient.del(failKey)

    const refreshToken = signRefreshToken(admin.admin_id)
    const session = await db.query(
      `INSERT INTO admin_sessions (admin_id, refresh_token_hash, ip, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [admin.admin_id, hashToken(refreshToken), req.ip, req.headers['user-agent'] || 'unknown', new Date(Date.now() + REFRESH_TOKEN_MS)]
    )
    await db.query('UPDATE admins SET last_login_at = NOW() WHERE admin_id = $1', [admin.admin_id])

    res.cookie(REFRESH_COOKIE, refreshToken, { ...refreshCookieOptions, maxAge: REFRESH_TOKEN_MS })
    return res.status(200).json({
      status: 'success',
      message: 'Signed in.',
      admin,
      accessToken: signAccessToken(admin, session.rows[0].id)
    })
  }catch(error){
    return next(error)
  }
})

// New access token from the refresh cookie. The refresh token is rotated each time.
adminauthrouter.post('/refresh_token', async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE]
    if(!refreshToken){
      return res.status(401).json({ status: 'fail', message: 'refreshToken not found' })
    }
    try {
      jwt.verify(refreshToken, JWT_ADMIN_SECRET, { audience: ADMIN_TOKEN_AUDIENCE })
    } catch {
      res.clearCookie(REFRESH_COOKIE, refreshCookieOptions)
      return res.status(401).json({ status: 'fail', message: 'refreshToken invalid or expired' })
    }

    const session = await db.query(
      `SELECT s.id, a.admin_id, a.role
       FROM admin_sessions s JOIN admins a ON a.admin_id = s.admin_id
       WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW() AND a.is_active`,
      [hashToken(refreshToken)]
    )
    if (!session.rows[0]) {
      res.clearCookie(REFRESH_COOKIE, refreshCookieOptions)
      return res.status(401).json({ status: 'fail', message: 'Session ended, sign in again.' })
    }
    const { id: sessionId, ...admin } = session.rows[0]

    const newRefreshToken = signRefreshToken(admin.admin_id)
    await db.query(
      `UPDATE admin_sessions SET refresh_token_hash = $2, expires_at = $3, last_used_at = NOW() WHERE id = $1`,
      [sessionId, hashToken(newRefreshToken), new Date(Date.now() + REFRESH_TOKEN_MS)]
    )

    res.cookie(REFRESH_COOKIE, newRefreshToken, { ...refreshCookieOptions, maxAge: REFRESH_TOKEN_MS })
    return res.status(200).json({ status: 'success', accessToken: signAccessToken(admin, sessionId) })
  } catch (error) {
    return next(error)
  }
})

adminauthrouter.post('/logout', async(req, res, next)=>{
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE]
    if (refreshToken) {
      await db.query('UPDATE admin_sessions SET revoked_at = NOW() WHERE refresh_token_hash = $1 AND revoked_at IS NULL', [hashToken(refreshToken)])
    }
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions)
    return res.status(200).json({ status: 'success', message: 'Signed out.' })
  }catch(error){
    return next(error)
  }
})

adminauthrouter.get('/me', requireAdmin, async (req,res, next) => {
  try {
    return res.status(200).json({ status: 'success', admin: await findAdminById(req.admin.admin_id) })
  }catch(error){
    return next(error)
  }
})

adminauthrouter.patch('/password', requireAdmin, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body || {}
    if (typeof current_password !== 'string' || !current_password) {
      return res.status(400).json({ status: 'fail', message: 'current_password is required.' })
    }
    const problem = validatePassword(new_password)
    if (problem) {
      return res.status(400).json({ status: 'fail', message: problem })
        }
    if (!(await changeAdminPassword(req.admin.admin_id, current_password, new_password))) {
      return res.status(401).json({ status: 'fail', message: 'Current password is wrong.' })
    }
    // Sign out every other session of this admin
    await db.query(
      'UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_id = $1 AND id <> $2 AND revoked_at IS NULL',
      [req.admin.admin_id, req.adminSessionId]
    )
    return res.status(200).json({ status: 'success', message: 'Password changed.' })
  } catch (error) {
    return next(error)
  }
})

// Create another admin account (super_admin only)
adminauthrouter.post('/admins', requireAdmin, superAdminOnly, async (req, res, next) => {
  try {
    const { username, password, full_name, role } = req.body || {}
    if ([username, full_name].some(value => typeof value !== 'string' || !value.trim())) {
      return res.status(400).json({ status: 'fail', message: 'username and full_name are required.' })
    }
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username.trim())) {
      return res.status(400).json({ status: 'fail', message: 'username must be 3-40 letters, numbers, dots, dashes or underscores.' })
    }
    if (!ADMIN_ROLES.includes(role)) {
      return res.status(400).json({ status: 'fail', message: `role must be one of: ${ADMIN_ROLES.join(', ')}.` })
    }
    const problem = validatePassword(password)
    if (problem) {
      return res.status(400).json({ status: 'fail', message: problem })
    }
    const admin = await createAdmin({ username: username.trim(), password, full_name: full_name.trim(), role })
    return res.status(201).json({ status: 'success', message: 'Admin created.', data: admin })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ status: 'fail', message: 'An admin with that username already exists.' })
    }
    return next(error)
  }
})



module.exports = adminauthrouter
