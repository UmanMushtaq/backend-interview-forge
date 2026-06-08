import type { QuizQuestion, QuizCategory, QuizProgressEntry } from '../../types';
import { nestjs } from './nestjs';
import { postgresql } from './postgresql';
import { redis } from './redis';
import { rabbitmq } from './rabbitmq';
import { kafka } from './kafka';
import { systemDesign } from './system-design';

export const quizzesByCategory: Record<QuizCategory, QuizQuestion[]> = {
  nestjs,
  postgresql,
  redis,
  rabbitmq,
  kafka,
  'system-design': systemDesign,
};

export const allQuizQuestions: QuizQuestion[] = Object.values(quizzesByCategory).flat();

export function selectDueQuizQuestions(
  progress: Record<string, QuizProgressEntry>,
  now: number = Date.now(),
): QuizQuestion[] {
  return allQuizQuestions.filter((q) => {
    const e = progress[q.id];
    return !!e && e.nextReview <= now;
  });
}
