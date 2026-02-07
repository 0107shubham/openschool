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

export const MCQ_FROM_NOTES_PROMPT = (notes: string, style: string, level: string, count: number = 20) => `
You are a Senior Exam Paper Setter for ${style} exams (${level}).

CRITICAL RULES:
1. SOURCE: Use ONLY provided notes. No outside data.
2. STRUCTURE: Every MCQ must have "question", "options" (4), and "answer".
3. VALIDITY: "answer" MUST match one option exactly. No nulls.
4. LANGUAGE: Questions/Options: English. Explanations: Hinglish.
5. FULL COVERAGE: You MUST generate at least one MCQ for EVERY single note provided. Do not skip any note.
6. VOLUME: Generate approximately ${count} questions to ensure exhaustive coverage of all concepts.

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
