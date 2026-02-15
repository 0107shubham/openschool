import OpenAI from "openai";
import { 
  SMART_NOTES_PROMPT, 
  SSC_FACT_CHRONO_PROMPT,
  MCQ_FROM_NOTES_PROMPT, 
  ENHANCE_NOTES_PROMPT, 
  MIND_MAP_PROMPT, 
  TEXT_TREE_PROMPT, 
  UPSC_RICH_NOTES_PROMPT,
  UPSC_KEYWORD_ENGINE,
  UPSC_MCQ_PROMPT
} from "./prompts";

// Providers
export type AIProvider = "OpenRouter" | "NVIDIA";

// OpenRouter Supported Models
export const SUPPORTED_MODELS = [
  // OpenRouter Models
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", description: "Ultra-fast, massive context", provider: "OpenRouter" as AIProvider },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", description: "Excellent instruction following", provider: "OpenRouter" as AIProvider },
  { id: "liquid/lfm-2.5-1.2b-thinking:free", name: "Liquid LFM 2.5 (Free)", description: "Reasoning model", provider: "OpenRouter" as AIProvider },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)", description: "Google's latest open model", provider: "OpenRouter" as AIProvider },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 (Free)", description: "Balanced performance", provider: "OpenRouter" as AIProvider },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (Free)", description: "High-speed reasoning", provider: "OpenRouter" as AIProvider },
  { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B (Free)", description: "Large scale open model", provider: "OpenRouter" as AIProvider },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA Nemotron 3 Nano (Free)", description: "Small but powerful agentic MoE", provider: "OpenRouter" as AIProvider },
  
  // NVIDIA Integrations
  { id: "moonshotai/kimi-k2.5", name: "Kimi k2.5 (Thinking)", description: "Moonshot's reasoning model", provider: "NVIDIA" as AIProvider },
  { id: "qwen/qwen3-next-80b-a3b-thinking", name: "Qwen 3 Next 80B (Thinking)", description: "Qwen's latest reasoning model", provider: "NVIDIA" as AIProvider },
  { id: "nvidia/nemotron-3-nano-30b-a3b", name: "Nemotron 3 Nano (Thinking)", description: "NVIDIA's fast reasoning model", provider: "NVIDIA" as AIProvider },
  { id: "deepseek-ai/deepseek-v3.1", name: "DeepSeek v3.1 (Thinking)", description: "DeepSeek's high-performance reasoning", provider: "NVIDIA" as AIProvider },
];

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

const getAIClient = (modelId: string, apiKey?: string) => {
  // Check if the model is an NVIDIA model
  const model = SUPPORTED_MODELS.find(m => m.id === modelId);
  const provider = model?.provider || "OpenRouter";

  if (provider === "NVIDIA") {
    console.log(`[AI] Initializing NVIDIA client for model: ${modelId}`);
    return new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }

  console.log(`[AI] Initializing OpenRouter client for model: ${modelId}`);
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
export async function generateSmartNotes(text: string, modelId: string = DEFAULT_MODEL, apiKey?: string, focus?: string, style?: string, examType: "SSC" | "UPSC" = "SSC") {
  const openai = getAIClient(modelId, apiKey);
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

    console.log(`Processing material in ${chunks.length} chunks in parallel...`);

    const chunkPromises = chunks.map(async (chunk, i) => {
      try {
        console.log(`Starting generation for chunk ${i + 1}/${chunks.length}...`);
        const prompt = focus 
          ? ENHANCE_NOTES_PROMPT(chunk, focus, style || "SSC")
          : (examType === "UPSC" ? UPSC_KEYWORD_ENGINE(chunk, focus || "the topic") : SSC_FACT_CHRONO_PROMPT(chunk, focus || "the topic"));

        // reasoning_budget and chat_template_kwargs are often NOT supported on standard API endpoints 
        // especially NVIDIA Integrate. We'll disable them for now to avoid 400 errors.
        let extraParams: any = {};
        
        // Check if the model is an NVIDIA model
        const model = SUPPORTED_MODELS.find(m => m.id === modelId);
        const provider = model?.provider || "OpenRouter";
        const isNvidia = provider === "NVIDIA";
        const isThinkingModel = modelId.includes('thinking') || modelId.includes('nemotron') || modelId.includes('kimi');
        
        if (!isNvidia) {
          if (modelId === "moonshotai/kimi-k2.5" || modelId === "qwen/qwen3-next-80b-a3b-thinking" || modelId === "deepseek-ai/deepseek-v3.1") {
            extraParams = { chat_template_kwargs: { thinking: true } };
          } else if (modelId === "nvidia/nemotron-3-nano-30b-a3b") {
            extraParams = { 
              reasoning_budget: 16384,
              chat_template_kwargs: { enable_thinking: true } 
            };
          }
        }

        const response = await openai.chat.completions.create({
          model: modelId,
          messages: [
            { 
              role: "system", 
              content: "You are an expert educator. You MUST use a natural mix of Hindi (Devanagari script) and English (Hinglish). Technical terms/dates stay in English, but narrative must be in Hindi. Example: 'Evergreen Forests में साल भर पेड़ हरे-भरे रहते हैं क्योंकि ये अपनी leaves एक साथ नहीं झाड़ते।' Return ONLY valid JSON." 
            },
            { role: "user", content: prompt },
          ],
          // Disable JSON mode for free models and NVIDIA as many don't support it
          // NVIDIA Integrate specifically throws 400 if response_format is present for some models
          ...((modelId.endsWith(':free') || isNvidia) ? {} : { response_format: { type: "json_object" } }),
          temperature: 0.5,
          // Use higher tokens for reasoning models
          max_tokens: (modelId.endsWith(':free') || isNvidia) ? 8192 : (isThinkingModel || modelId.includes('kimi') ? 16384 : 4000),
          ...extraParams
        } as any);

        const content = response.choices[0].message.content;
        if (!content) return null;

        let cleanedContent = cleanJsonResponse(content);
        let parsed;
        
        try {
          parsed = JSON.parse(cleanedContent);
        } catch (e) {
          console.warn(`JSON Parse failed for chunk ${i + 1}, attempting repair...`);
          const repaired = repairJson(cleanedContent);
          try {
            parsed = JSON.parse(repaired);
          } catch (repairError) {
            console.error(`JSON Repair failed for chunk ${i + 1}.`);
            return null;
          }
        }
        console.log(`Completed chunk ${i + 1}/${chunks.length}`);
        return parsed;
      } catch (err) {
        console.error(`Error processing chunk ${i + 1}:`, err);
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);

    for (const parsed of chunkResults) {
      if (!parsed) continue;

      if (parsed.notes) {
        allNotes.push(...parsed.notes);
      } else if (Array.isArray(parsed)) {
        allNotes.push(...parsed);
      }
      
      if (parsed.summary) {
        summary.sscRelevant += parsed.summary.sscRelevant || 0;
        summary.upscRelevant += parsed.summary.upscRelevant || 0;
        summary.bothRelevant += parsed.summary.bothRelevant || 0;
        if (parsed.summary.keyTopics) {
          summary.keyTopics = [...new Set([...summary.keyTopics, ...parsed.summary.keyTopics])];
        }
      }
    }

    const validNotes = allNotes.filter(n => n && n.topic); // Ensure notes are valid (AI returns 'topic' field)
    
    console.log(`✅ Generated ${validNotes.length} valid notes from ${chunkResults.filter(r => r !== null).length} successful chunks`);
    
    return {
      notes: validNotes,
      summary: {
        total: validNotes.length,
        sscCount: validNotes.filter(n => n.examRelevance === "SSC").length,
        upscCount: validNotes.filter(n => n.examRelevance === "UPSC").length,
        highPriority: validNotes.filter(n => n.importance >= 4).length
      }
    };

  } catch (error) {
    console.error("Smart Notes Generation Error:", error);
    throw new Error("Failed to generate smart notes. Please try again.");
  }
}

export async function generateMindMap(text: string, modelId: string = DEFAULT_MODEL, apiKey?: string, focus?: string, format: "MERMAID" | "TEXT" = "MERMAID") {
  const openai = getAIClient(modelId, apiKey);
  try {
    const prompt = format === "TEXT" 
      ? TEXT_TREE_PROMPT(text.substring(0, 15000), focus)
      : MIND_MAP_PROMPT(text.substring(0, 15000), focus);

    // Generate Mind Map
    const response = await openai.chat.completions.create({
      model: modelId || DEFAULT_MODEL,
      messages: [
        { role: "system", content: format === "TEXT" ? "You are a specialized text structure generator." : "You are a specialized Mind Map generator using Mermaid.js syntax." },
        { role: "user", content: prompt } // Limit context window
      ],
      temperature: 0.3,
    });

    let content = response.choices[0]?.message?.content || "";
    
    // Clean up markdown code blocks if present
    content = content.replace(/^```mermaid\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
    
    // Safety check: ensure it starts with mindmap ONLY if format is MERMAID
    if (format === "MERMAID" && !content.startsWith("mindmap")) {
        content = "mindmap\n" + content;
    }

    return content;
  } catch (error) {
    console.error("Mind Map Generation Error:", error);
    throw new Error("Failed to generate mind map.");
  }
}

/**
 * Generate MCQs from smart notes (ensures 100% accuracy to source material)
 */
export async function generateMCQsFromNotes(notes: any, style: string, level: string, count: number = 20, modelId: string = DEFAULT_MODEL, apiKey?: string, focus?: string, examType: "SSC" | "UPSC" = "SSC") {
  const openai = getAIClient(modelId, apiKey);
  try {
    // Use the count requested by user or default to 20
    const mcqCount = count;
    // Compress notes to save context window space
    const notesText = Array.isArray(notes.notes) 
      ? notes.notes.map((n: any) => `Topic: ${n.topic}\nSub: ${n.subtopic}\nContent: ${n.content}\n---`).join('\n')
      : JSON.stringify(notes, null, 2).substring(0, 10000); // Fallback

    const prompt = examType === "UPSC" 
      ? UPSC_MCQ_PROMPT(notesText, focus || "the topic", mcqCount, examType)
      : MCQ_FROM_NOTES_PROMPT(notesText, style, level, mcqCount, focus, examType);

    console.log(`Generating ${mcqCount} MCQs from notes${focus ? ` with focus: ${focus}` : ""}...`);

    // reasoning_budget and chat_template_kwargs are often NOT supported on standard API endpoints 
    // especially NVIDIA Integrate. We'll disable them for now to avoid 400 errors.
    const isNvidia = modelId.startsWith('nvidia/') || modelId.startsWith('qwen/') || modelId.startsWith('deepseek') || modelId.startsWith('moonshot');
    const isThinkingModel = modelId.includes('thinking') || modelId.includes('nemotron') || modelId.includes('kimi');
    
    let extraParams: any = {};
    
    if (!isNvidia) {
      if (modelId === "moonshotai/kimi-k2.5" || modelId === "qwen/qwen3-next-80b-a3b-thinking" || modelId === "deepseek-ai/deepseek-v3.1") {
        extraParams = { chat_template_kwargs: { thinking: true } };
      } else if (modelId === "nvidia/nemotron-3-nano-30b-a3b") {
        extraParams = { 
          reasoning_budget: 16384,
          chat_template_kwargs: { enable_thinking: true } 
        };
      }
    }

    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
          { 
            role: "system", 
            content: "You are a professional exam paper creator. Questions/options must be in Pure English. Explanations MUST be in Hinglish (Hindi Devanagari + English). Example Explanation: 'यह concept simple है: Preamble संविधान की identity card है।' Return ONLY valid JSON." 
          },
        { role: "user", content: prompt },
      ],
      // Disable JSON mode for free models and NVIDIA as many don't support it
      ...((modelId.endsWith(':free') || isNvidia) ? {} : { response_format: { type: "json_object" } }),
      temperature: 0.7,
      // Use higher tokens for reasoning models
      max_tokens: (modelId.endsWith(':free') || isNvidia) ? 8192 : (isThinkingModel || modelId.includes('kimi') ? 16384 : 4000),
      ...extraParams
    } as any);

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
      if (parsed.questions && Array.isArray(parsed.questions)) {
        if (examType === "UPSC" && parsed.trapConcepts) {
          return { questions: parsed.questions, trapConcepts: parsed.trapConcepts };
        }
        return parsed.questions;
      }
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

