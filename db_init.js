require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    database: process.env.POSTGRES_DB
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address_street VARCHAR(100),
    address_city VARCHAR(50),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),
    phone_number TEXT[]
);
`;

const seedDataQuery = `
INSERT INTO users (first_name, last_name, address_street, address_city, address_state, address_zip, phone_number)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;
`;

const userData = [
    'John', 'Doe', '21 2nd Street', 'New York', 'NY', '10021', ['212 555-1234', '646 555-4567']
];

async function initDB() {
    try {
        await pool.connect();
        console.log('Connected to database.');

        // Create table
        await pool.query(createTableQuery);
        console.log('Table "users" created successfully.');

        // Seed data
        const res = await pool.query(seedDataQuery, userData);
        console.log('Data seeded successfully:', res.rows[0]);

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await pool.end();
    }
}

initDB();
