import type { QuizQuestion } from '../../types';

export const systemDesign: QuizQuestion[] = [
  {
    id: 'sd-cap-001',
    category: 'system-design',
    subcategory: 'cap-theorem',
    difficulty: 'core',
    question: 'During a network partition, CAP says you must choose between which two properties?',
    options: [
      'Consistency and Availability',
      'Consistency and Partition tolerance',
      'Availability and Partition tolerance',
      'Latency and Throughput',
    ],
    correctIndex: 0,
    explanation:
      'Partition tolerance is non-negotiable in a distributed system — networks fail — so the real choice during a partition is between Consistency and Availability. A CP system rejects or blocks requests it cannot make consistent; an AP system keeps serving but may return stale data and reconcile later. Most real systems pick per-operation: strong consistency for money movements, availability for feeds.',
    interviewTip: 'Frame CAP as a per-operation choice, not a whole-system label.',
  },
  {
    id: 'sd-cqrs-001',
    category: 'system-design',
    subcategory: 'cqrs',
    difficulty: 'expert',
    question: 'What problem does CQRS primarily solve?',
    options: [
      'It removes the need for a database',
      'It lets the read model and write model scale and be shaped independently',
      'It guarantees ACID across microservices',
      'It eliminates eventual consistency',
    ],
    correctIndex: 1,
    explanation:
      'CQRS (Command Query Responsibility Segregation) splits the write path from the read path so each can use a model and store optimized for its job — for example a normalized write store and denormalized, fast read projections. This shines when read and write loads are very asymmetric. The cost is added complexity and usually eventual consistency between the command side and the query projections.',
    interviewTip: 'Only reach for CQRS when read/write needs genuinely diverge.',
  },
  {
    id: 'sd-circuit-001',
    category: 'system-design',
    subcategory: 'resilience',
    difficulty: 'core',
    question: 'What does a circuit breaker protect against?',
    options: [
      'SQL injection',
      'Cascading failures by stopping calls to a failing dependency and failing fast',
      'Data corruption during writes',
      'Unauthorized API access',
    ],
    correctIndex: 1,
    explanation:
      'A circuit breaker tracks failures to a downstream dependency and, once a threshold is crossed, opens to fail fast instead of piling up slow calls and exhausting threads or connections — preventing one sick service from dragging down its callers. After a cooldown it goes half-open to test recovery before closing again. It is usually paired with timeouts, retries with back-off, and a fallback response.',
    interviewTip: 'Closed -> Open (fail fast) -> Half-open (probe) -> Closed.',
  },
  {
    id: 'sd-db-per-service-001',
    category: 'system-design',
    subcategory: 'microservices',
    difficulty: 'expert',
    question: 'Why adopt database-per-service in a microservice architecture?',
    options: [
      'To allow services to share tables and join freely',
      'To enforce loose coupling and independent deployability, at the cost of cross-service queries and transactions',
      'Because one database cannot hold multiple schemas',
      'To guarantee global ACID transactions',
    ],
    correctIndex: 1,
    explanation:
      'Giving each service its own database prevents hidden coupling through shared tables, so teams can evolve schemas and deploy independently — a core goal of microservices. The trade-off is that you lose cross-service JOINs and single-database transactions, so you reach for API composition, data replication, and Sagas instead. If services constantly need each other\'s tables, that is a signal the boundaries are drawn wrong.',
    interviewTip: 'Private data per service is what makes services independently deployable.',
  },
];
