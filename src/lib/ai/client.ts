import OpenAI from "openai";
import { SMART_NOTES_PROMPT, MCQ_FROM_NOTES_PROMPT } from "./prompts";

// OpenRouter Supported Models
export const SUPPORTED_MODELS = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", description: "Ultra-fast, massive context", provider: "Google" },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", description: "Excellent instruction following", provider: "Alibaba" },
  { id: "liquid/lfm-2.5-1.2b-thinking:free", name: "Liquid LFM 2.5 (Free)", description: "Reasoning model", provider: "LiquidAI" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)", description: "Google's latest open model", provider: "Google" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 (Free)", description: "Balanced performance", provider: "Mistral" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (Free)", description: "High-speed reasoning", provider: "Z.AI" },
  { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B (Free)", description: "Large scale open model", provider: "OpenAI" },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA Nemotron 3 Nano (Free)", description: "Small but powerful agentic MoE", provider: "NVIDIA" },
];

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

const getAIClient = (apiKey?: string) => {
  return new OpenAI({
    apiKey: apiKey || process.env.OPENROUTER_API_KEY_1,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "OpenSchool AI",
    },
  });
};

/**
 * Clean AI response - strip markdown code blocks and handle potentially malformed JSON
 */
function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  
  // 1. Try to find markdown code blocks
  const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/) || 
                    cleaned.match(/```\s*([\s\S]*?)\s*```/);
  
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // 2. If no backticks, try to find the first '{' or '[' and the last '}' or ']'
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = cleaned.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1).trim();
  }
  
  // 4. Try to strip common conversational prefixes
  cleaned = cleaned.replace(/^(Here is the JSON:|JSON response:|Result:)\s*/i, "");
  
  return cleaned.trim();
}

/**
 * Attempt to repair a truncated JSON string by closing open objects/arrays
 * and fixing unterminated strings.
 */
function repairJson(json: string): string {
  let repaired = json.trim();
  
  // 1. Fix unterminated string if it ends in the middle of one
  // Check if there's an odd number of " in the last line or overall if no newlines
  const lastQuoteIndex = repaired.lastIndexOf('"');
  const beforeLastQuote = repaired.slice(0, lastQuoteIndex);
  const openQuotes = (repaired.match(/"/g) || []).length;
  
  if (openQuotes % 2 !== 0) {
    // String is likely unterminated. Close it.
    repaired += '"';
  }

  // 2. Count open brackets and braces
  const stack: string[] = [];
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (char === '{') stack.push('}');
    else if (char === '[') stack.push(']');
    else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop();
      }
    }
  }

  // 3. Close everything in reverse order
  while (stack.length > 0) {
    const closing = stack.pop();
    // Use regex to remove trailing comma if present (handling spaces/newlines)
    repaired = repaired.replace(/,\s*$/, "");
    repaired += closing;
  }

  // 4. Final check: if it doesn't end with } or ], something is very wrong
  // If it's empty after cleaning, return empty object
  if (!repaired) return "{}";

  return repaired;
}

/**
 * Split text into manageable chunks for AI processing
 * Reduced maxLength to 4000 to ensure AI doesn't hit output limits 
 * while maintaining high granularity.
 */
function chunkText(text: string, maxLength: number = 4000): string[] {
  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    let endPos = currentPos + maxLength;
    if (endPos >= text.length) {
       chunks.push(text.slice(currentPos));
       break;
    }

    // Try to find a good breaking point (newline or period)
    const nextNewline = text.lastIndexOf('\n', endPos);
    if (nextNewline > currentPos + (maxLength * 0.6)) {
       endPos = nextNewline;
    } else {
       const nextPeriod = text.lastIndexOf('. ', endPos);
       if (nextPeriod > currentPos + (maxLength * 0.6)) {
          endPos = nextPeriod + 1;
       }
    }

    chunks.push(text.slice(currentPos, endPos).trim());
    currentPos = endPos;
  }

  return chunks;
}

/**
 * Generate comprehensive smart notes with memory techniques from raw text
 */
export async function generateSmartNotes(text: string, modelId: string = DEFAULT_MODEL, apiKey?: string) {
  const openai = getAIClient(apiKey);
  try {
    const chunks = chunkText(text);
    const allNotes: any[] = [];
    const summary: any = {
      totalConcepts: 0,
      sscRelevant: 0,
      upscRelevant: 0,
      bothRelevant: 0,
      keyTopics: []
    };

    console.log(`Processing material in ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating notes for chunk ${i + 1}/${chunks.length}...`);
      const prompt = SMART_NOTES_PROMPT(chunks[i]);

      const response = await openai.chat.completions.create({
        model: modelId,
        messages: [
          { 
            role: "system", 
            content: "You are an expert educator. You MUST use a natural mix of Hindi (Devanagari script) and English (Hinglish). Technical terms/dates stay in English, but narrative must be in Hindi. Example: 'Evergreen Forests में साल भर पेड़ हरे-भरे रहते हैं क्योंकि ये अपनी leaves एक साथ नहीं झाड़ते।' Return ONLY valid JSON." 
          },
          { role: "user", content: prompt },
        ],
        // Disable JSON mode for free models as many don't support it
        ...(modelId.endsWith(':free') ? {} : { response_format: { type: "json_object" } }),
        temperature: 0.5,
        max_tokens: modelId.endsWith(':free') ? 8000 : 4000, 
      });

      const content = response.choices[0].message.content;
      if (!content) continue;

      let cleanedContent = cleanJsonResponse(content);
      let parsed;
      
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (e) {
        console.warn("JSON Parse failed, attempting repair...");
        const repaired = repairJson(cleanedContent);
        try {
          parsed = JSON.parse(repaired);
        } catch (repairError) {
          console.error("JSON Repair failed. RAW CONTENT FROM AI:");
          console.log("------------------------------------------");
          console.log(content);
          console.log("------------------------------------------");
          continue;
        }
      }

      if (parsed) {
        if (parsed.notes) {
          allNotes.push(...parsed.notes);
        } else if (Array.isArray(parsed)) {
          // If the AI returned just an array of notes
          allNotes.push(...parsed);
        } else {
          console.warn("Parsed JSON does not contain 'notes' array:", parsed);
        }
      }
      
      if (parsed?.summary) {
        summary.totalConcepts += parsed.summary.totalConcepts || 0;
        summary.sscRelevant += parsed.summary.sscRelevant || 0;
        summary.upscRelevant += parsed.summary.upscRelevant || 0;
        summary.bothRelevant += parsed.summary.bothRelevant || 0;
        if (parsed.summary.keyTopics) {
          summary.keyTopics = [...new Set([...summary.keyTopics, ...parsed.summary.keyTopics])];
        }
      }
    }

    return {
      notes: allNotes,
      summary: summary
    };
  } catch (error) {
    console.error("Smart Notes Generation Error:", error);
    throw error;
  }
}

/**
 * Generate MCQs from smart notes (ensures 100% accuracy to source material)
 */
export async function generateMCQsFromNotes(notes: any, style: string, level: string, count: number = 20, modelId: string = DEFAULT_MODEL, apiKey?: string) {
  const openai = getAIClient(apiKey);
  try {
    // Use the count requested by user or default to 20
    const mcqCount = count;
    const notesText = JSON.stringify(notes, null, 2);
    const prompt = MCQ_FROM_NOTES_PROMPT(notesText, style, level, mcqCount);

    console.log(`Generating ${mcqCount} MCQs from notes...`);

    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
          { 
            role: "system", 
            content: "You are a professional exam paper creator. Questions/options must be in Pure English. Explanations MUST be in Hinglish (Hindi Devanagari + English). Example Explanation: 'यह concept simple है: Preamble संविधान की identity card है।' Return ONLY valid JSON." 
          },
        { role: "user", content: prompt },
      ],
      // Disable JSON mode for free models as many don't support it
      // Also disable it if we're expecting a top-level array which some JSON modes don't like
      ...(modelId.endsWith(':free') ? {} : { response_format: { type: "json_object" } }),
      temperature: 0.7,
      max_tokens: modelId.endsWith(':free') ? 8000 : 4000, 
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content received from AI");

    const cleanedContent = cleanJsonResponse(content);
    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.warn("MCQ JSON Parse failed, attempting repair...");
      try {
        const repaired = repairJson(cleanedContent);
        parsed = JSON.parse(repaired);
      } catch (repairError) {
        console.error("MCQ JSON Repair failed. RAW CONTENT FROM AI:");
        console.log("------------------------------------------");
        console.log(content);
        console.log("------------------------------------------");
        throw parseError;
      }
    }

    if (parsed) {
      if (Array.isArray(parsed)) return parsed;
      if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
      if (parsed.mcqs && Array.isArray(parsed.mcqs)) return parsed.mcqs;
      return [];
    }
    return [];
  } catch (error) {
    console.error("MCQ Generation Error:", error);
    throw error;
  }
}

/**
 * Legacy function - generates MCQs directly from text
 */
export async function generateMCQs(text: string, style: string, level: string, count: number = 20) {
  const notes = await generateSmartNotes(text);
  return generateMCQsFromNotes(notes, style, level, count);
}

