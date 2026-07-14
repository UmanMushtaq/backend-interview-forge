import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Lock, Layers } from 'lucide-react';
import { ARCHITECTURE_MODULES } from '../data/architecture';
import { useProgressState } from '../hooks/useProgress';

export function ArchitectureStudioList() {
  const state = useProgressState();
  const progress = state.architectureProgress ?? {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Architecture Studio</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          Every lesson teaches one system design concept, makes you draw it on a canvas, then Gemini reviews what
          you drew before you move on. Modules can be tackled in any order; lessons inside a module unlock in
          sequence.
        </p>
      </div>

      <div className="space-y-4">
        {ARCHITECTURE_MODULES.map((mod) => {
          const builtCount = mod.lessons.length;
          const reviewedCount = mod.lessons.filter((l) => progress[l.id]?.reviewed).length;
          const totalCount = builtCount + (mod.plannedLessons?.length ?? 0);

          return (
            <div key={mod.id} className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{mod.title}</h2>
                  <p className="text-sm text-muted">{mod.blurb}</p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs tabular-nums text-muted">
                  {reviewedCount}/{totalCount}
                </span>
              </div>

              <div className="space-y-1 pt-1">
                {mod.lessons.map((lesson, i) => {
                  const prevLesson = mod.lessons[i - 1];
                  const locked = !!prevLesson && !progress[prevLesson.id]?.reviewed;
                  const entry = progress[lesson.id];

                  if (locked) {
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted/60"
                      >
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {i + 1}. {lesson.title}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={lesson.id}
                      to={`/architecture-studio/${mod.id}/${lesson.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text/90 transition hover:bg-surface-2"
                    >
                      {entry?.reviewed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted/60" />
                      )}
                      <span className="truncate">
                        {i + 1}. {lesson.title}
                      </span>
                      {entry?.reviewed && entry.lastVerdict && (
                        <span
                          className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            entry.lastVerdict === 'correct'
                              ? 'bg-success/15 text-success'
                              : entry.lastVerdict === 'partially-correct'
                                ? 'bg-warning/15 text-warning'
                                : 'bg-danger/15 text-danger'
                          }`}
                        >
                          {entry.lastVerdict}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {mod.plannedLessons?.map((title, i) => (
                  <div
                    key={title}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted/50"
                  >
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {builtCount + i + 1}. {title}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide">Coming soon</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
