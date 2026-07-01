import type { QuizProgressEntry, ProgressState, LearnModule } from '../types';
import type { CourseConfig } from '../data/courseConfig';

export const DAY_MS = 86_400_000;

/**
 * Leitner-style spacing. `streak` is the number of consecutive correct
 * answers *after* the current one.
 *   wrong            -> due now (comes back this session)
 *   1st correct      -> +1 day
 *   2nd consecutive  -> +3 days
 *   3rd consecutive  -> +7 days
 *   4th+ consecutive -> +14 days
 */
export function nextReviewDelayDays(streak: number): number {
  if (streak <= 0) return 0;
  if (streak === 1) return 1;
  if (streak === 2) return 3;
  if (streak === 3) return 7;
  return 14;
}

export function applyQuizAnswer(
  prev: QuizProgressEntry | undefined,
  correct: boolean,
  now: number = Date.now(),
): QuizProgressEntry {
  const attempts = (prev?.attempts ?? 0) + 1;
  const streak = correct ? (prev?.streak ?? 0) + 1 : 0;
  const delay = nextReviewDelayDays(streak);
  return {
    correct,
    attempts,
    streak,
    lastAttempt: now,
    nextReview: now + delay * DAY_MS,
  };
}

export const MASTERED_STREAK = 4;
export const STRUGGLING_ATTEMPTS = 3;

export function isMastered(entry: QuizProgressEntry): boolean {
  return entry.streak >= MASTERED_STREAK;
}

/** Struggling = answered several times but currently still wrong. */
export function isStruggling(entry: QuizProgressEntry): boolean {
  return entry.correct === false && entry.attempts >= STRUGGLING_ATTEMPTS;
}

export function isDue(entry: QuizProgressEntry, now: number = Date.now()): boolean {
  return entry.nextReview <= now;
}

// --- chapter review queue ---------------------------------------------------

export const REVIEW_DUE_DAYS = 7;
const FALLBACK_STALE_DAYS = 8;

export interface ReviewItem {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  lastReadAt: number;
  daysSinceRead: number;
  dueForReview: boolean;
}

export function getReviewQueue(
  state: ProgressState,
  courses: CourseConfig[],
  modules: Record<string, LearnModule>,
): ReviewItem[] {
  const now = Date.now();
  const items: ReviewItem[] = [];

  for (const course of courses) {
    const progress = state.moduleProgress[course.id];
    if (!progress) continue;
    const mod = modules[course.id];
    if (!mod) continue;

    for (const lessonId of progress.lessonsRead) {
      const lesson = mod.lessons.find((l) => l.id === lessonId);
      if (!lesson) continue;

      const lastReadAt = progress.lessonReadTimestamps?.[lessonId] ?? now - FALLBACK_STALE_DAYS * DAY_MS;
      const daysSinceRead = Math.floor((now - lastReadAt) / DAY_MS);

      if (daysSinceRead >= REVIEW_DUE_DAYS) {
        items.push({
          courseId: course.id,
          lessonId,
          courseTitle: course.title,
          lessonTitle: lesson.title,
          lastReadAt,
          daysSinceRead,
          dueForReview: true,
        });
      }
    }
  }

  return items.sort((a, b) => b.daysSinceRead - a.daysSinceRead);
}
