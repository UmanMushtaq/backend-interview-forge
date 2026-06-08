import type { LearnModule } from '../../types';

export const kafka: LearnModule = {
  id: 'kafka',
  title: 'Kafka',
  blurb: 'The log, partitions, consumer groups, and delivery semantics.',
  quizCategory: 'kafka',
  lessons: [
    {
      id: 'kafka-log',
      title: 'The log, partitions, and ordering',
      content:
        'Kafka is a distributed append-only log. A topic is split into partitions, and ordering is guaranteed only within a partition — messages with the same key hash to the same partition, so key by entity id when per-entity order matters. Messages are retained by time or size and consumers track their own offset, which is what makes replay and fan-out to many independent consumer groups possible without copying data. This log model is fundamentally different from a traditional message queue: the broker does not discard a message after delivery, so any consumer group can independently re-read history from any offset. Choosing partition count is an important capacity decision — you cannot reduce it later, and each partition adds leader-election overhead. A rule of thumb is to target partitions that give each consumer in the group roughly equal throughput, then multiply by two for headroom.',
    },
    {
      id: 'kafka-consumer-groups',
      title: 'Consumer groups and rebalancing',
      content:
        'Within a consumer group each partition is owned by exactly one consumer at a time, so the maximum useful parallelism equals the partition count. When a consumer joins or leaves the group, Kafka triggers a rebalance: the group coordinator pauses all consumers, reassigns partitions, and resumes. Eager rebalancing (the classic strategy) revokes all partition assignments during the pause, causing a stop-the-world gap; cooperative (incremental) rebalancing introduced in Kafka 2.4 only moves partitions that need to change, keeping the rest processing continuously. During a rebalance any in-flight work can cause duplicate processing because uncommitted offsets get re-read by the new owner, so consumers should commit offsets frequently and process idempotently. Different consumer groups each receive the full stream independently, which makes Kafka ideal for fan-out to analytics, search indexing, audit logging, and operational consumers simultaneously without any coordination between them.',
    },
    {
      id: 'kafka-offsets-retention',
      title: 'Offsets, commits, retention, and log compaction',
      content:
        'Consumer offsets are stored in the internal __consumer_offsets topic. Auto-commit (enable.auto.commit=true) commits periodically in a background thread, but this can commit an offset before the application has finished processing the corresponding message, losing work on crash. Manual commit after processing (commitSync or commitAsync) gives at-least-once semantics: if the consumer crashes after processing but before committing, it re-reads and re-processes the same message. Retention can be time-based (log.retention.hours, default 168 hours) or size-based (log.retention.bytes). Log compaction is an alternative retention policy that keeps only the latest message per key, making a topic behave like a compacted changelog or materialised view — useful for event-sourced state snapshots that new consumers can bootstrap from. Deleted keys are represented by tombstone messages (null value) which are themselves eventually removed after the tombstone retention period.',
    },
    {
      id: 'kafka-replication',
      title: 'Replication, ISR, and producer acks',
      content:
        'Each partition has one leader and zero or more follower replicas. The in-sync replicas (ISR) set contains the leader plus any followers that are caught up within replica.lag.time.max.ms. The producer acks setting controls durability: acks=0 fires and forgets; acks=1 waits for the leader to write (loses data if the leader crashes before followers replicate); acks=all (or -1) waits for all ISR members to write, which is the only setting that prevents data loss during a clean leader failover. min.insync.replicas (typically 2 for a 3-node cluster) sets the minimum ISR size that must acknowledge before the broker accepts the write — if fewer replicas are in sync the produce call is rejected with NotEnoughReplicasException, trading availability for durability. Unclean leader election (unclean.leader.election.enable=false by default since 0.11) prevents an out-of-date replica from becoming leader and introducing data loss or divergence.',
    },
    {
      id: 'kafka-exactly-once',
      title: 'Idempotent producer, transactions, and exactly-once',
      content:
        'The idempotent producer (enable.idempotence=true) assigns each message a producer id and sequence number; the broker deduplicates retries within a single producer session, eliminating duplicate writes caused by network timeouts. Kafka transactions extend this to atomic multi-partition writes: the producer opens a transaction, writes to multiple partitions and/or the offsets topic, then calls commitTransaction — consumers with isolation.level=read_committed see only committed data. Combining the idempotent producer, transactions, and read_committed consumers gives exactly-once stream processing semantics (EOS), which Kafka Streams uses internally. The cost is higher latency from the two-phase commit protocol between the producer and the transaction coordinator. In practice, many applications accept at-least-once with idempotent consumers rather than paying the EOS overhead, especially when side effects are naturally idempotent (upserts, set operations) or when duplicate event rates are very low.',
    },
    {
      id: 'kafka-vs-rabbitmq-outbox',
      title: 'Kafka vs RabbitMQ and the outbox pattern',
      content:
        'Kafka and RabbitMQ solve overlapping but different problems. RabbitMQ is a traditional message broker: it excels at task queues, complex routing (exchange types), per-message TTL, and request/reply patterns, and it is operationally simpler for small-scale deployments. Kafka is optimised for high-throughput event streaming, long-term retention, replay, and fan-out to many independent consumers; it is harder to operate but offers horizontal scale and a durable ordered log that RabbitMQ does not. Choose RabbitMQ for command dispatch and workflow coordination; choose Kafka for event streaming, audit logs, and systems where consumers need to replay history. The outbox pattern solves the dual-write problem in either broker: instead of writing to the database and publishing to the broker in two separate calls (which can fail independently), you write an outbox record in the same database transaction as the business change, then a relay process reads committed outbox rows and publishes them, guaranteeing that a message is published if and only if the database transaction committed. Kafka Connect with Debezium implements this via CDC (change-data capture) on the database transaction log, removing the need for a custom relay.',
    },
  ],
};
