import type { QuizQuestion } from '../types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function buildPrompt(
  courseTitle: string,
  chapterTitle: string,
  chapterContent: string,
  previousQuestionIds: string[],
): string {
  const avoidSection =
    previousQuestionIds.length > 0
      ? `\n\nAVOID repeating or closely paraphrasing questions with these ids that were already asked: ${previousQuestionIds.join(', ')}.`
      : '';

  return `You are a backend engineering quiz generator. Generate exactly 5 multiple-choice questions based ONLY on the chapter content provided below. Do not introduce concepts not covered in the chapter.${avoidSection}

Course: ${courseTitle}
Chapter: ${chapterTitle}

Chapter content:
---
${chapterContent.slice(0, 6000)}
---

Return a JSON array (no markdown fences, no extra text) of exactly 5 objects with this shape:
{
  "id": "<unique string like 'q-1'>",
  "question": "<the question>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctIndex": <0-3>,
  "explanation": "<2-4 sentence explanation of why the answer is correct>"
}`;
}

export async function generateChapterQuiz(
  apiKey: string,
  courseTitle: string,
  chapterTitle: string,
  chapterContent: string,
  previousQuestionIds: string[],
): Promise<QuizQuestion[]> {
  const prompt = buildPrompt(courseTitle, chapterTitle, chapterContent, previousQuestionIds);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${body || response.statusText}`);
  }

  const data = await response.json();
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned an empty response.');

  let parsed: unknown;
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini did not return a question array. Try again.');
  }

  return (parsed as Record<string, unknown>[]).map((q, i) => ({
    id: String(q.id ?? `ai-q-${i}`),
    category: 'ai',
    subcategory: chapterTitle,
    difficulty: 'core' as const,
    question: String(q.question ?? ''),
    options: Array.isArray(q.options) ? (q.options as string[]).map(String) : [],
    correctIndex: Number(q.correctIndex ?? 0),
    explanation: String(q.explanation ?? ''),
  }));
}

export async function generateInterviewQuestion(
  apiKey: string,
  topic: string,
  difficulty: string,
  previousQuestions: string[],
): Promise<{ question: string; hints: string[] }> {
  const avoidSection =
    previousQuestions.length > 0
      ? `\n\nDo NOT repeat or closely paraphrase any of these previously asked questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

  const prompt = `You are a senior backend engineering interviewer conducting a ${difficulty}-level interview on the topic: ${topic}.

Generate exactly one realistic, specific interview question that would be asked in a real backend engineering interview. The question should test deep understanding, not surface-level knowledge.${avoidSection}

Return ONLY valid JSON (no markdown fences, no extra text) with this exact shape:
{
  "question": "<the interview question>",
  "hints": ["<a nudge the interviewer might give if the candidate is stuck — not the full answer>", "<a second nudge>"]
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${body || response.statusText}`);
  }

  const data = await response.json();
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned an empty response.');

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.question || !Array.isArray(obj.hints)) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    question: String(obj.question),
    hints: (obj.hints as unknown[]).map(String),
  };
}

export async function scoreInterviewAnswer(
  apiKey: string,
  question: string,
  topic: string,
  userAnswer: string,
): Promise<{
  score: number;
  verdict: string;
  whatYouGotRight: string[];
  whatWasMissing: string[];
  modelAnswer: string;
}> {
  const prompt = `You are a senior backend engineering interviewer scoring a candidate's answer.

Topic: ${topic}
Question: ${question}

Candidate's answer:
"""
${userAnswer}
"""

Score this answer honestly and rigorously. A score of 10 requires a near-perfect answer that a Staff engineer would give. A score of 7-9 is a strong answer with minor gaps. A score of 4-6 covers the basics but misses important depth. A score of 1-3 is superficial or incorrect.

Return ONLY valid JSON (no markdown fences, no extra text) with this exact shape:
{
  "score": <integer from 0 to 10>,
  "verdict": "<one sentence summary like 'Solid answer, but missed the key trade-off'>",
  "whatYouGotRight": ["<specific point the candidate got right>", "<another point>"],
  "whatWasMissing": ["<specific concept or depth that was missing>", "<another gap>"],
  "modelAnswer": "<what a senior engineer would say in 3-5 sentences — concrete, precise, no fluff>"
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${body || response.statusText}`);
  }

  const data = await response.json();
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned an empty response.');

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (
    typeof obj.score !== 'number' ||
    !obj.verdict ||
    !Array.isArray(obj.whatYouGotRight) ||
    !Array.isArray(obj.whatWasMissing) ||
    !obj.modelAnswer
  ) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    score: Math.max(0, Math.min(10, Math.round(obj.score as number))),
    verdict: String(obj.verdict),
    whatYouGotRight: (obj.whatYouGotRight as unknown[]).map(String),
    whatWasMissing: (obj.whatWasMissing as unknown[]).map(String),
    modelAnswer: String(obj.modelAnswer),
  };
}

export async function testGeminiConnection(apiKey: string): Promise<void> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply with the single word: OK' }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 10 },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${body || response.statusText}`);
  }
}
