// ---------------------------------------------------------------------------
// Content types (data files in src/data conform to these)
// ---------------------------------------------------------------------------

export type QuizCategory =
  | 'nestjs'
  | 'postgresql'
  | 'redis'
  | 'rabbitmq'
  | 'kafka'
  | 'system-design';

export type QuizDifficulty = 'foundation' | 'core' | 'expert';

export interface QuizQuestion {
  id: string;
  // One of the six dashboard QuizCategory values, or a Learn-module id (e.g. "javascript").
  category: string;
  subcategory: string;
  difficulty: QuizDifficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  interviewTip?: string;
}

export type CodingDifficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
  name: string;
  /** JS/TS code that sets up the test and `return`s the value to compare. */
  input: string;
  expectedOutput: unknown;
  isHidden?: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: CodingDifficulty;
  category: string;
  description: string;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: string[];
  interviewContext: string;
}

export type DesignDifficulty = 'medium' | 'hard';

export interface DesignModelAnswer {
  overview: string;
  dataModel: string;
  apiDesign: string;
  messageFlow: string;
  scalingStrategy: string;
  tradeoffs: string;
}

export interface DesignChallenge {
  id: string;
  title: string;
  difficulty: DesignDifficulty;
  timeEstimate: string;
  prompt: string;
  requirements: string[];
  constraints: string[];
  modelAnswer: DesignModelAnswer;
  scoringDimensions: string[];
}

export type SqlDifficulty = 'easy' | 'medium' | 'hard';

export interface SqlChallenge {
  id: string;
  title: string;
  difficulty: SqlDifficulty;
  schema: string;
  sampleData: string;
  problem: string;
  modelAnswer: string;
  explanation: string;
  concepts: string[];
}

export type InterviewDifficulty = 'mid' | 'senior' | 'lead';

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  modelAnswer: string;
  followUps: string[];
  difficulty: InterviewDifficulty;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Progress types (persisted to localStorage)
// ---------------------------------------------------------------------------

export interface QuizProgressEntry {
  correct: boolean;
  attempts: number;
  /** Number of consecutive correct answers (drives the Leitner box). */
  streak: number;
  lastAttempt: number;
  nextReview: number;
}

export interface CodingProgressEntry {
  solved: boolean;
  attempts: number;
  lastCode: string;
}

export interface DesignSelfScore {
  requirements: number;
  dataModel: number;
  api: number;
  scaling: number;
  tradeoffs: number;
}

export interface DesignProgressEntry {
  attempted: boolean;
  answer?: string;
  selfScore: DesignSelfScore;
}

export interface SqlProgressEntry {
  attempted: boolean;
  selfCorrect: boolean;
  lastQuery?: string;
}

export interface InterviewProgressEntry {
  practiced: boolean;
  confidence: 1 | 2 | 3 | 4 | 5;
}

export interface StudyHistoryEntry {
  minutesSpent: number;
  questionsAnswered: number;
  chaptersRead: number;
}

export type ThemeMode = 'dark' | 'light';
export type TargetRole = 'mid' | 'senior' | 'lead';

export interface Settings {
  theme: ThemeMode;
  targetRole: TargetRole;
  onboarded: boolean;
  /** Optional, user-supplied Gemini API key. Stored only on this device. */
  geminiApiKey?: string;
}

// ---------------------------------------------------------------------------
// Learn modules (study material + adaptive relearn loop)
// ---------------------------------------------------------------------------

export interface Lesson {
  id: string;
  title: string;
  content: string; // markdown
}

export interface LearnModule {
  id: string;
  title: string;
  blurb: string;
  /** When set, the module quiz draws from this existing quiz category pool. */
  quizCategory?: QuizCategory;
  lessons: Lesson[];
  /** Module-specific question pool (for topics without a dashboard category). */
  questions?: QuizQuestion[];
}

export type ModuleStatus = 'not-started' | 'learning' | 'needs-review' | 'mastered';

export interface ModuleProgress {
  lessonsRead: string[];
  status: ModuleStatus;
  attempts: number;
  bestScore: number;
  lastScore: number;
  lastAttemptAt: number;
  /** Recently-asked question ids, so retakes rotate to fresh questions. */
  seenQuestionIds: string[];
  /** lessonId -> timestamp of last read, used for spaced repetition. */
  lessonReadTimestamps?: Record<string, number>;
}

export interface LastActivity {
  label: string;
  path: string;
  timestamp: number;
}

export interface ProgressState {
  quizProgress: Record<string, QuizProgressEntry>;
  codingProgress: Record<string, CodingProgressEntry>;
  designProgress: Record<string, DesignProgressEntry>;
  sqlProgress: Record<string, SqlProgressEntry>;
  interviewProgress: Record<string, InterviewProgressEntry>;
  moduleProgress: Record<string, ModuleProgress>;
  studyHistory: Record<string, StudyHistoryEntry>;
  settings: Settings;
  lastActivity?: LastActivity;
  bookmarks?: Array<{ courseId: string; lessonId: string }>;
}
