import type { ArchitectureModule } from '../../types';

export const distributedSystems: ArchitectureModule = {
  id: 'distributed-systems',
  title: 'Distributed Systems Concepts',
  blurb: 'CAP theorem, consistency models, distributed locks, idempotency, rate limiting, circuit breakers.',
  lessons: [],
  plannedLessons: [
    'CAP theorem in practice, not just the definition',
    'Consistency models: strong vs eventual',
    'Distributed locks (the Redis wallet lock in NexusPay)',
    'Idempotency and exactly-once processing',
    'Rate limiting strategies',
    'Circuit breakers, retries, and timeouts',
  ],
};
