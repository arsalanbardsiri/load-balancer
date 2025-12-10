const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    database: process.env.POSTGRES_DB
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
