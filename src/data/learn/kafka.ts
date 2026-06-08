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
        'Kafka is a distributed append-only log. A topic is split into partitions, and ordering is guaranteed only within a partition — messages with the same key hash to the same partition, so key by entity id when per-entity order matters. Messages are retained by time or size and consumers track their own offset, which is what makes replay and fan-out to many independent consumer groups possible without copying data.',
    },
    {
      id: 'kafka-delivery',
      title: 'Consumer groups and delivery semantics',
      content:
        'Within a consumer group each partition is owned by exactly one consumer, so parallelism is capped by partition count; different groups each get the full stream. acks=all maximises durability by waiting for all in-sync replicas. End-to-end exactly-once needs three things together: the idempotent producer, Kafka transactions, and consumers reading with isolation.level=read_committed. Compacted topics keep only the latest value per key, acting as a changelog.',
    },
  ],
};
