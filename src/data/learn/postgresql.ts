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
        'Indexes turn full table scans into fast lookups, but each one costs write time and storage, so index your real access patterns. B-tree suits equality and range queries; GIN suits containment lookups inside JSONB and arrays; partial indexes cover a hot subset of rows. Use EXPLAIN ANALYZE to see the real plan and timings — a large gap between estimated and actual rows usually means stale statistics, fixed by ANALYZE.',
    },
    {
      id: 'pg-transactions',
      title: 'Transactions, isolation, and locking',
      content:
        'ACID transactions group statements so they all commit or all roll back. The default isolation level READ COMMITTED prevents dirty reads but allows non-repeatable reads; REPEATABLE READ and SERIALIZABLE add stronger guarantees at a concurrency cost. For contended updates choose between pessimistic locking (SELECT FOR UPDATE) and optimistic locking (a version column checked on UPDATE). Store money as numeric, never float.',
    },
  ],
};
