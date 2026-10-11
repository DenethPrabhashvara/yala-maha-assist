const dotenv = require('dotenv')

dotenv.config({path: './config.env'})
const app = require('./app.js')



const PORT = 8005
app.listen(PORT, (port) =>{
    console.log("API Started Successfully!!! on", PORT)
})





