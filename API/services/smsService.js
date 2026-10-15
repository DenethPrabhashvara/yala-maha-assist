/**
 * Text.lk SMS Gateway Integration & Farmer Messaging Services
 * ------------------------------------------------------------
 * Features:
 * - Direct carrier integration via Text.lk API v3
 * - Strict Sri Lankan mobile format validation (zero credits wasted on bad numbers)
 * - Anti-Brute-Force & Rate Limiting Guards:
 *     * 60s cooldown per phone number
 *     * Max 4 OTP requests per phone number / hour
 *     * Max 10 OTP requests per IP / 15 minutes
 *     * Max 5 verification attempts before locking OTP
 * - Dry-run toggle to protect SMS credit balance
 */

// In-Memory Rate Limiting & OTP Stores
const otpStore = new Map()       // phone -> { otp, expiresAt, attempts, createdAt }
const cooldownStore = new Map()  // phone -> timestamp
const hourlyStore = new Map()    // phone -> [timestamps]
const ipStore = new Map()        // ip -> [timestamps]

const COOLDOWN_SECONDS = 60
const MAX_HOURLY_REQUESTS = 4
const MAX_VERIFY_ATTEMPTS = 5
const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_IP_REQUESTS_15M = 10

/**
 * Validate Sri Lankan mobile phone numbers strictly
 * Allows: 07XXXXXXXX, +947XXXXXXXX, 947XXXXXXXX, formatted with spaces or dashes
 */
function validateSriLankanMobile(rawPhone) {
  let cleaned = String(rawPhone || '').trim().replace(/[\s\-+]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.slice(1)
  }

  // Sri Lankan Mobile: 94 + (70, 71, 72, 74, 75, 76, 77, 78) + 7 digits = 11 digits
  const mobileRegex = /^94(7[01245678])\d{7}$/
  if (!mobileRegex.test(cleaned)) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Invalid Sri Lankan mobile number. Must be a valid 10-digit mobile (e.g., 077 123 4567).'
    }
  }

  return { valid: true, normalized: cleaned }
}

function normalizePhoneNumber(phone) {
  const result = validateSriLankanMobile(phone)
  return result.normalized
}

/**
 * Check rate limits to prevent credit draining and spam attacks
 */
function checkOtpRateLimit(normalizedPhone, clientIp) {
  const now = Date.now()

  // 1. 60-second cooldown per phone number
  const lastSent = cooldownStore.get(normalizedPhone) || 0
  const elapsedSec = Math.floor((now - lastSent) / 1000)
  if (elapsedSec < COOLDOWN_SECONDS) {
    const wait = COOLDOWN_SECONDS - elapsedSec
    return {
      allowed: false,
      status: 429,
      error: `Please wait ${wait} second${wait === 1 ? '' : 's'} before requesting another OTP.`
    }
  }

  // 2. Max 4 OTP requests per phone number within a rolling hour
  const phoneTimestamps = (hourlyStore.get(normalizedPhone) || [])
    .filter(ts => now - ts < 60 * 60 * 1000)
  if (phoneTimestamps.length >= MAX_HOURLY_REQUESTS) {
    const oldest = phoneTimestamps[0]
    const resetMin = Math.ceil((60 * 60 * 1000 - (now - oldest)) / (60 * 1000))
    return {
      allowed: false,
      status: 429,
      error: `Hourly OTP limit reached (max ${MAX_HOURLY_REQUESTS}/hr). Try again in ${resetMin} minutes.`
    }
  }

  // 3. Per-IP rate limit: max 10 requests per 15 minutes
  if (clientIp) {
    const ipTimestamps = (ipStore.get(clientIp) || [])
      .filter(ts => now - ts < 15 * 60 * 1000)
    if (ipTimestamps.length >= MAX_IP_REQUESTS_15M) {
      return {
        allowed: false,
        status: 429,
        error: 'Too many OTP requests from your network. Please wait a few minutes before trying again.'
      }
    }
  }

  return { allowed: true }
}

/**
 * Record successful OTP dispatch timestamps
 */
function recordOtpSent(normalizedPhone, clientIp) {
  const now = Date.now()
  cooldownStore.set(normalizedPhone, now)

  const phoneHistory = (hourlyStore.get(normalizedPhone) || [])
    .filter(ts => now - ts < 60 * 60 * 1000)
  phoneHistory.push(now)
  hourlyStore.set(normalizedPhone, phoneHistory)

  if (clientIp) {
    const ipHistory = (ipStore.get(clientIp) || [])
      .filter(ts => now - ts < 15 * 60 * 1000)
    ipHistory.push(now)
    ipStore.set(clientIp, ipHistory)
  }
}

/**
 * Dispatch SMS via Text.lk API v3
 */
async function sendSms(recipients, message, options = {}) {
  const recipientList = (Array.isArray(recipients) ? recipients : String(recipients).split(','))
    .map(p => {
      const v = validateSriLankanMobile(p)
      return v.valid ? v.normalized : null
    })
    .filter(Boolean)

  if (recipientList.length === 0) {
    throw new Error('No valid Sri Lankan mobile numbers provided.')
  }

  const recipientStr = recipientList.join(',')
  const isDryRun = options.forceLive ? false : process.env.SMS_DRY_RUN === 'true'

  if (isDryRun) {
    console.log(`[SMS DRY RUN] To: ${recipientStr} | Message: "${message}"`)
    return {
      status: 'success',
      dryRun: true,
      recipient: recipientStr,
      message,
    }
  }

  const token = process.env.TEXTLK_API_TOKEN
  if (!token) {
    throw new Error('TEXTLK_API_TOKEN is not configured.')
  }

  const senderId = process.env.TEXTLK_SENDER_ID || 'TextLKDemo'

  const response = await fetch('https://app.text.lk/api/v3/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      recipient: recipientStr,
      sender_id: senderId,
      type: 'plain',
      message,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`TextLK API error (${response.status}): ${JSON.stringify(data)}`)
  }

  return data
}

/**
 * Generate a 6-digit OTP and send via SMS with Rate Limiting protection
 */
async function generateAndSendOtp(rawPhone, options = {}) {
  // 1. Strict Phone Format Validation
  const phoneCheck = validateSriLankanMobile(rawPhone)
  if (!phoneCheck.valid) {
    const err = new Error(phoneCheck.error)
    err.status = 400
    throw err
  }
  const normalized = phoneCheck.normalized

  // 2. Anti-Brute-Force & Credit Protection Rate Limit Check
  const rateLimit = checkOtpRateLimit(normalized, options.clientIp)
  if (!rateLimit.allowed) {
    const err = new Error(rateLimit.error)
    err.status = rateLimit.status || 429
    throw err
  }

  // 3. Generate 6-digit OTP code & 5-minute TTL
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = Date.now() + OTP_TTL_MS

  otpStore.set(normalized, {
    otp,
    expiresAt,
    attempts: 0,
    createdAt: Date.now()
  })

  // 4. Record usage in rate limiters
  recordOtpSent(normalized, options.clientIp)

  // 5. Send clean, prominent OTP message
  const message = `Yala-Maha Verification: Your OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`
  const smsResult = await sendSms(normalized, message, options)

  console.log(`[OTP DISPATCH] To: ${normalized} | Code: [${otp}] | Delivery: ${smsResult.status || 'OK'}`)

  return {
    phone: normalized,
    expiresAt,
    cooldownSeconds: COOLDOWN_SECONDS,
    smsResult,
    devOtp: (process.env.SMS_DRY_RUN === 'true' && !options.forceLive) ? otp : undefined
  }
}

/**
 * Verify a farmer-provided 6-digit OTP code with max-attempt protection
 */
function verifyOtpCode(rawPhone, rawCode) {
  const phoneCheck = validateSriLankanMobile(rawPhone)
  if (!phoneCheck.valid) {
    return { valid: false, status: 400, message: phoneCheck.error }
  }
  const normalized = phoneCheck.normalized
  const cleanCode = String(rawCode || '').trim()

  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return { valid: false, status: 400, message: 'OTP must be a 6-digit numeric code.' }
  }

  // Demo fallback code for offline/dry-run testing
  if (process.env.SMS_DRY_RUN === 'true' && cleanCode === '529814') {
    return { valid: true, message: 'Demo OTP accepted.' }
  }

  const record = otpStore.get(normalized)
  if (!record) {
    return {
      valid: false,
      status: 400,
      message: 'No active OTP found for this number or code has expired. Please request a new code.'
    }
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized)
    return { valid: false, status: 400, message: 'OTP code has expired. Please request a new code.' }
  }

  // Brute-force protection: Lock out after MAX_VERIFY_ATTEMPTS
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalized)
    return {
      valid: false,
      status: 403,
      message: 'Maximum verification attempts exceeded. For security, this OTP code has been locked. Please request a new one.'
    }
  }

  if (record.otp !== cleanCode) {
    record.attempts += 1
    const remaining = MAX_VERIFY_ATTEMPTS - record.attempts
    if (remaining <= 0) {
      otpStore.delete(normalized)
      return {
        valid: false,
        status: 403,
        message: 'Maximum verification attempts reached. This OTP has been cancelled. Please request a new code.'
      }
    }
    return {
      valid: false,
      status: 400,
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    }
  }

  // Successful verification -> delete to prevent reuse
  otpStore.delete(normalized)
  return { valid: true, message: 'Phone verified successfully.' }
}

/**
 * Dispatch confirmation SMS after farmer completes registration
 */
async function sendRegistrationConfirmation(phone, { farmerName, farmId, acres }, options = {}) {
  const phoneCheck = validateSriLankanMobile(phone)
  if (!phoneCheck.valid) {
    throw new Error(phoneCheck.error)
  }
  const normalized = phoneCheck.normalized
  const name = farmerName || 'Farmer'
  const id = farmId || 'FAR-001'
  const totalAcres = acres ? `${acres} ac` : 'registered area'
  const message = `YalaMaha: Welcome ${name}! Farm ${id} (${totalAcres}) is registered for Mahaweli B irrigation schedules & flood alerts.`

  return await sendSms(normalized, message, options)
}

module.exports = {
  sendSms,
  normalizePhoneNumber,
  validateSriLankanMobile,
  generateAndSendOtp,
  verifyOtpCode,
  sendRegistrationConfirmation
}
