require('dotenv').config();
const { Pool } = require('pg');

// Use DATABASE_URL for Postgres, fallback to something empty to prevent crash
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bist-ai',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(255) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        buy_price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        buy_date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("PostgreSQL tabloları başarıyla oluşturuldu/doğrulandı.");
  } catch (err) {
    console.error("PostgreSQL tabloları oluşturulurken hata:", err);
  }
};

initDb();

module.exports = pool;
