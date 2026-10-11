const app = require('./app.js')
const PORT = process.env.PORT || 3007


app.listen(PORT, (port)=>{
    console.log("Listening 0n p0rt", PORT)
})


