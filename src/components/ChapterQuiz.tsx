import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Brain } from 'lucide-react';
import { generateChapterQuiz } from '../lib/gemini';
import { recordModuleAttempt } from '../lib/storage';
import { useProgressState } from '../hooks/useProgress';
import type { QuizQuestion } from '../types';

type Phase = 'idle' | 'loading' | 'active' | 'result' | 'error';

interface Props {
  courseId: string;
  chapterId: string;
  courseTitle: string;
  chapterTitle: string;
  chapterContent: string;
}

export function ChapterQuiz({ courseId, chapterId, courseTitle, chapterTitle, chapterContent }: Props) {
  const { settings, moduleProgress } = useProgressState();
  const apiKey = settings.geminiApiKey ?? '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [usedIds, setUsedIds] = useState<string[]>([]);

  const progress = moduleProgress[courseId];
  const previousIds = [...(progress?.seenQuestionIds ?? []), ...usedIds];

  async function start() {
    if (!apiKey) return;
    setPhase('loading');
    setCurrentIndex(0);
    setSelected(null);
    setCorrectCount(0);
    try {
      const qs = await generateChapterQuiz(apiKey, courseTitle, chapterTitle, chapterContent, previousIds);
      setQuestions(qs);
      setPhase('active');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  }

  function handleSelect(index: number) {
    if (selected !== null) return;
    setSelected(index);
    if (index === questions[currentIndex].correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    } else {
      // Record all asked question ids to avoid repetition next time
      const askedIds = questions.map((q) => q.id);
      setUsedIds((prev) => [...prev, ...askedIds]);
      const finalCorrect = selected === questions[currentIndex].correctIndex
        ? correctCount
        : correctCount; // already updated via handleSelect
      recordModuleAttempt(courseId, askedIds, finalCorrect, questions.length);
      setPhase('result');
    }
  }

  const LABELS = ['A', 'B', 'C', 'D'];
  const current = questions[currentIndex];
  const passed = correctCount >= 4;

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    if (!apiKey) {
      return (
        <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          <span className="mr-1">🔑</span>
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock AI-generated chapter quizzes.
        </div>
      );
    }
    return (
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Brain className="h-4 w-4 text-primary" />
              Test yourself
            </div>
            <p className="mt-1 text-sm text-muted">5 AI-generated questions based on this chapter.</p>
          </div>
          <button
            onClick={start}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Start quiz
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Generating questions…
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="mt-8 rounded-xl border border-danger/30 bg-surface p-5">
        <p className="text-sm text-danger">{errorMessage}</p>
        <button
          onClick={start}
          className="mt-3 flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition hover:text-text"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div
        className={`mt-8 rounded-xl border p-5 ${
          passed ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
          <span>
            {correctCount} / {questions.length} correct
          </span>
        </div>
        <p className={`mt-1 text-sm ${passed ? 'text-success' : 'text-warning'}`}>
          {passed ? 'Well done!' : 'Review the chapter and try again.'}
        </p>
        <button
          onClick={start}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm transition hover:text-text"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {passed ? 'Retake with new questions' : 'Try again (new questions)'}
        </button>
      </div>
    );
  }

  // ── Active ────────────────────────────────────────────────────────────────
  return (
    <div className="mt-8 rounded-xl border border-border bg-surface p-5">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5 font-medium text-primary">
            <Brain className="h-3.5 w-3.5" /> Chapter quiz
          </span>
          <span>
            Q {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <p className="mb-4 text-sm font-medium leading-relaxed">{current.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correctIndex;
          const isSelected = i === selected;
          let cls = 'w-full rounded-lg border px-4 py-3 text-left text-sm transition min-h-[44px] ';
          if (selected === null) {
            cls += 'border-border hover:border-primary/50 hover:bg-primary/5';
          } else if (isCorrect) {
            cls += 'border-success bg-success/10 text-success font-medium';
          } else if (isSelected) {
            cls += 'border-danger bg-danger/10 text-danger';
          } else {
            cls += 'border-border opacity-50';
          }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)}>
              <span className="mr-2 font-mono text-xs font-bold opacity-60">{LABELS[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {selected !== null && (
        <div className="mt-4 rounded-lg bg-surface-2 p-4 text-sm leading-relaxed text-text/80">
          <span className="font-semibold text-text">Explanation: </span>
          {current.explanation}
        </div>
      )}

      {/* Next / See result */}
      {selected !== null && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleNext}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {currentIndex < questions.length - 1 ? 'Next →' : 'See result'}
          </button>
        </div>
      )}
    </div>
  );
}
