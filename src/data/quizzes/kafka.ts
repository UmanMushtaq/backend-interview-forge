import type { QuizQuestion } from '../../types';

export const kafka: QuizQuestion[] = [
  {
    id: 'kafka-partition-001',
    category: 'kafka',
    subcategory: 'partitions',
    difficulty: 'core',
    question: 'In Kafka, what does message ordering actually guarantee?',
    options: [
      'Global ordering across the entire topic',
      'Ordering only within a single partition',
      'Ordering only if there is exactly one consumer',
      'No ordering is ever guaranteed',
    ],
    correctIndex: 1,
    explanation:
      'Kafka guarantees order within a partition, not across the whole topic. Messages with the same key hash to the same partition, so per-key ordering holds — which is why you key by entity id (e.g. walletId) when order matters. If you need strict global ordering you must use a single partition, sacrificing parallelism.',
    interviewTip: 'Key by entity id to keep per-entity order while still scaling partitions.',
  },
  {
    id: 'kafka-consumer-group-001',
    category: 'kafka',
    subcategory: 'consumer-groups',
    difficulty: 'core',
    question: 'How are partitions distributed among consumers in the same consumer group?',
    options: [
      'Every consumer reads every partition',
      'Each partition is assigned to exactly one consumer in the group at a time',
      'Partitions are shared randomly per message',
      'Only the group leader consumes messages',
    ],
    correctIndex: 1,
    explanation:
      'Within a consumer group, each partition is owned by exactly one consumer, which is how Kafka scales out work while preserving per-partition order. This means group parallelism is capped by the partition count — more consumers than partitions leaves some idle. Different groups, however, each get their own full copy of the stream, which is how you fan out to independent pipelines.',
    interviewTip: 'Max useful consumers in a group equals the number of partitions.',
  },
  {
    id: 'kafka-vs-rmq-001',
    category: 'kafka',
    subcategory: 'comparison',
    difficulty: 'expert',
    question: 'When is Kafka a better fit than RabbitMQ?',
    options: [
      'When you need complex per-message routing and short-lived task queues',
      'When you need a durable, replayable, high-throughput event log retained for many consumers',
      'When you never need to re-read messages',
      'When you require synchronous request/response',
    ],
    correctIndex: 1,
    explanation:
      'Kafka is a distributed, append-only log: messages are retained by time/size and consumers track their own offset, so multiple independent pipelines can read and replay the same stream at high throughput. RabbitMQ is a smarter broker for routing and task distribution where a message is typically consumed once and then gone. Choose Kafka for event streaming/analytics and event sourcing; choose RabbitMQ for command queues and rich routing.',
    interviewTip: 'Kafka = replayable log; RabbitMQ = smart broker for transient tasks.',
  },
  {
    id: 'kafka-acks-001',
    category: 'kafka',
    subcategory: 'producer-acks',
    difficulty: 'expert',
    question: 'A producer sets acks=all. What does it buy you, and at what cost?',
    options: [
      'Lowest latency, but messages can be lost on broker failure',
      'The leader and all in-sync replicas must acknowledge, maximizing durability at the cost of latency',
      'It disables replication entirely',
      'It guarantees exactly-once with no other configuration',
    ],
    correctIndex: 1,
    explanation:
      'acks=all means the leader waits for every in-sync replica to persist the record before acknowledging, so a single broker failure will not lose the write — the strongest durability setting. The cost is higher latency and lower throughput compared to acks=1 or acks=0. For true exactly-once you additionally enable the idempotent producer and transactions; acks=all alone only protects against loss.',
  },
];
