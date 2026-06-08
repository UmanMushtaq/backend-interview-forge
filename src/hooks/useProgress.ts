import { useSyncExternalStore, useMemo } from 'react';
import { getState, subscribe } from '../lib/storage';
import { CATEGORIES } from '../lib/categories';
import type { CategoryMeta } from '../lib/categories';
import {
  categoryStat,
  weightedReadiness,
  buildHeatmap,
  computeStreaks,
  totalQuestionsAnswered,
  totalCodingSolved,
  pct,
  type CategoryStat,
  type HeatCell,
  type StreakInfo,
} from '../lib/scoring';
import { quizzesByCategory } from '../data/quizzes';
import { allCodingProblems } from '../data/coding';
import { allDesignChallenges } from '../data/design';
import { allSqlChallenges } from '../data/sql';
import { allInterviewQuestions } from '../data/interview';
import type { ProgressState } from '../types';

export interface CategorySummary extends CategoryStat {
  meta: CategoryMeta;
}

export interface ProgressSummary {
  state: ProgressState;
  categories: CategorySummary[];
  overallReadiness: number;
  questionsAnswered: number;
  codingSolved: number;
  codingTotal: number;
  designAttempted: number;
  designTotal: number;
  sqlAttempted: number;
  sqlCorrect: number;
  sqlTotal: number;
  interviewPracticed: number;
  interviewTotal: number;
  avgConfidence: number;
  totalDueCount: number;
  totalMastered: number;
  totalStruggling: number;
  weakAreas: CategorySummary[];
  heatmap: HeatCell[];
  streak: StreakInfo;
}

export function useProgressState(): ProgressState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useProgress(): ProgressSummary {
  const state = useProgressState();

  return useMemo<ProgressSummary>(() => {
    const now = Date.now();

    const categories: CategorySummary[] = CATEGORIES.map((meta) => ({
      meta,
      ...categoryStat(quizzesByCategory[meta.id] ?? [], state.quizProgress, now),
    }));

    const overallReadiness = weightedReadiness(
      categories.map((c) => ({ weight: c.meta.weight, score: c.score })),
    );

    const totalDueCount = categories.reduce((a, c) => a + c.dueCount, 0);
    const totalMastered = categories.reduce((a, c) => a + c.mastered, 0);
    const totalStruggling = categories.reduce((a, c) => a + c.struggling, 0);

    // Weak areas: categories you've actually started, scoring under 60%.
    const weakAreas = categories
      .filter((c) => c.answered > 0 && c.score < 60)
      .sort((a, b) => a.score - b.score);

    const interviewEntries = Object.values(state.interviewProgress);
    const interviewPracticed = interviewEntries.filter((e) => e.practiced).length;
    const avgConfidence = interviewEntries.length
      ? interviewEntries.reduce((a, e) => a + e.confidence, 0) / interviewEntries.length
      : 0;

    const sqlEntries = Object.values(state.sqlProgress);

    return {
      state,
      categories,
      overallReadiness,
      questionsAnswered: totalQuestionsAnswered(state),
      codingSolved: totalCodingSolved(state),
      codingTotal: allCodingProblems.length,
      designAttempted: Object.values(state.designProgress).filter((d) => d.attempted).length,
      designTotal: allDesignChallenges.length,
      sqlAttempted: sqlEntries.filter((s) => s.attempted).length,
      sqlCorrect: sqlEntries.filter((s) => s.selfCorrect).length,
      sqlTotal: allSqlChallenges.length,
      interviewPracticed,
      interviewTotal: allInterviewQuestions.length,
      avgConfidence,
      totalDueCount,
      totalMastered,
      totalStruggling,
      weakAreas,
      heatmap: buildHeatmap(state.studyHistory, 90),
      streak: computeStreaks(state.studyHistory),
    };
  }, [state]);
}

export { pct };
