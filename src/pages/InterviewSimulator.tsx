import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import {
  generateInterviewQuestion,
  scoreInterviewAnswer,
  generateNexusPayQuestion,
  scoreNexusPayAnswer,
} from '../lib/gemini';

// ─── Types ───────────────────────────────────────────────────────────────────

const TOPICS = [
  'NestJS',
  'Node.js',
  'TypeScript',
  'PostgreSQL',
  'Redis',
  'RabbitMQ',
  'Kafka',
  'System Design',
  'Microservices',
  'DSA',
  'NexusPay',
] as const;

const DIFFICULTIES = ['Mid', 'Senior', 'Lead'] as const;
const QUESTION_COUNTS = [3, 5, 8] as const;

const NEXUSPAY_FOCUS_AREAS = [
  'Any',
  'KYC Flow',
  'Transfer Saga',
  'Redis Usage',
  'RabbitMQ vs Kafka',
  'Bounded Contexts',
  'API Gateway',
  'Testing Strategy',
  'Docker and CI/CD',
  'gRPC and GraphQL Evolution',
] as const;

type Topic = (typeof TOPICS)[number];
type Difficulty = (typeof DIFFICULTIES)[number];
type QuestionCount = (typeof QUESTION_COUNTS)[number];
type NexusPayFocusArea = (typeof NEXUSPAY_FOCUS_AREAS)[number];

interface AnswerResult {
  score: number;
  verdict: string;
  whatYouGotRight: string[];
  whatWasMissing: string[];
  modelAnswer: string;
}

interface SessionEntry {
  question: string;
  answer: string;
  result: AnswerResult;
  focusArea?: string;
}

type Screen = 'setup' | 'in-progress' | 'report';

// ─── Score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const color =
    score >= 7
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : score >= 4
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold tabular-nums ${color} ${large ? 'h-16 w-16 text-2xl' : 'h-7 w-7 text-sm'}`}
    >
      {score}
    </span>
  );
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 7) return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (score >= 4) return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />;
  return <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({
  initialTopic,
  onStart,
}: {
  initialTopic?: Topic;
  onStart: (topic: Topic, difficulty: Difficulty, count: QuestionCount, focusArea: NexusPayFocusArea) => void;
}) {
  const { settings } = useProgressState();
  const apiKey = settings.geminiApiKey ?? '';

  const [topic, setTopic] = useState<Topic | null>(initialTopic ?? null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Senior');
  const [count, setCount] = useState<QuestionCount>(5);
  const [focusArea, setFocusArea] = useState<NexusPayFocusArea>('Any');

  // Apply initialTopic when it arrives (from navigation state)
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  if (!apiKey) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <BrainCircuit className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="mb-2 text-2xl font-bold">Interview Simulator</h1>
        <p className="mb-6 text-muted">
          Add your Gemini API key in Settings to use the Interview Simulator.
        </p>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Settings className="h-4 w-4" />
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Interview Simulator</h1>
        <p className="text-muted">
          Gemini will interview you on a topic you choose. Answer each question like you would in a
          real interview. You will get scored and feedback after each answer.
        </p>
      </div>

      {/* Topic */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Topic</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                topic === t
                  ? t === 'NexusPay'
                    ? 'border-violet-400 bg-violet-400/15 text-violet-400'
                    : 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:border-primary/50 hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* NexusPay callout */}
        {topic === 'NexusPay' && (
          <div className="mt-4 rounded-xl border border-violet-400/30 bg-violet-400/5 p-4">
            <div className="flex items-start gap-3">
              <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
              <p className="text-sm text-muted">
                This mode simulates a real interviewer who has read your CV and wants to probe your
                understanding of NexusPay. Questions will be specific, technical, and hard. No
                generic backend questions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Focus area - NexusPay only */}
      {topic === 'NexusPay' && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">
            Focus Area <span className="normal-case font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {NEXUSPAY_FOCUS_AREAS.map((f) => (
              <button
                key={f}
                onClick={() => setFocusArea(f)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  focusArea === f
                    ? 'border-violet-400 bg-violet-400/15 text-violet-400'
                    : 'border-border text-muted hover:border-violet-400/50 hover:text-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Difficulty</p>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full border px-5 py-1.5 text-sm font-medium transition ${
                difficulty === d
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:border-primary/50 hover:text-text'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Question count */}
      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">
          Number of questions
        </p>
        <div className="flex gap-2">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`rounded-full border px-5 py-1.5 text-sm font-medium transition ${
                count === n
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:border-primary/50 hover:text-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!topic}
        onClick={() => topic && onStart(topic, difficulty, count, focusArea)}
        className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {topic === 'NexusPay' ? 'Start NexusPay Interview' : 'Start Interview'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── In-progress screen ───────────────────────────────────────────────────────

function InProgressScreen({
  topic,
  difficulty,
  totalCount,
  apiKey,
  focusArea,
  onComplete,
}: {
  topic: Topic;
  difficulty: Difficulty;
  totalCount: number;
  apiKey: string;
  focusArea: NexusPayFocusArea;
  onComplete: (entries: SessionEntry[]) => void;
}) {
  const isNexusPay = topic === 'NexusPay';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [currentFocusArea, setCurrentFocusArea] = useState<string>('');
  const [hintsShown, setHintsShown] = useState(0);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState('');

  const [answer, setAnswer] = useState('');
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const prefetchedRef = useRef<{ question: string; hints: string[]; focusArea?: string } | null>(null);
  const previousQuestionsRef = useRef<string[]>([]);

  const loadQuestion = useCallback(
    async (prefetched: { question: string; hints: string[]; focusArea?: string } | null) => {
      if (prefetched) {
        setQuestion(prefetched.question);
        setHints(prefetched.hints);
        setCurrentFocusArea(prefetched.focusArea ?? '');
        setHintsShown(0);
        prefetchedRef.current = null;
        return;
      }
      setLoadingQuestion(true);
      setQuestionError('');
      try {
        if (isNexusPay) {
          const q = await generateNexusPayQuestion(
            apiKey,
            difficulty,
            previousQuestionsRef.current,
            focusArea !== 'Any' ? focusArea : undefined,
          );
          setQuestion(q.question);
          setHints(q.hints);
          setCurrentFocusArea(q.focusArea);
          setHintsShown(0);
        } else {
          const q = await generateInterviewQuestion(
            apiKey,
            topic,
            difficulty,
            previousQuestionsRef.current,
          );
          setQuestion(q.question);
          setHints(q.hints);
          setCurrentFocusArea('');
          setHintsShown(0);
        }
      } catch (e) {
        setQuestionError(e instanceof Error ? e.message : 'Failed to load question.');
      } finally {
        setLoadingQuestion(false);
      }
    },
    [apiKey, topic, difficulty, isNexusPay, focusArea],
  );

  const hasLoaded = useRef(false);
  if (!hasLoaded.current) {
    hasLoaded.current = true;
    loadQuestion(null);
  }

  const prefetchNext = useCallback(
    async (index: number) => {
      if (index >= totalCount - 1) return;
      try {
        if (isNexusPay) {
          const q = await generateNexusPayQuestion(
            apiKey,
            difficulty,
            previousQuestionsRef.current,
            focusArea !== 'Any' ? focusArea : undefined,
          );
          prefetchedRef.current = { question: q.question, hints: q.hints, focusArea: q.focusArea };
        } else {
          const q = await generateInterviewQuestion(
            apiKey,
            topic,
            difficulty,
            previousQuestionsRef.current,
          );
          prefetchedRef.current = { question: q.question, hints: q.hints };
        }
      } catch {
        // silently fail - will re-fetch when needed
      }
    },
    [apiKey, topic, difficulty, isNexusPay, focusArea, totalCount],
  );

  async function handleSubmit() {
    if (!question || answer.trim().length < 50) return;
    setScoring(true);
    setScoreError('');
    setResult(null);
    setShowModelAnswer(false);
    try {
      let r: AnswerResult;
      if (isNexusPay) {
        r = await scoreNexusPayAnswer(apiKey, question, answer.trim(), currentFocusArea);
      } else {
        r = await scoreInterviewAnswer(apiKey, question, topic, answer.trim());
      }
      setResult(r);
      previousQuestionsRef.current = [...previousQuestionsRef.current, question];
      prefetchNext(currentIndex);
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : 'Scoring failed. Try again.');
    } finally {
      setScoring(false);
    }
  }

  function handleNext() {
    if (!question || !result) return;
    const newEntry: SessionEntry = {
      question,
      answer: answer.trim(),
      result,
      focusArea: isNexusPay ? currentFocusArea : undefined,
    };
    const newEntries = [...entries, newEntry];

    if (currentIndex + 1 >= totalCount) {
      onComplete(newEntries);
      return;
    }

    setEntries(newEntries);
    setCurrentIndex(currentIndex + 1);
    setAnswer('');
    setResult(null);
    setScoreError('');
    setShowModelAnswer(false);
    setHintsShown(0);
    loadQuestion(prefetchedRef.current);
  }

  const progress = ((currentIndex + (result ? 1 : 0)) / totalCount) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Top bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted">
            Question {currentIndex + 1} of {totalCount}
          </span>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
              isNexusPay
                ? 'bg-violet-400/10 text-violet-400'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {topic}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Focus area badge (NexusPay only) */}
      {isNexusPay && currentFocusArea && !loadingQuestion && (
        <div className="mb-3">
          <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-400">
            {currentFocusArea}
          </span>
        </div>
      )}

      {/* Question card */}
      <div className="mb-5 rounded-xl border border-border bg-surface p-6">
        {loadingQuestion ? (
          <div className="flex items-center gap-3 text-muted">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Generating question…</span>
          </div>
        ) : questionError ? (
          <div className="text-red-400">
            {questionError.includes('rate limited') || questionError.includes('QUOTA_EXCEEDED') ? (
              <>
                Gemini is rate limited right now. This usually clears up by midnight Pacific time. You can also add a different API key in{' '}
                <Link to="/settings" className="underline underline-offset-2 hover:opacity-80">
                  Settings
                </Link>
                .
              </>
            ) : (
              questionError
            )}
          </div>
        ) : (
          <p className="text-xl font-medium leading-relaxed">{question}</p>
        )}
      </div>

      {/* Hints */}
      {hints.length > 0 && !loadingQuestion && (
        <div className="mb-5">
          {hintsShown === 0 ? (
            <button
              onClick={() => setHintsShown(1)}
              className="flex items-center gap-2 text-sm text-muted hover:text-text transition"
            >
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Show hint
            </button>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Lightbulb className="h-3.5 w-3.5" />
                Hint {hintsShown} of {hints.length}
              </div>
              <p className="text-sm text-muted">{hints[hintsShown - 1]}</p>
              {hintsShown < hints.length && (
                <button
                  onClick={() => setHintsShown(hintsShown + 1)}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition"
                >
                  Show next hint →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Answer textarea */}
      {!result && (
        <div className="mb-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={scoring || loadingQuestion}
            rows={7}
            placeholder="Type your answer here. Speak as you would in a real interview — explain your reasoning, not just the answer."
            className="w-full resize-none rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-muted">
            <span>
              {answer.trim().length} characters{' '}
              {answer.trim().length < 50 && answer.trim().length > 0 ? '(minimum 50)' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Submit */}
      {!result && (
        <button
          onClick={handleSubmit}
          disabled={scoring || loadingQuestion || answer.trim().length < 50}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {scoring ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Scoring your answer…
            </>
          ) : (
            'Submit answer'
          )}
        </button>
      )}

      {scoreError && (
        <p className="mt-3 text-sm text-red-400">
          {scoreError.includes('rate limited') || scoreError.includes('QUOTA_EXCEEDED') ? (
            <>
              Gemini is rate limited right now. This usually clears up by midnight Pacific time. You can also add a different API key in{' '}
              <Link to="/settings" className="underline underline-offset-2 hover:opacity-80">
                Settings
              </Link>
              .
            </>
          ) : (
            scoreError
          )}
        </p>
      )}

      {/* Score result */}
      {result && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-start gap-4">
            <ScoreBadge score={result.score} large />
            <div>
              <p className="text-sm font-semibold text-muted uppercase tracking-wider mb-1">Score</p>
              <p className="font-medium">{result.verdict}</p>
            </div>
          </div>

          {result.whatYouGotRight.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                What you got right
              </p>
              <ul className="space-y-1">
                {result.whatYouGotRight.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.whatWasMissing.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                What was missing
              </p>
              <ul className="space-y-1">
                {result.whatWasMissing.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <button
              onClick={() => setShowModelAnswer((s) => !s)}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-text transition"
            >
              {showModelAnswer ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showModelAnswer ? 'Hide model answer' : 'See model answer'}
            </button>
            {showModelAnswer && (
              <div className="mt-3 rounded-lg border border-border bg-surface-2 p-4">
                <p className="text-sm leading-relaxed text-muted">{result.modelAnswer}</p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              {currentIndex + 1 >= totalCount ? (
                <>
                  See final report
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next question
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report screen ────────────────────────────────────────────────────────────

function ReportScreen({
  topic,
  difficulty,
  count,
  entries,
  onRetake,
  onChangeTopic,
}: {
  topic: Topic;
  difficulty: Difficulty;
  count: number;
  entries: SessionEntry[];
  onRetake: () => void;
  onChangeTopic: () => void;
}) {
  const isNexusPay = topic === 'NexusPay';
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const avgScore =
    entries.length > 0
      ? Math.round((entries.reduce((s, e) => s + e.result.score, 0) / entries.length) * 10) / 10
      : 0;

  const label = isNexusPay
    ? avgScore >= 8
      ? 'You can confidently discuss NexusPay in an interview. Apply to Qonto.'
      : avgScore >= 6
        ? 'Solid foundation. Review the weak areas below before your next interview.'
        : 'Keep studying NexusPay. Focus on the NexusPay Deep Dive course.'
    : avgScore >= 8
      ? 'Strong performance'
      : avgScore >= 6
        ? 'Good  -  a few gaps to address'
        : avgScore >= 4
          ? 'Room to grow'
          : 'Keep practising';

  const labelColor =
    avgScore >= 8
      ? 'text-emerald-400'
      : avgScore >= 6
        ? 'text-primary'
        : avgScore >= 4
          ? 'text-amber-400'
          : 'text-red-400';

  const allMissing = entries.flatMap((e) => e.result.whatWasMissing);
  const missingCounts = new Map<string, number>();
  for (const m of allMissing) {
    const key = m.trim().toLowerCase().slice(0, 60);
    missingCounts.set(key, (missingCounts.get(key) ?? 0) + 1);
  }
  const weakAreas = allMissing
    .filter((m, i) => {
      const key = m.trim().toLowerCase().slice(0, 60);
      const first = allMissing.findIndex(
        (x) => x.trim().toLowerCase().slice(0, 60) === key,
      );
      return first === i;
    })
    .sort(
      (a, b) =>
        (missingCounts.get(b.trim().toLowerCase().slice(0, 60)) ?? 0) -
        (missingCounts.get(a.trim().toLowerCase().slice(0, 60)) ?? 0),
    )
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="mb-1 text-sm text-muted uppercase tracking-wider font-semibold">
          {isNexusPay ? 'NexusPay Interview Complete' : 'Interview complete'}
        </p>
        <h1 className="mb-3 text-3xl font-bold">{topic} · {difficulty}</h1>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center rounded-full border-4 border-primary/20 bg-primary/10 h-24 w-24">
            <span className="text-4xl font-bold text-primary">{avgScore}</span>
          </div>
          {isNexusPay && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Readiness score</p>
          )}
          <p className={`text-lg font-semibold ${labelColor}`}>{label}</p>
          {isNexusPay && avgScore < 6 && (
            <Link
              to="/courses/nexuspay"
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-violet-400/15 px-4 py-2 text-sm font-semibold text-violet-400 transition hover:bg-violet-400/25"
            >
              Go to NexusPay Deep Dive <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <p className="text-sm text-muted">{entries.length} questions answered</p>
        </div>
      </div>

      {/* Weakest areas */}
      {weakAreas.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Weakest areas to review
          </p>
          <ul className="space-y-1.5">
            {weakAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="mb-8 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">Question breakdown</p>
        {entries.map((entry, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
            <button
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-2 transition"
            >
              <ScoreIcon score={entry.result.score} />
              <div className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium">{entry.question}</span>
                {entry.focusArea && (
                  <span className="text-xs text-violet-400">{entry.focusArea}</span>
                )}
              </div>
              <ScoreBadge score={entry.result.score} />
              {expandedIndex === i ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
              )}
            </button>
            {expandedIndex === i && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                <p className="text-sm text-muted">{entry.result.verdict}</p>
                {entry.result.whatYouGotRight.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">What you got right</p>
                    <ul className="space-y-1">
                      {entry.result.whatYouGotRight.map((p, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entry.result.whatWasMissing.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">What was missing</p>
                    <ul className="space-y-1">
                      {entry.result.whatWasMissing.map((p, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onRetake}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          Retake on same topic
        </button>
        <button
          onClick={onChangeTopic}
          className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text"
        >
          Change topic
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function InterviewSimulator() {
  const { settings } = useProgressState();
  const apiKey = settings.geminiApiKey ?? '';
  const location = useLocation();

  const initialTopic = (location.state as { topic?: Topic } | null)?.topic ?? undefined;

  const [screen, setScreen] = useState<Screen>('setup');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Senior');
  const [count, setCount] = useState<QuestionCount>(5);
  const [focusArea, setFocusArea] = useState<NexusPayFocusArea>('Any');
  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const [sessionKey, setSessionKey] = useState(0);

  function handleStart(t: Topic, d: Difficulty, c: QuestionCount, fa: NexusPayFocusArea) {
    setTopic(t);
    setDifficulty(d);
    setCount(c);
    setFocusArea(fa);
    setEntries([]);
    setSessionKey((k) => k + 1);
    setScreen('in-progress');
  }

  function handleComplete(e: SessionEntry[]) {
    setEntries(e);
    setScreen('report');
  }

  function handleRetake() {
    setEntries([]);
    setSessionKey((k) => k + 1);
    setScreen('in-progress');
  }

  function handleChangeTopic() {
    setScreen('setup');
  }

  return (
    <div>
      {screen === 'setup' && (
        <SetupScreen initialTopic={initialTopic} onStart={handleStart} />
      )}

      {screen === 'in-progress' && topic && (
        <InProgressScreen
          key={sessionKey}
          topic={topic}
          difficulty={difficulty}
          totalCount={count}
          apiKey={apiKey}
          focusArea={focusArea}
          onComplete={handleComplete}
        />
      )}

      {screen === 'report' && topic && (
        <ReportScreen
          topic={topic}
          difficulty={difficulty}
          count={count}
          entries={entries}
          onRetake={handleRetake}
          onChangeTopic={handleChangeTopic}
        />
      )}
    </div>
  );
}
