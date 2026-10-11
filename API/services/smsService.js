/**
 * Text.lk SMS Gateway Integration
 */

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

  // Dry run mode prevents spending SMS credits during testing/development
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

module.exports = { sendSms, normalizePhoneNumber }
