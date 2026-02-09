import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classroomId } = await params;

    // Fetch Classroom Details
    const classroomRes = await query(
      `SELECT * FROM "Classroom" WHERE id = $1`,
      [classroomId]
    );

    if (classroomRes.rows.length === 0) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    // Fetch Materials with MCQ and SmartNote counts
    const materialsRes = await query(
      `SELECT m.*, 
       (SELECT COUNT(*) FROM "MCQ" q WHERE q."materialId" = m.id) as "mcqCount",
       (SELECT COUNT(*) FROM "SmartNote" n WHERE n."materialId" = m.id) as "notesCount",
       (SELECT COUNT(*) FROM "SmartNote" n WHERE n."materialId" = m.id AND (n."examRelevance" = 'SSC' OR n."examRelevance" = 'BOTH')) as "sscNotesCount",
       (SELECT COUNT(*) FROM "SmartNote" n WHERE n."materialId" = m.id AND (n."examRelevance" = 'UPSC' OR n."examRelevance" = 'BOTH')) as "upscNotesCount"
       FROM "Material" m WHERE "classroomId" = $1 ORDER BY "createdAt" DESC`,
      [classroomId]
    );

    const materials = materialsRes.rows.map(m =>({
        ...m,
        status: parseInt(m.notesCount) > 0 ? "Analyzed" : (parseInt(m.mcqCount) > 0 ? "MCQs Ready" : "Ready to Analyze")
    }));

    return NextResponse.json({
      classroom: classroomRes.rows[0],
      materials: materials
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classroomId } = await params;
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and Content are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert Material
    const res = await query(
      `INSERT INTO "Material" (id, "classroomId", title, "pdfUrl", "rawText", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, classroomId, title, "https://mock.url/placeholder.pdf", content, now, now] // Mock PDF URL for now
    );

    return NextResponse.json(res.rows[0]);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classroomId } = await params;

    // Delete Classroom
    // Note: Due to ON DELETE CASCADE in Prisma/Postgres, 
    // this will automatically delete Materials, SmartNotes, and MCQs.
    const res = await query(
      `DELETE FROM "Classroom" WHERE id = $1 RETURNING *`,
      [classroomId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, classroom: res.rows[0] });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
