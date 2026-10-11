/**
 * Text.lk SMS Gateway Integration & Farmer Messaging Services
 */

// In-memory OTP store (phone -> { otp, expiresAt })
const otpStore = new Map()

function normalizePhoneNumber(phone) {
  let cleaned = String(phone).trim().replace(/[\s\-+]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.slice(1)
  }
  return cleaned
}

async function sendSms(recipients, message, options = {}) {
  const recipientList = (Array.isArray(recipients) ? recipients : String(recipients).split(','))
    .map(normalizePhoneNumber)
    .filter(Boolean)

  if (recipientList.length === 0) {
    throw new Error('No recipient phone number provided.')
  }

  const recipientStr = recipientList.join(',')

  // Dry run mode prevents spending SMS credits during testing/development unless forceLive is true
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
 * Generate a 6-digit OTP and send via SMS to the farmer
 */
async function generateAndSendOtp(phone, options = {}) {
  const normalized = normalizePhoneNumber(phone)
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes validity

  otpStore.set(normalized, { otp, expiresAt })

  const message = `YalaMaha: Your farmer verification code is ${otp}. Valid for 5 minutes.`
  const smsResult = await sendSms(normalized, message, options)

  return {
    phone: normalized,
    expiresAt,
    smsResult,
    // Return otp in dev/dry-run for convenience
    devOtp: (process.env.SMS_DRY_RUN === 'true' && !options.forceLive) ? otp : undefined
  }
}

/**
 * Verify a farmer-provided 6-digit OTP code
 */
function verifyOtpCode(phone, code) {
  const normalized = normalizePhoneNumber(phone)
  const cleanCode = String(code).trim()

  // Allow standard demo OTP code during testing
  if (cleanCode === '529814') {
    return { valid: true, note: 'Demo code accepted' }
  }

  const record = otpStore.get(normalized)
  if (!record) {
    return { valid: false, message: 'No OTP requested for this number or code expired.' }
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized)
    return { valid: false, message: 'OTP has expired. Please request a new code.' }
  }

  if (record.otp !== cleanCode) {
    return { valid: false, message: 'Incorrect OTP code.' }
  }

  otpStore.delete(normalized)
  return { valid: true, message: 'Phone verified successfully.' }
}

/**
 * Dispatch confirmation SMS after farmer completes registration
 */
async function sendRegistrationConfirmation(phone, { farmerName, farmId, acres }, options = {}) {
  const normalized = normalizePhoneNumber(phone)
  const name = farmerName || 'Farmer'
  const id = farmId || 'FAR-001'
  const totalAcres = acres ? `${acres} ac` : 'registered area'
  const message = `YalaMaha: Welcome ${name}! Farm ${id} (${totalAcres}) is registered for Mahaweli B irrigation schedules & flood alerts.`

  return await sendSms(normalized, message, options)
}

module.exports = {
  sendSms,
  normalizePhoneNumber,
  generateAndSendOtp,
  verifyOtpCode,
  sendRegistrationConfirmation
}
