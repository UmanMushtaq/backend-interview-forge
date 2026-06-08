import type { QuizQuestion } from '../../types';

export const rabbitmq: QuizQuestion[] = [
  {
    id: 'rmq-exchange-001',
    category: 'rabbitmq',
    subcategory: 'exchanges',
    difficulty: 'core',
    question: 'Which exchange type routes a message to every bound queue, ignoring the routing key?',
    options: ['direct', 'topic', 'fanout', 'headers'],
    correctIndex: 2,
    explanation:
      'A fanout exchange broadcasts each message to all bound queues regardless of routing key, which is ideal for publish/subscribe style events that many independent consumers care about. direct matches an exact routing key, and topic matches wildcard patterns like order.*. Choosing the exchange type is really choosing your routing semantics.',
    interviewTip: 'fanout = broadcast, direct = exact key, topic = wildcard patterns.',
  },
  {
    id: 'rmq-dlq-001',
    category: 'rabbitmq',
    subcategory: 'dead-letter-queues',
    difficulty: 'core',
    question: 'What is the primary purpose of a dead-letter queue (DLQ)?',
    options: [
      'To speed up message delivery',
      'To capture messages that were rejected, expired, or exceeded retry limits for later inspection',
      'To store a backup copy of every successful message',
      'To replace the need for acknowledgements',
    ],
    correctIndex: 1,
    explanation:
      'A DLQ is where messages go when they cannot be processed — they were nacked without requeue, hit a TTL, or blew past a retry limit. This keeps poison messages from blocking the main queue while preserving them so you can debug, fix, and replay. Pair it with a retry/back-off strategy so transient failures retry but permanent failures land in the DLQ.',
    interviewTip: 'DLQ isolates poison messages so one bad payload cannot stall the queue.',
  },
  {
    id: 'rmq-saga-001',
    category: 'rabbitmq',
    subcategory: 'saga',
    difficulty: 'expert',
    question: 'Why choose the Saga pattern over a two-phase commit (2PC) for a distributed transaction across microservices?',
    options: [
      'Saga guarantees stronger ACID isolation than 2PC',
      'Saga avoids a blocking global lock and coordinator, trading strict atomicity for availability via compensating actions',
      'Saga is simpler because it needs no error handling',
      '2PC is impossible over a message broker',
    ],
    correctIndex: 1,
    explanation:
      '2PC holds locks and depends on a coordinator across all participants, so a slow or failed node blocks everyone — poor availability at scale. A Saga instead runs a sequence of local transactions and, if a later step fails, executes compensating transactions to undo the earlier ones. You give up strict isolation and accept eventual consistency in exchange for resilience and loose coupling.',
    interviewTip: 'Say Saga = local transactions + compensations; 2PC = blocking locks + coordinator.',
  },
  {
    id: 'rmq-idempotency-001',
    category: 'rabbitmq',
    subcategory: 'idempotency',
    difficulty: 'expert',
    question: 'Your consumer uses at-least-once delivery. How do you stop duplicate messages from double-charging a wallet?',
    options: [
      'Switch to fire-and-forget with no acks',
      'Make processing idempotent, e.g. dedupe on a unique message/operation id stored transactionally',
      'Increase the prefetch count',
      'Use a fanout exchange',
    ],
    correctIndex: 1,
    explanation:
      'At-least-once delivery means a message can be redelivered (e.g. after a consumer crash before the ack), so consumers must be idempotent. The standard technique is to record a unique idempotency key (message id or business operation id) in the same database transaction as the side effect, and skip the work if the key was already seen. That way a redelivery is a safe no-op instead of a second charge.',
    interviewTip: 'At-least-once + idempotency key = effectively-once processing.',
  },
];
