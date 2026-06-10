import pool from '../api/database.js';

async function main() {
  try {
    const users = await pool.query('SELECT * FROM users');
    console.log("Users:", users.rows);
    
    const portfolios = await pool.query('SELECT * FROM portfolios');
    console.log("Portfolios:", portfolios.rows);
  } catch (err) {
    console.error("DB Query Error:", err);
  } finally {
    pool.end();
  }
}

main();
