import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;

    if (!materialId) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    // Delete the material. 
    // Associated SmartNotes and MCQs will be deleted via ON DELETE CASCADE in the DB.
    const res = await query(
      `DELETE FROM "Material" WHERE id = $1 RETURNING *`,
      [materialId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Material deleted successfully",
      material: res.rows[0]
    });

  } catch (error: any) {
    console.error("Delete Material API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const { title, subcategory } = await req.json();

    if (!title && subcategory === undefined) {
      return NextResponse.json({ error: "At least one field (title or subcategory) is required" }, { status: 400 });
    }

    const updates = [];
    const values = [];
    let queryStr = 'UPDATE "Material" SET ';

    if (title) {
      values.push(title);
      updates.push(`"title" = $${values.length}`);
    }
    if (subcategory !== undefined) {
      values.push(subcategory);
      updates.push(`"subcategory" = $${values.length}`);
    }

    values.push(new Date().toISOString());
    updates.push(`"updatedAt" = $${values.length}`);

    queryStr += updates.join(", ") + ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(materialId);

    const res = await query(queryStr, values);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error("Update Material API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
