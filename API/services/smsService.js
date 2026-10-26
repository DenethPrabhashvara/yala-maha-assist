/**
 * Text.lk SMS Gateway Integration & Farmer Messaging Services
 * ------------------------------------------------------------
 * Features:
 * - Direct carrier integration via Text.lk API v3
 * - Strict Sri Lankan mobile format validation (zero credits wasted on bad numbers)
 * - Dry-run toggle to protect SMS credit balance
 */

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
      error: 'Invalid mobile number. Must be a valid 10-digit mobile (e.g. :  077 123 4567).'
    }
  }

  return { valid: true, normalized: cleaned }
}

function normalizePhoneNumber(phone) {
  const result = validateSriLankanMobile(phone)
  return result.normalized
}

/**
 * Dispatch SMS via Text.lk API v3
 */
async function sendSms(recipients, message, options = {}) {
  const firstRecipient = (Array.isArray(recipients) ? recipients[0] : recipients)
    ?.toString()
    .split(',')[0]    //prevent one OTP getting sent to multiple nums IMPORTNT Logic
  const recipientCheck = validateSriLankanMobile(firstRecipient)

  if (!recipientCheck.valid) {
    throw new Error('No valid Sri Lankan mobile numbers provided.')
  }

  const recipientStr = recipientCheck.normalized
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
       throw new Error(`Message API error (${response.status}): ${JSON.stringify(data)}`)
  }

  return data
}

/**
 * Dispatch confirmation SMS after farmer completes registration
 */

async function sendRegistrationConfirmation(phone, { farmerName, acres }, options = {}) {
  const phoneCheck = validateSriLankanMobile(phone)
  if (!phoneCheck.valid) {
    throw new Error(phoneCheck.error)
  }
  const normalized = phoneCheck.normalized
  const name = farmerName || 'Farmer'
  const totalAcres = acres ? `${acres} ac` : 'registered area'
  const message = `YalaMahaAssist: Welcome ${name}! Farm of land (${totalAcres}) acres is registered for irrigation schedules & flood alerts.`

  return await sendSms(normalized, message, options)
}

module.exports = {
  sendSms,
  normalizePhoneNumber,
  validateSriLankanMobile,
  sendRegistrationConfirmation
}
