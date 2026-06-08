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
    id: 'iv-nexuspay-kyc-flow',
    category: 'nexuspay',
    question: 'How does the KYC verification flow work across services in NexusPay?',
    modelAnswer:
      'The KYC service owns identity documents and verification state; when a user submits documents the KYC service persists them and publishes a KycSubmitted event on RabbitMQ. An internal process or third-party webhook later updates the status to verified or rejected and publishes KycVerified or KycRejected. The wallet service subscribes to KycVerified to unlock higher transaction limits, and the notifications service subscribes to both outcomes to send user-facing messages. This event-driven fan-out means KYC does not need to know about wallets or notifications at all.',
    followUps: [
      'How do you handle the time between submission and verification?',
      'What if the notifications service is down when KycVerified fires?',
      'How would you add a fraud-hold step without changing KYC?',
    ],
    difficulty: 'senior',
    tags: ['nexuspay', 'kyc', 'events', 'rabbitmq'],
  },
  {
    id: 'iv-nexuspay-auth-service',
    category: 'nexuspay',
    question: 'How does authentication work across NexusPay microservices?',
    modelAnswer:
      'The auth service issues short-lived JWTs on login and stores refresh tokens in its own PostgreSQL table. Every other service validates the JWT signature locally using the public key, so no auth service call is needed on every request — that would be a synchronous bottleneck. The API gateway also performs an early signature check and rejects obviously bad tokens before they reach downstream services. Refresh-token rotation and a Redis blocklist for logout ensure revocation without making the token stateless property impractical.',
    followUps: [
      'How do you handle JWT revocation without a database call on every request?',
      'Why short-lived access tokens instead of long-lived ones?',
      'How do you propagate user identity to an async saga step?',
    ],
    difficulty: 'senior',
    tags: ['nexuspay', 'auth', 'jwt', 'redis'],
  },
  {
    id: 'iv-nexuspay-wallet-locking',
    category: 'nexuspay',
    question: 'How do you prevent double-spending in the wallet service?',
    modelAnswer:
      'Each balance update uses an optimistic lock via a version column in PostgreSQL — the UPDATE checks the expected version and returns zero rows if it changed, signalling a conflict that the caller retries. For the critical reserve step inside a Saga we additionally acquire a Redis distributed lock keyed by wallet id before reading the balance, so concurrent saga orchestrations queue rather than race. Idempotency keys on the API and unique transfer-id constraints in the database ensure that a retry of an already-applied operation is a no-op rather than a double debit.',
    followUps: [
      'Why not rely solely on the database row lock?',
      'What is the failure window if the Redis lock node goes down?',
      'How do you detect and alert on a balance going negative?',
    ],
    difficulty: 'lead',
    tags: ['nexuspay', 'wallet', 'redis', 'concurrency'],
  },
  {
    id: 'iv-nexuspay-notifications',
    category: 'nexuspay',
    question: 'How is the notifications service decoupled from the rest of NexusPay?',
    modelAnswer:
      'The notifications service is a pure consumer — it subscribes to domain events like PaymentCompleted and KycVerified on RabbitMQ and translates them into user-facing messages over email, SMS, or push channels. It holds no business logic about transfers or KYC; the contract is just the event schema. This means adding a new channel or template requires changing only the notifications service, and removing notifications entirely would not break any other service. Delivery failures are handled internally with retry queues and a dead-letter table, so transient provider outages do not propagate back to the emitting service.',
    followUps: [
      'How do you avoid sending duplicate notifications on message redelivery?',
      'How do you support user notification preferences without coupling to auth?',
      'What observability do you add to track delivery rate?',
    ],
    difficulty: 'mid',
    tags: ['nexuspay', 'notifications', 'rabbitmq', 'decoupling'],
  },
  {
    id: 'iv-nexuspay-rate-limiting',
    category: 'nexuspay',
    question: 'How is rate limiting implemented in NexusPay, and where does it live?',
    modelAnswer:
      'Rate limiting sits at the API gateway level using a fixed-window counter in Redis keyed by user id and endpoint, incremented with INCR and given an expiry on first write with EXPIRE. We chose the gateway so no individual service needs to implement it, and Redis gives us a shared counter across multiple gateway replicas. Sensitive paths like payment initiation get stricter limits than read endpoints. When a counter exceeds the threshold the gateway returns a 429 immediately and logs the event for abuse monitoring.',
    followUps: [
      'What are the trade-offs of fixed-window versus sliding-window rate limiting?',
      'How would you implement per-tier rate limits for different account types?',
      'What happens if the Redis instance is unavailable?',
    ],
    difficulty: 'senior',
    tags: ['nexuspay', 'redis', 'rate-limiting', 'api-gateway'],
  },
  {
    id: 'iv-nexuspay-inter-service-comms',
    category: 'nexuspay',
    question: 'When do you use synchronous HTTP versus asynchronous messaging between NexusPay services?',
    modelAnswer:
      'Synchronous HTTP is used only when the caller genuinely needs an immediate response to continue — for example, the API gateway calling the auth service to validate credentials during login. Everything else is async: commands and domain events flow over RabbitMQ so the caller can return immediately and services are independently available. The rule of thumb is that async messaging improves resilience because a temporary consumer outage does not fail the producer, while synchronous calls create tight availability coupling. We accept the extra complexity of correlation ids and status polling in exchange for that isolation.',
    followUps: [
      'How do you return a transfer result to the client if the payment is async?',
      'What is the risk of using sync HTTP in a critical saga step?',
      'How do you trace a request that spans both sync and async hops?',
    ],
    difficulty: 'senior',
    tags: ['nexuspay', 'architecture', 'messaging', 'http'],
  },
  {
    id: 'iv-nexuspay-observability',
    category: 'nexuspay',
    question: 'How do you trace a transaction end-to-end across NexusPay microservices?',
    modelAnswer:
      'Every request entering the API gateway is assigned a correlation id that is propagated in HTTP headers and injected into RabbitMQ message headers and Kafka record headers by a shared interceptor library. Each service extracts the id and attaches it to every log line and span, so a distributed trace tool like Jaeger or a log aggregator can reconstruct the full journey from API call to Kafka consumer. Structured JSON logging with a consistent schema means queries like "show all log lines for transfer id X" work across services. Alerting fires on p99 latency and error rate per service so regressions are caught before they reach users.',
    followUps: [
      'What do you do when a correlation id is missing from an incoming message?',
      'How do you measure end-to-end saga duration?',
      'Which signals — logs, metrics, or traces — do you look at first for an incident?',
    ],
    difficulty: 'lead',
    tags: ['nexuspay', 'observability', 'tracing', 'logging'],
  },
  {
    id: 'iv-nexuspay-deployment',
    category: 'nexuspay',
    question: 'How would you deploy a breaking schema change to the payments service without downtime?',
    modelAnswer:
      'I use an expand-contract migration: first deploy a migration that adds the new column as nullable alongside the old one, then deploy the service version that writes to both columns, then backfill historical rows, then deploy the version that reads from the new column only, and finally drop the old column in a later release. Each step is independently deployable and rollback-safe. Consumer contracts on RabbitMQ messages follow the same discipline — new optional fields are added before old ones are removed, with a deprecation window long enough for all consumers to catch up.',
    followUps: [
      'How do you coordinate the migration across multiple service replicas?',
      'What if two services share an event schema that needs to change?',
      'How do you test backwards compatibility in CI?',
    ],
    difficulty: 'lead',
    tags: ['nexuspay', 'migrations', 'deployment', 'zero-downtime'],
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
    id: 'iv-nestjs-modules',
    category: 'nestjs',
    question: 'How do you design the module boundary for a large NestJS service?',
    modelAnswer:
      'Each bounded context gets its own feature module that owns its providers, controllers, and repository — nothing leaks out except what is explicitly exported. Shared infrastructure like database connections, Redis clients, and config goes into a shared CoreModule imported once at the app root. Cross-cutting concerns like logging and tracing live in global modules registered with forRoot so they are available everywhere without repeated imports. This structure mirrors a domain-driven design layer cake, makes circular dependencies obvious as a smell, and keeps each module independently testable.',
    followUps: [
      'When would you reach for a dynamic module?',
      'How do you share a TypeORM repository across two modules without a circular import?',
      'How does the module structure change when you extract a microservice?',
    ],
    difficulty: 'senior',
    tags: ['nestjs', 'modules', 'architecture'],
  },
  {
    id: 'iv-nestjs-interceptors',
    category: 'nestjs',
    question: 'What are interceptors and what problems do they solve in NestJS?',
    modelAnswer:
      'Interceptors wrap the route handler execution using RxJS Observables, letting you run code before the handler, transform or replace the response stream, measure latency, or handle errors in a cross-cutting way. Common uses are response envelope normalization, per-route caching, audit logging, and timeout enforcement. Because they sit around the handler they see both the incoming context and the outgoing result, which guards and middleware cannot do simultaneously. The RxJS tap and map operators make it natural to add side effects or transforms without touching the handler itself.',
    followUps: [
      'How does an interceptor differ from an exception filter?',
      'How would you implement a per-route cache with an interceptor?',
      'What is the cost of using interceptors on every route?',
    ],
    difficulty: 'senior',
    tags: ['nestjs', 'interceptors', 'rxjs'],
  },
  {
    id: 'iv-nestjs-testing',
    category: 'nestjs',
    question: 'How do you unit-test a NestJS service that has multiple injected dependencies?',
    modelAnswer:
      'I use Test.createTestingModule from @nestjs/testing to build a minimal module, providing mock implementations for every dependency via useValue or useFactory. This creates the real IoC container so injection works exactly as in production, but all I/O is replaced with jest.fn() mocks I can assert on. For integration tests I keep a real TypeORM connection to a test database and run migrations before the suite. I avoid testing framework internals — guards, pipes — in service unit tests; I test those in isolation against their interface contracts.',
    followUps: [
      'How do you test a module that uses async providers?',
      'How do you test an exception filter?',
      'What do you mock and what do you not mock?',
    ],
    difficulty: 'mid',
    tags: ['nestjs', 'testing', 'dependency-injection'],
  },
  {
    id: 'iv-nestjs-config',
    category: 'nestjs',
    question: 'How do you manage configuration and secrets safely in NestJS?',
    modelAnswer:
      'I use @nestjs/config backed by a Joi or Zod schema that validates every required variable at startup and throws if any are missing or malformed — this moves configuration errors to deploy time rather than runtime. Secrets are injected from environment variables by the orchestrator (Kubernetes secrets or AWS Parameter Store) and never committed to source control. The ConfigService is injected into services that need it, while the config module itself is global so it does not need re-importing. Sensitive values like database passwords are never logged, which I enforce with a custom log sanitizer in the logging interceptor.',
    followUps: [
      'How do you handle configuration differences between local dev and production?',
      'What is the risk of accessing process.env directly in a service?',
      'How would you support hot-reload of configuration without restarting?',
    ],
    difficulty: 'mid',
    tags: ['nestjs', 'config', 'security'],
  },
  {
    id: 'iv-nestjs-pipes-validation',
    category: 'nestjs',
    question: 'How do pipes and validation work in NestJS, and how do you apply them globally?',
    modelAnswer:
      'Pipes transform or validate incoming data before it reaches the handler; the built-in ValidationPipe uses class-validator decorators on DTO classes to reject invalid payloads with a 400 before any business logic runs. Registering ValidationPipe globally via app.useGlobalPipes means every handler gets input validation automatically without per-route wiring, which eliminates a whole class of missing-validation bugs. I set whitelist: true to strip unknown properties and forbidNonWhitelisted: true to reject them outright, making the surface area explicit. Custom pipes handle transformations like parsing a string id to a typed entity fetched from the database.',
    followUps: [
      'How do you validate a nested object inside a DTO?',
      'What is the difference between a pipe and a transformation interceptor?',
      'How do you return custom validation error messages?',
    ],
    difficulty: 'mid',
    tags: ['nestjs', 'pipes', 'validation', 'dto'],
  },
  {
    id: 'iv-nestjs-guards',
    category: 'nestjs',
    question: 'How do you implement role-based access control with NestJS guards?',
    modelAnswer:
      'I attach a Roles metadata decorator to routes using SetMetadata, then a RolesGuard reads that metadata via the Reflector class and compares it against the roles on the request user object that a prior JWT guard has attached. The guard returns false or throws ForbiddenException when the roles do not match, which prevents the handler from executing. Nesting guards in order — first authenticate, then authorize — keeps the two concerns separate. For more complex policies like resource ownership I use an attribute-based approach where the guard fetches the resource and checks the owner field against the caller id.',
    followUps: [
      'How do you write a unit test for a guard that uses Reflector?',
      'How do you allow access to public routes without decorating every one?',
      'How do you handle permission checks that require a database call?',
    ],
    difficulty: 'senior',
    tags: ['nestjs', 'guards', 'auth', 'rbac'],
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
    id: 'iv-redis-distributed-lock',
    category: 'redis',
    question: 'How does a Redis distributed lock work, and what are its failure modes?',
    modelAnswer:
      'A distributed lock is acquired with SET key token NX EX ttl — atomic acquisition that sets the key only if absent, with a TTL so a dead holder eventually releases it. The value is a unique token owned by the acquirer; release checks and deletes only if the token matches, using a Lua script to make the check-and-delete atomic. Failure modes include lock expiry before work completes (fence token pattern helps), split-brain if the Redis primary fails before replication to the replica, and clock skew affecting TTL accuracy. For single-node Redis these are acceptable trade-offs; Redlock adds multi-node quorum for higher durability needs.',
    followUps: [
      'Why must release use a Lua script rather than a GET then DEL?',
      'What is the Redlock algorithm and when would you use it?',
      'How do you detect a process that holds a lock and has crashed?',
    ],
    difficulty: 'lead',
    tags: ['redis', 'distributed-locks', 'concurrency'],
  },
  {
    id: 'iv-redis-cache-patterns',
    category: 'redis',
    question: 'Compare cache-aside, read-through, and write-through caching strategies.',
    modelAnswer:
      'Cache-aside puts the caching logic in the application: on a miss the app fetches from the database and populates the cache, so the cache only contains what was actually requested. Read-through delegates that miss-fill to the cache layer itself, keeping application code simpler but requiring a cache provider that supports it. Write-through writes to both the cache and the database on every mutation so the cache is always warm, at the cost of write latency and wasted cache space for rarely-read data. I default to cache-aside because it gives the application full control over TTL and invalidation without over-caching, while write-through makes sense for data that is always read immediately after writing.',
    followUps: [
      'How do you invalidate a cache entry after a write in cache-aside?',
      'What is a thundering herd and how do you prevent it?',
      'How does write-behind differ from write-through?',
    ],
    difficulty: 'senior',
    tags: ['redis', 'caching', 'patterns'],
  },
  {
    id: 'iv-redis-data-structures',
    category: 'redis',
    question: 'Which Redis data structures do you use beyond plain strings, and why?',
    modelAnswer:
      'Sorted sets are the go-to for leaderboards and time-windowed rate limiters because ZADD and ZRANGEBYSCORE give O(log n) ordered access. Hashes store objects like user session fields without JSON serialization overhead, and individual fields can be updated atomically with HSET. Lists support job queues with RPUSH and BLPOP for a blocking dequeue. Streams (XADD/XREAD) provide a persistent, consumer-group-aware log for lightweight event pipelines where Kafka would be overkill. Choosing the right structure avoids application-side serialization gymnastics and exploits Redis atomicity guarantees per data type.',
    followUps: [
      'When would you use a Redis stream instead of a list for a queue?',
      'How do you expire a hash without expiring individual fields?',
      'What are the memory implications of large sorted sets?',
    ],
    difficulty: 'senior',
    tags: ['redis', 'data-structures'],
  },
  {
    id: 'iv-redis-persistence',
    category: 'redis',
    question: 'What are the Redis persistence options and which would you choose for NexusPay?',
    modelAnswer:
      'RDB takes periodic snapshots to disk — fast restarts, low disk I/O, but you can lose writes since the last snapshot. AOF appends every write command to a log — much smaller loss window (fsync every second means at most one second of data) at the cost of a larger file and slower restart. AOF with everysec is my choice for NexusPay rate-limit counters and session tokens because losing a minute of counter state on restart would let users burst through rate limits. For the distributed lock use case I also accept a brief window of lost locks after a restart, since lock holders must be prepared for expiry anyway. Redis 4+ hybrid persistence combines both for faster restarts with AOF safety.',
    followUps: [
      'When would you disable persistence entirely?',
      'How does AOF rewriting work to keep the file compact?',
      'What happens to locks and counters after a Redis restart?',
    ],
    difficulty: 'senior',
    tags: ['redis', 'persistence', 'reliability'],
  },
  {
    id: 'iv-redis-clustering',
    category: 'redis',
    question: 'How does Redis Cluster work, and what constraints does it impose on your code?',
    modelAnswer:
      'Redis Cluster shards data across nodes using a 16384-slot hash ring — each key is mapped to a slot by CRC16, and each node owns a subset of slots. This gives horizontal write scaling and higher aggregate memory. The constraint is that multi-key operations like MGET or Lua scripts only work when all keys map to the same slot, which is enforced by hash tags: keys with the same string inside curly braces like user:123:balance and user:123:lock share a slot. In NexusPay I group per-user keys with hash tags so that user-scoped atomic operations work, but I avoid cross-user transactions by design anyway since each saga touches only one source wallet at a time.',
    followUps: [
      'How do you do a distributed lock in Redis Cluster?',
      'What happens to a request when a cluster slot is being migrated?',
      'When would you choose Redis Sentinel instead of Cluster?',
    ],
    difficulty: 'lead',
    tags: ['redis', 'clustering', 'scaling'],
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
    id: 'iv-rabbitmq-exchange-types',
    category: 'rabbitmq',
    question: 'Walk through the four exchange types in RabbitMQ and when you use each.',
    modelAnswer:
      'Direct exchanges route a message to queues whose binding key exactly matches the routing key — good for commands directed at a single service. Fanout ignores the routing key and copies the message to every bound queue, ideal for broadcast domain events. Topic exchanges match routing keys with dot-separated wildcards like payments.# for all payments events, giving flexible pub-sub routing. Headers exchanges route on message header attributes rather than routing keys, useful when routing depends on multiple properties but relatively rare in practice. In NexusPay I use direct for saga command queues and topic for domain events so new subscribers can bind without changing the publisher.',
    followUps: [
      'How do you ensure every consumer gets its own copy of a domain event?',
      'What is a default exchange and when is it used?',
      'How does a dead-letter exchange integrate with these types?',
    ],
    difficulty: 'senior',
    tags: ['rabbitmq', 'exchanges', 'routing'],
  },
  {
    id: 'iv-rabbitmq-dlx',
    category: 'rabbitmq',
    question: 'How do you handle poison messages and dead-letter queues in RabbitMQ?',
    modelAnswer:
      'A dead-letter exchange receives messages when they are rejected with requeue false, when their TTL expires, or when a queue exceeds its max-length limit. I configure each production queue with x-dead-letter-exchange pointing to a DLX and bind a dead-letter queue to it. Consumers reject and do not requeue messages that fail deserialization or repeated processing after a retry count stored in the message header. A separate alert fires when the dead-letter queue depth grows, prompting investigation. Messages there are never auto-discarded so an operator can inspect, replay after a fix, or discard with deliberate intent.',
    followUps: [
      'How do you implement retry with exponential back-off before dead-lettering?',
      'How do you replay a dead-letter queue after fixing the consumer bug?',
      'What is the difference between a rejected message and an unacknowledged one?',
    ],
    difficulty: 'senior',
    tags: ['rabbitmq', 'dlx', 'error-handling', 'resilience'],
  },
  {
    id: 'iv-rabbitmq-consumer-ack',
    category: 'rabbitmq',
    question: 'Explain manual acknowledgement in RabbitMQ and why it matters for reliability.',
    modelAnswer:
      'With manual acknowledgement the message stays in an unacknowledged state on the broker until the consumer explicitly sends an ack or nack after processing. If the consumer crashes before acking, the broker redelivers the message to another consumer, so no message is lost. Auto-ack removes the message as soon as it is delivered, which means a consumer crash loses that message permanently. The flip side is that manual ack requires consumers to be idempotent because a redelivery can produce a duplicate. In NexusPay every saga step is idempotent by design, so we always use manual ack and set prefetchCount to a small number to avoid starving other consumers under slow processing.',
    followUps: [
      'What does prefetchCount do and how do you tune it?',
      'When would you use a nack with requeue versus without?',
      'How do you detect and alert on a growing unacknowledged message count?',
    ],
    difficulty: 'mid',
    tags: ['rabbitmq', 'acknowledgement', 'reliability'],
  },
  {
    id: 'iv-rabbitmq-idempotency',
    category: 'rabbitmq',
    question: 'How do you guarantee idempotent message processing in a RabbitMQ consumer?',
    modelAnswer:
      'Every message carries a unique message id generated by the publisher; the consumer writes that id to a processed-messages table inside the same local transaction as the business operation. On a redelivery the unique constraint rejects the insert and the consumer returns success without re-executing the business logic. This outbox-style approach ties deduplication to the same ACID transaction as the side effect, so there is no window where the effect happened but the id was not recorded. Alternatively, for truly idempotent operations like setting a status to verified, I rely on the natural idempotency of the write rather than tracking ids.',
    followUps: [
      'How long do you keep the processed message ids?',
      'What is the at-least-once delivery guarantee and why is it the default?',
      'How would you achieve exactly-once semantics across two services?',
    ],
    difficulty: 'lead',
    tags: ['rabbitmq', 'idempotency', 'consistency'],
  },
  {
    id: 'iv-rabbitmq-connection-channels',
    category: 'rabbitmq',
    question: 'What is the difference between a RabbitMQ connection and a channel, and how do you manage them in NestJS?',
    modelAnswer:
      'A TCP connection to RabbitMQ is expensive to create and should be long-lived; a channel is a lightweight virtual connection multiplexed over that TCP connection, and most operations — declaring queues, publishing, consuming — happen on a channel. Creating one channel per message would be wasteful; the pattern is one connection per process and a small pool of channels, with one dedicated channel per consumer to avoid interleaving acks. In NestJS with @nestjs/microservices or a custom AMQP provider, the connection and consumer channels are created at module initialization and reused for the lifetime of the service, with reconnection logic that re-declares queues and re-registers consumers on reconnect.',
    followUps: [
      'What happens to in-flight messages if a channel is closed unexpectedly?',
      'Why should you not publish from the same channel that is consuming?',
      'How do you health-check a RabbitMQ connection in a NestJS service?',
    ],
    difficulty: 'mid',
    tags: ['rabbitmq', 'nestjs', 'connections'],
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
    id: 'iv-kafka-consumer-groups',
    category: 'kafka',
    question: 'How do Kafka consumer groups and partition assignment work?',
    modelAnswer:
      'A consumer group is a set of consumers that collectively read a topic; Kafka assigns each partition to exactly one consumer in the group, so parallelism is bounded by partition count. When a consumer joins or leaves the group, a rebalance redistributes partitions — this briefly pauses consumption and is the main source of duplicate processing because uncommitted offsets are re-read by the new assignee. Increasing partitions scales throughput, but partition count cannot be decreased without recreation. I size partitions ahead of expected parallelism and commit offsets only after successful processing to avoid losing progress.',
    followUps: [
      'What is the difference between earliest and latest auto offset reset?',
      'How do you minimize rebalance impact?',
      'How do you handle a slow consumer that is falling behind?',
    ],
    difficulty: 'senior',
    tags: ['kafka', 'consumer-groups', 'partitions'],
  },
  {
    id: 'iv-kafka-ordering-keys',
    category: 'kafka',
    question: 'How does Kafka guarantee message ordering, and how do you design keys to exploit it?',
    modelAnswer:
      'Kafka guarantees ordering only within a partition — messages with the same key always go to the same partition, so all events for a given entity arrive in order for a single consumer. I key financial events by wallet id or user id so that the fraud scoring consumer sees a user\'s transactions in chronological order without any cross-partition coordination. Using a null key round-robins across partitions and destroys ordering, so null keys are appropriate only for events where order truly does not matter. Adding partitions after topic creation can reassign keys to different partitions, which breaks the ordering guarantee for in-flight keys, so I plan partition counts generously upfront.',
    followUps: [
      'How do you handle ordering for events that span two entities?',
      'What is the impact of a key that is too hot on a single partition?',
      'How do you test that consumers handle out-of-order messages gracefully?',
    ],
    difficulty: 'senior',
    tags: ['kafka', 'ordering', 'partitions', 'keys'],
  },
  {
    id: 'iv-kafka-exactly-once',
    category: 'kafka',
    question: 'How do you achieve exactly-once semantics in Kafka?',
    modelAnswer:
      'Kafka achieves exactly-once end-to-end through two mechanisms: idempotent producers (enable.idempotence=true) assign each message a sequence number so the broker deduplicates retries within a producer session, and transactions allow a producer to atomically write to multiple partitions and commit or abort as a unit. On the consumer side, exactly-once delivery requires committing the offset atomically with the result of processing — typically by writing to a database and using the Kafka transactional producer in the same logical transaction, or by designing consumers to be idempotent so that reprocessing the same event produces the same outcome. The transactional API adds latency, so I use it only where exactly-once genuinely matters, like the analytics aggregation pipeline.',
    followUps: [
      'What is the difference between idempotent producer and transactions?',
      'How does a Kafka Streams application achieve exactly-once?',
      'What failure scenario does idempotent producer not cover?',
    ],
    difficulty: 'lead',
    tags: ['kafka', 'exactly-once', 'transactions'],
  },
  {
    id: 'iv-kafka-analytics-stream',
    category: 'kafka',
    question: 'How do you use Kafka for the analytics stream in NexusPay?',
    modelAnswer:
      'Every significant domain event — payment initiated, payment completed, KYC status changed — is published to a Kafka topic partitioned by user id. Downstream consumers run independently of the transactional services: a fraud-scoring consumer aggregates velocity metrics in near real time, a reporting consumer materializes aggregates into a read-optimized store, and a data warehouse connector (Kafka Connect) sinks events to cold storage for historical analysis. Because Kafka retains events for a configurable window, new consumers can backfill from the beginning of history without touching the operational services. This clean separation means analytics failures never affect the payment critical path.',
    followUps: [
      'How do you handle schema evolution in the analytics events?',
      'How do you ensure the analytics consumer does not fall hours behind?',
      'What is the retention trade-off for the analytics topic?',
    ],
    difficulty: 'senior',
    tags: ['kafka', 'nexuspay', 'analytics', 'streaming'],
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
  {
    id: 'iv-behavioral-incident-response',
    category: 'behavioral',
    question: 'Tell me about a time you debugged a critical production incident under pressure.',
    modelAnswer:
      'During a peak traffic window our wallet-balance reads spiked in latency, causing payment timeouts for a subset of users. I started by checking our metrics dashboard — the Redis cache hit rate had dropped from 98% to 40%, pointing to a stampede after a cache flush. I isolated the cause to a deployment that accidentally cleared the cache namespace, then added a singleflight-style lock-before-populate pattern to prevent concurrent miss-filling. I communicated status to stakeholders every ten minutes with clear next-action statements, and we restored normal latency within 25 minutes. The post-mortem led to a canary deployment policy for cache-related changes.',
    followUps: [
      'How do you decide when to roll back versus push a fix forward?',
      'What did the post-mortem change about your process?',
      'How do you communicate during an incident to non-technical stakeholders?',
    ],
    difficulty: 'senior',
    tags: ['behavioral', 'incident-response', 'redis'],
  },
  {
    id: 'iv-behavioral-technical-debt',
    category: 'behavioral',
    question: 'How do you manage technical debt without letting it block feature delivery?',
    modelAnswer:
      'I track debt as first-class backlog items with a rough cost estimate, so product and engineering can make an informed trade-off rather than debt being invisible. My rule is that any area of code you touch gets left measurably better — refactoring in the same PR as a related feature rather than a separate sprint that never gets prioritized. For systemic debt I negotiate a time budget per sprint, typically 20%, and show concrete before-and-after metrics like reduced test flakiness or decreased incident rate to justify continued investment. The key is making debt tangible and tying paydown to business outcomes.',
    followUps: [
      'How do you convince a product manager to prioritize a non-feature refactor?',
      'What is the riskiest type of technical debt you have dealt with?',
      'How do you prevent debt from accumulating on a fast-moving team?',
    ],
    difficulty: 'lead',
    tags: ['behavioral', 'technical-debt', 'process'],
  },
  {
    id: 'iv-behavioral-disagreement',
    category: 'behavioral',
    question: 'Describe a time you disagreed with a technical decision made by a senior engineer or architect.',
    modelAnswer:
      'The team proposed using a shared database across three services to simplify cross-service queries, and I disagreed because it would couple deployment schedules and schema changes in a way that defeats the purpose of separate services. I prepared a short written analysis comparing the coupling cost with the query simplification benefit and proposed an alternative using a read-model consumer that projects data from domain events into a query-optimized view. After a focused discussion the team adopted the read-model approach, and the shared-database proposal was shelved. What mattered was focusing on data and trade-offs rather than personal preference, and being willing to be persuaded if the counter-argument was strong.',
    followUps: [
      'What would you have done if the decision went against you after the discussion?',
      'How do you disagree with someone more senior without damaging the relationship?',
      'What was the outcome of the decision you influenced?',
    ],
    difficulty: 'senior',
    tags: ['behavioral', 'collaboration', 'architecture'],
  },
  {
    id: 'iv-behavioral-mentoring',
    category: 'behavioral',
    question: 'How do you approach mentoring a junior engineer on your team?',
    modelAnswer:
      'I start by understanding what they want to grow in, then assign work that stretches them just beyond their current comfort zone with clear outcomes and a safe failure environment — meaning I review PRs promptly and explain the why behind every suggestion rather than just correcting. I prefer pairing on real production problems over toy exercises, because context makes feedback stick. I also make myself easy to interrupt for quick questions while encouraging the habit of trying first and coming with a concrete problem statement rather than an open-ended block. Measuring success is simple: over three to six months, do they need me less and are they reviewing others\' code?',
    followUps: [
      'How do you handle a junior who is not making the expected progress?',
      'What is the biggest mistake you made early in your career that you try to help others avoid?',
      'How do you balance mentoring time against your own delivery commitments?',
    ],
    difficulty: 'lead',
    tags: ['behavioral', 'mentoring', 'leadership'],
  },
];
