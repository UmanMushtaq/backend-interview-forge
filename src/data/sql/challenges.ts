import type { SqlChallenge } from '../../types';

const SCHEMA = `CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  country     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wallets (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id),
  currency    TEXT NOT NULL,
  balance     NUMERIC(18,4) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id            SERIAL PRIMARY KEY,
  wallet_id     INT NOT NULL REFERENCES wallets(id),
  type          TEXT NOT NULL,          -- 'credit' | 'debit'
  amount        NUMERIC(18,4) NOT NULL,
  status        TEXT NOT NULL,          -- 'pending' | 'completed' | 'failed'
  counterparty  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

const SAMPLE = `INSERT INTO users (id, email, full_name, country) VALUES
  (1, 'amelie@nexus.eu', 'Amelie Dubois', 'FR'),
  (2, 'lukas@nexus.eu',  'Lukas Weber',   'DE'),
  (3, 'sofia@nexus.eu',  'Sofia Rossi',   'IT');

INSERT INTO wallets (id, user_id, currency, balance, status) VALUES
  (10, 1, 'EUR', 1840.50, 'active'),
  (11, 2, 'EUR',  320.00, 'active'),
  (12, 3, 'EUR',   75.25, 'frozen');

INSERT INTO transactions (wallet_id, type, amount, status, created_at) VALUES
  (10, 'credit', 1000.00, 'completed', '2026-05-01'),
  (10, 'debit',   159.50, 'completed', '2026-05-03'),
  (11, 'credit',  320.00, 'completed', '2026-05-04'),
  (12, 'credit',  100.00, 'failed',    '2026-05-05'),
  (10, 'credit',  999.99, 'pending',   '2026-05-06');`;

export const sqlChallenges: SqlChallenge[] = [
  {
    id: 'sql-top-wallets',
    title: 'Top wallets by balance',
    difficulty: 'easy',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'Return the 5 wallets with the highest balance, showing wallet id, currency, and balance, ordered from richest to poorest.',
    modelAnswer: `SELECT id, currency, balance
FROM wallets
ORDER BY balance DESC
LIMIT 5;`,
    explanation:
      'A straight SELECT with ORDER BY balance DESC puts the largest balances first, and LIMIT 5 caps the result. Because there is no filter, every wallet is a candidate. If ties at the boundary mattered you would add a tie-breaker column to ORDER BY for deterministic output.',
    concepts: ['SELECT', 'ORDER BY', 'LIMIT'],
  },
  {
    id: 'sql-active-wallets-with-owner',
    title: 'Active wallets with their owner',
    difficulty: 'easy',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'List every active wallet together with the owner email and country. Only include wallets whose status is active.',
    modelAnswer: `SELECT w.id, w.balance, u.email, u.country
FROM wallets w
JOIN users u ON u.id = w.user_id
WHERE w.status = 'active';`,
    explanation:
      'An inner JOIN matches each wallet to its owning user on user_id, and the WHERE clause keeps only active wallets. Using table aliases (w, u) keeps the column references unambiguous. An inner join is correct here because every wallet has a valid user_id foreign key, so no rows are dropped unexpectedly.',
    concepts: ['JOIN', 'WHERE'],
  },
  {
    id: 'sql-completed-credit-per-user',
    title: 'Completed credits per user',
    difficulty: 'medium',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'For each user, compute the total amount of COMPLETED credit transactions across all their wallets. Only include users whose completed credit total is greater than 500. Show full_name and the total.',
    modelAnswer: `SELECT u.full_name, SUM(t.amount) AS total_credit
FROM users u
JOIN wallets w  ON w.user_id = u.id
JOIN transactions t ON t.wallet_id = w.id
WHERE t.type = 'credit' AND t.status = 'completed'
GROUP BY u.id, u.full_name
HAVING SUM(t.amount) > 500;`,
    explanation:
      'The two JOINs walk users -> wallets -> transactions so amounts can be attributed to a user. The WHERE clause filters to completed credits BEFORE aggregation, then GROUP BY collapses to one row per user. HAVING filters on the aggregate (you cannot use SUM in WHERE), keeping only users above 500. Grouping by u.id as well as full_name is the safe, portable form.',
    concepts: ['JOIN', 'GROUP BY', 'HAVING', 'SUM'],
  },
  {
    id: 'sql-running-balance',
    title: 'Running balance per wallet',
    difficulty: 'hard',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'For wallet 10, list every transaction in chronological order with a running balance, treating credits as positive and debits as negative. Show created_at, type, amount, and the cumulative running_total.',
    modelAnswer: `SELECT
  created_at,
  type,
  amount,
  SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END)
    OVER (ORDER BY created_at, id) AS running_total
FROM transactions
WHERE wallet_id = 10
ORDER BY created_at, id;`,
    explanation:
      'The CASE expression signs each amount, and SUM(...) OVER (ORDER BY created_at, id) is a window function that accumulates the signed amounts row by row instead of collapsing them, giving a running total. Ordering inside the window by created_at then id makes the cumulative sum deterministic even when timestamps tie. Unlike GROUP BY, a window function keeps every individual row in the output.',
    concepts: ['window functions', 'CASE', 'running total'],
  },
];
