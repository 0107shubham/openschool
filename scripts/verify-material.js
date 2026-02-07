require('dotenv').config();
const { Pool } = require('pg');

async function verifyMaterial(materialId) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
  });
  
  try {
    console.log(`Checking Material ID: ${materialId}`);
    
    // Check Material
    const materialRes = await pool.query('SELECT * FROM "Material" WHERE id = $1', [materialId]);
    if (materialRes.rows.length === 0) {
      console.log('❌ Material not found.');
      return;
    }
    const material = materialRes.rows[0];
    console.log('✅ Material found:', {
      id: material.id,
      title: material.title,
      status: material.status,
      createdAt: material.createdAt
    });

    // Check SmartNotes
    const notesRes = await pool.query('SELECT COUNT(*) FROM "SmartNote" WHERE "materialId" = $1', [materialId]);
    console.log(`📊 SmartNotes count: ${notesRes.rows[0].count}`);

    // Check MCQs
    const mcqsRes = await pool.query('SELECT COUNT(*) FROM "MCQ" WHERE "materialId" = $1', [materialId]);
    console.log(`📊 MCQs count: ${mcqsRes.rows[0].count}`);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

const materialId = process.argv[2] || "e843f064-d3ac-4274-87fe-59024e0401a6";
verifyMaterial(materialId);
