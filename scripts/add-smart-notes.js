const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

async function addSmartNotesSupport() {
  const client = await pool.connect();
  try {
    console.log('Adding SmartNote table and updating MCQ table...');

    await client.query('BEGIN');

    // Add SmartNote table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SmartNote" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "materialId" TEXT NOT NULL REFERENCES "Material"(id) ON DELETE CASCADE,
        topic TEXT NOT NULL,
        subtopic TEXT,
        content TEXT NOT NULL,
        "examRelevance" TEXT NOT NULL,
        importance INTEGER NOT NULL,
        "memoryTechnique" JSONB NOT NULL,
        "examTips" TEXT,
        "commonMistakes" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add indexes for SmartNote
    await client.query(`
      CREATE INDEX IF NOT EXISTS "SmartNote_materialId_examRelevance_idx" 
      ON "SmartNote"("materialId", "examRelevance");
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "SmartNote_materialId_importance_idx" 
      ON "SmartNote"("materialId", importance);
    `);

    // Add new columns to MCQ table if they don't exist
    await client.query(`
      ALTER TABLE "MCQ" 
      ADD COLUMN IF NOT EXISTS "examRelevance" TEXT,
      ADD COLUMN IF NOT EXISTS importance INTEGER,
      ADD COLUMN IF NOT EXISTS "sourceNote" TEXT;
    `);

    // Add indexes for MCQ
    await client.query(`
      CREATE INDEX IF NOT EXISTS "MCQ_materialId_examRelevance_idx" 
      ON "MCQ"("materialId", "examRelevance");
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "MCQ_materialId_importance_idx" 
      ON "MCQ"("materialId", importance);
    `);

    await client.query('COMMIT');
    console.log('✅ SmartNote table and MCQ updates added successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addSmartNotesSupport();
