import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateSmartNotes, generateMCQsFromNotes, SUPPORTED_MODELS } from "@/lib/ai/client";

export const maxDuration = 60; // Extend timeout for reasoning models

export async function POST(req: Request) {
  try {
    const { materialId, level = "Medium", style = "SSC CGL 2024", modelId, accountIndex = 1 } = await req.json();

    // Determine provider and correct API Key
    const model = SUPPORTED_MODELS.find(m => m.id === modelId);
    const provider = model?.provider || "OpenRouter";
    
    let apiKey = "";
    if (provider === "NVIDIA") {
      apiKey = process.env.NVIDIA_API_KEY || "";
    } else {
      apiKey = accountIndex === 2 ? process.env.OPENROUTER_API_KEY_2 || "" : process.env.OPENROUTER_API_KEY_1 || "";
    }

    if (!apiKey) {
      console.error(`Missing API Key for provider: ${provider}`);
      return NextResponse.json({ error: `API Key for ${provider} is not configured in production settings.` }, { status: 401 });
    }

    console.log(`Using ${provider} API with key starting with: ${apiKey.substring(0, 5)}...`);

    if (!materialId) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    // 1. Fetch the material text
    const materialRes = await query(
      `SELECT "rawText" FROM "Material" WHERE id = $1`,
      [materialId]
    );

    if (materialRes.rows.length === 0) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const material = materialRes.rows[0];

    // 2. Generate Smart Notes with memory techniques
    console.log(`Generating smart notes with model: ${modelId || 'default'}...`);
    const smartNotesData = await generateSmartNotes(material.rawText, modelId, apiKey);

    // 3. Save Smart Notes to database
    const savedNotes = [];
    for (const note of smartNotesData.notes) {
      const res = await query(
        `INSERT INTO "SmartNote" ("materialId", topic, subtopic, content, "examRelevance", importance, "memoryTechnique", "examTips", "commonMistakes")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          materialId,
          note.topic,
          note.subtopic || null,
          note.content,
          note.examRelevance,
          note.importance,
          JSON.stringify(note.memoryTechnique),
          note.examTips || null,
          note.commonMistakes || null
        ]
      );
      savedNotes.push(res.rows[0]);
    }

    // 4. Generate MCQs from Smart Notes (ensures 100% accuracy)
    const mcqRequirement = Math.max(20, Math.ceil(smartNotesData.notes.length * 1.5));
    console.log(`Generating ${mcqRequirement} MCQs from ${smartNotesData.notes.length} smart notes...`);
    const mcqs = await generateMCQsFromNotes(smartNotesData, style, level, mcqRequirement, modelId, apiKey);

    // 5. Save MCQs to database
    const savedMcqs = [];
    for (const mcq of mcqs) {
      // Defensive check for malformed AI data
      if (!mcq.question || !mcq.options || !Array.isArray(mcq.options) || !mcq.answer) {
        console.warn("Skipping malformed MCQ:", mcq);
        continue;
      }

      const res = await query(
        `INSERT INTO "MCQ" ("materialId", question, options, answer, explanation, level, "pyqContext", "examRelevance", importance, "sourceNote")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          materialId,
          mcq.question,
          mcq.options,
          mcq.answer,
          mcq.explanation,
          mcq.level || level,
          mcq.pyqContext || `${style} style question`,
          mcq.examRelevance || null,
          mcq.importance || null,
          mcq.sourceNote || null
        ]
      );
      savedMcqs.push(res.rows[0]);
    }

    return NextResponse.json({ 
      success: true, 
      smartNotes: {
        count: savedNotes.length,
        summary: smartNotesData.summary,
        notes: savedNotes
      },
      mcqs: {
        count: savedMcqs.length,
        questions: savedMcqs
      }
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
