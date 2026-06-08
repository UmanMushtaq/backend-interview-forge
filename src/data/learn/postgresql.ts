import type { LearnModule } from '../../types';

export const postgresql: LearnModule = {
  id: 'postgresql',
  title: 'PostgreSQL',
  blurb: 'Indexes, transactions, isolation levels, and query performance.',
  quizCategory: 'postgresql',
  lessons: [
    {
      id: 'pg-indexes',
      title: 'Indexes and query planning',
      content:
        'Indexes turn full table scans into fast lookups, but each one costs write time and storage, so index your real access patterns. B-tree suits equality and range queries; GIN suits containment lookups inside JSONB and arrays; partial indexes cover a hot subset of rows (for example, WHERE deleted_at IS NULL) so they are smaller and faster to maintain. Composite indexes are powerful but column order matters: a composite index on (user_id, created_at) serves queries that filter on user_id alone or on both columns, but not on created_at alone. Use EXPLAIN ANALYZE to see the real plan and timings — a large gap between estimated and actual rows usually means stale statistics, fixed by ANALYZE. In interviews, explain that an index-only scan is the fastest path because PostgreSQL can answer the query entirely from the index without touching heap pages, which requires the visibility map to be up to date via VACUUM.',
    },
    {
      id: 'pg-transactions',
      title: 'Transactions, isolation, and locking',
      content:
        'ACID transactions group statements so they all commit or all roll back. The default isolation level READ COMMITTED prevents dirty reads but allows non-repeatable reads; REPEATABLE READ and SERIALIZABLE add stronger guarantees at a concurrency cost. For contended updates choose between pessimistic locking (SELECT FOR UPDATE, which acquires a row-level lock) and optimistic locking (a version column checked on UPDATE — if the row changed, the update affects zero rows and the application retries). PostgreSQL\'s SERIALIZABLE isolation uses Serializable Snapshot Isolation (SSI), detecting dangerous cycles without blocking reads, making it practical for correctness-critical workloads. Store money as numeric(precision, scale) or as integer cents, never float, because floating-point arithmetic is inexact and will silently produce wrong totals in financial reporting.',
    },
    {
      id: 'pg-mvcc-vacuum',
      title: 'MVCC, VACUUM, and bloat',
      content:
        'PostgreSQL implements multi-version concurrency control (MVCC) by keeping old row versions on the heap instead of overwriting them; each row version carries xmin and xmax transaction IDs that define its visibility window. This lets readers and writers never block each other, which is a key performance advantage over lock-based databases. The cost is that dead row versions (tuples) accumulate and must be cleaned up by VACUUM. Regular autovacuum runs in the background and also updates the visibility map used by index-only scans. Table bloat occurs when autovacuum cannot keep up with a high update or delete rate; VACUUM FULL rewrites the table to reclaim space but takes an exclusive lock, so it should only be used in scheduled maintenance windows. In interviews, be ready to explain transaction ID wraparound: PostgreSQL uses 32-bit transaction IDs, so a table not vacuumed for roughly two billion transactions becomes unreadable — autovacuum\'s anti-wraparound pass exists specifically to prevent this.',
    },
    {
      id: 'pg-jsonb-window',
      title: 'JSONB and window functions',
      content:
        'JSONB stores JSON in a decomposed binary format that supports GIN indexing and fast containment queries using the @> operator (for example, data @> \'{"role": "admin"}\' finds all rows where the role key equals admin). It is slower to insert than plain JSON because it parses and reorders keys at write time, but much faster to query. Avoid reaching for JSONB as a substitute for proper columns on frequently queried attributes — it should extend relational data, not replace it. Window functions (ROW_NUMBER, RANK, LAG, LEAD, SUM OVER) perform calculations across a set of rows related to the current row without collapsing them into groups. A common interview pattern is: rank users by revenue within each country using RANK() OVER (PARTITION BY country ORDER BY revenue DESC). Unlike GROUP BY, window functions preserve every row, making them ideal for running totals, moving averages, and gap-and-island problems.',
    },
    {
      id: 'pg-connection-pooling',
      title: 'Connection pooling and performance tuning',
      content:
        'PostgreSQL spawns a separate OS process for each client connection, so each connection costs roughly 5-10 MB of RAM and significant connection setup time. In high-concurrency applications this becomes a bottleneck, which is why PgBouncer (a lightweight connection pooler) sits between the application and the database. PgBouncer supports three pooling modes: session (a server connection follows the client for the whole session), transaction (returned to the pool after each transaction — the most common mode), and statement (returned after each statement, incompatible with multi-statement transactions). In interviews, the key trade-off to articulate is that transaction-mode pooling makes the database scale to thousands of application connections with dozens of server connections, but prepared statements and session-level settings (like SET LOCAL) become problematic because the server connection may differ on the next transaction. Application-side pools (like pg-pool in Node.js) are simpler but do not multiplex connections as aggressively.',
    },
    {
      id: 'pg-normalization-replication',
      title: 'Normalization, replication, and high availability',
      content:
        'Normalization eliminates redundancy through normal forms: first (1NF) removes repeating groups, second (2NF) removes partial dependencies on composite keys, third (3NF) removes transitive dependencies. In practice, denormalization is sometimes deliberate — read-heavy reporting tables may duplicate data to avoid expensive joins. PostgreSQL streaming replication sends WAL (write-ahead log) records to standby servers; logical replication selectively replicates individual tables and is used for zero-downtime migrations and cross-version upgrades. Write-ahead logging is also the foundation of crash recovery: every change is written to the WAL before it touches data pages, so the database can replay the WAL on restart after a crash. In interviews, explain the difference between synchronous and asynchronous replication: synchronous (synchronous_commit = on) guarantees no data loss on primary failure at the cost of added write latency, while asynchronous is faster but risks losing the last few transactions if the primary crashes before the standby applies them.',
    },
  ],
};
