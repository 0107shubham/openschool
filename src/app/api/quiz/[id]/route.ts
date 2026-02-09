import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: materialId } = await params;

    // Fetch MCQs for this material
    // We can also fetch by classroomId if we want a cumulative quiz, 
    // but for now let's stick to material-specific or classroom-specific logic.
    // If the ID matches a Material ID, we get material MCQs.
    // If it matches a Classroom ID, we get ALL MCQs for that classroom.
    
    // Check if it's a material
    let mcqRes = await query(
      `SELECT * FROM "MCQ" WHERE "materialId" = $1 ORDER BY "createdAt" DESC`,
      [materialId]
    );

    // If no MCQs found, check if it's a subclassroom ID
    if (mcqRes.rows.length === 0) {
      const subclassroomRes = await query(
        `SELECT id, name, "classroomId" FROM "Subclassroom" WHERE id = $1`,
        [materialId]
      );
      
      if (subclassroomRes.rows.length > 0) {
        const subName = subclassroomRes.rows[0].name;
        const classId = subclassroomRes.rows[0].classroomId;
        mcqRes = await query(`
           SELECT q.* FROM "MCQ" q
           JOIN "Material" m ON q."materialId" = m.id
           WHERE m."subclassroomId" = $1
           ORDER BY RANDOM()
        `, [materialId]);

        return NextResponse.json({ 
          mcqs: mcqRes.rows,
          source: subName,
          type: "Module Quiz",
          classroomId: classId,
          subclassroomId: materialId
        });
      }
    }

    // If still no MCQs, check if it's a classroom ID
    if (mcqRes.rows.length === 0) {
       const classroomMaterialsRes = await query(
         `SELECT id, name FROM "Classroom" WHERE id = $1`,
         [materialId]
       );
       
       if (classroomMaterialsRes.rows.length > 0) {
         const classroomName = classroomMaterialsRes.rows[0].name;
         mcqRes = await query(`
            SELECT q.* FROM "MCQ" q
            JOIN "Material" m ON q."materialId" = m.id
            WHERE m."classroomId" = $1
            ORDER BY RANDOM()
         `, [materialId]);

         return NextResponse.json({ 
           mcqs: mcqRes.rows,
           source: classroomName,
           type: "Classroom Quiz",
           classroomId: materialId
         });
       }
    }

    if (mcqRes.rows.length === 0) {
       return NextResponse.json({ mcqs: [], source: "Unknown", type: "Quiz" });
    }

    // Since we found MCQs directly by materialId, let's get the material title and classroomId
    const materialRes = await query(
      `SELECT title, "classroomId" FROM "Material" WHERE id = $1`,
      [materialId]
    );
    const materialData = materialRes.rows[0];
    const materialTitle = materialData?.title || "Chapter Quiz";
    const classroomId = materialData?.classroomId;

    return NextResponse.json({ 
      mcqs: mcqRes.rows,
      source: materialTitle,
      type: "Chapter Quiz",
      classroomId: classroomId
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
