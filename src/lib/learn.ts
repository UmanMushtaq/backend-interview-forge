import type { LearnModule, QuizQuestion } from '../types';
import { quizzesByCategory } from '../data/quizzes';

/** The question pool a module is tested from. */
export function poolForModule(m: LearnModule): QuizQuestion[] {
  if (m.questions && m.questions.length) return m.questions;
  if (m.quizCategory) return quizzesByCategory[m.quizCategory] ?? [];
  return [];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const MODULE_QUIZ_SIZE = 8;

/**
 * Pick a fresh, rotated quiz for a module: prefer questions the learner has not
 * recently seen, so every retake feels new. Falls back to the full pool once
 * everything has been seen.
 */
export function pickModuleQuiz(m: LearnModule, seen: string[], size = MODULE_QUIZ_SIZE): QuizQuestion[] {
  const pool = poolForModule(m);
  if (pool.length === 0) return [];
  const target = Math.min(size, pool.length);
  const unseen = pool.filter((q) => !seen.includes(q.id));
  const source = unseen.length >= target ? unseen : pool;
  return shuffle(source).slice(0, target);
}
