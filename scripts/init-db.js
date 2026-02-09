const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');

    await client.query('BEGIN');

    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE,
        name TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Classrooms Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Classroom" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Subclassrooms Table (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Subclassroom" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        "classroomId" TEXT NOT NULL REFERENCES "Classroom"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Materials Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Material" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        "pdfUrl" TEXT NOT NULL,
        "rawText" TEXT NOT NULL,
        subcategory TEXT,
        "classroomId" TEXT NOT NULL REFERENCES "Classroom"(id) ON DELETE CASCADE,
        "subclassroomId" TEXT NOT NULL REFERENCES "Subclassroom"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // SmartNotes Table - NEW
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SmartNote" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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

    // Create indexes for SmartNote
    await client.query(`
      CREATE INDEX IF NOT EXISTS "SmartNote_materialId_examRelevance_idx" 
      ON "SmartNote"("materialId", "examRelevance");
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "SmartNote_materialId_importance_idx" 
      ON "SmartNote"("materialId", importance);
    `);

    // MCQs Table - UPDATED with new fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS "MCQ" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "materialId" TEXT NOT NULL REFERENCES "Material"(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options TEXT[] NOT NULL,
        answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        level TEXT DEFAULT 'Medium',
        "pyqContext" TEXT,
        "examRelevance" TEXT,
        importance INTEGER,
        "sourceNote" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for MCQ
    await client.query(`
      CREATE INDEX IF NOT EXISTS "MCQ_materialId_examRelevance_idx" 
      ON "MCQ"("materialId", "examRelevance");
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS "MCQ_materialId_importance_idx" 
      ON "MCQ"("materialId", importance);
    `);

    // UserProgress Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserProgress" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "mcqId" TEXT NOT NULL REFERENCES "MCQ"(id) ON DELETE CASCADE,
        "isCorrect" BOOLEAN NOT NULL,
        "attemptDate" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database schema initialization successful!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error Initializing Database:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();

