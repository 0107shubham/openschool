require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSubclassroomTable() {
  const client = await pool.connect();
  try {
    console.log('Creating Subclassroom table and migrating data...');

    await client.query('BEGIN');

    // 1. Create Subclassroom table
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

    console.log('✅ Created Subclassroom table');

    // 2. Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Subclassroom_classroomId_idx" 
      ON "Subclassroom"("classroomId");
    `);

    console.log('✅ Created index on Subclassroom');

    // 3. Add subclassroomId to Material table (nullable temporarily)
    await client.query(`
      ALTER TABLE "Material" 
      ADD COLUMN IF NOT EXISTS "subclassroomId" TEXT;
    `);

    console.log('✅ Added subclassroomId column to Material');

    // 4. For each classroom, create a default subclassroom and migrate materials
    const classrooms = await client.query('SELECT id, name FROM "Classroom"');
    
    for (const classroom of classrooms.rows) {
      // Create default subclassroom
      const defaultSubclassroom = await client.query(
        `INSERT INTO "Subclassroom" (id, name, description, "classroomId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, 'Auto-migrated from existing classroom', $2, NOW(), NOW())
         RETURNING id`,
        [`General - ${classroom.name}`, classroom.id]
      );

      const subclassroomId = defaultSubclassroom.rows[0].id;

      // Migrate all materials from this classroom to the default subclassroom
      await client.query(
        `UPDATE "Material" 
         SET "subclassroomId" = $1 
         WHERE "classroomId" = $2 AND "subclassroomId" IS NULL`,
        [subclassroomId, classroom.id]
      );

      console.log(`✅ Migrated materials from "${classroom.name}" to default subclassroom`);
    }

    // 5. Now make subclassroomId NOT NULL and add foreign key
    await client.query(`
      ALTER TABLE "Material" 
      ALTER COLUMN "subclassroomId" SET NOT NULL;
    `);

    await client.query(`
      ALTER TABLE "Material" 
      ADD CONSTRAINT "Material_subclassroomId_fkey" 
      FOREIGN KEY ("subclassroomId") 
      REFERENCES "Subclassroom"(id) 
      ON DELETE CASCADE;
    `);

    console.log('✅ Made subclassroomId NOT NULL and added foreign key');

    // 6. Create index on Material.subclassroomId
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Material_subclassroomId_idx" 
      ON "Material"("subclassroomId");
    `);

    console.log('✅ Created index on Material.subclassroomId');

    await client.query('COMMIT');
    console.log('\n🎉 Migration completed successfully!');
    console.log('📝 All existing materials have been moved to default subclassrooms');
    console.log('💡 You can now create new subclassrooms within each classroom');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error during migration:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

addSubclassroomTable();
