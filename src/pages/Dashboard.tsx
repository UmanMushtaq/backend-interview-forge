import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  Trophy,
  Flame,
  Timer,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Brain,
  BrainCircuit,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { MetricCard } from '../components/MetricCard';
import { computeStreaks } from '../lib/scoring';
import { todayKey } from '../lib/storage';
import { COURSES, courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import {
  overallChapterProgress,
  coursesMastered,
  continueTarget,
  courseProgress,
} from '../lib/courses';
import { generateWarmupQuestion } from '../lib/gemini';

const STATUS_STYLES: Record<string, string> = {
  mastered: 'bg-success/15 text-success',
  completed: 'bg-primary/15 text-primary',
  'in-progress': 'bg-amber-400/15 text-amber-400',
  'not-started': 'bg-surface-2 text-muted',
};

// ─── Daily warm-up ────────────────────────────────────────────────────────────

interface WarmupStored {
  date: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex: number | null;
}

const WARMUP_LS_KEY = 'bif:warmup';
const LABELS = ['A', 'B', 'C', 'D'];

function WarmupCard({ apiKey }: { apiKey: string }) {
  const today = todayKey();
  const topicIndex = new Date().getDate() % COURSES.length;
  const topic = COURSES[topicIndex].title;

  const [stored, setStored] = useState<WarmupStored | null>(() => {
    try {
      const raw = localStorage.getItem(WARMUP_LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as WarmupStored;
      return parsed.date === today ? parsed : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || stored || !apiKey) return;
    fetchedRef.current = true;
    fetchWarmup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWarmup() {
    setLoading(true);
    setError('');
    try {
      const q = await generateWarmupQuestion(apiKey, topic);
      const next: WarmupStored = { date: today, topic, ...q, selectedIndex: null };
      setStored(next);
      localStorage.setItem(WARMUP_LS_KEY, JSON.stringify(next));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate warm-up.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(index: number) {
    if (!stored || stored.selectedIndex !== null) return;
    const updated = { ...stored, selectedIndex: index };
    setStored(updated);
    localStorage.setItem(WARMUP_LS_KEY, JSON.stringify(updated));
  }

  const header = (
    <div className="mb-4 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-amber-400" />
      <span className="text-sm font-semibold">Today's warm-up</span>
      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-400">
        2 min
      </span>
      <span className="ml-auto text-xs text-muted">{topic}</span>
    </div>
  );

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5">
        {header}
        <p className="text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock daily warm-ups.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5">
      {header}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          Generating today's question…
        </div>
      )}

      {error && !loading && (
        <div className="space-y-2">
          <p className="text-sm text-danger">{error}</p>
          <button onClick={fetchWarmup} className="text-xs text-amber-400 hover:underline">
            Try again
          </button>
        </div>
      )}

      {stored && !loading && (
        <>
          {stored.selectedIndex !== null ? (
            // Already answered — show result
            <div className="space-y-3">
              <div className="space-y-2">
                {stored.options.map((opt, i) => {
                  const isCorrect = i === stored.correctIndex;
                  const isSelected = i === stored.selectedIndex;
                  let cls =
                    'w-full rounded-lg border px-4 py-2.5 text-left text-sm min-h-[44px] ';
                  if (isCorrect)
                    cls += 'border-success bg-success/10 text-success font-medium';
                  else if (isSelected)
                    cls += 'border-danger bg-danger/10 text-danger';
                  else cls += 'border-border opacity-40';
                  return (
                    <div key={i} className={cls}>
                      <span className="mr-2 font-mono text-xs font-bold opacity-60">
                        {LABELS[i]}
                      </span>
                      {opt}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-lg bg-surface p-3 text-sm leading-relaxed text-text/80">
                <span className="font-semibold text-text">Explanation: </span>
                {stored.explanation}
              </div>
              <p className="text-xs text-muted">See you tomorrow for a new one. ☕</p>
            </div>
          ) : (
            // Not yet answered
            <div className="space-y-3">
              <p className="text-sm font-medium leading-relaxed">{stored.question}</p>
              <div className="space-y-2">
                {stored.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-left text-sm transition hover:border-amber-400/50 hover:bg-amber-400/5 min-h-[44px]"
                  >
                    <span className="mr-2 font-mono text-xs font-bold opacity-60">{LABELS[i]}</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Onboarding block ─────────────────────────────────────────────────────────

function OnboardingBlock() {
  const steps = [
    {
      num: 1,
      icon: BookOpen,
      title: 'Pick a course',
      body: 'Start with NestJS if you want the highest interview impact, or JavaScript if you want to build from the ground up.',
    },
    {
      num: 2,
      icon: Brain,
      title: 'Read and get quizzed',
      body: 'Every chapter ends with a quiz. Fail it and you get fresh questions, not the same ones again.',
    },
    {
      num: 3,
      icon: BrainCircuit,
      title: 'Practice the real interview',
      body: 'Use the Interview Simulator, or go straight to the NexusPay Mock Interview to defend your own project.',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome. Let&apos;s get you ready for your next interview.
        </h1>
        <p className="mt-2 text-sm text-muted">
          12 courses, AI-generated quizzes that change every time you retry, and a mock interview
          mode that grills you on your own NexusPay project. Here is where to start.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map(({ num, icon: Icon, title, body }) => (
          <div key={num} className="rounded-xl border border-border bg-surface-2 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {num}
              </span>
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{title}</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/courses/nestjs"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Start with NestJS
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/interview-simulator"
          state={{ topic: 'NexusPay' }}
          className="flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-400/10 px-5 py-2.5 text-sm font-semibold text-violet-400 transition hover:bg-violet-400/20"
        >
          Try the NexusPay Mock Interview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const state = useProgressState();
  const apiKey = state.settings.geminiApiKey ?? '';

  const overall = overallChapterProgress(state);
  const mastered = coursesMastered(state);
  const streak = computeStreaks(state.studyHistory);
  const todayEntry = state.studyHistory[todayKey()];
  const todayMinutes = todayEntry?.minutesSpent ?? 0;
  const chaptersReadToday = todayEntry?.chaptersRead ?? 0;
  const questionsAnsweredToday = todayEntry?.questionsAnswered ?? 0;

  const studiedToday = questionsAnsweredToday > 0 || chaptersReadToday > 0;

  const goalProgress = Math.max(chaptersReadToday / 2, questionsAnsweredToday / 5);
  const goalMet = goalProgress >= 1;

  const target = continueTarget(state);
  const targetCourse = target ? courseConfigById[target.courseId] : null;
  const targetChapter = target
    ? moduleById[target.courseId]?.lessons.find((l) => l.id === target.chapterId)
    : null;

  const started = overall.read > 0;

  return (
    <div className="space-y-6">
      {/* Header / onboarding */}
      {started ? (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted">Your backend engineering learning path.</p>
        </div>
      ) : (
        <OnboardingBlock />
      )}

      {/* Stats grid — only for returning users */}
      {started && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            icon={BookOpenCheck}
            label="Chapters read"
            value={overall.read}
            sub={`of ${overall.total}`}
            accent="text-primary"
          />
          <MetricCard
            icon={Trophy}
            label="Courses mastered"
            value={mastered}
            sub={`of ${COURSES.length}`}
            accent="text-success"
          />
          <MetricCard
            icon={Flame}
            label="Day streak"
            value={`${streak.current}d`}
            sub={`best ${streak.best}d`}
            accent="text-amber-400"
          />
          <MetricCard
            icon={Timer}
            label="Today's minutes"
            value={todayMinutes}
            sub="keep it going"
            accent="text-sky-400"
          />
        </div>
      )}

      {/* Daily warm-up — only for returning users */}
      {started && <WarmupCard apiKey={apiKey} />}

      {/* Study streak banner */}
      {started && (
        studiedToday ? (
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-5 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <p className="text-sm">
              Great work today.{' '}
              <span className="font-semibold text-success">{streak.current} day streak</span>{' '}
              and counting.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-5 py-3">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm">You haven&apos;t studied today yet. Keep your streak alive.</p>
            </div>
            {target && (
              <Link
                to={`/courses/${target.courseId}/${target.chapterId}`}
                className="shrink-0 rounded-lg bg-warning/20 px-3 py-1.5 text-xs font-semibold text-warning transition hover:bg-warning/30"
              >
                Start studying
              </Link>
            )}
          </div>
        )
      )}

      {/* Daily goal row */}
      {started && (
        <div className="rounded-xl border border-border bg-surface px-5 py-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Daily goal</span>
            {goalMet ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Daily goal complete
              </span>
            ) : (
              <span className="text-xs text-muted">
                Today: {chaptersReadToday} chapters read · {questionsAnsweredToday} questions answered
              </span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${goalMet ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, goalProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Continue learning banner */}
      {target && targetCourse && targetChapter && (
        <Link
          to={`/courses/${target.courseId}/${target.chapterId}`}
          className="group flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 transition hover:border-primary/50"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${targetCourse.tint}`}>
              <targetCourse.icon className={`h-6 w-6 ${targetCourse.color}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wider text-primary">
                {started ? 'Continue learning' : 'Start learning'}
              </div>
              <div className="truncate font-semibold">{targetChapter.title}</div>
              <div className="truncate text-sm text-muted">{targetCourse.title}</div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Course grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">All courses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => {
            const Icon = course.icon;
            const prog = courseProgress(course.id, state);
            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${course.tint}`}>
                    <Icon className={`h-6 w-6 ${course.color}`} />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      STATUS_STYLES[prog.status] ?? STATUS_STYLES['not-started']
                    }`}
                  >
                    {prog.statusLabel}
                  </span>
                </div>
                <h3 className="font-semibold">{course.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{course.description}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                    <span className="tabular-nums">
                      {prog.read}/{prog.total} chapters
                    </span>
                    <span className="tabular-nums">{prog.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${course.bar}`}
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
