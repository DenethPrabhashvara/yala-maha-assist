const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.APIDBUSERN || process.env.DB_USER || 'postgres',
    password: process.env.APIDBPASSWORD || process.env.DB_PASSWORD || 'postgres',
    host: process.env.APIDBHOST || process.env.DB_HOST || 'localhost',
    database: process.env.APIDATABASE || process.env.DB_NAME || 'yala-maha-api',
    port: Number(process.env.APIDBPORT || process.env.DB_PORT || 5432)
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};