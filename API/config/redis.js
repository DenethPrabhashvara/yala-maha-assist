const Redis = require('ioredis');

const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connected'));

module.exports = client;   