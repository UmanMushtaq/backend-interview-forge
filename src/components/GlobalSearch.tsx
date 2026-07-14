import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Compass } from 'lucide-react';
import { LEARN_MODULES } from '../data/learn';
import { courseConfigById } from '../data/courseConfig';
import { ARCHITECTURE_MODULES } from '../data/architecture';

interface SearchResult {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  snippet: string;
  /** Where this result navigates to; defaults to the Learn course path if omitted. */
  path: string;
  /** Undefined uses the course's own icon/color (Learn courses); set for non-course sources. */
  sourceIcon?: typeof Compass;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-text">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function getSnippet(content: string, query: string): string {
  const preview = content.slice(0, 500).replace(/[#*`>_~]/g, '');
  const idx = preview.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return preview.slice(0, 100);
  const start = Math.max(0, idx - 40);
  const end = Math.min(preview.length, idx + query.length + 60);
  return (start > 0 ? '…' : '') + preview.slice(start, end) + (end < preview.length ? '…' : '');
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results: SearchResult[] = [];

  if (query.trim().length > 0) {
    const q = query.trim();
    for (const mod of LEARN_MODULES) {
      let courseCount = 0;
      for (const lesson of mod.lessons) {
        if (courseCount >= 5) break;
        if (results.length >= 20) break;
        const inTitle = lesson.title.toLowerCase().includes(q.toLowerCase());
        const inContent = lesson.content.slice(0, 500).toLowerCase().includes(q.toLowerCase());
        if (inTitle || inContent) {
          results.push({
            courseId: mod.id,
            lessonId: lesson.id,
            courseTitle: courseConfigById[mod.id]?.title ?? mod.title,
            lessonTitle: lesson.title,
            snippet: getSnippet(lesson.content, q),
            path: `/courses/${mod.id}/${lesson.id}`,
          });
          courseCount++;
        }
      }
    }

    for (const mod of ARCHITECTURE_MODULES) {
      let moduleCount = 0;
      for (const lesson of mod.lessons) {
        if (moduleCount >= 5) break;
        if (results.length >= 20) break;
        const inTitle = lesson.title.toLowerCase().includes(q.toLowerCase());
        const inContent = lesson.content.slice(0, 500).toLowerCase().includes(q.toLowerCase());
        if (inTitle || inContent) {
          results.push({
            courseId: `architecture-studio:${mod.id}`,
            lessonId: lesson.id,
            courseTitle: `Architecture Studio · ${mod.title}`,
            lessonTitle: lesson.title,
            snippet: getSnippet(lesson.content, q),
            path: `/architecture-studio/${mod.id}/${lesson.id}`,
            sourceIcon: Compass,
          });
          moduleCount++;
        }
      }
    }
  }

  // Group results by course
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.courseId] ??= []).push(r);
    return acc;
  }, {});

  function goTo(path: string) {
    navigate(path);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all lessons…"
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted hover:text-text">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-xs text-muted sm:block">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Type to search across all lessons</p>
          ) : results.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No results for "{query}"</p>
          ) : (
            <div className="divide-y divide-border">
              {Object.entries(grouped).map(([courseId, items]) => {
                const cfg = courseConfigById[courseId];
                const Icon = items[0].sourceIcon ?? cfg?.icon;
                return (
                  <div key={courseId} className="py-2">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      {Icon && <Icon className={`h-3.5 w-3.5 ${cfg?.color ?? 'text-primary'}`} />}
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {items[0].courseTitle}
                      </span>
                    </div>
                    {items.map((r) => (
                      <button
                        key={r.lessonId}
                        onClick={() => goTo(r.path)}
                        className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition hover:bg-surface-2"
                      >
                        <span className="text-sm font-medium text-text">
                          {highlight(r.lessonTitle, query.trim())}
                        </span>
                        <span className="line-clamp-1 text-xs text-muted">
                          {highlight(r.snippet, query.trim())}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
