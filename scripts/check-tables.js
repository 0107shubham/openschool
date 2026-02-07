require('dotenv').config();
const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
  });
  
  try {
    const res = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:');
    res.rows.forEach(r => console.log('  -', r.table_name));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkTables();
