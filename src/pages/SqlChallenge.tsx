import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { sqlById } from '../data/sql';
import { getState, saveSqlAttempt, setSqlSelfCorrect } from '../lib/storage';
import { CodeEditor } from '../components/CodeEditor';
import { Markdown } from '../components/Markdown';
import { ConfirmButton } from '../components/Confirm';
import { DifficultyBadge } from '../components/DifficultyBadge';

export function SqlChallenge() {
  const { id = '' } = useParams();
  const challenge = sqlById[id];
  const existing = getState().sqlProgress[id];

  const [query, setQuery] = useState(existing?.lastQuery ?? '-- write your query here\n');
  const [revealed, setRevealed] = useState(false);

  if (!challenge) return <p className="text-sm text-muted">Challenge not found.</p>;

  const selfCorrect = getState().sqlProgress[id]?.selfCorrect;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/sql" className="text-sm text-muted hover:text-text">
          ← SQL
        </Link>
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          {challenge.title}
          <DifficultyBadge level={challenge.difficulty} />
        </h2>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <Markdown>{challenge.problem}</Markdown>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col">
          <div className="h-[40vh] overflow-hidden rounded-xl border border-border bg-surface">
            <CodeEditor
              value={query}
              onChange={(v) => {
                setQuery(v);
                saveSqlAttempt(id, v);
              }}
              language="sql"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">Schema</h3>
            <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">
              <code className="font-mono">{challenge.schema}</code>
            </pre>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">Sample data</h3>
            <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">
              <code className="font-mono">{challenge.sampleData}</code>
            </pre>
          </div>
        </div>
      </div>

      {!revealed ? (
        <ConfirmButton
          question="Reveal the answer?"
          confirmLabel="Reveal"
          onConfirm={() => setRevealed(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Reveal answer
        </ConfirmButton>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-2 text-sm font-semibold text-primary">Model answer</h3>
              <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">
                <code className="font-mono">{challenge.modelAnswer}</code>
              </pre>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-2 text-sm font-semibold">Explanation</h3>
              <Markdown>{challenge.explanation}</Markdown>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">Did you get it right?</span>
            <button
              onClick={() => setSqlSelfCorrect(id, true)}
              className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
                selfCorrect === true ? 'border-success bg-success/15 text-success' : 'border-border text-muted hover:text-text'
              }`}
            >
              <Check className="h-4 w-4" /> Yes
            </button>
            <button
              onClick={() => setSqlSelfCorrect(id, false)}
              className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
                selfCorrect === false ? 'border-danger bg-danger/15 text-danger' : 'border-border text-muted hover:text-text'
              }`}
            >
              <X className="h-4 w-4" /> No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
