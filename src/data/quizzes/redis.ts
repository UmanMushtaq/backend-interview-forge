import type { QuizQuestion } from '../../types';

export const redis: QuizQuestion[] = [
  {
    id: 'redis-lock-001',
    category: 'redis',
    subcategory: 'distributed-locks',
    difficulty: 'core',
    question: 'Which command acquires a simple distributed lock that auto-expires?',
    options: [
      'SET lock:key token NX EX 30',
      'SET lock:key token',
      'GET lock:key then SET lock:key token',
      'INCR lock:key',
    ],
    correctIndex: 0,
    explanation:
      'SET key value NX EX 30 sets the key only if it does not already exist (NX) and attaches a 30s expiry (EX) atomically, which is exactly what a lock needs. The GET-then-SET option is a race condition because two clients can both read "empty" and both write. Always store a unique token as the value so the owner can safely release it with a compare-and-delete Lua script.',
    interviewTip: 'NX gives mutual exclusion; EX gives a safety timeout if the holder crashes.',
  },
  {
    id: 'redis-cache-aside-001',
    category: 'redis',
    subcategory: 'caching',
    difficulty: 'foundation',
    question: 'In the cache-aside pattern, what happens on a cache miss?',
    options: [
      'The cache loads the value itself from the database automatically',
      'The application reads from the database, returns it, and writes it back into the cache',
      'The request fails until the cache is warmed',
      'The database is bypassed entirely',
    ],
    correctIndex: 1,
    explanation:
      'With cache-aside (lazy loading), the application is in charge: on a miss it fetches from the source of truth, returns the value, and populates the cache with a TTL for next time. The cache itself is passive — it does not know about your database. The main risks are stale data (mitigated by TTL and invalidation on write) and the thundering-herd of many misses at once.',
    interviewTip: 'Contrast cache-aside (app loads) with read-through (cache loads).',
  },
  {
    id: 'redis-eviction-001',
    category: 'redis',
    subcategory: 'eviction',
    difficulty: 'core',
    question: 'Redis is used purely as a cache and is full. Which maxmemory-policy fits best?',
    options: [
      'noeviction',
      'allkeys-lru',
      'volatile-ttl only on keys you forgot to expire',
      'It is impossible to evict in Redis',
    ],
    correctIndex: 1,
    explanation:
      'For a pure cache you want Redis to drop the least valuable data when memory is full, and allkeys-lru evicts the least-recently-used key across the whole keyspace. noeviction would instead start rejecting writes, which is wrong for a cache. If only some keys have TTLs and others are persistent state, a volatile-* policy may fit better, but a dedicated cache usually uses allkeys-lru or allkeys-lfu.',
  },
  {
    id: 'redis-threading-001',
    category: 'redis',
    subcategory: 'architecture',
    difficulty: 'expert',
    question: 'Redis executes commands on a single thread. What is the key implication?',
    options: [
      'It can only handle one client connection at a time',
      'Each command is atomic, but one slow command (e.g. KEYS *) blocks everything',
      'It cannot use more than one CPU core for anything',
      'Transactions are impossible',
    ],
    correctIndex: 1,
    explanation:
      'Because the command-execution loop is single-threaded, individual commands run to completion without interleaving, which is why operations are atomic and you rarely need locks for a single key. The flip side is that an O(N) command like KEYS * or a big Lua script stalls every other client until it finishes. That is why you use SCAN instead of KEYS and keep scripts short.',
    interviewTip: 'Single-threaded = free atomicity, but never run O(N) commands in production.',
  },
];
