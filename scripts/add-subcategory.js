require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSubcategory() {
  const client = await pool.connect();
  try {
    console.log('Adding subcategory column to Material table...');

    await client.query('BEGIN');

    // Add subcategory column (nullable for backward compatibility)
    await client.query(`
      ALTER TABLE "Material" 
      ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT NULL;
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Material_subcategory_idx" 
      ON "Material"(subcategory);
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully added subcategory column!');
    console.log('✅ Created index for subcategory queries');
    console.log('📝 Existing materials will have subcategory = null (backward compatible)');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding subcategory:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addSubcategory();
