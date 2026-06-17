import type { ProgressState, Lesson } from '../types';
import { moduleById } from '../data/learn';
import { COURSES } from '../data/courseConfig';

export type CourseStatus = 'not-started' | 'in-progress' | 'completed' | 'mastered';

export interface CourseProgress {
  read: number;
  total: number;
  percent: number;
  /** First chapter the learner has not read yet, or null if all are read. */
  firstUnreadId: string | null;
  status: CourseStatus;
  statusLabel: string;
}

/** The set of lesson ids the learner has read for a given course. */
export function readSetFor(courseId: string, state: ProgressState): Set<string> {
  return new Set(state.moduleProgress[courseId]?.lessonsRead ?? []);
}

export function courseLessons(courseId: string): Lesson[] {
  return moduleById[courseId]?.lessons ?? [];
}

export function courseProgress(courseId: string, state: ProgressState): CourseProgress {
  const lessons = courseLessons(courseId);
  const total = lessons.length;
  const read = readSetFor(courseId, state);
  const readCount = lessons.filter((l) => read.has(l.id)).length;
  const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;
  const firstUnread = lessons.find((l) => !read.has(l.id)) ?? null;
  const moduleStatus = state.moduleProgress[courseId]?.status;

  let status: CourseStatus = 'not-started';
  if (moduleStatus === 'mastered') status = 'mastered';
  else if (total > 0 && readCount >= total) status = 'completed';
  else if (readCount > 0) status = 'in-progress';

  const statusLabel =
    status === 'mastered'
      ? 'Mastered'
      : status === 'completed'
        ? 'Read · quiz to master'
        : status === 'in-progress'
          ? 'In progress'
          : 'Not started';

  return { read: readCount, total, percent, firstUnreadId: firstUnread?.id ?? null, status, statusLabel };
}

export interface OverallProgress {
  read: number;
  total: number;
  percent: number;
}

export function overallChapterProgress(state: ProgressState): OverallProgress {
  let read = 0;
  let total = 0;
  for (const course of COURSES) {
    const p = courseProgress(course.id, state);
    read += p.read;
    total += p.total;
  }
  return { read, total, percent: total > 0 ? Math.round((read / total) * 100) : 0 };
}

export function coursesMastered(state: ProgressState): number {
  return COURSES.filter((c) => courseProgress(c.id, state).status === 'mastered').length;
}

export interface ContinueTarget {
  courseId: string;
  chapterId: string;
}

/**
 * Where the "Continue learning" CTA should point. Prefers an in-progress course
 * (so you resume what you started), then any course with unread chapters, then
 * falls back to the very first chapter of the first course.
 */
export function continueTarget(state: ProgressState): ContinueTarget | null {
  const inProgress = COURSES.map((c) => ({ c, p: courseProgress(c.id, state) })).find(
    ({ p }) => p.status === 'in-progress' && p.firstUnreadId,
  );
  if (inProgress?.p.firstUnreadId) {
    return { courseId: inProgress.c.id, chapterId: inProgress.p.firstUnreadId };
  }

  for (const course of COURSES) {
    const p = courseProgress(course.id, state);
    if (p.firstUnreadId) return { courseId: course.id, chapterId: p.firstUnreadId };
  }

  const first = COURSES[0];
  const firstLesson = courseLessons(first.id)[0];
  return firstLesson ? { courseId: first.id, chapterId: firstLesson.id } : null;
}

/** Plain-text reading helpers shared by chapter pages. */
export function wordCount(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ') // drop fenced code blocks
    .replace(/[#>*`_~|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

export function readingMinutes(markdown: string, wpm = 200): number {
  return Math.max(1, Math.round(wordCount(markdown) / wpm));
}

/**
 * The "key takeaway": the first one or two prose sentences of a lesson, with
 * markdown noise (code fences, headings, emphasis) stripped out.
 */
export function keyTakeaway(markdown: string, sentences = 2): string {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, ' ') // remove code blocks
    .replace(/^#{1,6}\s+.*$/gm, ' ') // remove heading lines
    .replace(/^\s*\|.*$/gm, ' ') // remove table rows
    .replace(/[*_`>#]/g, '') // strip emphasis / code / quote markers
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // unwrap links
    .replace(/\s+/g, ' ')
    .trim();

  const parts = prose.match(/[^.!?]+[.!?]+/g);
  if (!parts || parts.length === 0) return prose.slice(0, 220);
  return parts.slice(0, sentences).join(' ').trim();
}
