import { useEffect, useMemo, useState } from 'react';
import { Shuffle, ChevronLeft, ChevronRight } from 'lucide-react';
import { allInterviewQuestions } from '../data/interview';
import { useProgressState } from '../hooks/useProgress';
import { setInterviewConfidence } from '../lib/storage';
import { Markdown } from '../components/Markdown';
import { DifficultyBadge } from '../components/DifficultyBadge';
import type { InterviewProgressEntry } from '../types';

const CONFIDENCE_LABELS = ['Cannot answer', 'Shaky', 'Okay', 'Solid', 'Nailed it'];

export function InterviewQA() {
  const state = useProgressState();
  const [cat, setCat] = useState('all');
  const [diff, setDiff] = useState('all');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const categories = ['all', ...Array.from(new Set(allInterviewQuestions.map((q) => q.category)))];
  const difficulties = ['all', 'mid', 'senior', 'lead'];

  const filtered = useMemo(
    () =>
      allInterviewQuestions.filter(
        (q) => (cat === 'all' || q.category === cat) && (diff === 'all' || q.difficulty === diff),
      ),
    [cat, diff],
  );

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
  }, [cat, diff]);

  const q = filtered[index];

  function go(delta: number) {
    setRevealed(false);
    setIndex((i) => (i + delta + filtered.length) % filtered.length);
  }
  function random() {
    setRevealed(false);
    setIndex(Math.floor(Math.random() * filtered.length));
  }

  const FilterPill = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
        active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted hover:text-text'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Interview Q&amp;A</h2>
        <p className="text-sm text-muted">Speak your answer out loud, then reveal the model answer and rate yourself.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <FilterPill key={c} active={cat === c} onClick={() => setCat(c)} label={c} />
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {difficulties.map((d) => (
          <FilterPill key={d} active={diff === d} onClick={() => setDiff(d)} label={d} />
        ))}
      </div>

      {!q ? (
        <p className="text-sm text-muted">No questions match these filters.</p>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DifficultyBadge level={q.difficulty} />
              <span className="text-xs capitalize text-muted">{q.category}</span>
            </div>
            <span className="text-xs text-muted">
              {index + 1} / {filtered.length}
            </span>
          </div>

          <p className="text-lg font-medium">{q.question}</p>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Reveal model answer
            </button>
          ) : (
            <div className="mt-5 space-y-4 animate-slide-down">
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <Markdown>{q.modelAnswer}</Markdown>
              </div>
              {q.followUps.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Likely follow-ups</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-text/90">
                    {q.followUps.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="mb-2 text-sm font-semibold">How confident were you?</h3>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((c) => {
                    const active = state.interviewProgress[q.id]?.confidence === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setInterviewConfidence(q.id, c as InterviewProgressEntry['confidence'])}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                          active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted hover:text-text'
                        }`}
                        title={CONFIDENCE_LABELS[c - 1]}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => go(-1)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          onClick={random}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        >
          <Shuffle className="h-4 w-4" /> Random
        </button>
        <button
          onClick={() => go(1)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
