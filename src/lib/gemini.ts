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
