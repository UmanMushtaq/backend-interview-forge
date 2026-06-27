import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { getBookmarks } from '../lib/storage';
import { courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';

export function Bookmarks() {
  const state = useProgressState();
  const bookmarks = getBookmarks(state);

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Bookmark className="h-10 w-10 text-muted/40" />
        <p className="text-sm text-muted">
          No bookmarks yet. Click the bookmark icon on any chapter to save it here.
        </p>
      </div>
    );
  }

  // Group by course
  const grouped = bookmarks.reduce<Record<string, typeof bookmarks>>((acc, b) => {
    (acc[b.courseId] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookmarks</h1>
        <p className="text-sm text-muted">Chapters you've saved for later.</p>
      </div>

      {Object.entries(grouped).map(([courseId, items]) => {
        const cfg = courseConfigById[courseId];
        const mod = moduleById[courseId];
        if (!cfg || !mod) return null;
        const Icon = cfg.icon;

        return (
          <div key={courseId}>
            <div className="mb-2 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.tint}`}>
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <span className="font-semibold">{cfg.title}</span>
            </div>
            <div className="space-y-2">
              {items.map((b) => {
                const lesson = mod.lessons.find((l) => l.id === b.lessonId);
                if (!lesson) return null;
                const excerpt = lesson.content
                  .slice(0, 100)
                  .replace(/[#*`>_~]/g, '')
                  .trim();
                return (
                  <Link
                    key={b.lessonId}
                    to={`/courses/${courseId}/${b.lessonId}`}
                    className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40"
                  >
                    <span className="font-medium">{lesson.title}</span>
                    <span className="line-clamp-1 text-sm text-muted">{excerpt}…</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
