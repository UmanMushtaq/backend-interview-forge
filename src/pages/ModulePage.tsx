import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronDown, RefreshCw, Trophy, RotateCcw, GraduationCap } from 'lucide-react';
import { moduleById } from '../data/learn';
import { poolForModule, pickModuleQuiz } from '../lib/learn';
import {
  getState,
  markLessonRead,
  recordModuleAttempt,
  MODULE_PASS_THRESHOLD,
} from '../lib/storage';
import { useProgressState } from '../hooks/useProgress';
import { Markdown } from '../components/Markdown';
import { DifficultyBadge } from '../components/DifficultyBadge';
import type { QuizQuestion } from '../types';

type Mode = 'learn' | 'test' | 'result';

export function ModulePage() {
  const { moduleId = '' } = useParams();
  const mod = moduleById[moduleId];
  const state = useProgressState();

  const [mode, setMode] = useState<Mode>('learn');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);

  if (!mod) return <p className="text-sm text-muted">Module not found.</p>;

  const progress = state.moduleProgress[moduleId];
  const poolSize = poolForModule(mod).length;

  function toggleLesson(id: string) {
    setOpen((prev) => {
      const nextOpen = new Set(prev);
      if (nextOpen.has(id)) {
        nextOpen.delete(id);
      } else {
        nextOpen.add(id);
        markLessonRead(moduleId, id);
      }
      return nextOpen;
    });
  }

  function startTest() {
    const seen = getState().moduleProgress[moduleId]?.seenQuestionIds ?? [];
    setQuiz(pickModuleQuiz(mod, seen));
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setMode('test');
  }

  function choose(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === quiz[index].correctIndex) setCorrect((c) => c + 1);
  }

  function next() {
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      const s = recordModuleAttempt(moduleId, quiz.map((q) => q.id), correct, quiz.length);
      setScore(s);
      setMode('result');
    }
  }

  const Header = (
    <div>
      <Link to="/learn" className="text-sm text-muted hover:text-text">
        ← Learn
      </Link>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <GraduationCap className="h-5 w-5 text-primary" />
        {mod.title}
      </h2>
      <p className="text-sm text-muted">{mod.blurb}</p>
    </div>
  );

  // ---- LEARN MODE ----------------------------------------------------------
  if (mode === 'learn') {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {Header}
        {progress?.status === 'needs-review' && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            You scored {progress.lastScore}% last time. Review the lessons below, then take a fresh test.
          </div>
        )}
        {progress?.status === 'mastered' && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            <Trophy className="h-4 w-4" /> Mastered with a best score of {progress.bestScore}%. Retake any time to keep it sharp.
          </div>
        )}

        <div className="space-y-3">
          {mod.lessons.map((lesson) => {
            const isOpen = open.has(lesson.id);
            const read = progress?.lessonsRead.includes(lesson.id);
            return (
              <div key={lesson.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <button
                  onClick={() => toggleLesson(lesson.id)}
                  className="flex w-full items-center justify-between gap-2 p-4 text-left"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <BookOpen className={`h-4 w-4 ${read ? 'text-success' : 'text-muted'}`} />
                    {lesson.title}
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-border p-4 animate-slide-down">
                    <Markdown>{lesson.content}</Markdown>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-border bg-surface/90 p-4 backdrop-blur">
          <span className="text-sm text-muted">
            {poolSize} questions in the pool · pass at {MODULE_PASS_THRESHOLD}%
          </span>
          <button
            onClick={startTest}
            disabled={poolSize === 0}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {progress?.attempts ? 'Take a fresh test' : 'Test me'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---- TEST MODE -----------------------------------------------------------
  if (mode === 'test') {
    const q = quiz[index];
    if (!q) {
      return (
        <div className="mx-auto max-w-3xl space-y-4">
          {Header}
          <p className="text-sm text-muted">No questions available for this module yet.</p>
        </div>
      );
    }
    const answered = selected !== null;
    const optionClass = (i: number) => {
      if (!answered) return 'border-border hover:border-primary/60 hover:bg-surface-2 cursor-pointer';
      if (i === q.correctIndex) return 'border-success bg-success/15';
      if (i === selected) return 'border-danger bg-danger/15';
      return 'border-border opacity-50';
    };
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{mod.title} — test</h2>
          <span className="text-sm text-muted">
            {index + 1} / {quiz.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / quiz.length) * 100}%` }} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-3">
            <DifficultyBadge level={q.difficulty} />
          </div>
          <div className="text-lg font-medium">
            <Markdown>{q.question}</Markdown>
          </div>
          <div className="mt-5 space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${optionClass(i)}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-xs text-muted">
                  {i + 1}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
          {answered && (
            <div className="mt-5 space-y-4 animate-slide-down">
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="mb-1 text-sm font-semibold">
                  {selected === q.correctIndex ? (
                    <span className="text-success">Correct</span>
                  ) : (
                    <span className="text-danger">Not quite</span>
                  )}
                </div>
                <Markdown>{q.explanation}</Markdown>
              </div>
              <button
                onClick={next}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {index + 1 < quiz.length ? 'Next' : 'See result'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- RESULT MODE ---------------------------------------------------------
  const passed = score >= MODULE_PASS_THRESHOLD;
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      {passed ? (
        <Trophy className="mx-auto mb-4 h-12 w-12 text-success" />
      ) : (
        <RotateCcw className="mx-auto mb-4 h-12 w-12 text-warning" />
      )}
      <h2 className="text-2xl font-bold">{score}%</h2>
      <p className="mt-2 text-sm text-muted">
        {passed
          ? `You mastered ${mod.title}! Pass mark is ${MODULE_PASS_THRESHOLD}%.`
          : `Below the ${MODULE_PASS_THRESHOLD}% pass mark. Review the lessons and try again — you'll get a fresh set of questions.`}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {passed ? (
          <>
            <Link to="/learn" className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-text">
              Back to Learn
            </Link>
            <button
              onClick={startTest}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" /> Retake (new questions)
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setMode('learn')}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-text"
            >
              <BookOpen className="h-4 w-4" /> Review lessons
            </button>
            <button
              onClick={startTest}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" /> Try again (new questions)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
