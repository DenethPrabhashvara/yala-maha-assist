// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Load .env if present
try {
  process.loadEnvFile?.();
} catch (e) {
  // Ignore if .env does not exist or already loaded
}

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
// For local testing, you can use your Account SID and Auth token
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = twilio(apiKey, apiSecret, { accountSid: accountSid });

async function createCall() {
  const call = await client.calls.create({
    from: "+13202387222",
    to: "+94774817583",
    twiml: "<Response><Say>Ahoy,hello my name is induwara</Say></Response>",
  });

  console.log(call.sid);
}

createCall();