require('dotenv').config({ path: './config.env' })
const { sendSms, normalizePhoneNumber } = require('./services/smsService.js')

const args = process.argv.slice(2)
const isLive = args.includes('--live')
const nonFlagArgs = args.filter(a => a !== '--live')

const recipient = nonFlagArgs[0]
const customMessage = nonFlagArgs[1] || 'YalaMaha ALERT: Test SMS from Gateway'

if (!recipient) {
  console.log(`
Usage:
  node test-sms.js <PHONE_NUMBER> [MESSAGE] [--live]

Examples:
  # Safe dry-run test (does not consume credits):
  node test-sms.js 0771234567

  # Live SMS dispatch:
  node test-sms.js 0771234567 --live

  # Custom message:
  node test-sms.js 0771234567 "Hello from Yala Maha Team" --live
`)
  process.exit(1)
}

async function run() {
  console.log('----------------------------------------------------')
  console.log(`Target Phone:      ${recipient} (Normalized: ${normalizePhoneNumber(recipient)})`)
  console.log(`Message:           "${customMessage}"`)
  console.log(`Mode:              ${isLive ? '🔴 LIVE (Sending real SMS)' : '🟢 DRY-RUN (Simulated)'}`)
  console.log('----------------------------------------------------')

  try {
    const result = await sendSms(recipient, customMessage, { forceLive: isLive })
    console.log('Result:\n', JSON.stringify(result, null, 2))
    if (!isLive) {
      console.log('\n💡 Tip: Add "--live" to the end of your command to send a real SMS.')
    } else {
      console.log('\n✅ SMS sent successfully!')
    }
  } catch (err) {
    console.error('\n❌ Error sending SMS:', err.message)
    process.exit(1)
  }
}

run()
