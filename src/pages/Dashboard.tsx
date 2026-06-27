import { Link } from 'react-router-dom';
import { BookOpenCheck, Trophy, Flame, Timer, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { MetricCard } from '../components/MetricCard';
import { computeStreaks } from '../lib/scoring';
import { todayKey } from '../lib/storage';
import { COURSES, courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import {
  overallChapterProgress,
  coursesMastered,
  continueTarget,
  courseProgress,
} from '../lib/courses';

const STATUS_STYLES: Record<string, string> = {
  mastered: 'bg-success/15 text-success',
  completed: 'bg-primary/15 text-primary',
  'in-progress': 'bg-amber-400/15 text-amber-400',
  'not-started': 'bg-surface-2 text-muted',
};

export function Dashboard() {
  const state = useProgressState();

  const overall = overallChapterProgress(state);
  const mastered = coursesMastered(state);
  const streak = computeStreaks(state.studyHistory);
  const todayEntry = state.studyHistory[todayKey()];
  const todayMinutes = todayEntry?.minutesSpent ?? 0;
  const chaptersReadToday = todayEntry?.chaptersRead ?? 0;
  const questionsAnsweredToday = todayEntry?.questionsAnswered ?? 0;

  const studiedToday = questionsAnsweredToday > 0 || chaptersReadToday > 0;

  const goalProgress = Math.max(chaptersReadToday / 2, questionsAnsweredToday / 5);
  const goalMet = goalProgress >= 1;

  const target = continueTarget(state);
  const targetCourse = target ? courseConfigById[target.courseId] : null;
  const targetChapter = target
    ? moduleById[target.courseId]?.lessons.find((l) => l.id === target.chapterId)
    : null;
  const started = overall.read > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted">Your backend engineering learning path.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={BookOpenCheck}
          label="Chapters read"
          value={overall.read}
          sub={`of ${overall.total}`}
          accent="text-primary"
        />
        <MetricCard
          icon={Trophy}
          label="Courses mastered"
          value={mastered}
          sub={`of ${COURSES.length}`}
          accent="text-success"
        />
        <MetricCard
          icon={Flame}
          label="Day streak"
          value={`${streak.current}d`}
          sub={`best ${streak.best}d`}
          accent="text-amber-400"
        />
        <MetricCard
          icon={Timer}
          label="Today's minutes"
          value={todayMinutes}
          sub="keep it going"
          accent="text-sky-400"
        />
      </div>

      {/* Study streak banner  -  hidden for brand-new users */}
      {started && (
        studiedToday ? (
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-5 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <p className="text-sm">
              Great work today.{' '}
              <span className="font-semibold text-success">{streak.current} day streak</span>{' '}
              and counting.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-5 py-3">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm">You haven&apos;t studied today yet. Keep your streak alive.</p>
            </div>
            {target && (
              <Link
                to={`/courses/${target.courseId}/${target.chapterId}`}
                className="shrink-0 rounded-lg bg-warning/20 px-3 py-1.5 text-xs font-semibold text-warning transition hover:bg-warning/30"
              >
                Start studying
              </Link>
            )}
          </div>
        )
      )}

      {/* Daily goal row */}
      {started && (
        <div className="rounded-xl border border-border bg-surface px-5 py-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Daily goal</span>
            {goalMet ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Daily goal complete
              </span>
            ) : (
              <span className="text-xs text-muted">
                Today: {chaptersReadToday} chapters read · {questionsAnsweredToday} questions answered
              </span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${goalMet ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, goalProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Continue learning banner */}
      {target && targetCourse && targetChapter && (
        <Link
          to={`/courses/${target.courseId}/${target.chapterId}`}
          className="group flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 transition hover:border-primary/50"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${targetCourse.tint}`}>
              <targetCourse.icon className={`h-6 w-6 ${targetCourse.color}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wider text-primary">
                {started ? 'Continue learning' : 'Start learning'}
              </div>
              <div className="truncate font-semibold">{targetChapter.title}</div>
              <div className="truncate text-sm text-muted">{targetCourse.title}</div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Course grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">All courses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => {
            const Icon = course.icon;
            const prog = courseProgress(course.id, state);
            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${course.tint}`}>
                    <Icon className={`h-6 w-6 ${course.color}`} />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      STATUS_STYLES[prog.status] ?? STATUS_STYLES['not-started']
                    }`}
                  >
                    {prog.statusLabel}
                  </span>
                </div>
                <h3 className="font-semibold">{course.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{course.description}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                    <span className="tabular-nums">
                      {prog.read}/{prog.total} chapters
                    </span>
                    <span className="tabular-nums">{prog.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${course.bar}`}
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
