export const SMART_NOTES_PROMPT = (text: string) => `
You are an Expert Educator generating EXHAUSTIVE smart notes strictly from the SOURCE MATERIAL.

CRITICAL RULES:
1. STRICT CONTEXT: Use ONLY provided data. Add missing SSC/UPSC-critical facts ONLY if essential.
2. WORD LIMIT: Each "content" MUST be exactly 20–30 words.
3. ZERO DATA LOSS: Capture EVERY fact, date, name, number, and nuance.
4. SEQUENCE: Maintain strict chronological or logical order.
5. GRANULARITY: Combine related facts ONLY if within word limit.

CONTENT STYLE:
- Hinglish mandatory: English for terms/dates, Hindi (Devanagari) for explanation.
- Bold **Rulers, Years, Reforms, Battles, Books, Buildings**.
- No filler. Every word must aid revision.
- Use bullets/headings inside content where helpful.

JSON RULES (ABSOLUTE):
- Return ONLY valid JSON.
- Use double quotes only.
- Escape inner quotes with \\"
- No trailing commas.
- No extra text.

JSON FORMAT:
{
  "notes": [
    {
      "topic": "Main topic",
      "subtopic": "Specific event/person",
      "content": "20–30 words Hinglish content",
      "examRelevance": "SSC" | "UPSC" | "BOTH",
      "importance": 1-5,
      "memoryTechnique": {
        "type": "Mnemonic" | "Acronym" | "Story" | "Visual" | "Rhyme" | "Association",
        "technique": "Memory aid",
        "explanation": "Hinglish explanation"
      }
    }
  ],
  "summary": {
    "totalConcepts": 0,
    "keyTopics": []
  }
}

SOURCE MATERIAL:
"""
${text}
"""
`;

export const MCQ_FROM_NOTES_PROMPT = (notes: string, style: string, level: string, count: number = 20, focus?: string) => `
You are a Senior Exam Paper Setter for ${style} exams (${level}).

CRITICAL RULES:
1. SUBJECT MATTER ONLY: Questions must ONLY be about educational facts (Geography, History, etc.).
2. NO META-QUESTIONS: NEVER ask about note importance, exam relevance, memory techniques, or the mnemonics themselves.
3. STRUCTURE: Every MCQ must have "question", "options" (4), and "answer".
5. LANGUAGE: Questions/Options: English. Explanations: Hinglish.
6. CONCEPT TESTING: Focus on testing understanding of the facts. Total count: ${count}.
${focus ? `7. FOCUS TOPIC: The questions MUST focus SPECIFICALLY on '${focus}'. Ignore other topics unless related.` : ""}

JSON RULES:
- Return ONLY a valid JSON object.
- Root key: "questions".
- Use double quotes only.
- Escape inner quotes with \\"
- No preamble/post-text.

JSON FORMAT:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "Hinglish explanation + memory technique",
      "level": "${level}",
      "sourceNote": "Concept source",
      "examRelevance": "SSC" | "UPSC" | "BOTH",
      "importance": 1-5
    }
  ]
}

SMART NOTES:
"""
${notes}
"""
`;

export const SHORT_TRICK_PROMPT = (text: string) => `
Analyze the following educational text and extract "Smart Notes."
For each major concept, provide:
1. A 1-sentence "Crystal Clear" summary in **Hindi (Devanagari) + English**.
2. A "Short Trick" or Mnemonic to remember it in **Hindi (Devanagari) + English**.
3. One common pitfall students make during exams in **Hindi (Devanagari) + English**.

SOURCE MATERIAL:
"""
${text}
"""
`;

export const ENHANCE_NOTES_PROMPT = (text: string, focus: string, style: string) => `
You are an expert educator creating DETAILED, SPECIFIC smart notes from the source material.

FOCUS TOPIC: "${focus}"
STYLE: "${style}" (${style === "SSC" ? "Fact-focused, precise, bullet points" : style === "UPSC" ? "Concept-heavy, analytical, detailed paragraphs" : "Balanced mix of Facts (SSC) and Concepts (UPSC)"})

CRITICAL RULES:
1. IGNORE general summary. Focus ONLY on "${focus}".
2. NO DUPLICATES: Do not repeat generic info. Dig deeper into the focus topic.
3. FORMAT:
   - If SSC: Short, crisp facts (20-30 words).
   - If UPSC: Detailed analysis (40-60 words).
   - If BOTH: Mix of both.
4. STRICT JSON OUTPUT.

JSON FORMAT:
{
  "notes": [
    {
      "topic": "${focus}",
      "subtopic": "Specific Aspect",
      "content": "Content based on style...",
      "examRelevance": "${style === 'BOTH' ? 'BOTH' : style}",
      "importance": 5,
      "memoryTechnique": {
        "type": "Mnemonic",
        "technique": "...",
        "explanation": "..."
      }
    }
  ],
  "summary": {
    "totalConcepts": 0
  }
}

SOURCE MATERIAL:
"""
${text}
"""
`;

export const MIND_MAP_PROMPT = (text: string, focus: string = "Overview") => `
You are an expert at creating visual mind maps using Mermaid.js syntax.

FOCUS TOPIC: "${focus}"
SOURCE MATERIAL:
"""
${text}
"""

INSTRUCTIONS:
1. Create a "mindmap" diagram using Mermaid syntax.
2. **STRUCTURE**: The map MUST be hierarchical and deeply categorized.
   - Root: Main Topic
   - Level 1: Major Categories (e.g., Features, Geography, Society, Economy, Sites)
   - Level 2: Specific Details/Facts
   - Level 3: Sub-details (if necessary)
3. **CONTENT**:
   - Keep node text SHORT (1-5 words max).
   - *Crucial*: Escape any parentheses () in text or remove them to avoid syntax errors.
   - Use simple text.
4. **SYNTAX RULES**:
   - Start with \`mindmap\`
   - Indentation is CRITICAL (2 spaces per level).
   - Do NOT use special characters that break Mermaid.

EXAMPLE OUTPUT STRUCTURE (Your output must match this DEPTH):
mindmap
  root((Indus Valley))
    Features
      Urban Planning
        Grid System
        Drainage
      Bronze Age
    Geography
      North
        Manda
      South
        Daimabad
    Economy
      Agriculture
        Wheat
        Barley
      Trade
        Mesopotamia
        Seals
    Sites
      Harappa
        Granaries
      Mohenjodaro

GENERATE NOW. RETURN ONLY THE MERMAID CODE.
`;export const TEXT_TREE_PROMPT = (text: string, focus: string = "Overview") => `
You are an expert at creating structured, hierarchical text trees.

FOCUS TOPIC: "${focus}"
SOURCE MATERIAL:
"""
${text}
"""

INSTRUCTIONS:
1. Create a text-based tree structure using Unicode box-drawing characters (│, ├──, └──).
2. Root node should be the Focus Topic.
3. Branch out to categories and sub-details.
4. Keep the text clean and concise.
5. DO NOT use markdown code blocks or styling. Just returns the raw tree text.

EXAMPLE OUTPUT:
ROOT TOPIC
│
├── Category 1
│   ├── Detail A
│   └── Detail B
│
└── Category 2
    └── Detail C
`;
