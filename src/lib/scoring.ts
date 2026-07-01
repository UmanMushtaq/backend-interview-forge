import type { ProgressState, QuizQuestion, QuizProgressEntry, StudyHistoryEntry, LearnModule } from '../types';
import { isDue, isMastered, isStruggling, DAY_MS } from './spacedRepetition';
import { todayKey } from './storage';
import { LEARN_MODULES } from '../data/learn';
import { COURSES, type CourseConfig } from '../data/courseConfig';

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export interface CategoryStat {
  total: number;
  answered: number;
  correctNow: number;
  /** Readiness: correct answers as a share of all questions in the category. */
  score: number;
  /** Accuracy among answered questions only. */
  accuracy: number;
  dueCount: number;
  mastered: number;
  struggling: number;
}

export function categoryStat(
  questions: QuizQuestion[],
  progress: Record<string, QuizProgressEntry>,
  now: number = Date.now(),
): CategoryStat {
  let answered = 0;
  let correctNow = 0;
  let dueCount = 0;
  let mastered = 0;
  let struggling = 0;
  for (const q of questions) {
    const e = progress[q.id];
    if (!e) continue;
    answered++;
    if (e.correct) correctNow++;
    if (isDue(e, now)) dueCount++;
    if (isMastered(e)) mastered++;
    if (isStruggling(e)) struggling++;
  }
  const total = questions.length;
  return {
    total,
    answered,
    correctNow,
    score: pct(correctNow, total),
    accuracy: pct(correctNow, answered),
    dueCount,
    mastered,
    struggling,
  };
}

export function weightedReadiness(items: { weight: number; score: number }[]): number {
  const totalWeight = items.reduce((a, b) => a + b.weight, 0) || 1;
  const sum = items.reduce((a, b) => a + b.weight * b.score, 0);
  return Math.round(sum / totalWeight);
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4;
export interface HeatCell {
  date: string;
  count: number;
  level: HeatLevel;
}

function levelOf(count: number): HeatLevel {
  if (count <= 0) return 0;
  if (count < 3) return 1;
  if (count < 7) return 2;
  if (count < 15) return 3;
  return 4;
}

export function buildHeatmap(
  studyHistory: Record<string, StudyHistoryEntry>,
  days = 90,
): HeatCell[] {
  const cells: HeatCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const entry = studyHistory[key];
    const count = entry ? entry.questionsAnswered : 0;
    cells.push({ date: key, count, level: levelOf(count) });
  }
  return cells;
}

export interface StreakInfo {
  current: number;
  best: number;
  totalDays: number;
}

export function computeStreaks(studyHistory: Record<string, StudyHistoryEntry>): StreakInfo {
  const active = (key: string): boolean => {
    const e = studyHistory[key];
    return !!e && (e.questionsAnswered > 0 || e.chaptersRead > 0);
  };

  const keys = Object.keys(studyHistory).filter(active).sort();
  const totalDays = keys.length;

  // current streak, with a one-day grace so "haven't studied yet today" doesn't zero it
  let current = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!active(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (active(todayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // best run of consecutive active days
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of keys) {
    const t = new Date(`${k}T00:00:00`).getTime();
    if (prev !== null && t - prev === DAY_MS) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = t;
  }

  return { current, best: Math.max(best, current), totalDays };
}

export function totalQuestionsAnswered(state: ProgressState): number {
  return Object.keys(state.quizProgress).length;
}

export function totalCodingSolved(state: ProgressState): number {
  return Object.values(state.codingProgress).filter((c) => c.solved).length;
}

export interface WeakSpot {
  courseId: string;
  courseTitle: string;
  lessonTitle?: string;
  reason: 'low-quiz-score' | 'failed-multiple-times' | 'never-quizzed';
  score?: number;
  attempts?: number;
}

export function getWeakSpots(
  state: ProgressState,
  modules: LearnModule[] = LEARN_MODULES,
  configs: CourseConfig[] = COURSES,
): WeakSpot[] {
  const configById = Object.fromEntries(configs.map((c) => [c.id, c]));

  const needsReview: WeakSpot[] = [];
  const lowScore: WeakSpot[] = [];
  const neverQuizzed: WeakSpot[] = [];

  for (const mod of modules) {
    const progress = state.moduleProgress[mod.id];
    const config = configById[mod.id];
    if (!progress || !config) continue;

    if (progress.status === 'needs-review') {
      needsReview.push({
        courseId: mod.id,
        courseTitle: config.title,
        reason: 'failed-multiple-times',
        score: progress.lastScore,
      });
    } else if (progress.bestScore > 0 && progress.bestScore < 60) {
      lowScore.push({
        courseId: mod.id,
        courseTitle: config.title,
        reason: 'low-quiz-score',
        score: progress.bestScore,
      });
    } else if (progress.lessonsRead.length >= 3 && progress.attempts === 0) {
      neverQuizzed.push({
        courseId: mod.id,
        courseTitle: config.title,
        reason: 'never-quizzed',
      });
    }
  }

  lowScore.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  return [...needsReview, ...lowScore, ...neverQuizzed].slice(0, 5);
}
