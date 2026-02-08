
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Mind Map ID is required" }, { status: 400 });
    }

    await query(
      `DELETE FROM "MindMap" WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true, message: "Mind Map deleted" });

  } catch (error: any) {
    console.error("Delete Mind Map Error:", error);
    return NextResponse.json({ error: "Failed to delete mind map" }, { status: 500 });
  }
}
