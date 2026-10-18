const path = require('path')
const dotenv = require('dotenv')

// Load environment variables reliably from api/config.env and fallback to root .env 
dotenv.config({ path: path.join(__dirname, 'config.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = require('./app.js')

const PORT = process.env.PORT || 8005

app.listen(PORT, () => {
    console.log(`API Started Successfully on port ${PORT}`)
})


