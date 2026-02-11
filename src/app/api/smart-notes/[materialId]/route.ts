import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ materialId: string }> }) {
  try {
    const { materialId } = await params;
    const url = new URL(req.url);
    const examFilter = url.searchParams.get("exam"); // SSC, UPSC, or BOTH

    // Build query with optional exam filter
    let sqlQuery = `
      SELECT * FROM "SmartNote" 
      WHERE "materialId" = $1
    `;
    const sqlParams: any[] = [materialId];

    if (examFilter && ["SSC", "UPSC", "BOTH"].includes(examFilter.toUpperCase())) {
      sqlQuery += ` AND ("examRelevance" = $2 OR "examRelevance" = 'BOTH')`;
      sqlParams.push(examFilter.toUpperCase());
    }

    sqlQuery += ` ORDER BY importance DESC, topic ASC`;

    const notesRes = await query(sqlQuery, sqlParams);

    // Fetch Mind Maps
    const mindMapsRes = await query(
      `SELECT * FROM "MindMap" WHERE "materialId" = $1 ORDER BY "createdAt" DESC`,
      [materialId]
    );

    // Calculate summary
    const allNotes = notesRes.rows;
    const summary = {
      total: allNotes.length,
      sscCount: allNotes.filter((n: any) => n.examRelevance === "SSC" || n.examRelevance === "BOTH").length,
      upscCount: allNotes.filter((n: any) => n.examRelevance === "UPSC" || n.examRelevance === "BOTH").length,
      highPriority: allNotes.filter((n: any) => n.importance >= 4).length,
    };

    // Group by topic
    const byTopic: Record<string, any[]> = {};
    allNotes.forEach((note: any) => {
      if (!byTopic[note.topic]) {
        byTopic[note.topic] = [];
      }
      byTopic[note.topic].push({
        ...note,
        memoryTechnique: typeof note.memoryTechnique === 'string' 
          ? JSON.parse(note.memoryTechnique) 
          : note.memoryTechnique
      });
    });

    return NextResponse.json({
      notes: allNotes.map((n: any) => ({
        ...n,
        memoryTechnique: typeof n.memoryTechnique === 'string' 
          ? JSON.parse(n.memoryTechnique) 
          : n.memoryTechnique
      })),
      mindMaps: mindMapsRes.rows,
      byTopic,
      summary
    });

  } catch (error: any) {
    console.error("Smart Notes API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ materialId: string }> }) {
  try {
    const { materialId } = await params;
    const { topic, subtopic, content, examRelevance, importance } = await req.json();

    if (!topic || !content) {
      return NextResponse.json({ error: "Topic and content are required" }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO "SmartNote" 
       ("id", "topic", "subtopic", "content", "materialId", "examRelevance", "importance", "memoryTechnique", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        crypto.randomUUID(),
        topic,
        subtopic || "",
        content,
        materialId,
        examRelevance || "BOTH",
        importance || 3,
        JSON.stringify({}),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error("Manual Note Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
