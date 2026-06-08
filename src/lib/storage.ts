import type {
  ProgressState,
  Settings,
  QuizQuestion,
  DesignSelfScore,
  LastActivity,
  InterviewProgressEntry,
  ModuleProgress,
  ModuleStatus,
} from '../types';
import { applyQuizAnswer } from './spacedRepetition';

const STORAGE_KEY = 'bif:state:v1';

export const defaultSettings: Settings = {
  theme: 'dark',
  targetRole: 'senior',
  onboarded: false,
};

function defaultState(): ProgressState {
  return {
    quizProgress: {},
    codingProgress: {},
    designProgress: {},
    sqlProgress: {},
    interviewProgress: {},
    moduleProgress: {},
    studyHistory: {},
    settings: { ...defaultSettings },
    lastActivity: undefined,
  };
}

export function emptyModuleProgress(): ModuleProgress {
  return {
    lessonsRead: [],
    status: 'not-started',
    attempts: 0,
    bestScore: 0,
    lastScore: 0,
    lastAttemptAt: 0,
    seenQuestionIds: [],
  };
}

export const MODULE_PASS_THRESHOLD = 70;

function load(): ProgressState {
  if (typeof localStorage === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      quizProgress: parsed.quizProgress ?? {},
      codingProgress: parsed.codingProgress ?? {},
      designProgress: parsed.designProgress ?? {},
      sqlProgress: parsed.sqlProgress ?? {},
      interviewProgress: parsed.interviewProgress ?? {},
      moduleProgress: parsed.moduleProgress ?? {},
      studyHistory: parsed.studyHistory ?? {},
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultState();
  }
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be full or unavailable; ignore */
  }
}

function setState(producer: (s: ProgressState) => ProgressState) {
  state = producer(state);
  persist();
  listeners.forEach((l) => l());
}

export function getState(): ProgressState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// --- date helpers ----------------------------------------------------------

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function bumpStudyToday(s: ProgressState, questions: number, minutes: number): ProgressState {
  const key = todayKey();
  const prev = s.studyHistory[key] ?? { minutesSpent: 0, questionsAnswered: 0 };
  return {
    ...s,
    studyHistory: {
      ...s.studyHistory,
      [key]: {
        minutesSpent: prev.minutesSpent + minutes,
        questionsAnswered: prev.questionsAnswered + questions,
      },
    },
  };
}

// --- mutators --------------------------------------------------------------

export function recordQuizAnswer(question: QuizQuestion, selectedIndex: number): boolean {
  const correct = selectedIndex === question.correctIndex;
  setState((s) => {
    const entry = applyQuizAnswer(s.quizProgress[question.id], correct);
    const withQuiz: ProgressState = {
      ...s,
      quizProgress: { ...s.quizProgress, [question.id]: entry },
      lastActivity: {
        label: `Quiz · ${question.category}`,
        path: `/quiz/${question.category}`,
        timestamp: Date.now(),
      },
    };
    return bumpStudyToday(withQuiz, 1, 0);
  });
  return correct;
}

export function recordCodingAttempt(problemId: string, code: string, solved: boolean): void {
  setState((s) => {
    const prev = s.codingProgress[problemId] ?? { solved: false, attempts: 0, lastCode: '' };
    return {
      ...s,
      codingProgress: {
        ...s.codingProgress,
        [problemId]: {
          solved: prev.solved || solved,
          attempts: prev.attempts + 1,
          lastCode: code,
        },
      },
      lastActivity: { label: 'Coding challenge', path: `/code/${problemId}`, timestamp: Date.now() },
    };
  });
}

export function saveCodingCode(problemId: string, code: string): void {
  setState((s) => {
    const prev = s.codingProgress[problemId] ?? { solved: false, attempts: 0, lastCode: '' };
    return {
      ...s,
      codingProgress: { ...s.codingProgress, [problemId]: { ...prev, lastCode: code } },
    };
  });
}

export function saveDesignAnswer(promptId: string, answer: string): void {
  setState((s) => {
    const prev = s.designProgress[promptId];
    return {
      ...s,
      designProgress: {
        ...s.designProgress,
        [promptId]: {
          attempted: true,
          answer,
          selfScore: prev?.selfScore ?? { requirements: 0, dataModel: 0, api: 0, scaling: 0, tradeoffs: 0 },
        },
      },
      lastActivity: { label: 'System design', path: `/design/${promptId}`, timestamp: Date.now() },
    };
  });
}

export function setDesignScore(promptId: string, selfScore: DesignSelfScore): void {
  setState((s) => {
    const prev = s.designProgress[promptId];
    return {
      ...s,
      designProgress: {
        ...s.designProgress,
        [promptId]: { attempted: true, answer: prev?.answer, selfScore },
      },
    };
  });
}

export function saveSqlAttempt(problemId: string, query: string): void {
  setState((s) => {
    const prev = s.sqlProgress[problemId];
    return {
      ...s,
      sqlProgress: {
        ...s.sqlProgress,
        [problemId]: { attempted: true, selfCorrect: prev?.selfCorrect ?? false, lastQuery: query },
      },
      lastActivity: { label: 'SQL challenge', path: `/sql/${problemId}`, timestamp: Date.now() },
    };
  });
}

export function setSqlSelfCorrect(problemId: string, correct: boolean): void {
  setState((s) => {
    const prev = s.sqlProgress[problemId] ?? { attempted: true, selfCorrect: false };
    return {
      ...s,
      sqlProgress: { ...s.sqlProgress, [problemId]: { ...prev, attempted: true, selfCorrect: correct } },
    };
  });
}

export function setInterviewConfidence(
  questionId: string,
  confidence: InterviewProgressEntry['confidence'],
): void {
  setState((s) => {
    const withInterview: ProgressState = {
      ...s,
      interviewProgress: {
        ...s.interviewProgress,
        [questionId]: { practiced: true, confidence },
      },
      lastActivity: { label: 'Interview Q&A', path: '/interview', timestamp: Date.now() },
    };
    return bumpStudyToday(withInterview, 1, 0);
  });
}

export function markLessonRead(moduleId: string, lessonId: string): void {
  setState((s) => {
    const prev = s.moduleProgress[moduleId] ?? emptyModuleProgress();
    if (prev.lessonsRead.includes(lessonId)) return s;
    return {
      ...s,
      moduleProgress: {
        ...s.moduleProgress,
        [moduleId]: {
          ...prev,
          lessonsRead: [...prev.lessonsRead, lessonId],
          status: prev.status === 'not-started' ? 'learning' : prev.status,
        },
      },
      lastActivity: { label: 'Learn', path: `/learn/${moduleId}`, timestamp: Date.now() },
    };
  });
}

/** Records a module test attempt; returns the score %. Status becomes mastered at >= MODULE_PASS_THRESHOLD. */
export function recordModuleAttempt(
  moduleId: string,
  askedIds: string[],
  correctCount: number,
  total: number,
): number {
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  setState((s) => {
    const prev = s.moduleProgress[moduleId] ?? emptyModuleProgress();
    const status: ModuleStatus = score >= MODULE_PASS_THRESHOLD ? 'mastered' : 'needs-review';
    const next: ModuleProgress = {
      lessonsRead: prev.lessonsRead,
      status,
      attempts: prev.attempts + 1,
      bestScore: Math.max(prev.bestScore, score),
      lastScore: score,
      lastAttemptAt: Date.now(),
      seenQuestionIds: [...prev.seenQuestionIds, ...askedIds].slice(-60),
    };
    const withModule: ProgressState = {
      ...s,
      moduleProgress: { ...s.moduleProgress, [moduleId]: next },
      lastActivity: { label: 'Learn', path: `/learn/${moduleId}`, timestamp: Date.now() },
    };
    return bumpStudyToday(withModule, total, 0);
  });
  return score;
}

export function logStudyMinutes(minutes: number): void {
  if (minutes <= 0) return;
  setState((s) => bumpStudyToday(s, 0, minutes));
}

export function setLastActivity(activity: LastActivity): void {
  setState((s) => ({ ...s, lastActivity: activity }));
}

export function updateSettings(patch: Partial<Settings>): void {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function resetAll(): void {
  setState((s) => ({ ...defaultState(), settings: { ...s.settings } }));
}

export function exportJSON(): string {
  return JSON.stringify(state, null, 2);
}

export function importJSON(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<ProgressState>;
    setState(() => ({
      ...defaultState(),
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    }));
    return true;
  } catch {
    return false;
  }
}
