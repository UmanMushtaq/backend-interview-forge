import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { LEARN_MODULES } from '../data/learn';
import { emptyModuleProgress } from '../lib/storage';
import { ProgressBar } from '../components/ProgressBar';
import type { ModuleStatus } from '../types';

const STATUS: Record<ModuleStatus, { label: string; cls: string }> = {
  'not-started': { label: 'Not started', cls: 'text-muted' },
  learning: { label: 'Learning', cls: 'text-warning' },
  'needs-review': { label: 'Needs review', cls: 'text-danger' },
  mastered: { label: 'Mastered', cls: 'text-success' },
};

export function LearnList() {
  const state = useProgressState();
  const mastered = LEARN_MODULES.filter((m) => state.moduleProgress[m.id]?.status === 'mastered').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <GraduationCap className="h-5 w-5 text-primary" />
          Learn
        </h2>
        <p className="text-sm text-muted">
          Study each topic, then prove it. Fail the test and you&rsquo;ll relearn and get fresh questions until you
          master it  -  {mastered}/{LEARN_MODULES.length} mastered.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEARN_MODULES.map((m) => {
          const p = state.moduleProgress[m.id] ?? emptyModuleProgress();
          const st = STATUS[p.status];
          const lessons = m.lessons.length;
          const readPct = lessons ? Math.round((p.lessonsRead.length / lessons) * 100) : 0;
          return (
            <Link
              key={m.id}
              to={`/learn/${m.id}`}
              className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{m.title}</h3>
                <span className={`whitespace-nowrap text-xs font-medium ${st.cls}`}>{st.label}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{m.blurb}</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-muted">
                  <span>{lessons} lessons</span>
                  <span>{p.bestScore > 0 ? `best ${p.bestScore}%` : 'not tested'}</span>
                </div>
                <ProgressBar
                  value={p.status === 'mastered' ? 100 : readPct}
                  tone={p.status === 'mastered' ? 'success' : p.status === 'needs-review' ? 'danger' : 'primary'}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
