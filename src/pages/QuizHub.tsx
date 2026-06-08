import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useProgress } from '../hooks/useProgress';
import { QuizCard } from '../components/QuizCard';

export function QuizHub() {
  const p = useProgress();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Quizzes</h2>
          <p className="text-sm text-muted">
            {p.totalDueCount > 0
              ? `${p.totalDueCount} question${p.totalDueCount === 1 ? '' : 's'} due for review`
              : 'Pick a category to drill, or review when questions come due.'}
          </p>
        </div>
        {p.totalDueCount > 0 && (
          <Link
            to="/quiz/review"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Brain className="h-4 w-4" />
            Smart review ({p.totalDueCount})
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {p.categories.map((c) => (
          <QuizCard key={c.meta.id} summary={c} />
        ))}
      </div>
    </div>
  );
}
