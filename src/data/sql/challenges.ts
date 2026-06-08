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
  // ── EASY ─────────────────────────────────────────────────────────────────
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
    id: 'sql-pending-transactions',
    title: 'Pending transactions',
    difficulty: 'easy',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'Return all transactions whose status is pending. Show the transaction id, wallet_id, type, amount, and created_at, sorted by created_at ascending.',
    modelAnswer: `SELECT id, wallet_id, type, amount, created_at
FROM transactions
WHERE status = 'pending'
ORDER BY created_at ASC;`,
    explanation:
      'The WHERE clause filters to only pending rows before any sorting happens, which keeps the work minimal. ORDER BY created_at ASC surfaces the oldest pending transactions first, which is the natural queue order for a payments system. No JOIN is needed because all required columns live in the transactions table.',
    concepts: ['SELECT', 'WHERE', 'ORDER BY'],
  },
  {
    id: 'sql-users-from-country',
    title: 'Users from a specific country',
    difficulty: 'easy',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'List the full_name and email of every user whose country is FR, ordered alphabetically by full_name.',
    modelAnswer: `SELECT full_name, email
FROM users
WHERE country = 'FR'
ORDER BY full_name ASC;`,
    explanation:
      'The WHERE predicate country = FR restricts the scan to French users. ORDER BY full_name ASC returns names in alphabetical order, which makes the result deterministic. Only the two requested columns are projected to keep the output lean.',
    concepts: ['SELECT', 'WHERE', 'ORDER BY'],
  },
  {
    id: 'sql-wallets-for-user',
    title: 'Wallets belonging to a user',
    difficulty: 'easy',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'Given the email amelie@nexus.eu, find all wallets that belong to that user. Return wallet id, currency, balance, and status.',
    modelAnswer: `SELECT w.id, w.currency, w.balance, w.status
FROM wallets w
JOIN users u ON u.id = w.user_id
WHERE u.email = 'amelie@nexus.eu';`,
    explanation:
      'Joining wallets to users on the foreign key user_id allows filtering by email without knowing the user id upfront. The WHERE clause narrows to the single user, and only the four requested columns are projected. An inner join is safe here because the foreign key guarantees every wallet row has a matching user.',
    concepts: ['JOIN', 'WHERE', 'foreign key'],
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────
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
    id: 'sql-transaction-count-by-type',
    title: 'Transaction count and total by type',
    difficulty: 'medium',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'For each combination of transaction type and status, return the number of transactions and the total amount. Order results by type, then status.',
    modelAnswer: `SELECT
  type,
  status,
  COUNT(*)        AS transaction_count,
  SUM(amount)     AS total_amount
FROM transactions
GROUP BY type, status
ORDER BY type, status;`,
    explanation:
      'GROUP BY type, status creates one bucket per unique (type, status) pair. COUNT(*) tallies all rows in each bucket and SUM(amount) accumulates the amounts. No JOIN is needed because every relevant column lives in transactions. The ORDER BY mirrors the GROUP BY so the output is easy to scan.',
    concepts: ['GROUP BY', 'COUNT', 'SUM', 'ORDER BY'],
  },
  {
    id: 'sql-wallets-no-transactions',
    title: 'Wallets with no transactions',
    difficulty: 'medium',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'Find all wallets that have never had a transaction. Return the wallet id, currency, and the owning user email.',
    modelAnswer: `SELECT w.id, w.currency, u.email
FROM wallets w
JOIN users u ON u.id = w.user_id
WHERE NOT EXISTS (
  SELECT 1
  FROM transactions t
  WHERE t.wallet_id = w.id
);`,
    explanation:
      'The NOT EXISTS subquery checks whether any transaction row references the current wallet. If no such row exists the predicate is true and the wallet is included in the result. This is often more readable than a LEFT JOIN / IS NULL pattern and can be equally efficient when an index exists on transactions.wallet_id. The outer JOIN to users retrieves the email.',
    concepts: ['subquery', 'NOT EXISTS', 'JOIN'],
  },
  {
    id: 'sql-recent-7-days',
    title: 'Transactions in the last 7 days',
    difficulty: 'medium',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'Return all completed transactions created within the last 7 days. Show transaction id, wallet_id, type, amount, and created_at.',
    modelAnswer: `SELECT id, wallet_id, type, amount, created_at
FROM transactions
WHERE status = 'completed'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;`,
    explanation:
      'The interval arithmetic NOW() - INTERVAL 7 days produces a timestamp 7 days before the current moment, making the filter dynamic. Combining it with the status filter in a single WHERE clause lets the database apply both conditions in one pass. An index on (status, created_at) would allow an index range scan here, avoiding a full table scan. ORDER BY created_at DESC surfaces the newest rows first.',
    concepts: ['DATE functions', 'INTERVAL', 'WHERE', 'ORDER BY'],
  },
  {
    id: 'sql-avg-balance-by-country',
    title: 'Average wallet balance by country',
    difficulty: 'medium',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'Calculate the average wallet balance grouped by user country. Only include countries where the average balance exceeds 200. Show country and avg_balance rounded to 2 decimal places.',
    modelAnswer: `SELECT
  u.country,
  ROUND(AVG(w.balance), 2) AS avg_balance
FROM wallets w
JOIN users u ON u.id = w.user_id
GROUP BY u.country
HAVING AVG(w.balance) > 200
ORDER BY avg_balance DESC;`,
    explanation:
      'Joining wallets to users lets us group by a column that lives in users. AVG(w.balance) computes the mean balance per country bucket. ROUND(..., 2) trims the result to two decimal places for presentation. HAVING AVG(w.balance) > 200 post-filters the aggregated groups, which is necessary because WHERE cannot reference aggregate functions.',
    concepts: ['AVG', 'ROUND', 'GROUP BY', 'HAVING', 'JOIN'],
  },

  // ── HARD ──────────────────────────────────────────────────────────────────
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
  {
    id: 'sql-row-number-per-wallet',
    title: 'Rank transactions within each wallet',
    difficulty: 'hard',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'For every transaction, assign a sequential row number within its wallet ordered by created_at ascending. Return wallet_id, transaction id, created_at, amount, and the row number as txn_rank.',
    modelAnswer: `SELECT
  wallet_id,
  id,
  created_at,
  amount,
  ROW_NUMBER() OVER (
    PARTITION BY wallet_id
    ORDER BY created_at, id
  ) AS txn_rank
FROM transactions
ORDER BY wallet_id, txn_rank;`,
    explanation:
      'PARTITION BY wallet_id restarts the counter for each wallet, so the numbering is independent across wallets. ORDER BY created_at, id inside the window determines which transaction gets rank 1 within that wallet. ROW_NUMBER never produces ties; if you wanted ties to share the same rank you would use RANK() or DENSE_RANK() instead. The outer ORDER BY simply presents the output in a logical reading order.',
    concepts: ['ROW_NUMBER', 'PARTITION BY', 'window functions'],
  },
  {
    id: 'sql-lag-amount-change',
    title: 'Amount change from previous transaction',
    difficulty: 'hard',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'For each transaction, show the amount and the amount of the immediately preceding transaction in the same wallet (ordered by created_at, id). Label the columns amount and prev_amount. Rows with no predecessor should show NULL for prev_amount.',
    modelAnswer: `SELECT
  wallet_id,
  id,
  created_at,
  amount,
  LAG(amount) OVER (
    PARTITION BY wallet_id
    ORDER BY created_at, id
  ) AS prev_amount
FROM transactions
ORDER BY wallet_id, created_at, id;`,
    explanation:
      'LAG(amount) looks back one row within the same window partition, which is PARTITION BY wallet_id. The first transaction in each wallet has no predecessor, so LAG returns NULL by default. You can supply a fallback as a second argument to LAG if you prefer a specific default. LEAD would do the opposite, looking at the next row. Both functions avoid the need for a self-join.',
    concepts: ['LAG', 'window functions', 'PARTITION BY'],
  },
  {
    id: 'sql-cte-high-value-users',
    title: 'High-value users via CTE',
    difficulty: 'hard',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem:
      'Using a CTE, first calculate the total completed transaction volume (credits + debits) per user. Then select only users whose total volume exceeds 1000, returning full_name, email, and total_volume.',
    modelAnswer: `WITH user_volume AS (
  SELECT
    u.id,
    u.full_name,
    u.email,
    SUM(t.amount) AS total_volume
  FROM users u
  JOIN wallets w ON w.user_id = u.id
  JOIN transactions t ON t.wallet_id = w.id
  WHERE t.status = 'completed'
  GROUP BY u.id, u.full_name, u.email
)
SELECT full_name, email, total_volume
FROM user_volume
WHERE total_volume > 1000
ORDER BY total_volume DESC;`,
    explanation:
      'The CTE user_volume encapsulates the aggregation logic, making the outer query clean and readable. Both credit and debit amounts are summed because we want total volume, not net balance. The WHERE t.status = completed inside the CTE ensures only settled transactions count. The outer WHERE filters on the computed aggregate, which would require HAVING if written as a single query. CTEs also enable reuse: user_volume could be referenced multiple times in a larger query.',
    concepts: ['CTE', 'WITH', 'GROUP BY', 'SUM', 'JOIN'],
  },
  {
    id: 'sql-index-design',
    title: 'Index design for transaction queries',
    difficulty: 'hard',
    schema: SCHEMA,
    sampleData: SAMPLE,
    problem: `The following query runs millions of times a day and is slow:

    SELECT id, wallet_id, type, amount, created_at
    FROM transactions
    WHERE status = 'completed'
      AND created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC;

Design one or two indexes that would best support this query. Write the CREATE INDEX statements and explain your reasoning.`,
    modelAnswer: `CREATE INDEX idx_transactions_status_created_at
  ON transactions (status, created_at DESC);`,
    explanation:
      'Placing status as the leading column lets the database seek directly to the completed partition, eliminating all non-completed rows without scanning them. The second column created_at DESC aligns with both the range predicate (>= NOW() - 7 days) and the ORDER BY direction, so the engine can do an index range scan and return rows in sorted order without a separate sort step. A covering index could also include (type, amount) to avoid heap fetches entirely, at the cost of more write overhead. A separate index on just created_at would be weaker because it cannot filter on status first. Partial indexes (WHERE status = completed) are another option on PostgreSQL and can be smaller and faster when one status value dominates query traffic.',
    concepts: ['indexes', 'CREATE INDEX', 'query optimization', 'composite index'],
  },
];
