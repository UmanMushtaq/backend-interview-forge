import type { LearnModule } from '../../types';

export const redis: LearnModule = {
  id: 'redis',
  title: 'Redis',
  blurb: 'Caching patterns, distributed locks, eviction, and persistence.',
  quizCategory: 'redis',
  lessons: [
    {
      id: 'redis-caching',
      title: 'Caching patterns and pitfalls',
      content:
        'The cache-aside pattern has the application read from the cache, fall back to the database on a miss, and populate the cache with a TTL. The main hazards are stale data (mitigated by TTL and invalidation on write) and the cache stampede, where a hot key expires and many requests hit the database at once — solved with a per-key lock, probabilistic early expiry, or serving stale while one worker refreshes. Pick an eviction policy like allkeys-lru for a pure cache.',
    },
    {
      id: 'redis-locks',
      title: 'Distributed locks and the single thread',
      content:
        'Redis executes commands on a single thread, so each command is atomic and you rarely need locks for one key. A simple distributed lock is SET key token NX EX 30: NX gives mutual exclusion, EX auto-expires if the holder crashes, and a unique token lets the owner release safely with a compare-and-delete script. For multi-node safety the Redlock algorithm requires a majority quorum, though it is debated — handle the case where the lock expires mid-operation with a fencing token.',
    },
  ],
};
