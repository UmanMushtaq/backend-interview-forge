import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { allSqlChallenges } from '../data/sql';
import { useProgressState } from '../hooks/useProgress';
import { DifficultyBadge } from '../components/DifficultyBadge';

export function SqlList() {
  const state = useProgressState();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">SQL challenges</h2>
        <p className="text-sm text-muted">Write queries against a fintech schema, then compare to the model answer.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allSqlChallenges.map((c) => {
          const p = state.sqlProgress[c.id];
          return (
            <Link
              key={c.id}
              to={`/sql/${c.id}`}
              className="rounded-xl border border-border bg-surface p-4 transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{c.title}</h3>
                {p?.selfCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DifficultyBadge level={c.difficulty} />
                {c.concepts.slice(0, 2).map((k) => (
                  <span key={k} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {k}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
