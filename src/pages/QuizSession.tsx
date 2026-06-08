import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, RotateCcw, Lightbulb } from 'lucide-react';
import { quizzesByCategory, selectDueQuizQuestions } from '../data/quizzes';
import { CATEGORY_BY_ID } from '../lib/categories';
import { getState, recordQuizAnswer } from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
import { Markdown } from '../components/Markdown';
import { Callout } from '../components/Callout';
import { DifficultyBadge } from '../components/DifficultyBadge';
import type { QuizQuestion, QuizCategory } from '../types';

const DIFFICULTIES = ['all', 'foundation', 'core', 'expert'] as const;

export function QuizSession() {
  const { category = '' } = useParams();
  const isReview = category === 'review';
  const meta = CATEGORY_BY_ID[category];

  // Snapshot the question pool once per visit.
  const [pool] = useState<QuizQuestion[]>(() =>
    isReview
      ? selectDueQuizQuestions(getState().quizProgress)
      : quizzesByCategory[category as QuizCategory] ?? [],
  );

  const [subcategory, setSubcategory] = useState('all');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('all');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const subcategories = useMemo(
    () => ['all', ...Array.from(new Set(pool.map((q) => q.subcategory)))],
    [pool],
  );

  const questions = useMemo(
    () =>
      pool.filter(
        (q) =>
          (subcategory === 'all' || q.subcategory === subcategory) &&
          (difficulty === 'all' || q.difficulty === difficulty),
      ),
    [pool, subcategory, difficulty],
  );

  // Reset position whenever the filtered set changes.
  useEffect(() => {
    setIndex(0);
    setSelected(null);
  }, [subcategory, difficulty]);

  const current = questions[index];
  const answered = selected !== null;
  const finished = index >= questions.length && questions.length > 0;

  function choose(i: number) {
    if (answered || !current) return;
    setSelected(i);
    recordQuizAnswer(current, i);
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  // Keyboard shortcuts: 1-4 to answer, Enter/N for next.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (!answered && ['1', '2', '3', '4'].includes(e.key)) {
        const i = Number(e.key) - 1;
        if (i < current.options.length) choose(i);
      } else if (answered && (e.key === 'Enter' || e.key.toLowerCase() === 'n')) {
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (pool.length === 0) {
    return (
      <Empty
        title={isReview ? 'Nothing due for review' : 'No questions yet'}
        hint={isReview ? 'Come back after answering more questions.' : 'This category has no questions.'}
      />
    );
  }

  if (finished || !current) {
    const answeredCount = questions.length;
    return (
      <Empty
        title="Session complete"
        hint={`You went through ${answeredCount} question${answeredCount === 1 ? '' : 's'}. Reviewed answers update your readiness and review schedule.`}
      />
    );
  }

  function optionClass(i: number): string {
    if (!answered) return 'border-border hover:border-primary/60 hover:bg-surface-2 cursor-pointer';
    if (i === current!.correctIndex) return 'border-success bg-success/15';
    if (i === selected) return 'border-danger bg-danger/15';
    return 'border-border opacity-50';
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/quiz" className="text-sm text-muted hover:text-text">
            ← Quizzes
          </Link>
          <h2 className="text-xl font-semibold">
            {isReview ? 'Smart review' : meta?.label ?? category}
          </h2>
        </div>
        <span className="text-sm text-muted">
          {index + 1} / {questions.length}
        </span>
      </div>

      <ProgressBar value={(index / questions.length) * 100} />

      {!isReview && (
        <div className="flex flex-wrap gap-2">
          {subcategories.map((s) => (
            <button
              key={s}
              onClick={() => setSubcategory(s)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                subcategory === s ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted hover:text-text'
              }`}
            >
              {s.replace(/-/g, ' ')}
            </button>
          ))}
          <span className="mx-1 w-px bg-border" />
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                difficulty === d ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted hover:text-text'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-3 flex items-center gap-2">
          <DifficultyBadge level={current.difficulty} />
          <span className="text-xs capitalize text-muted">{current.subcategory.replace(/-/g, ' ')}</span>
        </div>
        <div className="text-lg font-medium">
          <Markdown>{current.question}</Markdown>
        </div>

        <div className="mt-5 space-y-3">
          {current.options.map((opt, i) => (
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
                {selected === current.correctIndex ? (
                  <span className="text-success">Correct</span>
                ) : (
                  <span className="text-danger">Not quite</span>
                )}
              </div>
              <Markdown>{current.explanation}</Markdown>
            </div>
            {current.interviewTip && (
              <Callout title="Interview tip" icon={Lightbulb}>
                {current.interviewTip}
              </Callout>
            )}
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {index + 1 < questions.length ? 'Next' : 'Finish'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <RotateCcw className="mx-auto mb-4 h-8 w-8 text-muted" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <Link
        to="/quiz"
        className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Back to quizzes
      </Link>
    </div>
  );
}
