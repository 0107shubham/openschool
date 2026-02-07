import { query } from "@/lib/db";

export async function processPdfMaterial(classroomId: string, title: string, pdfUrl: string, rawText: string) {
  try {
    const res = await query(
      `INSERT INTO "Material" ("classroomId", title, "pdfUrl", "rawText")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [classroomId, title, pdfUrl, rawText]
    );
    return res.rows[0];
  } catch (error) {
    console.error("PDF Processing Error:", error);
    throw error;
  }
}
