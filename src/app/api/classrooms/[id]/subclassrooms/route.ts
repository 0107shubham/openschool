import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classroomId } = await params;

    // Fetch Subclassrooms with material counts
    const subclassroomsRes = await query(
      `SELECT s.*, 
       (SELECT COUNT(*) FROM "Material" m WHERE m."subclassroomId" = s.id) as "materialCount"
       FROM "Subclassroom" s 
       WHERE "classroomId" = $1 
       ORDER BY s."createdAt" DESC`,
      [classroomId]
    );

    return NextResponse.json(subclassroomsRes.rows);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classroomId } = await params;
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const res = await query(
      `INSERT INTO "Subclassroom" (id, name, description, "classroomId", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [id, name, description || null, classroomId, now, now]
    );

    return NextResponse.json(res.rows[0]);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
