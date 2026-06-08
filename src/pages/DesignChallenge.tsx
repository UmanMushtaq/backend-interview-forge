import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Play, Pause } from 'lucide-react';
import { designById } from '../data/design';
import { getState, saveDesignAnswer, setDesignScore } from '../lib/storage';
import { Markdown } from '../components/Markdown';
import { ConfirmButton } from '../components/Confirm';
import { DifficultyBadge } from '../components/DifficultyBadge';
import type { DesignSelfScore } from '../types';

const SCORE_KEYS: (keyof DesignSelfScore)[] = ['requirements', 'dataModel', 'api', 'scaling', 'tradeoffs'];

function mmss(total: number): string {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function DesignChallenge() {
  const { id = '' } = useParams();
  const challenge = designById[id];
  const existing = getState().designProgress[id];

  const [answer, setAnswer] = useState(existing?.answer ?? '');
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState<DesignSelfScore>(
    existing?.selfScore ?? { requirements: 0, dataModel: 0, api: 0, scaling: 0, tradeoffs: 0 },
  );
  const [seconds, setSeconds] = useState(0);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => {
    if (!timerOn) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerOn]);

  if (!challenge) return <p className="text-sm text-muted">Challenge not found.</p>;

  const sections: [string, string][] = [
    ['Overview', challenge.modelAnswer.overview],
    ['Data model', challenge.modelAnswer.dataModel],
    ['API design', challenge.modelAnswer.apiDesign],
    ['Message flow', challenge.modelAnswer.messageFlow],
    ['Scaling strategy', challenge.modelAnswer.scalingStrategy],
    ['Trade-offs', challenge.modelAnswer.tradeoffs],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/design" className="text-sm text-muted hover:text-text">
            ← System design
          </Link>
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            {challenge.title}
            <DifficultyBadge level={challenge.difficulty} />
          </h2>
        </div>
        <button
          onClick={() => setTimerOn((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        >
          {timerOn ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <Clock className="h-4 w-4" />
          {mmss(seconds)}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <Markdown>{challenge.prompt}</Markdown>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">Requirements</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text/90">
              {challenge.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <h3 className="mb-2 mt-4 text-sm font-semibold">Constraints</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text/90">
              {challenge.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">Your answer</h3>
          <textarea
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              saveDesignAnswer(id, e.target.value);
            }}
            placeholder="Sketch your architecture: requirements, data model, APIs, message flow, scaling, trade-offs…"
            className="h-72 w-full resize-none rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none focus:border-primary/50"
          />
          <p className="mt-2 text-xs text-muted">Auto-saved to this device.</p>
        </div>
      </div>

      {!revealed ? (
        <ConfirmButton
          question="Reveal the model answer?"
          confirmLabel="Reveal"
          onConfirm={() => setRevealed(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Reveal model answer
        </ConfirmButton>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-surface p-4">
                <h3 className="mb-2 font-semibold text-primary">{title}</h3>
                <Markdown>{body}</Markdown>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 font-semibold">Self-score (1–5)</h3>
            <div className="space-y-4">
              {SCORE_KEYS.map((key, i) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-44 text-sm">{challenge.scoringDimensions[i] ?? key}</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={score[key] || 3}
                    onChange={(e) => {
                      const next = { ...score, [key]: Number(e.target.value) };
                      setScore(next);
                      setDesignScore(id, next);
                    }}
                    className="flex-1 accent-[rgb(var(--primary))]"
                  />
                  <span className="w-6 text-center text-sm font-medium">{score[key] || 3}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
