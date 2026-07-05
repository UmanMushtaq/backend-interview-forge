import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Circle, Lightbulb, Check, Bookmark, X, Loader2 } from 'lucide-react';
import { courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import { useProgressState } from '../hooks/useProgress';
import { markLessonRead, markLessonUnread, toggleBookmark, getBookmarks } from '../lib/storage';
import { readSetFor, readingMinutes, keyTakeaway } from '../lib/courses';
import { Markdown } from '../components/Markdown';
import { ChapterQuiz } from '../components/ChapterQuiz';
import { ChapterTutor } from '../components/ChapterTutor';
import { explainSelectedText, getApiKeys } from '../lib/gemini';

interface ExplainPopover {
  x: number;
  y: number;
  text: string;
  loading: boolean;
  explanation: string;
  error: string;
}

export function ChapterPage() {
  const { courseId = '', chapterId = '' } = useParams();
  const state = useProgressState();
  const course = courseConfigById[courseId];
  const mod = moduleById[courseId];
  const lessons = mod?.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === chapterId);
  const lesson = index >= 0 ? lessons[index] : undefined;

  const articleRef = useRef<HTMLDivElement>(null);
  const [explainButton, setExplainButton] = useState<{ x: number; y: number; text: string } | null>(null);
  const [popover, setPopover] = useState<ExplainPopover | null>(null);
  const hasApiKey = getApiKeys(state.settings).length > 0;

  useEffect(() => {
    setExplainButton(null);
    setPopover(null);
  }, [chapterId]);

  useEffect(() => {
    function onMouseUp(e: MouseEvent) {
      const target = e.target as Node;
      // Clicks on the floating button / popover shouldn't clear the selection state.
      if ((target as HTMLElement).closest?.('[data-explain-ui]')) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? '';
      const container = articleRef.current;

      if (!selection || !container || text.length < 10 || text.length > 500 || selection.rangeCount === 0) {
        setExplainButton(null);
        setPopover(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const anchorNode = selection.anchorNode;
      if (!anchorNode || !container.contains(anchorNode)) {
        setExplainButton(null);
        setPopover(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setExplainButton({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text,
      });
      setPopover(null);
    }

    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  async function handleExplain() {
    if (!explainButton || !course || !lesson) return;
    const { x, y, text } = explainButton;
    setPopover({ x, y, text, loading: true, explanation: '', error: '' });
    setExplainButton(null);
    try {
      const explanation = await explainSelectedText(state.settings, text, course.title, lesson.title);
      setPopover({ x, y, text, loading: false, explanation, error: '' });
    } catch (err) {
      setPopover({
        x,
        y,
        text,
        loading: false,
        explanation: '',
        error: err instanceof Error ? err.message : 'Failed to explain this text.',
      });
    }
  }

  function closePopover() {
    setPopover(null);
    setExplainButton(null);
    window.getSelection()?.removeAllRanges();
  }

  if (!course || !mod || !lesson) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Chapter not found.</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const read = readSetFor(courseId, state);
  const isCurrentRead = read.has(chapterId);
  const isBookmarked = getBookmarks(state).some((b) => b.courseId === courseId && b.lessonId === chapterId);
  const total = lessons.length;
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < total - 1 ? lessons[index + 1] : null;
  const minutes = readingMinutes(lesson.content);
  const takeaway = keyTakeaway(lesson.content, 2);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex gap-8">
        {/* Main content */}
        <article className="min-w-0 flex-1 lg:max-w-3xl">
          {/* Chapter progress bar */}
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <Link to={`/courses/${courseId}`} className="font-medium text-muted hover:text-text">
                {course.title}
              </Link>
              <span className="flex items-center gap-2 sm:gap-3">
                <span className="tabular-nums">
                  Chapter {index + 1} of {total}
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <Clock className="h-3.5 w-3.5" /> {minutes} min read
                </span>
                {isCurrentRead ? (
                  <button
                    onClick={() => markLessonUnread(courseId, chapterId)}
                    className="flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success transition hover:bg-success/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marked as read
                  </button>
                ) : (
                  <button
                    onClick={() => markLessonRead(courseId, chapterId)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-text"
                  >
                    <Circle className="h-3.5 w-3.5" /> Mark as read
                  </button>
                )}
                <button
                  onClick={() => toggleBookmark(courseId, chapterId)}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark this chapter'}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:text-text"
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-primary text-primary' : 'text-muted'}`}
                  />
                </button>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${course.bar}`}
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>

          <div ref={articleRef} className="mt-5">
            <Markdown>{lesson.content}</Markdown>
          </div>

          {/* Floating "Explain" button on text selection */}
          {explainButton && hasApiKey && (
            <button
              data-explain-ui
              onClick={handleExplain}
              style={{ position: 'fixed', left: explainButton.x, top: explainButton.y }}
              className="z-50 flex -translate-x-1/2 -translate-y-[calc(100%+8px)] items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
            >
              <Lightbulb className="h-3.5 w-3.5" /> Explain
            </button>
          )}

          {/* Explanation popover */}
          {popover && (
            <div
              data-explain-ui
              style={{ position: 'fixed', left: popover.x, top: popover.y }}
              className="z-50 w-80 max-w-[90vw] -translate-x-1/2 rounded-xl border border-border bg-surface p-4 shadow-xl"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Lightbulb className="h-3.5 w-3.5" /> Explanation
                </div>
                <button onClick={closePopover} className="text-muted transition hover:text-text" aria-label="Close">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {popover.loading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                </div>
              )}

              {popover.error && !popover.loading && <p className="text-sm text-danger">{popover.error}</p>}

              {popover.explanation && !popover.loading && (
                <p className="text-sm leading-relaxed text-text/90">{popover.explanation}</p>
              )}
            </div>
          )}

          {/* Key takeaway callout */}
          {takeaway && (
            <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-primary">
                <Lightbulb className="h-4 w-4" /> Key takeaway
              </div>
              <p className="text-sm leading-relaxed text-text/90">{takeaway}</p>
            </div>
          )}

          {/* AI tutor */}
          <ChapterTutor
            key={chapterId}
            settings={state.settings}
            courseTitle={course.title}
            chapterTitle={lesson.title}
            chapterContent={lesson.content}
          />

          {/* AI chapter quiz */}
          <ChapterQuiz
            courseId={courseId}
            chapterId={chapterId}
            courseTitle={course.title}
            chapterTitle={lesson.title}
            chapterContent={lesson.content}
          />

          {/* Prev / next chapter */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            {prev ? (
              <Link
                to={`/courses/${courseId}/${prev.id}`}
                className="group flex max-w-[48%] items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition hover:border-primary/40"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block text-xs text-muted">Previous</span>
                  <span className="block truncate font-medium">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                to={`/courses/${courseId}/${next.id}`}
                className="group flex max-w-[48%] items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-right text-sm transition hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-muted">Next</span>
                  <span className="block truncate font-medium">{next.title}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            ) : (
              <Link
                to={`/courses/${courseId}`}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Check className="h-4 w-4" /> Finish course
              </Link>
            )}
          </div>
        </article>

        {/* Right sticky chapter list (xl+) */}
        <aside className="hidden w-64 shrink-0 xl:block">
          <div className="sticky top-6">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">In this course</p>
            <nav className="space-y-0.5">
              {lessons.map((l, i) => {
                const isRead = read.has(l.id);
                const isCurrent = l.id === chapterId;
                return (
                  <Link
                    key={l.id}
                    to={`/courses/${courseId}/${l.id}`}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ${
                      isCurrent
                        ? 'bg-primary/15 font-medium text-primary'
                        : 'text-muted hover:bg-surface-2 hover:text-text'
                    }`}
                  >
                    {isRead ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-muted/50" />
                    )}
                    <span className="truncate">
                      {i + 1}. {l.title}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
