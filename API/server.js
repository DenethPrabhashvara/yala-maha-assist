const path = require('path')
const dotenv = require('dotenv')

// Load environment variables reliably from api/config.env and fallback to root .env 
dotenv.config({ path: path.join(__dirname, 'config.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const logger =require('./utils/logger.js')
const app = require('./app.js')

const PORT = process.env.API_PORT || 8005

try{
    app.listen(PORT, () => {
        console.log(`API Started Successfully on port ${PORT}`)
        logger.info(`API Running on PORT ${PORT}`)
    })

} catch(error) {
    logger.error(`Error: ${error}`)
    process.exit(1)
}