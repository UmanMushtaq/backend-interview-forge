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
  category: QuizCategory;
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
}

export type ThemeMode = 'dark' | 'light';
export type TargetRole = 'mid' | 'senior' | 'lead';

export interface Settings {
  theme: ThemeMode;
  targetRole: TargetRole;
  onboarded: boolean;
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
  studyHistory: Record<string, StudyHistoryEntry>;
  settings: Settings;
  lastActivity?: LastActivity;
}
