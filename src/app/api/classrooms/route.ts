import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        c.*, 
        COUNT(m.id) as "materialCount"
      FROM "Classroom" c
      LEFT JOIN "Material" m ON c.id = m."classroomId"
      GROUP BY c.id
      ORDER BY c."updatedAt" DESC
    `);
    
    // Transform count to number (Postgres returns bigint as string often)
    const classrooms = res.rows.map(row => ({
      ...row,
      materialCount: parseInt(row.materialCount || '0')
    }));

    return NextResponse.json(classrooms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, subject } = await req.json();
    if (!name || !subject) {
      return NextResponse.json({ error: "Name and Subject are required" }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO "Classroom" (name, subject) VALUES ($1, $2) RETURNING *`,
      [name, subject]
    );

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
