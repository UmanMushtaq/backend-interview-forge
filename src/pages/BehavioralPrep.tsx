import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Loader2, Users } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { generateBehavioralQuestion, scoreBehavioralAnswer } from '../lib/gemini';

const STAR_PARTS = [
  { letter: 'S', label: 'Situation', desc: 'The context you were in.', color: 'text-sky-400 bg-sky-400/10' },
  { letter: 'T', label: 'Task', desc: 'What you were responsible for.', color: 'text-violet-400 bg-violet-400/10' },
  { letter: 'A', label: 'Action', desc: 'The specific steps you took.', color: 'text-amber-400 bg-amber-400/10' },
  { letter: 'R', label: 'Result', desc: 'The measurable outcome.', color: 'text-success bg-success/10' },
];

const CATEGORIES = [
  'Leadership',
  'Conflict Resolution',
  'Technical Decision Making',
  'Failure and Learning',
  'Collaboration',
  'Ownership and Initiative',
  'Handling Pressure',
  'Career Motivation',
];

interface Question {
  question: string;
  competencies: string[];
  followUp: string;
}

interface Score {
  situationScore: number;
  taskScore: number;
  actionScore: number;
  resultScore: number;
  overallScore: number;
  verdict: string;
  whatWasStrong: string[];
  whatWasMissing: string[];
  improvedVersion: string;
}

function barColor(score: number): string {
  if (score >= 7) return 'bg-success';
  if (score >= 4) return 'bg-amber-400';
  return 'bg-danger';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex-1 text-center">
      <div className="mx-auto mb-2 h-24 w-4 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`w-full rounded-full transition-all duration-500 ${barColor(score)}`}
          style={{ height: `${(score / 10) * 100}%`, marginTop: `${100 - (score / 10) * 100}%` }}
        />
      </div>
      <div className="text-sm font-semibold tabular-nums">{score}/10</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

export function BehavioralPrep() {
  const state = useProgressState();
  const apiKey = state.settings.geminiApiKey ?? '';

  const [category, setCategory] = useState<string | null>(null);
  const [screen, setScreen] = useState<'select' | 'practice'>('select');
  const [question, setQuestion] = useState<Question | null>(null);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState<Score | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState('');
  const [starHelperOpen, setStarHelperOpen] = useState(false);
  const [practicedCount, setPracticedCount] = useState(0);

  async function startPractice(cat: string) {
    setCategory(cat);
    setScreen('practice');
    setPreviousQuestions([]);
    await loadQuestion(cat, []);
  }

  async function loadQuestion(cat: string, prev: string[]) {
    setLoadingQuestion(true);
    setError('');
    setAnswer('');
    setScore(null);
    try {
      const q = await generateBehavioralQuestion(apiKey, cat, prev);
      setQuestion(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate a question.');
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function submitAnswer() {
    if (!question || answer.trim().length < 80) return;
    setLoadingScore(true);
    setError('');
    try {
      const result = await scoreBehavioralAnswer(apiKey, question.question, answer, question.competencies);
      setScore(result);
      setPracticedCount((c) => c + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score your answer.');
    } finally {
      setLoadingScore(false);
    }
  }

  function nextQuestion() {
    if (!category || !question) return;
    const nextPrev = [...previousQuestions, question.question];
    setPreviousQuestions(nextPrev);
    loadQuestion(category, nextPrev);
  }

  function changeCategory() {
    setScreen('select');
    setCategory(null);
    setQuestion(null);
    setScore(null);
    setAnswer('');
    setError('');
  }

  if (!apiKey) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Behavioral Interview Prep</h1>
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock behavioral interview practice.
        </div>
      </div>
    );
  }

  // ── Screen 1: category selector ─────────────────────────────────────────
  if (screen === 'select') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Behavioral Interview Prep</h1>
          <p className="mt-2 text-sm text-muted">
            Every senior EU fintech interview has a behavioral round. Gemini plays the interviewer. You answer
            like you would in a real interview. Your answer is scored on the STAR method.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {STAR_PARTS.map((p) => (
            <div key={p.letter} className="rounded-xl border border-border bg-surface p-3">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${p.color}`}>
                {p.letter}
              </span>
              <div className="mt-1.5 text-sm font-medium">{p.label}</div>
              <div className="text-xs text-muted">{p.desc}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Pick a category</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-xl border p-4 text-left text-sm font-medium transition ${
                  category === cat
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface hover:border-primary/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => category && startPractice(category)}
          disabled={!category}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start practice
        </button>
      </div>
    );
  }

  // ── Screen 2: practice session ──────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{category}</h1>
        </div>
        <span className="text-xs text-muted">{practicedCount} question{practicedCount === 1 ? '' : 's'} practiced</span>
      </div>

      {loadingQuestion && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Generating question…
        </div>
      )}

      {error && !loadingQuestion && (
        <div className="rounded-xl border border-danger/30 bg-surface p-5 text-sm text-danger">{error}</div>
      )}

      {question && !loadingQuestion && (
        <>
          <div className="rounded-xl border border-border bg-surface p-6">
            <p className="text-lg font-medium leading-relaxed">{question.question}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {question.competencies.map((c) => (
                <span key={c} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {!score && (
            <div className="space-y-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer as you would say it in a real interview. Include the Situation, Task, Action, and Result. Be specific - vague answers score low."
                rows={8}
                className="w-full rounded-xl border border-border bg-surface p-4 text-sm outline-none focus:border-primary/50"
              />

              <div className="rounded-lg border border-border bg-surface">
                <button
                  onClick={() => setStarHelperOpen((o) => !o)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted transition hover:text-text"
                >
                  {starHelperOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  STAR structure helper
                </button>
                {starHelperOpen && (
                  <div className="space-y-1.5 border-t border-border px-4 py-3 text-sm text-muted">
                    <p><span className="font-semibold text-text">S</span> - Set the context.</p>
                    <p><span className="font-semibold text-text">T</span> - Your specific role.</p>
                    <p><span className="font-semibold text-text">A</span> - What you did and how.</p>
                    <p><span className="font-semibold text-text">R</span> - The measurable outcome.</p>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                onClick={submitAnswer}
                disabled={answer.trim().length < 80 || loadingScore}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingScore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingScore ? 'Scoring your answer...' : 'Submit answer'}
              </button>
            </div>
          )}

          {score && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex justify-center gap-6">
                  <ScoreBar label="Situation" score={score.situationScore} />
                  <ScoreBar label="Task" score={score.taskScore} />
                  <ScoreBar label="Action" score={score.actionScore} />
                  <ScoreBar label="Result" score={score.resultScore} />
                </div>

                <div className="mt-6 text-center">
                  <div className="text-4xl font-bold tabular-nums">{score.overallScore}/10</div>
                  <p className="mt-1 text-sm text-muted">{score.verdict}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-success">What was strong</h3>
                  <ul className="space-y-1.5 text-sm text-text/90">
                    {score.whatWasStrong.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-warning">What was missing</h3>
                  <ul className="space-y-1.5 text-sm text-text/90">
                    {score.whatWasMissing.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <h3 className="mb-2 text-sm font-semibold text-primary">Here is how a top candidate would answer this:</h3>
                <p className="text-sm leading-relaxed text-text/90">{score.improvedVersion}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm text-muted">
                The interviewer would then ask: <span className="text-text">{question.followUp}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={nextQuestion}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Next question
                </button>
                <button
                  onClick={changeCategory}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm transition hover:text-text"
                >
                  Change category
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
