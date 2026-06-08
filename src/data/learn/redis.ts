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
        'The cache-aside pattern has the application read from the cache, fall back to the database on a miss, and populate the cache with a TTL. The main hazards are stale data (mitigated by TTL and invalidation on write) and the cache stampede, where a hot key expires and many requests hit the database at once — solved with a per-key lock, probabilistic early expiry, or serving stale while one worker refreshes. Pick an eviction policy like allkeys-lru for a pure cache. Cache penetration is a different hazard: requests for keys that will never exist in the cache keep hitting the database; mitigate it by caching negative results (a sentinel value like an empty string) or using a Bloom filter at the edge to reject obviously invalid lookups. Write-through and write-behind caches keep the cache in sync with the database, trading write latency for read consistency — choose the pattern based on whether your workload is read-heavy or write-heavy.',
    },
    {
      id: 'redis-data-structures',
      title: 'Data structures: choosing the right type',
      content:
        'Redis is not a plain key-value store — each key holds a typed data structure, and choosing the right one is a core interview topic. Strings store bytes, integers, or serialised JSON; INCR and INCRBY are atomic, making strings ideal for counters and rate limiters. Hashes represent objects as field-value maps and are memory-efficient for small objects because Redis uses a ziplist encoding internally below a configurable threshold. Lists are ordered, doubly linked sequences supporting O(1) push and pop at both ends; BLPOP enables blocking queue consumers. Sets enforce uniqueness and support O(1) membership tests plus set operations (union, intersection, difference) in O(n) — useful for storing user tags or friend lists. Sorted sets (zsets) attach a float score to each member and keep members sorted; ZADD, ZRANGE, and ZRANGEBYSCORE power leaderboards and time-series windowed queries. Streams (added in Redis 5) provide a persistent, consumer-group-aware log with at-least-once delivery semantics, making them a lightweight alternative to Kafka for modest throughput requirements.',
    },
    {
      id: 'redis-locks',
      title: 'Distributed locks and the single thread',
      content:
        'Redis executes commands on a single thread, so each command is atomic and you rarely need locks for one key. A simple distributed lock is SET key token NX EX 30: NX gives mutual exclusion, EX auto-expires if the holder crashes, and a unique token lets the owner release safely with a compare-and-delete Lua script. For multi-node safety the Redlock algorithm requires acquiring the lock on a majority of N independent Redis nodes within a validity window; if the total elapsed time exceeds the lock TTL, the acquisition is abandoned. Redlock is debated — Martin Kleppmann argues that even Redlock is unsafe without a fencing token (a monotonically increasing number appended to writes so the storage backend can reject late writes). In practice, a single well-configured Redis instance with appropriate TTLs is sufficient for most distributed lock use cases, and the added complexity of Redlock is only justified when the Redis instance itself is a single point of failure.',
    },
    {
      id: 'redis-persistence-eviction',
      title: 'Persistence: RDB, AOF, and eviction policies',
      content:
        'Redis offers two persistence mechanisms. RDB (Redis Database) snapshots the entire dataset to disk at configurable intervals using a fork-and-write approach; snapshots are compact and fast to restore but you can lose up to the last snapshot interval of writes. AOF (Append-Only File) logs every write command and can be configured to fsync on every write (no data loss), every second (at most one second of loss), or never (OS decides); AOF files grow large and are periodically rewritten in the background with BGREWRITEAOF. For production, combining both (AOF for durability, RDB for fast restarts) is recommended. Eviction policies define what Redis does when maxmemory is reached: noeviction returns errors on writes (suitable for a primary database), allkeys-lru evicts the least-recently used key from the entire keyspace (suitable for a pure cache), and volatile-lru only evicts keys that have a TTL set (suitable for a mixed workload). In interviews, demonstrate that you understand the trade-off: allkeys-lru keeps the most popular data in memory but can evict data you wanted to keep; set maxmemory conservatively and monitor evicted_keys in INFO stats.',
    },
    {
      id: 'redis-pipelines-transactions-lua',
      title: 'Pipelines, transactions, and Lua scripts',
      content:
        'A Redis pipeline batches multiple commands into one network round trip, dramatically reducing latency for bulk operations; the client sends all commands at once and reads all replies together. Pipelines do not guarantee atomicity — other clients can interleave commands between pipeline commands. MULTI/EXEC transactions provide atomicity in the sense that no other client\'s commands execute between MULTI and EXEC, but Redis does not roll back on command errors (a wrong type error in the middle of a transaction still commits the successful commands). Lua scripts executed with EVAL are truly atomic: Redis runs the entire script without interruption, which makes them the right tool for compare-and-swap patterns like releasing a lock only if the token matches. WATCH implements optimistic transactions: it monitors keys and causes EXEC to fail if any watched key changed, letting the application retry. In interviews, the key point is to match the tool to the consistency need: pipeline for throughput, MULTI/EXEC for isolation without rollback, Lua for atomic read-modify-write.',
    },
    {
      id: 'redis-cluster-replication',
      title: 'Pub/Sub, cluster, and replication',
      content:
        'Redis Pub/Sub provides at-most-once messaging: publishers send to a channel and all subscribers receive the message, but if a subscriber is offline it misses the message entirely. Streams (XADD, XREAD, XREADGROUP) solve this with persistence and consumer groups — each group tracks a last-read ID, and unacknowledged messages can be reclaimed, giving at-least-once delivery. Redis Replication is asynchronous by default: a primary streams commands to one or more replicas, which can serve read traffic. Redis Sentinel monitors the primary and coordinates automatic failover if it becomes unreachable, promoting a replica in roughly 10-30 seconds. Redis Cluster shards data across up to 1000 nodes using consistent hashing over 16384 hash slots; each slot is assigned to a primary, which may have replicas. The CLUSTER KEYSLOT command reveals which slot a key maps to; keys in the same hash tag (the substring between curly braces) always land on the same slot, which is important when a Lua script or transaction needs to operate on multiple keys. In interviews, be clear that Redis Cluster is a horizontal scaling solution, not a high-availability solution by itself — you still need replicas per shard for HA.',
    },
  ],
};
