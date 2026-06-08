# Backend Interview Forge — Full Product Spec

For Claude Code

Repo name: `backend-interview-forge` One-liner: A free, self-hosted interview prep platform for backend engineers targeting EU senior roles. Quizzes, coding challenges, system design, SQL, and progress tracking. Zero cost, zero backend.

## Phase 1 — Project scaffold and dashboard

Prompt for Claude Code:

```
Create a new React + Vite + TypeScript project called "backend-interview-forge".

Tech stack:
- React 18 + Vite + TypeScript
- Tailwind CSS for styling
- React Router v6 for navigation
- localStorage for all data persistence
- No backend, no API, no database

Design direction:
- Clean, modern, professional. Dark theme by default with light mode toggle.
- Use a monospace accent font for code-related headings.
- Color palette: deep navy/charcoal background, teal accents for progress/success, amber for warnings, red for weak areas.
- The app should look like a developer tool, not a toy. Think Linear or Raycast aesthetic.

Pages to create (with routes):
1. Dashboard (/)
2. Quiz hub (/quiz)
3. Quiz session (/quiz/:category)
4. Coding challenges list (/code)
5. Coding challenge (/code/:id)
6. System design list (/design)
7. System design challenge (/design/:id)
8. SQL challenges (/sql)
9. SQL challenge (/sql/:id)
10. Interview Q&A (/interview)
11. Progress report (/progress)
12. Settings (/settings)

For Phase 1, implement ONLY the Dashboard page with:

1. A sidebar navigation with icons for each section (use Lucide React icons)
2. A top bar showing "Backend Interview Forge" and a dark/light mode toggle
3. Four metric cards at the top:
   - Overall readiness: weighted % across all categories
   - Questions answered: total count
   - Coding problems solved: total count
   - Study streak: consecutive days
4. A "Weak areas" section: shows categories where score < 60%, sorted worst-first. Red badge. If no weak areas, show a green "All areas strong" message.
5. A "Continue where you left off" card: shows the last incomplete activity with a "Resume" button.
6. A GitHub-style contribution heatmap showing the last 90 days of study activity. Green squares for active days, gray for inactive.
7. A category breakdown: 6 horizontal progress bars, one per category:
   - NestJS (25% weight)
   - PostgreSQL + TypeORM (15%)
   - Redis (15%)
   - RabbitMQ + Saga (15%)
   - Kafka (15%)
   - System Design + Architecture (15%)

All data comes from a custom hook useProgress() that reads from localStorage.
Initialize with empty/zero state. The dashboard should look good even with zero data.

Create a src/data/ directory structure ready for content:
- src/data/quizzes/ (will hold JSON files per category)
- src/data/coding/ (will hold coding problem definitions)
- src/data/design/ (will hold system design prompts)
- src/data/sql/ (will hold SQL challenges)
- src/data/interview/ (will hold interview Q&A)

Create a src/lib/storage.ts utility that wraps localStorage with typed getters/setters for:
- quizProgress: { [questionId]: { correct: boolean, attempts: number, lastAttempt: timestamp, nextReview: timestamp } }
- codingProgress: { [problemId]: { solved: boolean, attempts: number, lastCode: string } }
- designProgress: { [promptId]: { attempted: boolean, selfScore: { requirements: number, dataModel: number, api: number, scaling: number, tradeoffs: number } } }
- sqlProgress: { [problemId]: { attempted: boolean, selfCorrect: boolean } }
- interviewProgress: { [questionId]: { practiced: boolean, confidence: 1|2|3|4|5 } }
- studyHistory: { [dateString]: { minutesSpent: number, questionsAnswered: number } }
- settings: { theme: 'dark'|'light', targetRole: 'mid'|'senior'|'lead' }

Make the sidebar collapsible. The layout should be responsive but optimized for desktop.

```

## Phase 2 — Quiz system with full content

Prompt for Claude Code:

```
In the backend-interview-forge project, implement the full quiz system.

### Quiz data format (src/data/quizzes/nestjs.ts, redis.ts, kafka.ts, rabbitmq.ts, postgresql.ts, system-design.ts):

Each file exports an array of questions:

interface QuizQuestion {
  id: string;                    // e.g. "nestjs-di-001"
  category: string;              // "nestjs" | "redis" | "kafka" | "rabbitmq" | "postgresql" | "system-design"
  subcategory: string;           // e.g. "dependency-injection", "distributed-locks"
  difficulty: 'foundation' | 'core' | 'expert';
  question: string;              // the question text (can include code blocks in markdown)
  options: string[];             // 4 options
  correctIndex: number;          // 0-3
  explanation: string;           // detailed explanation shown after answering (markdown)
  interviewTip?: string;         // optional one-liner for interview context
}

### Quiz session page (/quiz/:category):
1. Shows category name and progress (e.g. "NestJS — 12/40 completed")
2. Subcategory filter tabs at the top
3. Difficulty filter (Foundation / Core / Expert / All)
4. One question at a time, full width
5. Four clickable option cards. On click:
   - Correct: card turns green, others gray out
   - Wrong: selected turns red, correct one turns green
   - Explanation slides in below with a nice animation
   - If interviewTip exists, show it in a special "Interview tip" callout
6. "Next" button appears after answering
7. Progress bar at the top of the session
8. After answering, update localStorage via the storage utility:
   - Record correct/wrong
   - Update nextReview timestamp using Leitner spaced repetition:
     - Wrong: nextReview = now (comes back immediately next session)
     - Right 1st time: nextReview = now + 1 day
     - Right 2nd consecutive: nextReview = now + 3 days
     - Right 3rd consecutive: nextReview = now + 7 days
     - Right 4th+: nextReview = now + 14 days

### Quiz hub page (/quiz):
1. Six category cards in a grid
2. Each shows: category name, icon, total questions, completed count, score %, next review count
3. "Start" or "Continue" button per card
4. A "Review due" badge if any questions have nextReview <= now
5. A "Smart review" button that collects all due questions across categories and starts a mixed session

### Content — create at least 10 questions per category (60 total minimum) to start:
Populate each category file with real, high-quality interview questions.

NestJS topics to cover: modules, DI, provider scopes, circular dependencies, request lifecycle (middleware -> guard -> interceptor -> pipe -> controller), forRoot vs forRootAsync, custom decorators, exception filters.

Redis topics: SET NX EX, cache-aside pattern, cache stampede, eviction policies (LRU, LFU), RDB vs AOF, pub/sub, rate limiting, distributed locks, Redlock, single-threaded model.

Kafka topics: topics vs partitions, consumer groups, offsets, replay, log compaction, Kafka vs RabbitMQ, producer acks, exactly-once semantics.

RabbitMQ topics: exchange types (direct/fanout/topic), message acknowledgement, dead-letter queues, Saga pattern, 2PC vs Saga, commands vs events, idempotency, compensating transactions.

PostgreSQL topics: ACID, isolation levels, N+1 problem, optimistic vs pessimistic locking, decimal for money, migrations, indexes (B-tree, GIN for JSONB), EXPLAIN ANALYZE, connection pooling, window functions.

System Design topics: DDD layers, hexagonal architecture, CAP theorem, database-per-service, CQRS, event sourcing, circuit breaker, monolith vs microservices trade-offs, horizontal scaling, load balancing.

Every question must have a thorough explanation (3-5 sentences minimum) that teaches the concept, not just states the answer. The explanation should be what a senior engineer would say to a junior in a mentoring session.

```

## Phase 3 — Coding challenges with Monaco Editor

Prompt for Claude Code:

```
In the backend-interview-forge project, implement the coding challenge system.

### Dependencies to add:
- @monaco-editor/react (Monaco Editor for React)
- typescript (for in-browser transpilation)

### Coding problem data format (src/data/coding/*.ts):

interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;             // "di-container", "saga", "rate-limiter", "lock", "cache", "event-emitter", "queue", "algorithms"
  description: string;          // markdown, includes the problem statement
  starterCode: string;          // TypeScript code shown initially in the editor
  solution: string;             // the model solution (revealed after solving or giving up)
  testCases: TestCase[];
  hints: string[];              // progressive hints, revealed one at a time
  interviewContext: string;     // why this problem matters in an interview
}

interface TestCase {
  name: string;                 // e.g. "should acquire lock when not held"
  input: string;                // JS code that sets up the test and calls the function
  expectedOutput: any;          // the expected return value
  isHidden?: boolean;           // if true, don't show the test details until after solving
}

### Coding challenge page (/code/:id):
1. Left panel (60% width): Monaco Editor with TypeScript language support
   - Dark theme matching the app
   - Starter code pre-loaded
   - Full syntax highlighting and IntelliSense
2. Right panel (40% width):
   - Problem description (rendered markdown)
   - Test cases list (name + pass/fail status)
   - Hints section: "Show hint 1", "Show hint 2" buttons, each reveals progressively
   - Solution section: "Show solution" button (with "Are you sure?" confirmation)
3. Bottom bar:
   - "Run tests" button
   - "Reset code" button
   - Test results: green checkmark or red X per test case, with expected vs actual on failure

### Code execution:
Create a Web Worker (src/lib/codeRunner.worker.ts) that:
1. Receives the user's TypeScript code as a string
2. Transpiles it to JavaScript using the TypeScript compiler API (importScripts from CDN or bundled)
3. Wraps it in a try-catch
4. Runs each test case by eval-ing the test input code against the user's exported function
5. Returns results: { testName, passed, expected, actual, error? } per test case
6. Has a 5-second timeout per test case (use setTimeout + reject)
7. Catches infinite loops via the timeout

NOTE: Since we can't use the network in the worker easily, an alternative approach is fine:
- Transpile TypeScript to JavaScript in the main thread using the TypeScript compiler
- Send the JavaScript to the worker for execution
- The worker uses Function() constructor instead of eval for slightly better sandboxing

### Coding challenge list page (/code):
1. Cards grouped by category
2. Each card shows: title, difficulty badge (color-coded), solved/unsolved status
3. Filter by category and difficulty
4. Sort by: difficulty, category, unsolved first

### Create at least 15 coding problems:

Category "di-container" (3 problems):
1. Easy: Implement a simple service registry with register(name, factory) and resolve(name)
2. Medium: Add singleton scope — resolve returns the same instance every time
3. Hard: Add dependency resolution — the factory receives the container, resolve dependencies recursively, detect circular dependencies

Category "saga" (3 problems):
1. Easy: Implement a step executor that runs async steps in sequence, returns results
2. Medium: Add rollback — if step N fails, run compensating functions for steps N-1 to 0
3. Hard: Add timeout per step, retry with exponential backoff before triggering rollback

Category "rate-limiter" (2 problems):
1. Easy: Fixed window rate limiter — isAllowed(clientId, maxRequests, windowMs)
2. Hard: Sliding window rate limiter using timestamps

Category "lock" (2 problems):
1. Easy: In-memory lock manager — acquire(key, ttlMs), release(key), isLocked(key)
2. Hard: Add lock expiry via setTimeout, handle the "operation completes after lock expired" edge case

Category "cache" (2 problems):
1. Medium: LRU cache with get(key), set(key, value, capacity)
2. Hard: Add TTL support — items expire after a set time

Category "event-emitter" (2 problems):
1. Easy: Basic EventEmitter — on, emit, off
2. Medium: Add once(), wildcard matching (on('user.*', handler))

Category "algorithms" (3 problems):
1. Easy: Implement debounce(fn, delayMs)
2. Medium: Implement Promise.all from scratch
3. Hard: Implement a deep clone function that handles objects, arrays, dates, maps, sets

```

## Phase 4 — System design + SQL + Interview Q&A

Prompt for Claude Code:

```
In the backend-interview-forge project, implement the three remaining sections.

### 1. System Design Arena (/design)

Data format (src/data/design/*.ts):

interface DesignChallenge {
  id: string;
  title: string;
  difficulty: 'medium' | 'hard';
  timeEstimate: string;         // e.g. "30-45 minutes"
  prompt: string;               // the problem statement (markdown)
  requirements: string[];       // functional requirements to address
  constraints: string[];        // e.g. "1M daily active users", "99.99% uptime"
  modelAnswer: {
    overview: string;           // high-level approach (markdown)
    dataModel: string;          // schema design (markdown with code blocks)
    apiDesign: string;          // endpoints (markdown)
    messageFlow: string;        // event/message architecture (markdown)
    scalingStrategy: string;    // how to scale (markdown)
    tradeoffs: string;          // what you gained and what you gave up (markdown)
  };
  scoringDimensions: string[];  // ["Requirements clarification", "Data model", "API design", "Scaling", "Trade-off articulation"]
}

Design challenge page (/design/:id):
1. Problem statement displayed at top
2. Requirements and constraints shown clearly
3. Large text area where the user writes their answer (auto-saves to localStorage)
4. Timer (optional, can be toggled off)
5. "Reveal model answer" button — with confirmation dialog
6. After reveal: model answer shown section by section with nice formatting
7. Self-scoring: 5 sliders (1-5) for each scoring dimension, saved to localStorage
8. The self-scores update the dashboard

Create 10 design challenges covering:
- Design a payment processing system
- Design a notification service
- Design a wallet system with real-time balance updates
- Design a KYC verification pipeline
- Design an analytics event pipeline
- Design NexusPay from scratch (the meta-challenge)
- Design a rate limiting service for an API gateway
- Design a distributed job queue with retry and DLQ
- Design a real-time fraud detection system
- Design a multi-tenant SaaS backend

### 2. SQL Challenges (/sql)

Data format (src/data/sql/*.ts):

interface SqlChallenge {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  schema: string;              // SQL CREATE TABLE statements shown as context
  sampleData: string;          // INSERT statements to show what's in the tables
  problem: string;             // what query to write (markdown)
  modelAnswer: string;         // the correct SQL query
  explanation: string;         // line-by-line explanation (markdown)
  concepts: string[];          // e.g. ["JOIN", "GROUP BY", "window functions"]
}

SQL challenge page (/sql/:id):
1. Left panel: Monaco Editor with SQL language mode
2. Right panel: schema displayed as formatted SQL, sample data as a visual table
3. Problem statement at top
4. "Reveal answer" button with confirmation
5. After reveal: model answer + explanation, with the user's attempt still visible for comparison
6. Self-grade: "Did I get it right?" Yes/No button

Create 15 SQL problems using a fintech schema (users, wallets, transactions):
- Easy (5): basic SELECT, WHERE, ORDER BY, simple JOIN
- Medium (5): GROUP BY + HAVING, multi-table JOINs, subqueries, DATE functions
- Hard (5): window functions (ROW_NUMBER, LAG), CTEs, self-joins, index design questions

### 3. Interview Q&A Bank (/interview)

Data format (src/data/interview/*.ts):

interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  modelAnswer: string;          // the ideal answer, 3-5 sentences (markdown)
  followUps: string[];          // likely follow-up questions
  difficulty: 'mid' | 'senior' | 'lead';
  tags: string[];               // e.g. ["saga", "redis", "nexuspay"]
}

Interview Q&A page (/interview):
1. Filter by: category, difficulty level, tags
2. One question shown at a time, large text
3. User thinks/speaks their answer out loud, then clicks "Reveal model answer"
4. Model answer shown
5. Follow-up questions shown below
6. Confidence rating: 1 (can't answer) to 5 (nailed it), saved to localStorage
7. Navigation: Previous / Next buttons, or "Random question" button

Create 40 questions covering:
- NexusPay architecture (10): "Walk me through your architecture", "What happens when X service goes down?", "Why separate databases?", "Why Saga not 2PC?"
- NestJS (8): "How does DI work?", "Request lifecycle?", "Provider scopes?", "Circular dependency?"
- Redis (6): "4 use cases in your project?", "Lock expires mid-operation?", "Cache stampede?"
- RabbitMQ (6): "Commands vs events?", "What is a DLQ?", "Idempotency?"
- Kafka (5): "Kafka vs RabbitMQ?", "Consumer groups?", "Replay?"
- Behavioral/Architecture (5): "Microservices for a startup?", "What would you do differently?", "How would you scale to 1M TPS?"

```

## Phase 5 — Progress tracking and polish

Prompt for Claude Code:

```
In the backend-interview-forge project, implement the progress report page and final polish.

### Progress Report page (/progress):
1. Overall readiness gauge (animated circular progress)
2. Category breakdown with detailed stats:
   - Per category: total questions, answered, correct %, average confidence
   - Per subcategory: breakdown within each category
   - Visual: horizontal bar charts
3. Spaced repetition status:
   - Questions due for review today
   - Questions mastered (4+ consecutive correct)
   - Questions struggling (3+ consecutive wrong)
4. Coding challenge stats:
   - Solved by category
   - Average attempts per problem
5. Study history:
   - Contribution heatmap (last 90 days)
   - Total study days
   - Current streak
   - Best streak
6. Weak area analysis:
   - Top 5 weakest subcategories, sorted by score
   - "Focus on these" recommendation
7. Export: "Export progress as JSON" button (downloads the full localStorage data as a .json file for backup)

### Settings page (/settings):
1. Theme toggle (dark/light)
2. Target role selector (Mid / Senior / Lead) — filters question difficulty across the app
3. Reset progress button (with "Are you sure? This is permanent" confirmation)
4. Import progress from JSON (re-import a previously exported backup)

### Final polish:
1. Add page transitions (subtle fade)
2. Add keyboard shortcuts:
   - 1/2/3/4 to select quiz options
   - Enter or N for next question
   - Ctrl+Enter to run code tests
   - R to reset code
3. Add a "Quick start" onboarding modal on first visit that explains the app sections
4. Make sure all loading states look clean (skeleton screens, not spinners)
5. Add a footer: "Built by Uman Mushtaq — github.com/UmanMushtaq/backend-interview-forge"
6. Ensure the app works fully offline (it's all static files + localStorage)
7. Add GitHub Pages deployment config:
   - vite.config.ts: set base to '/backend-interview-forge/'
   - Add a GitHub Actions workflow (.github/workflows/deploy.yml) that builds and deploys to GitHub Pages on push to main

```

## Phase 6 — Content expansion (ongoing)

After the app is built, you expand content by adding more questions to the JSON/TS files. The app dynamically reads from them. No code changes needed, just data.
Target content volume:

* Quizzes: 200+ questions (30-40 per category)
* Coding: 25+ problems
* System design: 15+ prompts
* SQL: 20+ problems
* Interview Q&A: 50+ questions

You can do this incrementally by telling Claude Code: "Add 10 more Redis quiz questions to src/data/quizzes/redis.ts covering pub/sub, cluster mode, and memory optimization. Same format as existing questions."

## Folder structure

```
backend-interview-forge/
  src/
    components/          # shared UI components
      Layout.tsx         # sidebar + topbar shell
      MetricCard.tsx
      ProgressBar.tsx
      QuizCard.tsx
      CodeEditor.tsx     # Monaco wrapper
      Heatmap.tsx
      DifficultyBadge.tsx
    pages/
      Dashboard.tsx
      QuizHub.tsx
      QuizSession.tsx
      CodingList.tsx
      CodingChallenge.tsx
      DesignList.tsx
      DesignChallenge.tsx
      SqlList.tsx
      SqlChallenge.tsx
      InterviewQA.tsx
      Progress.tsx
      Settings.tsx
    data/
      quizzes/
        nestjs.ts
        redis.ts
        kafka.ts
        rabbitmq.ts
        postgresql.ts
        system-design.ts
      coding/
        di-container.ts
        saga.ts
        rate-limiter.ts
        lock.ts
        cache.ts
        event-emitter.ts
        algorithms.ts
      design/
        challenges.ts
      sql/
        challenges.ts
      interview/
        questions.ts
    lib/
      storage.ts         # typed localStorage wrapper
      spacedRepetition.ts # Leitner algorithm
      scoring.ts         # readiness score calculator
      codeRunner.worker.ts # Web Worker for code execution
    hooks/
      useProgress.ts     # reads all progress from storage
      useTheme.ts        # dark/light mode
    App.tsx
    main.tsx
  public/
  .github/
    workflows/
      deploy.yml         # GitHub Pages deployment
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
  README.md

```
