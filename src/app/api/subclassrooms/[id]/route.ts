import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subclassroomId } = await params;

    // Fetch Subclassroom Details
    const subclassroomRes = await query(
      `SELECT * FROM "Subclassroom" WHERE id = $1`,
      [subclassroomId]
    );

    if (subclassroomRes.rows.length === 0) {
      return NextResponse.json({ error: "Subclassroom not found" }, { status: 404 });
    }

    // Fetch Materials with MCQ and SmartNote counts
    const materialsRes = await query(
      `SELECT m.*, 
       (SELECT COUNT(*) FROM "MCQ" q WHERE q."materialId" = m.id) as "mcqCount",
       (SELECT COUNT(*) FROM "MCQ" q WHERE q."materialId" = m.id AND (q."examRelevance" = 'SSC' OR q."examRelevance" = 'BOTH')) as "sscMcqCount",
       (SELECT COUNT(*) FROM "MCQ" q WHERE q."materialId" = m.id AND (q."examRelevance" = 'UPSC' OR q."examRelevance" = 'BOTH')) as "upscMcqCount",
       (SELECT COUNT(*) FROM "SmartNote" n WHERE n."materialId" = m.id) as "notesCount",
       (SELECT COUNT(*) FROM "SmartNote" n WHERE n."materialId" = m.id AND (n."examRelevance" = 'SSC' OR n."examRelevance" = 'BOTH')) as "sscNotesCount",
       (SELECT COUNT(*) FROM "SmartNote" n WHERE n."materialId" = m.id AND (n."examRelevance" = 'UPSC' OR n."examRelevance" = 'BOTH')) as "upscNotesCount"
       FROM "Material" m WHERE "subclassroomId" = $1 ORDER BY subcategory NULLS LAST, "createdAt" DESC`,
      [subclassroomId]
    );

    const materials = materialsRes.rows.map(m =>({
        ...m,
        status: parseInt(m.notesCount) > 0 ? "Analyzed" : (parseInt(m.mcqCount) > 0 ? "MCQs Ready" : "Ready to Analyze")
    }));

    return NextResponse.json({
      subclassroom: subclassroomRes.rows[0],
      materials: materials
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subclassroomId } = await params;
    const { title, content, subcategory } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and Content are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Get classroomId from subclassroom
    const subclassroomRes = await query(
      `SELECT "classroomId" FROM "Subclassroom" WHERE id = $1`,
      [subclassroomId]
    );

    if (subclassroomRes.rows.length === 0) {
      return NextResponse.json({ error: "Subclassroom not found" }, { status: 404 });
    }

    const classroomId = subclassroomRes.rows[0].classroomId;

    // Insert Material
    const res = await query(
      `INSERT INTO "Material" (id, "classroomId", "subclassroomId", title, "pdfUrl", "rawText", subcategory, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, classroomId, subclassroomId, title, "https://mock.url/placeholder.pdf", content, subcategory || null, now, now]
    );

    return NextResponse.json(res.rows[0]);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subclassroomId } = await params;

    // Delete Subclassroom
    // Note: Due to ON DELETE CASCADE, this will automatically delete Materials, SmartNotes, and MCQs.
    const res = await query(
      `DELETE FROM "Subclassroom" WHERE id = $1 RETURNING *`,
      [subclassroomId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Subclassroom not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, subclassroom: res.rows[0] });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subclassroomId } = await params;
    const { name, description } = await req.json();

    if (!name && description === undefined) {
      return NextResponse.json({ error: "At least one field (name or description) is required" }, { status: 400 });
    }

    const updates = [];
    const values = [];
    let queryStr = 'UPDATE "Subclassroom" SET ';

    if (name) {
      values.push(name);
      updates.push(`"name" = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      updates.push(`"description" = $${values.length}`);
    }

    values.push(new Date().toISOString());
    updates.push(`"updatedAt" = $${values.length}`);

    queryStr += updates.join(", ") + ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(subclassroomId);

    const res = await query(queryStr, values);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Subclassroom not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
