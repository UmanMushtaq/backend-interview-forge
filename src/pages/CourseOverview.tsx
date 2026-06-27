import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight, ArrowLeft, CheckCircle2, Circle, Trophy, BrainCircuit } from 'lucide-react';
import { COURSES, courseConfigById } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import { useProgressState } from '../hooks/useProgress';
import { markLessonRead, markLessonUnread } from '../lib/storage';
import { courseProgress, readSetFor } from '../lib/courses';

export function CourseOverview() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const state = useProgressState();
  const course = courseConfigById[courseId];
  const mod = moduleById[courseId];

  if (!course || !mod) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Course not found.</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const Icon = course.icon;
  const prog = courseProgress(courseId, state);
  const read = readSetFor(courseId, state);
  const lessons = mod.lessons;

  const continueId = prog.firstUnreadId ?? lessons[0]?.id;
  const ctaLabel = prog.read === 0 ? 'Start learning' : prog.read >= prog.total ? 'Review course' : 'Continue';

  const index = COURSES.findIndex((c) => c.id === courseId);
  const prev = index > 0 ? COURSES[index - 1] : null;
  const next = index < COURSES.length - 1 ? COURSES[index + 1] : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${course.tint}`}>
          <Icon className={`h-7 w-7 ${course.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-1 text-sm text-muted">{course.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {lessons.length} chapters
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> ~{course.estimatedHours} hours
            </span>
            {prog.status === 'mastered' && (
              <span className="flex items-center gap-1.5 text-success">
                <Trophy className="h-4 w-4" /> Mastered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress + CTA */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Your progress</span>
          <span className="text-muted tabular-nums">
            {prog.read} / {prog.total} chapters · {prog.percent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${course.bar}`}
            style={{ width: `${prog.percent}%` }}
          />
        </div>
        {continueId && (
          <Link
            to={`/courses/${courseId}/${continueId}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Chapter list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Chapters</h2>
        <div className="space-y-2">
          {lessons.map((lesson, i) => {
            const isRead = read.has(lesson.id);
            return (
              <Link
                key={lesson.id}
                to={`/courses/${courseId}/${lesson.id}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-surface-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-medium text-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span>
                <span className="text-xs text-muted">{isRead ? 'Read' : 'Unread'}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isRead) markLessonUnread(courseId, lesson.id);
                    else markLessonRead(courseId, lesson.id);
                  }}
                  title={isRead ? 'Mark as unread' : 'Mark as read'}
                  className="shrink-0 rounded p-0.5 transition hover:opacity-70"
                >
                  {isRead ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted/40" />
                  )}
                </button>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* NexusPay Mock Interview CTA */}
      {courseId === 'nexuspay' && (
        <div className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10">
              <BrainCircuit className="h-6 w-6 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Test yourself in a mock interview</h3>
              <p className="mt-1 text-sm text-muted">
                Gemini plays a senior engineer from Qonto and asks you hard questions about NexusPay.
                No generic questions — only questions about your actual architecture.
              </p>
              <button
                onClick={() => navigate('/interview-simulator', { state: { topic: 'NexusPay' } })}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-400/20 px-4 py-2 text-sm font-semibold text-violet-400 transition hover:bg-violet-400/30"
              >
                <BrainCircuit className="h-4 w-4" />
                Start NexusPay Mock Interview
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prev / next course */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        {prev ? (
          <Link
            to={`/courses/${prev.id}`}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/courses/${next.id}`}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-text"
          >
            <span className="truncate">{next.title}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
