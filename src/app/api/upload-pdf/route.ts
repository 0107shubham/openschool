import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Set up the worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const classroomId = formData.get("classroomId") as string;
    const title = formData.get("title") as string;
    const startPage = parseInt(formData.get("startPage") as string || "1");
    const endPage = parseInt(formData.get("endPage") as string || "5");

    if (!file || !classroomId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    const totalPages = pdfDocument.numPages;
    const actualEndPage = Math.min(endPage, totalPages);
    const actualStartPage = Math.max(1, startPage);

    if (actualStartPage > totalPages) {
      return NextResponse.json({ 
        error: `Start page ${actualStartPage} exceeds total pages ${totalPages}` 
      }, { status: 400 });
    }

    // Extract text from specified page range
    let extractedText = "";
    
    for (let pageNum = actualStartPage; pageNum <= actualEndPage; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with proper spacing
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      extractedText += pageText + "\n\n";
    }

    extractedText = extractedText.trim();

    if (!extractedText) {
      return NextResponse.json({ 
        error: "No text could be extracted from the selected range." 
      }, { status: 400 });
    }

    // Save to DB
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const res = await query(
      `INSERT INTO "Material" (id, "classroomId", title, "pdfUrl", "rawText", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, classroomId, title, "https://mock.url/memory-processed-file.pdf", extractedText, now, now]
    );

    return NextResponse.json({
      ...res.rows[0],
      metadata: {
        totalPages,
        extractedPages: `${actualStartPage}-${actualEndPage}`,
        textLength: extractedText.length
      }
    });

  } catch (error: any) {
    console.error("PDF Processing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
