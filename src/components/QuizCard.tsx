import { Link } from 'react-router-dom';
import type { CategorySummary } from '../hooks/useProgress';
import { ProgressBar } from './ProgressBar';

export function QuizCard({ summary }: { summary: CategorySummary }) {
  const { meta, total, answered, score, dueCount } = summary;
  const Icon = meta.icon;
  return (
    <Link
      to={`/quiz/${meta.id}`}
      className="group rounded-xl border border-border bg-surface p-5 transition hover:border-primary/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-surface-2 p-2">
            <Icon className={`h-5 w-5 ${meta.accent}`} />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">{meta.label}</h3>
            <p className="text-xs text-muted">
              {answered}/{total} answered
            </p>
          </div>
        </div>
        {dueCount > 0 && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            {dueCount} due
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted">Readiness</span>
          <span className="font-medium">{score}%</span>
        </div>
        <ProgressBar value={score} tone={score >= 60 ? 'success' : score > 0 ? 'warning' : 'primary'} />
      </div>
      <div className="mt-4 text-sm font-medium text-primary">
        {answered > 0 ? 'Continue' : 'Start'} {'→'}
      </div>
    </Link>
  );
}
