import { Link, useNavigate } from 'react-router-dom';
import { Download, BookOpenCheck, Trophy, Flame, AlertTriangle } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { exportJSON, todayKey } from '../lib/storage';
import { computeStreaks, buildHeatmap, type HeatCell } from '../lib/scoring';
import { ProgressBar } from '../components/ProgressBar';
import { Heatmap } from '../components/Heatmap';
import { COURSES } from '../data/courseConfig';
import { courseProgress, overallChapterProgress } from '../lib/courses';

function downloadProgress() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backend-interview-forge-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function chunkIntoWeeks(cells: HeatCell[]): HeatCell[][] {
  const weeks: HeatCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function monthLabels(weeks: HeatCell[][]): Array<{ text: string; col: number }> {
  const labels: Array<{ text: string; col: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    if (!week[0]) return;
    const m = new Date(week[0].date + 'T00:00:00').getMonth();
    if (m !== lastMonth) {
      labels.push({ text: MONTH_NAMES[m], col: wi });
      lastMonth = m;
    }
  });
  return labels;
}

const STATUS_ORDER: Record<string, number> = {
  'in-progress': 0,
  completed: 1,
  'not-started': 2,
  mastered: 3,
};

const STATUS_BADGE: Record<string, string> = {
  mastered: 'bg-success/15 text-success',
  completed: 'bg-primary/15 text-primary',
  'in-progress': 'bg-amber-400/15 text-amber-400',
  'not-started': 'bg-surface-2 text-muted',
};

export function Progress() {
  const navigate = useNavigate();
  const state = useProgressState();

  const overall = overallChapterProgress(state);
  const { current: currentStreak, best: longestStreak } = computeStreaks(state.studyHistory);
  const coursesMasteredCount = COURSES.filter(
    (c) => courseProgress(c.id, state).status === 'mastered',
  ).length;

  // Rows sorted: in-progress → not-started/completed → mastered
  const rows = COURSES.map((course) => {
    const prog = courseProgress(course.id, state);
    const mp = state.moduleProgress[course.id];
    return { course, prog, bestScore: mp?.bestScore ?? 0 };
  }).sort((a, b) => (STATUS_ORDER[a.prog.status] ?? 2) - (STATUS_ORDER[b.prog.status] ?? 2));

  // Weak spots: courses with a score attempt below 70%
  const weakSpots = rows
    .filter(({ bestScore }) => bestScore > 0 && bestScore < 70)
    .sort((a, b) => a.bestScore - b.bestScore)
    .slice(0, 3);

  // Heatmap data
  const heatCells = buildHeatmap(state.studyHistory, 90);
  const weeks = chunkIntoWeeks(heatCells);
  const labels = monthLabels(weeks);

  // Active study days in last 90 days (any activity counts)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  const ninetyDaysAgoKey = todayKey(ninetyDaysAgo);
  const activeDays = Object.entries(state.studyHistory).filter(
    ([key, entry]) =>
      key >= ninetyDaysAgoKey &&
      (entry.questionsAnswered > 0 || entry.chaptersRead > 0),
  ).length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Progress</h2>

      {/* Section 1  -  Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <BookOpenCheck className="mb-3 h-5 w-5 text-primary" />
          <div className="text-3xl font-bold text-primary">{overall.read}</div>
          <div className="mt-1 text-sm font-medium text-text">Chapters read</div>
          <div className="text-xs text-muted">of {overall.total} total</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <Trophy className="mb-3 h-5 w-5 text-success" />
          <div className="text-3xl font-bold text-success">{coursesMasteredCount}</div>
          <div className="mt-1 text-sm font-medium text-text">Courses mastered</div>
          <div className="text-xs text-muted">of {COURSES.length} courses</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <Flame className="mb-3 h-5 w-5 text-amber-400" />
          <div className="text-3xl font-bold text-amber-400">{currentStreak}</div>
          <div className="mt-1 text-sm font-medium text-text">Current streak</div>
          <div className="text-xs text-muted">days</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <Flame className="mb-3 h-5 w-5 text-amber-400/50" />
          <div className="text-3xl font-bold text-amber-400/70">{longestStreak}</div>
          <div className="mt-1 text-sm font-medium text-text">Longest streak</div>
          <div className="text-xs text-muted">days ever</div>
        </div>
      </div>

      {/* Section 2  -  Per-course progress table */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold">Course progress</h3>
        </div>
        <div className="divide-y divide-border">
          {rows.map(({ course, prog, bestScore }) => {
            const Icon = course.icon;
            return (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="flex cursor-pointer items-center gap-4 px-5 py-3 transition hover:bg-surface-2"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${course.tint}`}
                >
                  <Icon className={`h-4 w-4 ${course.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">{course.title}</span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="w-10 text-right text-xs tabular-nums text-muted">
                        {prog.read}/{prog.total}
                      </span>
                      <span className="w-10 text-right text-xs tabular-nums text-muted">
                        {bestScore > 0 ? `${bestScore}%` : ' - '}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[prog.status] ?? STATUS_BADGE['not-started']}`}
                      >
                        {prog.statusLabel}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={prog.percent} tone="primary" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3  -  Study heatmap */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Study history</h3>
          <span className="text-sm text-muted">{activeDays} active study days in the last 90 days</span>
        </div>
        {/* Month labels aligned to week columns */}
        <div className="mb-0.5 flex gap-1">
          {weeks.map((_, wi) => {
            const label = labels.find((l) => l.col === wi);
            return (
              <div key={wi} className="w-3 text-[10px] leading-none text-muted">
                {label?.text ?? ''}
              </div>
            );
          })}
        </div>
        <Heatmap cells={heatCells} />
      </section>

      {/* Section 4  -  Weak spots */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-semibold">Weak spots</h3>
        {weakSpots.length === 0 ? (
          <p className="text-sm text-muted">No weak spots yet  -  keep going.</p>
        ) : (
          <div className="space-y-3">
            {weakSpots.map(({ course, bestScore }) => {
              const Icon = course.icon;
              return (
                <div key={course.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${course.tint}`}
                  >
                    <Icon className={`h-4 w-4 ${course.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{course.title}</span>
                    <span className="ml-2 text-sm text-warning">Best score: {bestScore}%</span>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:text-text"
                  >
                    Review
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Weak spots callout if none yet but user has started */}
      {weakSpots.length === 0 && overall.read > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/50 px-5 py-4 text-sm text-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted/60" />
          <span>
            Weak spots appear once you complete a chapter quiz and score below 70%. Start a quiz from
            any chapter page.
          </span>
        </div>
      )}

      {/* Section 5  -  Data export */}
      <div className="flex justify-end">
        <button
          onClick={downloadProgress}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        >
          <Download className="h-4 w-4" /> Export progress JSON
        </button>
      </div>
    </div>
  );
}
