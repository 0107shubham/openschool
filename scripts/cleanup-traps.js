const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function removeTraps() {
  try {
    const res = await pool.query('DELETE FROM "SmartNote" WHERE "subtopic" = \'UPSC Exam Trap!\'');
    console.log(`Successfully deleted ${res.rowCount} trap notes.`);
  } catch (err) {
    console.error('Error deleting trap notes:', err);
  } finally {
    await pool.end();
  }
}

removeTraps();
