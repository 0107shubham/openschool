import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateSmartNotes, generateMCQsFromNotes, generateMindMap, SUPPORTED_MODELS } from "@/lib/ai/client";

export const maxDuration = 300; // Extend timeout to 300s (Pro maximum) for reasoning models

export async function POST(req: Request) {
  try {
    const reqBody = await req.json();
    const { 
      materialId, 
      level = "Medium", 
      style = "SSC CGL 2024", 
      modelId, 
      accountIndex = 1,
      generationType = "BOTH", // "BOTH", "NOTES", "MCQS", "ENHANCE", "MINDMAP"
      focus, // Optional specific focus for MCQs or Notes Enhancement
      examType = "SSC",
      refreshNotes = false // New parameter to force regeneration of notes
    } = reqBody;

    // Determine provider and correct API Key
    const model = SUPPORTED_MODELS.find(m => m.id === modelId);
    const provider = model?.provider || "OpenRouter";
    
    let apiKey = "";
    if (accountIndex === 3 || provider === "NVIDIA") {
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

    // 2. CHECK FOR EXISTING NOTES (Recovery Logic)
    let smartNotesData: any = null;
    let savedNotes: any[] = [];
    
    if ((generationType === "MCQS" || generationType === "BOTH") && !refreshNotes) {
      const existingNotesRes = await query(
        `SELECT * FROM "SmartNote" WHERE "materialId" = $1 AND ("examRelevance" = $2 OR "examRelevance" = 'BOTH')`,
        [materialId, examType]
      );
      
      if (existingNotesRes.rows.length > 0) {
        console.log(`Found ${existingNotesRes.rows.length} existing notes for material ${materialId}. Reusing for MCQ generation.`);
        savedNotes = existingNotesRes.rows;
        smartNotesData = {
          notes: existingNotesRes.rows.map(n => ({
            ...n,
            memoryTechnique: typeof n.memoryTechnique === 'string' ? JSON.parse(n.memoryTechnique) : n.memoryTechnique
          })),
          summary: { totalConcepts: existingNotesRes.rows.length } // Minimal summary for MCQ prompt
        };
      }
    }

    // 3. GENERATE NOTES if not found or if specifically requested
    if (!smartNotesData && (generationType === "NOTES" || generationType === "BOTH" || generationType === "MCQS")) {
      console.log(`Generating smart notes for ${examType} with model: ${modelId || 'default'}...`);
      smartNotesData = await generateSmartNotes(material.rawText, modelId, apiKey, focus, style, examType);

      // Save Smart Notes to database ONLY if user didn't request "MCQS Only" 
      // OR if notes were missing for "BOTH" mode
      if (generationType !== "MCQS") {
        for (const note of smartNotesData.notes) {
          const noteId = crypto.randomUUID();
          const now = new Date().toISOString();

          const res = await query(
            `INSERT INTO "SmartNote" (id, "materialId", topic, subtopic, content, "examRelevance", importance, "memoryTechnique", "examTips", "commonMistakes", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
              noteId,
              materialId,
              note.topic,
              note.subtopic || null,
              note.content,
              note.examRelevance,
              note.importance,
              JSON.stringify({
                ...(note.memoryTechnique || {}),
                upscExtra: {
                  background: note.background,
                  pyqAnalysis: note.pyqAnalysis,
                  currentRelevance: note.currentRelevance,
                  analyticalAngles: note.analyticalAngles,
                  valueAddition: note.valueAddition,
                  probableQuestions: note.probableQuestions
                }
              }),
              note.examTips || null,
              note.commonMistakes || null,
              now,
              now
            ]
          );
          savedNotes.push(res.rows[0]);
        }
      }
    }

    // 3.5. HANDLE ENHANCE NOTES
    if (generationType === "ENHANCE") {
       if (!focus) return NextResponse.json({ error: "Focus topic is required for enhancement" }, { status: 400 });

       console.log(`Enhancing notes with focus: "${focus}" and style: "${style}" using model: ${modelId}...`);
       
       // Generate NEW notes based on focus
       const enhancedData = await generateSmartNotes(material.rawText, modelId, apiKey, focus, style, examType);
       
       if (enhancedData && enhancedData.notes.length > 0) {
          // Save NEW notes
          for (const note of enhancedData.notes) {
            const noteId = crypto.randomUUID();
            const now = new Date().toISOString();

            const res = await query(
               `INSERT INTO "SmartNote" (id, "materialId", topic, subtopic, content, "examRelevance", importance, "memoryTechnique", "examTips", "commonMistakes", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
               [
                 noteId,
                 materialId,
                 note.topic,
                 note.subtopic || null,
                 note.content,
                 note.examRelevance,
                 note.importance,
                 JSON.stringify({
                   ...(note.memoryTechnique || {}),
                   upscExtra: {
                     background: note.background,
                     pyqAnalysis: note.pyqAnalysis,
                     currentRelevance: note.currentRelevance,
                     analyticalAngles: note.analyticalAngles,
                     valueAddition: note.valueAddition,
                     probableQuestions: note.probableQuestions
                   }
                 }),
                 note.examTips || null,
                 note.commonMistakes || null,
                 now,
                 now
               ]
             );
             savedNotes.push(res.rows[0]);
          }

          // Use ONLY these new notes for MCQ generation
          smartNotesData = enhancedData; 
       } else {
          return NextResponse.json({ error: "Failed to generate enhanced notes" }, { status: 500 });
       }
    }


    // 3.6. HANDLE MIND MAP
    // 3.6. HANDLE MIND MAP
    if (generationType === "MINDMAP") {
       const mapFormat = reqBody.mapFormat || "MERMAID"; // "MERMAID" or "TEXT"
       console.log(`Generating Mind Map with focus: "${focus || 'Overview'}" using model: ${modelId} in format: ${mapFormat}...`);
       
       const content = await generateMindMap(material.rawText, modelId, apiKey, focus, mapFormat);
       
       if (content) {

          // Save Mind Map to DB
          const mindMapId = crypto.randomUUID();
          await query(
            `INSERT INTO "MindMap" ("id", "materialId", "content", "updatedAt") VALUES ($1, $2, $3, NOW())`,
            [mindMapId, materialId, content]
          );
          
          return NextResponse.json({ 
            success: true, 
            mindMap: { id: mindMapId, content: content } 
          });
       } else {
          return NextResponse.json({ error: "Failed to generate mind map" }, { status: 500 });
       }
    }



    // 4. GENERATE MCQs if requested
    const savedMcqs = [];
    if (generationType === "MCQS" || generationType === "BOTH") {
      // Ensure at least 12 questions, scale up to 1.5x notes for high-density material
      const noteCount = smartNotesData.notes.length;
      const mcqRequirement = Math.max(12, Math.min(30, Math.ceil(noteCount * 1.5)));
      
      console.log(`Generating ${mcqRequirement} ${examType} MCQs (Minimum 12) from ${noteCount} smart notes...`);
      const mcqOutput = await generateMCQsFromNotes(smartNotesData, style, level, mcqRequirement, modelId, apiKey, focus, examType);
      
      const mcqs = Array.isArray(mcqOutput) ? mcqOutput : (mcqOutput.questions || []);
      const trapConcepts = !Array.isArray(mcqOutput) ? (mcqOutput.trapConcepts || []) : [];

      // Save Trap Concepts as special notes
      if (trapConcepts.length > 0) {
        for (const trap of trapConcepts) {
          const noteId = crypto.randomUUID();
          const now = new Date().toISOString();
          const trapContent = `WHY IT'S A TRAP: ${trap.whyItsATrap}\n\nCONCEPTUAL TRUTH: ${trap.correction}`;
          
          await query(
            `INSERT INTO "SmartNote" (id, "materialId", topic, subtopic, content, "examRelevance", importance, "memoryTechnique", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [noteId, materialId, trap.topic || trap.concept || "Exam Trap", "UPSC Exam Trap!", trapContent, "UPSC", 5, JSON.stringify({ type: "warning" }), now, now]
          );
        }
      }

      // Save MCQs to database
      for (const mcq of mcqs) {
        if (!mcq.question || !mcq.options || !Array.isArray(mcq.options) || !mcq.answer) {
          console.warn("Skipping malformed MCQ:", mcq);
          continue;
        }

        const mcqId = crypto.randomUUID();
        const now = new Date().toISOString();

        const res = await query(
          `INSERT INTO "MCQ" (id, "materialId", question, options, answer, explanation, level, "pyqContext", "examRelevance", importance, "sourceNote", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            mcqId,
            materialId,
            mcq.question,
            mcq.options,
            mcq.answer,
            mcq.explanation,
            mcq.level || level,
            mcq.pyqContext || `${style} style question`,
            mcq.examRelevance || examType,
            mcq.importance || null,
            mcq.sourceNote || null,
            now,
            now
          ]
        );
        savedMcqs.push(res.rows[0]);
      }
    }

    return NextResponse.json({ 
      success: true, 
      smartNotes: {
        count: savedNotes.length,
        summary: smartNotesData?.summary || {},
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
