import { Download } from 'lucide-react';
import { useProgress } from '../hooks/useProgress';
import { allCodingProblems } from '../data/coding';
import { exportJSON } from '../lib/storage';
import { ReadinessGauge } from '../components/ReadinessGauge';
import { ProgressBar } from '../components/ProgressBar';
import { Heatmap } from '../components/Heatmap';

function downloadProgress() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backend-interview-forge-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function Progress() {
  const p = useProgress();

  // Coding stats by category.
  const codingByCategory = new Map<string, { solved: number; total: number }>();
  for (const prob of allCodingProblems) {
    const c = codingByCategory.get(prob.category) ?? { solved: 0, total: 0 };
    c.total += 1;
    if (p.state.codingProgress[prob.id]?.solved) c.solved += 1;
    codingByCategory.set(prob.category, c);
  }
  const attempts = Object.values(p.state.codingProgress).filter((c) => c.attempts > 0);
  const avgAttempts = attempts.length
    ? (attempts.reduce((a, c) => a + c.attempts, 0) / attempts.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Progress report</h2>
          <p className="text-sm text-muted">Where you stand and what to focus on next.</p>
        </div>
        <button
          onClick={downloadProgress}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        >
          <Download className="h-4 w-4" /> Export JSON
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-6">
          <ReadinessGauge value={p.overallReadiness} />
          <p className="mt-3 text-sm text-muted">Overall readiness</p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Category breakdown</h3>
          <div className="space-y-4">
            {p.categories.map((c) => (
              <div key={c.meta.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{c.meta.label}</span>
                  <span className="text-muted">
                    {c.answered}/{c.total} answered · {c.accuracy}% accuracy
                  </span>
                </div>
                <ProgressBar value={c.score} tone={c.score >= 60 ? 'success' : c.score > 0 ? 'warning' : 'primary'} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard label="Due for review" value={p.totalDueCount} tone="text-warning" />
        <StatCard label="Mastered (4+ streak)" value={p.totalMastered} tone="text-success" />
        <StatCard label="Struggling" value={p.totalStruggling} tone="text-danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-semibold">Coding by category</h3>
          <div className="space-y-3">
            {Array.from(codingByCategory.entries()).map(([cat, s]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="capitalize">{cat.replace(/-/g, ' ')}</span>
                <span className="text-muted">
                  {s.solved}/{s.total} solved
                </span>
              </div>
            ))}
            <div className="mt-2 border-t border-border pt-2 text-sm text-muted">
              Average attempts per problem: <span className="font-medium text-text">{avgAttempts}</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-2 font-semibold">Focus on these</h3>
          {p.weakAreas.length === 0 ? (
            <p className="text-sm text-muted">No weak areas yet — keep going to surface them.</p>
          ) : (
            <ul className="space-y-2">
              {p.weakAreas.slice(0, 5).map((w) => (
                <li key={w.meta.id} className="flex items-center justify-between text-sm">
                  <span>{w.meta.label}</span>
                  <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">{w.score}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Study history</h3>
          <div className="flex gap-4 text-sm text-muted">
            <span>{p.streak.totalDays} active days</span>
            <span>{p.streak.current}d streak</span>
            <span>best {p.streak.best}d</span>
          </div>
        </div>
        <Heatmap cells={p.heatmap} />
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className={`text-3xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}
