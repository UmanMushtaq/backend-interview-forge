import { Link } from 'react-router-dom';
import { Gauge, CheckCircle2, Code2, Flame, AlertTriangle, ArrowRight, Trophy } from 'lucide-react';
import { useProgress } from '../hooks/useProgress';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';
import { Heatmap } from '../components/Heatmap';

export function Dashboard() {
  const p = useProgress();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted">Your readiness across every backend interview topic.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Gauge} label="Overall readiness" value={`${p.overallReadiness}%`} sub="weighted across categories" />
        <MetricCard icon={CheckCircle2} label="Questions answered" value={p.questionsAnswered} accent="text-success" />
        <MetricCard icon={Code2} label="Coding solved" value={`${p.codingSolved}/${p.codingTotal}`} accent="text-sky-400" />
        <MetricCard icon={Flame} label="Study streak" value={`${p.streak.current}d`} accent="text-warning" sub={`best ${p.streak.best}d`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-danger" />
              Weak areas
            </h3>
            {p.weakAreas.length === 0 ? (
              p.questionsAnswered === 0 ? (
                <p className="text-sm text-muted">Answer a few questions to see where to focus.</p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-success">
                  <Trophy className="h-4 w-4" />
                  All started areas are strong.
                </p>
              )
            ) : (
              <ul className="space-y-2">
                {p.weakAreas.map((w) => (
                  <li key={w.meta.id}>
                    <Link
                      to={`/quiz/${w.meta.id}`}
                      className="flex items-center justify-between text-sm transition hover:text-primary"
                    >
                      <span>{w.meta.label}</span>
                      <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                        {w.score}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 font-semibold">Continue where you left off</h3>
            {p.state.lastActivity ? (
              <Link
                to={p.state.lastActivity.path}
                className="flex items-center justify-between rounded-lg bg-surface-2 p-3 transition hover:opacity-80"
              >
                <div>
                  <div className="text-sm font-medium">{p.state.lastActivity.label}</div>
                  <div className="text-xs text-muted">Resume</div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            ) : (
              <p className="text-sm text-muted">
                Nothing yet —{' '}
                <Link to="/quiz" className="text-primary">
                  start a quiz
                </Link>
                .
              </p>
            )}
          </section>
        </div>

        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Category breakdown</h3>
          <div className="space-y-4">
            {p.categories.map((c) => {
              const Icon = c.meta.icon;
              return (
                <div key={c.meta.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${c.meta.accent}`} />
                      {c.meta.label}
                    </span>
                    <span className="text-muted">
                      {c.score}% · {Math.round(c.meta.weight * 100)}% weight
                    </span>
                  </div>
                  <ProgressBar value={c.score} tone={c.score >= 60 ? 'success' : c.score > 0 ? 'warning' : 'primary'} />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-semibold">Study activity (last 90 days)</h3>
        <Heatmap cells={p.heatmap} />
      </section>
    </div>
  );
}
