import { Link } from 'react-router-dom';
import { RotateCcw, CalendarCheck } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { COURSES, courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import { getReviewQueue } from '../lib/spacedRepetition';

export function ReviewQueue() {
  const state = useProgressState();
  const queue = getReviewQueue(state, COURSES, moduleById);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-warning" />
        <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
        {queue.length > 0 && (
          <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
            {queue.length}
          </span>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
          <CalendarCheck className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted">Nothing due for review. Come back in a few days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((item) => {
            const course = courseConfigById[item.courseId];
            const Icon = course?.icon;
            return (
              <Link
                key={`${item.courseId}-${item.lessonId}`}
                to={`/courses/${item.courseId}/${item.lessonId}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning/5 p-4 transition hover:border-warning/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {Icon && course && (
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${course.tint}`}>
                      <Icon className={`h-5 w-5 ${course.color}`} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-xs text-muted">{item.courseTitle}</div>
                    <div className="truncate font-medium">{item.lessonTitle}</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted">{item.daysSinceRead} days ago</span>
                  <span className="rounded-lg bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning">
                    Review now
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
