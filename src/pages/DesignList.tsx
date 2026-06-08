import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import { allDesignChallenges } from '../data/design';
import { useProgressState } from '../hooks/useProgress';
import { DifficultyBadge } from '../components/DifficultyBadge';

export function DesignList() {
  const state = useProgressState();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">System design arena</h2>
        <p className="text-sm text-muted">Timed prompts with model answers and self-scoring.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {allDesignChallenges.map((c) => {
          const attempted = state.designProgress[c.id]?.attempted;
          return (
            <Link
              key={c.id}
              to={`/design/${c.id}`}
              className="rounded-xl border border-border bg-surface p-4 transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{c.title}</h3>
                {attempted ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted" />
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <DifficultyBadge level={c.difficulty} />
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="h-3 w-3" />
                  {c.timeEstimate}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
