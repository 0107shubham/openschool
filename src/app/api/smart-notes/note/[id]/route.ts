import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: noteId } = await params;
    const { topic, content, subtopic } = await req.json();

    if (!topic && !content && subtopic === undefined) {
      return NextResponse.json({ error: "At least one field is required" }, { status: 400 });
    }

    const updates = [];
    const values = [];
    let queryStr = 'UPDATE "SmartNote" SET ';

    if (topic) {
      values.push(topic);
      updates.push(`"topic" = $${values.length}`);
    }
    if (content) {
      values.push(content);
      updates.push(`"content" = $${values.length}`);
    }
    if (subtopic !== undefined) {
      values.push(subtopic);
      updates.push(`"subtopic" = $${values.length}`);
    }

    values.push(new Date().toISOString());
    updates.push(`"updatedAt" = $${values.length}`);

    queryStr += updates.join(", ") + ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(noteId);

    const res = await query(queryStr, values);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Smart Note not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: noteId } = await params;
    const res = await query('DELETE FROM "SmartNote" WHERE id = $1 RETURNING *', [noteId]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
