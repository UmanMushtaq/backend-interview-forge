import type { QuizQuestion } from '../types';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiKeySettings = { geminiApiKey?: string; geminiApiKey2?: string; geminiApiKey3?: string };

export function getApiKeys(settings: GeminiKeySettings): string[] {
  return [settings.geminiApiKey, settings.geminiApiKey2, settings.geminiApiKey3]
    .filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
}

let _workingModel: string | null = null;
let _workingKeyIndex: number = 0;

async function tryModel(
  apiKey: string,
  model: string,
  prompt: string,
  generationConfig: { temperature: number; maxOutputTokens: number },
): Promise<{ raw: string } | { error: Error; maxTokens?: boolean }> {
  try {
    const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          ...generationConfig,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (response.status === 429) {
        return { error: new Error('QUOTA_EXCEEDED') };
      }
      return { error: new Error(`Gemini API error ${response.status} on ${model}: ${body || response.statusText}`) };
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const raw: string | undefined = candidate?.content?.parts?.[0]?.text;

    if (!raw) {
      console.error(`[gemini] No text from ${model}:`, JSON.stringify(data));
      const finishReason: string = candidate?.finishReason ?? 'UNKNOWN';
      const promptFeedback: string | undefined = data?.promptFeedback?.blockReason;
      return {
        error: new Error(
          `Gemini returned no text from ${model}. finishReason: ${finishReason}${promptFeedback ? `, blockReason: ${promptFeedback}` : ''}`,
        ),
        maxTokens: finishReason === 'MAX_TOKENS',
      };
    }

    return { raw };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

async function tryModelWithMaxTokensRetry(
  apiKey: string,
  model: string,
  prompt: string,
  generationConfig: { temperature: number; maxOutputTokens: number },
): Promise<{ raw: string } | { error: Error }> {
  const result = await tryModel(apiKey, model, prompt, generationConfig);
  if ('raw' in result) return result;
  if (result.maxTokens) {
    const retry = await tryModel(apiKey, model, prompt, {
      ...generationConfig,
      maxOutputTokens: generationConfig.maxOutputTokens * 2,
    });
    if ('raw' in retry) return retry;
    return { error: retry.error };
  }
  return { error: result.error };
}

async function callGemini(
  apiKeys: string[],
  prompt: string,
  generationConfig: { temperature: number; maxOutputTokens: number },
): Promise<string> {
  if (apiKeys.length === 0) {
    throw new Error('No Gemini API key configured. Add one in Settings.');
  }

  let lastError: Error | null = null;

  // If a working key+model is cached, try it first before cycling through everything again.
  if (_workingModel && _workingKeyIndex < apiKeys.length) {
    const cachedModel = _workingModel;
    const cachedKey = apiKeys[_workingKeyIndex];
    const result = await tryModelWithMaxTokensRetry(cachedKey, cachedModel, prompt, generationConfig);
    if ('raw' in result) {
      return result.raw;
    }
    lastError = result.error;
    // Cached key+model failed; reset the cache and fall through to the full rotation.
    _workingModel = null;
    _workingKeyIndex = 0;
  }

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const key = apiKeys[keyIndex];
    let quotaExceededForThisKey = false;

    for (const model of GEMINI_MODELS) {
      const result = await tryModelWithMaxTokensRetry(key, model, prompt, generationConfig);
      if ('raw' in result) {
        _workingModel = model;
        _workingKeyIndex = keyIndex;
        return result.raw;
      }
      lastError = result.error;
      if (result.error.message === 'QUOTA_EXCEEDED') {
        quotaExceededForThisKey = true;
        break;
      }
    }

    if (quotaExceededForThisKey) continue;
  }

  if (lastError?.message === 'QUOTA_EXCEEDED') {
    throw new Error(
      apiKeys.length > 1
        ? 'All Gemini models are currently rate limited on every configured API key. This usually resets at midnight Pacific time. Add another key from a separate Google account in Settings, or wait for the daily reset.'
        : 'All Gemini models are currently rate limited on this API key. This usually resets at midnight Pacific time. Try a different API key from a separate Google account in Settings, or wait for the daily reset.',
    );
  }
  throw lastError ?? new Error('Gemini request failed for an unknown reason.');
}

export async function callGeminiWithSettings(
  settings: GeminiKeySettings,
  prompt: string,
  generationConfig: { temperature: number; maxOutputTokens: number },
): Promise<string> {
  return callGemini(getApiKeys(settings), prompt, generationConfig);
}

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
  settings: GeminiKeySettings,
  courseTitle: string,
  chapterTitle: string,
  chapterContent: string,
  previousQuestionIds: string[],
): Promise<QuizQuestion[]> {
  const prompt = buildPrompt(courseTitle, chapterTitle, chapterContent, previousQuestionIds);
  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.7, maxOutputTokens: 2048 });

  let parsed: unknown;
  try {
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
  settings: GeminiKeySettings,
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
  "hints": ["<a nudge the interviewer might give if the candidate is stuck  -  not the full answer>", "<a second nudge>"]
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.8, maxOutputTokens: 1024 });

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
  settings: GeminiKeySettings,
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
  "modelAnswer": "<what a senior engineer would say in 3-5 sentences  -  concrete, precise, no fluff>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.4, maxOutputTokens: 2048 });

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

export async function generateNexusPayQuestion(
  settings: GeminiKeySettings,
  difficulty: string,
  previousQuestions: string[],
  focusArea?: string,
): Promise<{ question: string; hints: string[]; focusArea: string }> {
  const prompt = `You are a senior backend engineer at a European fintech company (like Qonto, Alan, or Swan) interviewing a candidate for a Senior NestJS Engineer role. The candidate's CV lists NexusPay as their flagship project.

NexusPay is a production-grade event-driven fintech platform with 7 NestJS microservices in an Nx monorepo: User Service, Wallet Service, Transaction Service, Notification Service, Analytics Service, Payment Gateway Service, and API Gateway. Each service has its own PostgreSQL database. RabbitMQ handles directed commands and Saga orchestration. Kafka handles event streaming to the transactions.stream topic. Redis handles caching (user profiles, TTL 5min), rate limiting (100 req/min per IP), distributed locks (SET NX EX 30 to prevent double-spending), and JWT blacklisting. The KYC flow: user submits documents, admin approves, user.kyc.approved published to RabbitMQ, Wallet Service auto-creates wallet, Notification Service sends confirmation. The transfer Saga: Redis lock acquired, transaction saved as PENDING, debit requested via RabbitMQ, wallet debited, credit requested, wallet credited, transaction.completed published to Kafka. REST in Phase 1-3, gRPC in Phase 4, GraphQL subscriptions in Phase 5. 85% Jest test coverage, Docker Compose, GitHub Actions.

Difficulty level: ${difficulty}

${focusArea && focusArea !== 'Any' ? `Focus this question on: ${focusArea}` : 'Choose any aspect of the architecture.'}

${previousQuestions.length > 0 ? `Do NOT repeat these questions already asked:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

Generate one sharp, specific interview question about NexusPay. The question should feel like it comes from a real interviewer who has read the candidate's CV and wants to probe their genuine understanding. It should NOT be answerable by someone who just read a summary - it should require real architectural understanding.

Examples of good questions:
- 'You mentioned your Redis lock uses SET NX EX 30. What happens if the service crashes after acquiring the lock but before the finally block runs? Walk me through exactly what happens to that transfer.'
- 'Your Saga marks the transaction COMPLETED after the debit. But what if the credit to the destination wallet fails after the debit already happened? How does your compensating transaction work?'
- 'You said each service has its own PostgreSQL database. A user profile update in User Service needs to be reflected in the Wallet Service. How does that data eventually get there?'

Return ONLY valid JSON with this shape:
{
  "question": "<the question>",
  "hints": ["<a nudge if stuck, not the full answer>", "<a second nudge>"],
  "focusArea": "<the area this question targets, e.g. 'Redis distributed locks' or 'Saga pattern' or 'Kafka consumer groups'>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.8, maxOutputTokens: 1536 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.question || !Array.isArray(obj.hints) || !obj.focusArea) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    question: String(obj.question),
    hints: (obj.hints as unknown[]).map(String),
    focusArea: String(obj.focusArea),
  };
}

export async function scoreNexusPayAnswer(
  settings: GeminiKeySettings,
  question: string,
  userAnswer: string,
  focusArea: string,
): Promise<{
  score: number;
  verdict: string;
  whatYouGotRight: string[];
  whatWasMissing: string[];
  modelAnswer: string;
}> {
  const prompt = `You are a senior backend engineer at a European fintech company scoring a candidate's answer about their NexusPay project.

Focus area: ${focusArea}
Question: ${question}

Candidate's answer:
"""
${userAnswer}
"""

Score this rigorously. You are checking whether this candidate truly built and understands this system, or whether they are bluffing. A score of 9-10 means they answered with the precision of someone who genuinely built it - naming specific Redis commands, specific RabbitMQ exchange patterns, specific error scenarios. A score of 7-8 is good but missing one key technical detail. A score of 4-6 covers the concept but lacks implementation depth. A score of 1-3 is vague or incorrect.

Return ONLY valid JSON with this shape:
{
  "score": <0-10 integer>,
  "verdict": "<one precise sentence like 'Good understanding of the lock mechanism but missed the crash recovery scenario'>",
  "whatYouGotRight": ["<specific correct point>"],
  "whatWasMissing": ["<specific missing detail or depth>"],
  "modelAnswer": "<exactly what a senior engineer who built this system would say - precise, uses real command names, mentions specific trade-offs, 4-6 sentences>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.4, maxOutputTokens: 2048 });

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

export async function askChapterTutor(
  settings: GeminiKeySettings,
  courseTitle: string,
  chapterTitle: string,
  chapterContent: string,
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const prompt = `You are an expert backend engineering tutor helping a Senior NestJS engineer prepare for technical interviews at European fintech companies like Qonto, Alan, and Swan. You are currently helping them understand a chapter from their personal learning platform.

Course: ${courseTitle}
Chapter: ${chapterTitle}

Chapter content (for context):
"""
${chapterContent.slice(0, 3000)}
"""

Previous conversation:
${conversationHistory.map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n')}

Student question: ${question}

Answer clearly and specifically. If the question is about a concept in the chapter, explain it differently from how the chapter explains it. Use concrete examples. If relevant, relate the answer to NexusPay or fintech use cases. Keep the answer focused and under 200 words unless more is genuinely needed. Never use em dashes. Never use AI phrases like 'great question', 'certainly', 'of course', 'absolutely'.`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.7, maxOutputTokens: 1024 });
  return raw.trim();
}

export async function generateBehavioralQuestion(
  settings: GeminiKeySettings,
  category: string,
  previousQuestions: string[],
): Promise<{ question: string; competencies: string[]; followUp: string }> {
  const prompt = `You are a senior engineering manager at a European fintech company (Qonto, Alan, or Swan) conducting a behavioral interview for a Senior Backend Engineer role. Generate one realistic behavioral interview question for the category: ${category}. Avoid repeating these questions: ${previousQuestions.join(', ')}. Return ONLY valid JSON: { "question": "...", "competencies": ["<competency this tests>"], "followUp": "<one natural follow-up question the interviewer would ask>" }`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.7, maxOutputTokens: 512 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.question || !Array.isArray(obj.competencies) || !obj.followUp) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    question: String(obj.question),
    competencies: (obj.competencies as unknown[]).map(String),
    followUp: String(obj.followUp),
  };
}

export async function scoreBehavioralAnswer(
  settings: GeminiKeySettings,
  question: string,
  userAnswer: string,
  competencies: string[],
): Promise<{
  situationScore: number;
  taskScore: number;
  actionScore: number;
  resultScore: number;
  overallScore: number;
  verdict: string;
  whatWasStrong: string[];
  whatWasMissing: string[];
  improvedVersion: string;
}> {
  const prompt = `You are scoring a behavioral interview answer using the STAR method (Situation, Task, Action, Result). The candidate is a Senior Backend Engineer applying to a European fintech company.

Question: ${question}
Testing competencies: ${competencies.join(', ')}

Candidate answer:
"""
${userAnswer}
"""

Score each STAR component 0-10. Be honest and specific. A 9-10 means the candidate gave precise, quantified, memorable detail. A 5-6 means it was present but vague. A 1-3 means it was missing or very weak.

Return ONLY valid JSON:
{
  "situationScore": <0-10>,
  "taskScore": <0-10>,
  "actionScore": <0-10>,
  "resultScore": <0-10>,
  "overallScore": <0-10>,
  "verdict": "<one precise sentence>",
  "whatWasStrong": ["<specific strong point>"],
  "whatWasMissing": ["<specific missing or weak point>"],
  "improvedVersion": "<a rewritten version of the answer that would score 9-10, in first person, using the candidate's domain - backend engineering, fintech, NexusPay - as the example context. 3-5 sentences.>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.3, maxOutputTokens: 2048 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (
    typeof obj.situationScore !== 'number' ||
    typeof obj.taskScore !== 'number' ||
    typeof obj.actionScore !== 'number' ||
    typeof obj.resultScore !== 'number' ||
    typeof obj.overallScore !== 'number' ||
    !obj.verdict ||
    !Array.isArray(obj.whatWasStrong) ||
    !Array.isArray(obj.whatWasMissing) ||
    !obj.improvedVersion
  ) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

  return {
    situationScore: clamp(obj.situationScore as number),
    taskScore: clamp(obj.taskScore as number),
    actionScore: clamp(obj.actionScore as number),
    resultScore: clamp(obj.resultScore as number),
    overallScore: clamp(obj.overallScore as number),
    verdict: String(obj.verdict),
    whatWasStrong: (obj.whatWasStrong as unknown[]).map(String),
    whatWasMissing: (obj.whatWasMissing as unknown[]).map(String),
    improvedVersion: String(obj.improvedVersion),
  };
}

export async function testGeminiConnection(apiKey: string): Promise<void> {
  await callGemini([apiKey], 'Reply with the single word: OK', {
    temperature: 0,
    maxOutputTokens: 50,
  });
}

export async function reviewCV(
  settings: GeminiKeySettings,
  cvText: string,
  targetCompany: string,
): Promise<{ score: number; strengths: string[]; weaknesses: string[]; suggestions: string[] }> {
  const prompt = `You are a senior technical recruiter at a European fintech company reviewing a CV for a Senior Backend Engineer role. The target company is ${targetCompany}. Review this CV text and give honest, specific feedback. Score it 0-10 on how well it would pass an ATS screen and a human recruiter glance for this kind of role.

CV text:
"""
${cvText}
"""

Return ONLY valid JSON with this shape:
{
  "score": <0-10 integer>,
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "weaknesses": ["<specific weakness, be honest, do not sugarcoat>"],
  "suggestions": ["<specific actionable fix the candidate can make today>"]
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.4, maxOutputTokens: 2048 });

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
    !Array.isArray(obj.strengths) ||
    !Array.isArray(obj.weaknesses) ||
    !Array.isArray(obj.suggestions)
  ) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    score: Math.max(0, Math.min(10, Math.round(obj.score as number))),
    strengths: (obj.strengths as unknown[]).map(String),
    weaknesses: (obj.weaknesses as unknown[]).map(String),
    suggestions: (obj.suggestions as unknown[]).map(String),
  };
}

export async function generateCoverLetter(
  settings: GeminiKeySettings,
  cvSummary: string,
  companyName: string,
  roleTitle: string,
  tone: 'formal' | 'direct' | 'enthusiastic',
): Promise<string> {
  const prompt = `Write a cover letter for a ${roleTitle} position at ${companyName}. The candidate background: ${cvSummary}. Tone: ${tone}. Rules: under 250 words, no generic filler phrases like 'I am writing to express my interest', no placeholder brackets like [Company Name] or [Your Name], use the actual company name directly, be specific about why this candidate fits this company based on their actual experience, no markdown formatting, no quotation marks around the letter. Return only the cover letter text with no preamble.`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.7, maxOutputTokens: 1024 });
  return raw.trim();
}

export async function generateWarmupQuestion(
  settings: GeminiKeySettings,
  topic: string,
): Promise<{ question: string; options: string[]; correctIndex: number; explanation: string }> {
  const prompt = `Generate exactly one multiple-choice backend engineering interview question on the topic: ${topic}. Make it sharp and realistic, the kind of question that gets asked in a 45-minute technical screen. Return ONLY valid JSON with this shape: { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.7, maxOutputTokens: 512 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.question || !Array.isArray(obj.options) || typeof obj.correctIndex !== 'number' || !obj.explanation) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    question: String(obj.question),
    options: (obj.options as unknown[]).map(String),
    correctIndex: Math.max(0, Math.min(3, Math.round(obj.correctIndex as number))),
    explanation: String(obj.explanation),
  };
}

export async function generateFlashcards(
  settings: GeminiKeySettings,
  courseTitle: string,
  chapterTitle: string,
  chapterContent: string,
): Promise<Array<{ front: string; back: string; example: string }>> {
  const prompt = `You are creating flashcards for a senior backend engineer studying for technical interviews. Based on this chapter content, generate 6 flashcards. Each flashcard has a front (a key term, concept, or pattern name - 1-8 words), a back (a clear definition - 1-3 sentences, no jargon padding), and an example (one concrete real-world example of where this is used, ideally in a fintech or NestJS context - 1 sentence). Return ONLY valid JSON array: [{ "front": "...", "back": "...", "example": "..." }]

Course: ${courseTitle}
Chapter: ${chapterTitle}

Chapter content:
"""
${chapterContent.slice(0, 6000)}
"""`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.5, maxOutputTokens: 1024 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini did not return a flashcard array. Try again.');
  }

  return (parsed as Record<string, unknown>[]).map((c) => ({
    front: String(c.front ?? ''),
    back: String(c.back ?? ''),
    example: String(c.example ?? ''),
  }));
}

export async function explainSelectedText(
  settings: GeminiKeySettings,
  selectedText: string,
  courseTitle: string,
  chapterTitle: string,
): Promise<string> {
  const prompt = `A backend engineer is reading a chapter titled '${chapterTitle}' from a course on '${courseTitle}'. They highlighted this text:

"${selectedText}"

Explain this in a different, clearer way. Use a concrete analogy or real-world example. If it is a technical term or pattern, say what problem it solves and give a one-line code example if helpful. Keep the explanation under 120 words. Never use em dashes. Never use phrases like 'great question', 'certainly', 'of course'.`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.7, maxOutputTokens: 512 });
  return raw.trim();
}

export async function getSalaryAdvice(
  settings: GeminiKeySettings,
  company: string,
  role: string,
  yearsExperience: number,
  currentExpectation: string,
  situation: 'first-mention' | 'counter-offer' | 'pushback' | 'competing-offer',
): Promise<{ strategy: string; exactWords: string; thingsToAvoid: string[]; followUpMoves: string[] }> {
  const prompt = `You are a senior salary negotiation coach specialising in European tech companies, specifically French fintech. The candidate is a Senior Backend Engineer with ${yearsExperience} years of experience interviewing at ${company} for the role of ${role}. Their current expectation is ${currentExpectation}. The situation is: ${situation}.

Give concrete, actionable advice. Do not give generic tips. Give the exact words to say in this specific situation.

Return ONLY valid JSON:
{
  "strategy": "<2-3 sentences explaining the overall approach for this specific situation>",
  "exactWords": "<the exact script to say or write, in first person, ready to use verbatim>",
  "thingsToAvoid": ["<specific mistake to avoid in this situation>"],
  "followUpMoves": ["<what to do or say next depending on their response>"]
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.4, maxOutputTokens: 1024 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.strategy || !obj.exactWords || !Array.isArray(obj.thingsToAvoid) || !Array.isArray(obj.followUpMoves)) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    strategy: String(obj.strategy),
    exactWords: String(obj.exactWords),
    thingsToAvoid: (obj.thingsToAvoid as unknown[]).map(String),
    followUpMoves: (obj.followUpMoves as unknown[]).map(String),
  };
}

export async function generateTakeHomeAssessment(
  settings: GeminiKeySettings,
  company: string,
  difficulty: string,
): Promise<{ title: string; context: string; requirements: string[]; constraints: string[]; evaluationCriteria: string[] }> {
  const prompt = `Generate a realistic take-home coding assessment for a Senior Backend Engineer role at ${company}, difficulty: ${difficulty}. Make it specific to the kind of system ${company} builds (fintech, payments, healthcare tech etc). It should be completable in 3-5 hours.

Return ONLY valid JSON:
{
  "title": "<short project title>",
  "context": "<2-3 sentences of business context explaining what the company needs>",
  "requirements": ["<functional requirement>"],
  "constraints": ["<technical constraint or rule>"],
  "evaluationCriteria": ["<what the reviewer will specifically look for>"]
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.7, maxOutputTokens: 1024 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (
    !obj.title ||
    !obj.context ||
    !Array.isArray(obj.requirements) ||
    !Array.isArray(obj.constraints) ||
    !Array.isArray(obj.evaluationCriteria)
  ) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    title: String(obj.title),
    context: String(obj.context),
    requirements: (obj.requirements as unknown[]).map(String),
    constraints: (obj.constraints as unknown[]).map(String),
    evaluationCriteria: (obj.evaluationCriteria as unknown[]).map(String),
  };
}

export async function scoreTakeHomeApproach(
  settings: GeminiKeySettings,
  assessment: { title: string; requirements: string[]; evaluationCriteria: string[] },
  userApproach: string,
): Promise<{
  architectureScore: number;
  qualityScore: number;
  communicationScore: number;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  whatReviewersWouldSay: string;
  improvedApproach: string;
}> {
  const prompt = `You are a senior engineer at a European fintech company reviewing a take-home assessment submission. The assessment was: ${assessment.title}. Requirements: ${assessment.requirements.join(', ')}. Evaluation criteria: ${assessment.evaluationCriteria.join(', ')}.

The candidate's planned approach:
"""
${userApproach}
"""

Score it honestly. 9-10 means production-quality thinking. 7-8 is solid with minor gaps. 5-6 has good ideas but missing key concerns. Below 5 has fundamental gaps.

Return ONLY valid JSON:
{
  "architectureScore": <0-10>,
  "qualityScore": <0-10>,
  "communicationScore": <0-10>,
  "overallScore": <0-10>,
  "strengths": ["<specific strength>"],
  "gaps": ["<specific gap or missed concern>"],
  "whatReviewersWouldSay": "<what the engineering team would say in their debrief about this submission, 2-3 sentences>",
  "improvedApproach": "<a rewritten version of the approach that would score 9-10, specific and technical, 4-6 sentences>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.3, maxOutputTokens: 2048 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (
    typeof obj.architectureScore !== 'number' ||
    typeof obj.qualityScore !== 'number' ||
    typeof obj.communicationScore !== 'number' ||
    typeof obj.overallScore !== 'number' ||
    !Array.isArray(obj.strengths) ||
    !Array.isArray(obj.gaps) ||
    !obj.whatReviewersWouldSay ||
    !obj.improvedApproach
  ) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

  return {
    architectureScore: clamp(obj.architectureScore as number),
    qualityScore: clamp(obj.qualityScore as number),
    communicationScore: clamp(obj.communicationScore as number),
    overallScore: clamp(obj.overallScore as number),
    strengths: (obj.strengths as unknown[]).map(String),
    gaps: (obj.gaps as unknown[]).map(String),
    whatReviewersWouldSay: String(obj.whatReviewersWouldSay),
    improvedApproach: String(obj.improvedApproach),
  };
}

export async function getDesignInterviewResponse(
  settings: GeminiKeySettings,
  question: string,
  conversationHistory: Array<{ role: 'interviewer' | 'candidate'; content: string }>,
  phase: 'requirements' | 'design' | 'deep-dive' | 'wrap-up',
): Promise<{ response: string; nextPhase?: string; score?: number; feedback?: string }> {
  const prompt = `You are a senior engineering interviewer at a European fintech company conducting a system design interview. You are ${phase === 'wrap-up' ? 'wrapping up the interview' : 'in the ' + phase + ' phase'}.

Original question: ${question}

Conversation so far:
${conversationHistory.map((m) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')}

Your job: Ask ONE sharp follow-up question or probe. Push back if their answer was vague. Challenge their trade-off decisions. If they have not addressed scale, ask about it. If they have not mentioned failure modes, ask about them. If this is the wrap-up phase, give a brief honest assessment of their performance (score 1-10) and 2-3 specific pieces of feedback.

Keep your response concise: 1-3 sentences for follow-up questions, or a short assessment paragraph for wrap-up.

Return ONLY valid JSON:
{
  "response": "<your follow-up question or probe or assessment>",
  "nextPhase": "<only include if you think it is time to move to the next phase: requirements|design|deep-dive|wrap-up>",
  "score": <only include in wrap-up phase, 0-10>,
  "feedback": "<only include in wrap-up phase, 2-3 specific pieces of feedback>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.6, maxOutputTokens: 512 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!obj.response) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    response: String(obj.response),
    nextPhase: obj.nextPhase ? String(obj.nextPhase) : undefined,
    score: typeof obj.score === 'number' ? Math.max(0, Math.min(10, Math.round(obj.score))) : undefined,
    feedback: obj.feedback ? String(obj.feedback) : undefined,
  };
}

export async function analyzeDebrief(
  settings: GeminiKeySettings,
  company: string,
  role: string,
  questionsAsked: string,
  yourAnswers: string,
  yourFeeling: 'great' | 'okay' | 'struggled',
): Promise<{
  analysis: string;
  whatWentWell: string[];
  whatToImprove: string[];
  topicsToStudy: string[];
  estimatedOutcome: string;
}> {
  const prompt = `You are a senior interview coach analysing a candidate's debrief after a technical interview for a ${role} role at ${company}.

Questions asked in the interview:
"""
${questionsAsked}
"""

How the candidate answered (their own account):
"""
${yourAnswers}
"""

Candidate's overall feeling: ${yourFeeling}

Give an honest analysis. Identify specific topics and concepts that came up. Assess where the candidate performed well and where they have gaps. Recommend exactly what to study before a potential next round.

Return ONLY valid JSON:
{
  "analysis": "<2-3 sentence overall assessment>",
  "whatWentWell": ["<specific thing that went well>"],
  "whatToImprove": ["<specific gap or weak area>"],
  "topicsToStudy": ["<specific topic to review before the next round>"],
  "estimatedOutcome": "<honest one-sentence assessment of how likely they are to progress and why>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.4, maxOutputTokens: 1024 });

  let parsed: unknown;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON. Try again.');
  }

  const obj = parsed as Record<string, unknown>;
  if (
    !obj.analysis ||
    !Array.isArray(obj.whatWentWell) ||
    !Array.isArray(obj.whatToImprove) ||
    !Array.isArray(obj.topicsToStudy) ||
    !obj.estimatedOutcome
  ) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  return {
    analysis: String(obj.analysis),
    whatWentWell: (obj.whatWentWell as unknown[]).map(String),
    whatToImprove: (obj.whatToImprove as unknown[]).map(String),
    topicsToStudy: (obj.topicsToStudy as unknown[]).map(String),
    estimatedOutcome: String(obj.estimatedOutcome),
  };
}

export async function scoreVoiceAnswer(
  settings: GeminiKeySettings,
  question: string,
  topic: string,
  transcribedAnswer: string,
  difficulty: string,
): Promise<{
  score: number;
  verdict: string;
  clarity: number;
  depth: number;
  whatWasGood: string[];
  whatWasMissing: string[];
  modelAnswer: string;
}> {
  const prompt = `You are a senior backend engineering interviewer at a European fintech company scoring a candidate's spoken interview answer. The answer was transcribed from speech so it may have minor transcription errors or filler words like 'um', 'uh', 'like' - treat these generously and focus on technical content.

Question: ${question}
Topic: ${topic}
Difficulty: ${difficulty}

Transcribed spoken answer:
"""
${transcribedAnswer}
"""

Score it honestly. A spoken interview answer is naturally less polished than a written one - reward clear thinking and correct technical content, not perfect sentence structure.

Return ONLY valid JSON:
{
  "score": <0-10>,
  "clarity": <0-10, how clearly they communicated>,
  "depth": <0-10, how technically deep the answer was>,
  "verdict": "<one precise sentence>",
  "whatWasGood": ["<specific good point>"],
  "whatWasMissing": ["<specific technical gap>"],
  "modelAnswer": "<what an excellent spoken answer would cover, written as natural speech, 3-5 sentences>"
}`;

  const raw = await callGeminiWithSettings(settings, prompt, { temperature: 0.3, maxOutputTokens: 1024 });

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
    typeof obj.clarity !== 'number' ||
    typeof obj.depth !== 'number' ||
    !obj.verdict ||
    !Array.isArray(obj.whatWasGood) ||
    !Array.isArray(obj.whatWasMissing) ||
    !obj.modelAnswer
  ) {
    throw new Error('Gemini returned an unexpected shape. Try again.');
  }

  const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

  return {
    score: clamp(obj.score as number),
    clarity: clamp(obj.clarity as number),
    depth: clamp(obj.depth as number),
    verdict: String(obj.verdict),
    whatWasGood: (obj.whatWasGood as unknown[]).map(String),
    whatWasMissing: (obj.whatWasMissing as unknown[]).map(String),
    modelAnswer: String(obj.modelAnswer),
  };
}
