const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
    ssl: {
        rejectUnauthorized: false
    },
    // --- Capacity settings for ~800 concurrent users ---
    // App Runner scales to multiple instances; each holds max 20 DB connections.
    // e.g. 8 instances × 20 = 160 total connections — safely within RDS limits.
    max: 20,                     // Max connections per App Runner instance
    min: 2,                      // Keep 2 warm connections ready at all times
    idleTimeoutMillis: 30000,    // Release idle connections after 30s
    connectionTimeoutMillis: 3000, // Fail fast if DB is overloaded (3s timeout)
    allowExitOnIdle: false       // Keep pool alive between requests
});

// Log and recover from pool-level errors (prevents server crash on DB hiccup)
pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};