const { Pool } = require('pg');


const pool = new Pool({
    user:process.env.APIDBUSERN,
    password:process.env.APIDBPASSWORD,
    host:process.env.APIDBHOST,
    database:process.env.APIDATABASE,
    port:process.env.APIDBPORT
})


module.exports = { query: (text, params) => pool.query(text, params) };