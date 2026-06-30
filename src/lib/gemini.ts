import type { QuizQuestion } from '../types';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

let _workingModel: string | null = null;

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

async function callGemini(
  apiKey: string,
  prompt: string,
  generationConfig: { temperature: number; maxOutputTokens: number },
): Promise<string> {
  let lastError: Error | null = null;

  // If a working model is cached, try it first; on failure clear the cache and fall through to the full list
  if (_workingModel) {
    const cached = _workingModel;
    _workingModel = null;
    const result = await tryModel(apiKey, cached, prompt, generationConfig);
    if ('raw' in result) {
      _workingModel = cached;
      return result.raw;
    }
    lastError = result.error;
    // If MAX_TOKENS, retry cached model with doubled token limit before falling through
    if (result.maxTokens) {
      const retry = await tryModel(apiKey, cached, prompt, {
        ...generationConfig,
        maxOutputTokens: generationConfig.maxOutputTokens * 2,
      });
      if ('raw' in retry) {
        _workingModel = cached;
        return retry.raw;
      }
      lastError = retry.error;
    }
  }

  for (const model of GEMINI_MODELS) {
    const result = await tryModel(apiKey, model, prompt, generationConfig);
    if ('raw' in result) {
      _workingModel = model;
      return result.raw;
    }
    lastError = result.error;
    // If MAX_TOKENS, retry this model once with doubled token limit before moving on
    if (result.maxTokens) {
      const retry = await tryModel(apiKey, model, prompt, {
        ...generationConfig,
        maxOutputTokens: generationConfig.maxOutputTokens * 2,
      });
      if ('raw' in retry) {
        _workingModel = model;
        return retry.raw;
      }
      lastError = retry.error;
    }
  }

  if (lastError?.message === 'QUOTA_EXCEEDED') {
    throw new Error(
      'All Gemini models are currently rate limited on this API key. This usually resets at midnight Pacific time. Try a different API key from a separate Google account in Settings, or wait for the daily reset.',
    );
  }
  throw lastError ?? new Error('Gemini request failed for an unknown reason.');
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
  apiKey: string,
  courseTitle: string,
  chapterTitle: string,
  chapterContent: string,
  previousQuestionIds: string[],
): Promise<QuizQuestion[]> {
  const prompt = buildPrompt(courseTitle, chapterTitle, chapterContent, previousQuestionIds);
  const raw = await callGemini(apiKey, prompt, { temperature: 0.7, maxOutputTokens: 2048 });

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
  "hints": ["<a nudge the interviewer might give if the candidate is stuck  -  not the full answer>", "<a second nudge>"]
}`;

  const raw = await callGemini(apiKey, prompt, { temperature: 0.8, maxOutputTokens: 1024 });

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
  "modelAnswer": "<what a senior engineer would say in 3-5 sentences  -  concrete, precise, no fluff>"
}`;

  const raw = await callGemini(apiKey, prompt, { temperature: 0.4, maxOutputTokens: 2048 });

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
  apiKey: string,
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

  const raw = await callGemini(apiKey, prompt, { temperature: 0.8, maxOutputTokens: 1536 });

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
  apiKey: string,
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

  const raw = await callGemini(apiKey, prompt, { temperature: 0.4, maxOutputTokens: 2048 });

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
  await callGemini(apiKey, 'Reply with the single word: OK', {
    temperature: 0,
    maxOutputTokens: 50,
  });
}

export async function reviewCV(
  apiKey: string,
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

  const raw = await callGemini(apiKey, prompt, { temperature: 0.4, maxOutputTokens: 2048 });

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
  apiKey: string,
  cvSummary: string,
  companyName: string,
  roleTitle: string,
  tone: 'formal' | 'direct' | 'enthusiastic',
): Promise<string> {
  const prompt = `Write a cover letter for a ${roleTitle} position at ${companyName}. The candidate background: ${cvSummary}. Tone: ${tone}. Rules: under 250 words, no generic filler phrases like 'I am writing to express my interest', no placeholder brackets like [Company Name] or [Your Name], use the actual company name directly, be specific about why this candidate fits this company based on their actual experience, no markdown formatting, no quotation marks around the letter. Return only the cover letter text with no preamble.`;

  const raw = await callGemini(apiKey, prompt, { temperature: 0.7, maxOutputTokens: 1024 });
  return raw.trim();
}

export async function generateWarmupQuestion(
  apiKey: string,
  topic: string,
): Promise<{ question: string; options: string[]; correctIndex: number; explanation: string }> {
  const prompt = `Generate exactly one multiple-choice backend engineering interview question on the topic: ${topic}. Make it sharp and realistic, the kind of question that gets asked in a 45-minute technical screen. Return ONLY valid JSON with this shape: { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }`;

  const raw = await callGemini(apiKey, prompt, { temperature: 0.7, maxOutputTokens: 512 });

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
