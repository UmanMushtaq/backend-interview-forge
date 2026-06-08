import type { InterviewQuestion } from '../../types';

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: 'iv-nexuspay-architecture',
    category: 'nexuspay',
    question: 'Walk me through the architecture of NexusPay.',
    modelAnswer:
      'NexusPay is a set of NestJS microservices split by business capability — auth, KYC, wallet, payments, notifications, and analytics — each owning its own PostgreSQL database. Services exchange commands and domain events over RabbitMQ, while Kafka carries the high-volume event stream for analytics and fraud. Redis backs caching, distributed locks, and rate limiting. The defining decision is database-per-service for independent deployability, which forces us to use Sagas instead of distributed transactions for cross-service flows like a wallet-to-wallet transfer.',
    followUps: [
      'Why database-per-service instead of a shared database?',
      'How does a transfer stay consistent across two services?',
      'Where is your single point of failure?',
    ],
    difficulty: 'senior',
    tags: ['nexuspay', 'architecture', 'microservices'],
  },
  {
    id: 'iv-nexuspay-saga-vs-2pc',
    category: 'nexuspay',
    question: 'Why did you use the Saga pattern instead of two-phase commit for transfers?',
    modelAnswer:
      'A transfer touches two wallets that may live in different services, so a two-phase commit would hold locks across services and depend on a coordinator — that blocks under latency and hurts availability, which is unacceptable at scale. A Saga instead runs local transactions: reserve funds on the source, credit the destination, and if a later step fails, run compensating actions to release the reservation. We trade strict isolation for availability and accept eventual consistency, making each step idempotent and keyed by transfer id so retries are safe.',
    followUps: [
      'What happens if a compensating action itself fails?',
      'How do you make each saga step idempotent?',
      'How do you expose an in-flight transfer to the client?',
    ],
    difficulty: 'lead',
    tags: ['nexuspay', 'saga', 'rabbitmq', 'consistency'],
  },
  {
    id: 'iv-nestjs-di',
    category: 'nestjs',
    question: 'How does dependency injection actually work in NestJS?',
    modelAnswer:
      'NestJS has an IoC container that builds a dependency graph from provider metadata. TypeScript emits constructor parameter types via decorator metadata, so when the container instantiates a class it resolves each parameter token from the relevant module injector and injects the cached instance. Providers are singletons by default and scoped to the module, with explicit transient and request scopes when you need them. This inversion means classes declare what they need and the framework owns construction and lifetime.',
    followUps: [
      'What changes with REQUEST scope?',
      'How do you inject something that is not a class, like a config value?',
      'How do you resolve a circular dependency?',
    ],
    difficulty: 'mid',
    tags: ['nestjs', 'dependency-injection'],
  },
  {
    id: 'iv-nestjs-lifecycle',
    category: 'nestjs',
    question: 'Describe the request lifecycle in NestJS.',
    modelAnswer:
      'An incoming request passes through middleware, then guards decide whether it is authorized, then interceptors wrap the handler (so they can run logic before and after), then pipes validate and transform the arguments, and finally the controller method runs. The response travels back out through the interceptors. Exception filters sit around the whole thing to translate thrown errors into responses. Knowing this order explains, for example, why a guard cannot see a value that a pipe will later transform.',
    followUps: [
      'Difference between a guard and middleware?',
      'Where would you put response caching?',
      'How do interceptors enable an audit log?',
    ],
    difficulty: 'senior',
    tags: ['nestjs', 'request-lifecycle'],
  },
  {
    id: 'iv-redis-use-cases',
    category: 'redis',
    question: 'Give four distinct ways you use Redis in your project.',
    modelAnswer:
      'First, cache-aside caching of hot reads like wallet balances with a short TTL. Second, distributed locks using SET NX EX with a unique token so only one worker runs a critical section. Third, rate limiting with a token-bucket or fixed-window counter to protect the API gateway. Fourth, pub/sub or streams for lightweight real-time fan-out such as pushing balance updates to connected clients. The common thread is that Redis is in-memory and single-threaded, so each operation is fast and atomic.',
    followUps: [
      'What if the lock expires while the work is still running?',
      'How do you prevent a cache stampede?',
      'Why not use Redis as your primary database?',
    ],
    difficulty: 'senior',
    tags: ['redis', 'nexuspay', 'caching'],
  },
  {
    id: 'iv-rabbitmq-commands-vs-events',
    category: 'rabbitmq',
    question: 'What is the difference between commands and events, and why does it matter?',
    modelAnswer:
      'A command is an instruction to do something, sent to exactly one owner who is expected to act — like ProcessPayment. An event is a statement that something already happened, broadcast to anyone interested — like PaymentProcessed. Commands imply coupling and a single handler; events invert the dependency so publishers do not know or care who consumes them. Modeling this correctly keeps services loosely coupled: you send a command when you need an action, and you publish an event to let the rest of the system react.',
    followUps: [
      'Which exchange type fits events versus commands?',
      'How do you keep an event consumer idempotent?',
      'What goes in a dead-letter queue?',
    ],
    difficulty: 'senior',
    tags: ['rabbitmq', 'messaging', 'ddd'],
  },
  {
    id: 'iv-kafka-vs-rabbitmq',
    category: 'kafka',
    question: 'When would you reach for Kafka over RabbitMQ?',
    modelAnswer:
      'I use Kafka when I need a durable, replayable log that multiple independent consumers read at high throughput — analytics, fraud scoring, event sourcing — because consumers track their own offset and messages are retained, so I can replay history. I use RabbitMQ for command queues and rich routing where a message is typically processed once and acknowledged. In NexusPay, transfer commands and sagas run on RabbitMQ, while the firehose of money-moved events streams through Kafka for downstream processing.',
    followUps: [
      'How does Kafka preserve ordering?',
      'What caps consumer parallelism in a group?',
      'How do you achieve exactly-once with Kafka?',
    ],
    difficulty: 'lead',
    tags: ['kafka', 'rabbitmq', 'streaming'],
  },
  {
    id: 'iv-behavioral-microservices-startup',
    category: 'behavioral',
    question: 'Would you choose microservices for an early-stage startup?',
    modelAnswer:
      'Usually no. Microservices buy independent scaling and deployability at the cost of operational complexity, distributed transactions, and network failure modes — costs that only pay off with team size and load a startup does not yet have. I would start with a well-structured modular monolith with clear domain boundaries, so I can extract a service later exactly where a real scaling or team-ownership pressure appears. Choosing the boundaries early, even inside a monolith, is what makes that future extraction cheap.',
    followUps: [
      'When specifically would you extract the first service?',
      'How do you keep a monolith from becoming a big ball of mud?',
      'What did you over-engineer on NexusPay in hindsight?',
    ],
    difficulty: 'lead',
    tags: ['behavioral', 'architecture', 'trade-offs'],
  },
];
