export const SMART_NOTES_PROMPT = (text: string) => `
You are an Expert Educator generating EXHAUSTIVE smart notes strictly from the SOURCE MATERIAL.

CRITICAL RULES:
1. STRICT CONTEXT: Use ONLY provided data. Add missing SSC/UPSC-critical facts ONLY if essential.
2. WORD LIMIT: Each "content" MUST be exactly 20–30 words.
3. ZERO DATA LOSS: Capture EVERY fact, date, name, number, and nuance.
4. SEQUENCE: Maintain strict chronological or logical order.
5. GRANULARITY: Combine related facts ONLY if within word limit.

CONTENT STYLE:
- Hinglish mandatory: English for terms/dates/names/keywords, Hindi (Devanagari) for explanation.
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
      "importance": 1-5
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

export const SSC_FACT_CHRONO_PROMPT = (text: string, topicName: string = "the topic") => `
You are an SSC Exam Specialist.

Create structured, chronological notes for "${topicName}" using the provided material.

DESIGN & FORMAT RULES:
- Format: Pointer-wise only.
- Language: Hinglish (Hindi narrative in Devanagari script, but all technical terms, names, years, and original keywords MUST be in English script).
  - Example: उन्होंने **Nagalapuram** city बसाई। **Ashtadiggajas** को patronage दिया।
- Pointers: Each point should be balanced (not too short, not a paragraph). Aim for 1.5 - 2 lines.
- Chronology: Maintain a strict timeline from oldest to newest events.

CONTENT DEPTH:
- If keywords are provided, expand them into complete factual points.
- Automatically add "Who, When, Where" for every entity.
- Value Addition: Add critical information based on SSC Previous Year Questions (PYQs) trends (e.g. specific titles, contemporary rulers, associated monuments and their styles).

OUTPUT JSON STRUCTURE:
{
  "notes": [
    {
      "topic": "${topicName}",
      "subtopic": "Logical Phase Name (Chronological)",
      "content": "→ Pointer 1\n→ Pointer 2\n→ Pointer 3",
      "examRelevance": "SSC",
      "importance": 1-5
    }
  ]
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
      "importance": 5
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

export const UPSC_RICH_NOTES_PROMPT = (text: string, topicName: string = "the topic") => `
You are a senior UPSC/PSC mentor.

Create deeply detailed, fact-rich, exam-oriented notes on "${topicName}" using the SOURCE MATERIAL.

Language:
- Write in Hinglish (Hindi + English mix in English script).
- Conceptual but dense.
- Pointer format only.
- No paragraph writing.

Content Depth:
- Add maximum relevant facts, dates, figures, technical terms, and regional variations.
- Maintain strict chronological flow.
- Focus on high-yield exam areas.

INSTRUCTIONS:
You must break the content into these 9 SPECIFIC sections and return them as separate note objects in the 'notes' array:

1. Background & Duration
   → Exact time span (India specific + global comparison)
   → Total duration and significance
   → Climatic phases (if relevant)

2. Detailed Chronological Timeline
   → Period-wise classification
   → Regional differences
   → Tool types (clear distinction)
   → Major developments

3. Important Archaeological Sites
   → Site name – Location – Period – Key findings
   → Site-period matching clarity

4. Technology & Economy
   → Tool evolution
   → Subsistence patterns
   → Agriculture / Domestication / Pottery / Metallurgy links

5. Art & Culture
   → Rock art sites
   → Themes
   → Cultural interpretation

6. Scientific & Dating Methods
   → Carbon dating
   → Stratigraphy
   → Thermoluminescence
   → Relevance in Indian context

7. Regional Variations
   → North-West, Central India, South India, North-East

8. Transition Analysis
   → Climate role, Technological shifts, Social changes

9. High-Yield Revision Zone
   → Chronology traps, Tool classification confusion, Site matching traps, Frequently mixed concepts

JSON RULES:
- Return ONLY valid JSON.
- Root key: "notes".
- Each note MUST have: "topic", "subtopic" (from the list above), "content" (the pointers), "examRelevance" (set to "UPSC"), "importance" (1-5).
- "content" MUST be structured pointers using arrows (→) and bullets.

SOURCE MATERIAL:
"""
${text}
"""
`;

export const UPSC_MCQ_PROMPT = (notes: string, topicName: string = "the topic") => `
You are a UPSC/PSC examiner.

Create 15 high-quality MCQs on the topic: "${topicName}" based on the provided SMART NOTES.

Follow these rules strictly:

1. Language:
   - Questions must be in English only.
   - UPSC standard difficulty (Conceptual + analytical).

2. Question Pattern:
   - Statement based (1, 2, 3 correct), Assertion-Reason, Match the following, Chronological order.
   - Multi-dimensional linking.

3. Distractors:
   - Options must be tricky but logical. Avoid obvious elimination.

4. Explanations:
   - Provide detailed explanation for each answer IN HINGLISH.
   - Explain why wrong options are wrong.

5. Trap Concepts:
   - After 15 MCQs, add 3 "Most Dangerous Trap Concepts".

JSON FORMAT:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "Detailed Hinglish explanation + why others are wrong",
      "level": "Hard",
      "examRelevance": "UPSC"
    }
  ],
  "trapConcepts": [
    {
      "topic": "Trap Concept 1",
      "content": "..."
    }
  ]
}

SMART NOTES:
"""
${notes}
"""
`;

export const UPSC_KEYWORD_ENGINE = (text: string, topicName: string = "the topic") => `
You are a UPSC Senior Mentor.

Transform the provided keywords/material into highly structured, analytical, and chronological notes on "${topicName}".

GUIDELINES:
- Flow: Maintain clear chronological or conceptual progression.
- Style: Pointers only. Each point must be meaningful and balanced (approx 2 lines).
- Language: Hindi sentence structure (Devanagari script). HOWEVER, all technical terms, entities, and original input keywords MUST ALWAYS be in English script.

CONTENT DEPTH:
- Expansion: Treat keywords as hooks; expand them into dense, fact-rich analysis.
- Value Addition: Integrate missing but high-yield facts based on UPSC Mains/Prelims trends (e.g., historical significance, modern relevance, administrative links).
- Sub-topics: Create logical divisions (e.g., Origins, Expansion, Decline, Impact).

JSON STRUCTURE:
{
  "notes": [
    {
      "topic": "${topicName}",
      "subtopic": "Topical/Chronological Section",
      "content": "→ Pointer covering depth/analysis\n→ Secondary pointer",
      "examRelevance": "UPSC",
      "importance": 1-5
    }
  ]
}

SOURCE MATERIAL:
"""
${text}
"""
`;
