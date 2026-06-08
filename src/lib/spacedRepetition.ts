import type { QuizProgressEntry } from '../types';

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
