import type { DesignChallenge } from '../../types';

const SCORING = [
  'Requirements clarification',
  'Data model',
  'API design',
  'Scaling',
  'Trade-off articulation',
];

export const designChallenges: DesignChallenge[] = [
  {
    id: 'payment-processing-system',
    title: 'Design a payment processing system',
    difficulty: 'hard',
    timeEstimate: '40-55 minutes',
    prompt:
      'Design the backend for processing card payments: a client requests a charge, you authorize it with an external payment provider, and you must never double-charge a customer even when the network is unreliable.',
    requirements: [
      'Create and authorize a payment against an external provider (Stripe-like)',
      'Guarantee idempotency so retries never double-charge',
      'Record an auditable history of every state transition',
      'Support asynchronous webhooks for final settlement',
      'Allow refunds and partial refunds',
    ],
    constraints: [
      '2,000 payments/second at peak',
      'External provider p99 latency around 800ms',
      'Money correctness is non-negotiable (no lost or duplicated funds)',
      '99.95% availability',
    ],
    modelAnswer: {
      overview:
        'Model a payment as a state machine: created -> authorized -> captured -> settled, with failed and refunded branches. The client supplies an idempotency key on the create request; the payment service stores it uniquely so a retried request returns the original result instead of starting a new charge. Calls to the external provider are wrapped in timeouts, retries with back-off, and a circuit breaker, and the provider is treated as the source of truth that we reconcile against via webhooks.',
      dataModel:
        'Core tables (one service, its own database):\n\n    payments(id, idempotency_key UNIQUE, user_id, amount NUMERIC(18,4), currency, status, provider_ref, created_at, updated_at)\n    payment_events(id, payment_id, from_status, to_status, reason, created_at)\n    refunds(id, payment_id, amount NUMERIC(18,4), status, provider_ref, created_at)\n\nAmounts use NUMERIC, never float. payment_events is an append-only audit log that also lets you rebuild current state.',
      apiDesign:
        'Endpoints:\n\n    POST /payments            (header: Idempotency-Key) -> create + authorize\n    GET  /payments/:id        -> current state\n    POST /payments/:id/capture\n    POST /payments/:id/refund\n    POST /webhooks/provider   -> provider settlement callbacks\n\nThe create endpoint is the only one that needs the idempotency key; it returns 200 with the existing payment if the key was seen before.',
      messageFlow:
        'After authorization, emit a payment.authorized event onto a broker so downstream services (ledger, notifications, analytics) react asynchronously. Provider webhooks land on a queue and are processed idempotently using the provider event id. A dead-letter queue captures webhook payloads that fail repeatedly for manual review.',
      scalingStrategy:
        'The service is stateless behind a load balancer, so scale horizontally. The database is the bottleneck: partition by user_id or payment_id, use a connection pool, and keep transactions short. Cache idempotency-key lookups in Redis to absorb retry storms before they hit Postgres. The external provider is the real ceiling, so use bulk-friendly back-pressure and queue captures rather than doing everything inline.',
      tradeoffs:
        'Choosing eventual consistency for downstream effects (ledger, notifications) buys throughput and resilience but means balances are not instantly final. Treating the provider as source of truth simplifies correctness but adds reconciliation complexity. A strict two-phase commit across services would be simpler to reason about but would not survive provider latency at this scale, so a saga-style flow with compensation is preferred.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'notification-service',
    title: 'Design a notification service',
    difficulty: 'medium',
    timeEstimate: '30-45 minutes',
    prompt:
      'Design a service that sends notifications across email, SMS, and push, with templates, user preferences, retries, and rate limiting, used by many internal teams.',
    requirements: [
      'Multi-channel delivery (email, SMS, push)',
      'Reusable templates with variable substitution',
      'Per-user channel preferences and opt-outs',
      'Retries with back-off and a dead-letter path',
      'Deduplication so the same event does not notify twice',
    ],
    constraints: [
      '50M notifications/day with spiky bursts',
      'Third-party providers with their own rate limits',
      'Delivery should feel near-real-time but can be async',
    ],
    modelAnswer: {
      overview:
        'Expose a single send API that accepts an event, a template id, a recipient, and variables. The service resolves user preferences, renders the template, and enqueues a per-channel job. Channel workers talk to provider adapters (one per email/SMS/push vendor) behind a common interface, so vendors can be swapped or load-balanced. Everything after the API call is asynchronous and queue-driven for burst absorption.',
      dataModel:
        'Tables:\n\n    templates(id, channel, subject, body, version, created_at)\n    preferences(user_id, channel, enabled, updated_at)\n    notifications(id, user_id, channel, template_id, status, dedupe_key UNIQUE, attempts, created_at)\n\ndedupe_key (event id + recipient + template) gives idempotency. Provider responses are stored for observability.',
      apiDesign:
        'Endpoints:\n\n    POST /notifications        -> enqueue a notification\n    GET  /notifications/:id    -> delivery status\n    PUT  /preferences/:userId  -> update channel opt-ins\n    POST /templates            -> create/version a template\n\nThe send endpoint returns 202 Accepted immediately with a notification id.',
      messageFlow:
        'The API publishes to a topic; a router consumer fans out one message per enabled channel to channel-specific queues. Workers pull from their queue, respecting provider rate limits via a Redis token bucket. Failures retry with exponential back-off; exhausted messages go to a DLQ. Successful deliveries emit a notification.sent event for analytics.',
      scalingStrategy:
        'Partition queues per channel so a slow SMS vendor does not block email. Scale workers independently per channel based on queue depth. Use Redis for rate-limit tokens and dedupe checks. Templates are cached in memory with a version key so renders are cheap.',
      tradeoffs:
        'A fully async pipeline maximizes throughput and isolation but makes synchronous "did it send?" answers impossible — callers get a status to poll or subscribe to. A shared queue would be simpler but couples channels together. Per-vendor adapters add code but make the system resilient to any single provider outage.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'wallet-system',
    title: 'Design a wallet system with real-time balance updates',
    difficulty: 'medium',
    timeEstimate: '30-45 minutes',
    prompt:
      'Design a digital wallet service where users can top up, spend, and transfer funds. Balances must be accurate at all times and visible in real time to the account holder.',
    requirements: [
      'Top-up from an external payment method',
      'Spend from the wallet (debit on purchase)',
      'Peer-to-peer transfers between wallets',
      'Real-time balance visible to the user via websocket or SSE',
      'Full transaction history with pagination',
    ],
    constraints: [
      '10M wallets, 500k daily active',
      'No balance can go negative unless explicitly permitted by a credit feature',
      'P2P transfer must be atomic: both wallets update or neither does',
      '99.99% read availability',
    ],
    modelAnswer: {
      overview:
        'Model each wallet as a consistent aggregate with an optimistic-lock version column. All money movements write append-only ledger entries, and the balance is derived from the ledger (or cached from it). A transfer between two wallets runs inside a single database transaction when both wallets share the same shard; cross-shard transfers use a two-phase saga. Real-time updates are pushed via a Redis Pub/Sub fan-out to connected WebSocket sessions after each successful ledger commit.',
      dataModel: `Tables in the wallet service:\n\n    wallets(id, user_id, currency, balance NUMERIC(18,4), version INT, status, created_at)\n    ledger_entries(id, wallet_id, direction ENUM('credit','debit'), amount NUMERIC(18,4), reference_type, reference_id, balance_after NUMERIC(18,4), created_at)\n    transfers(id, from_wallet_id, to_wallet_id, amount NUMERIC(18,4), status, idempotency_key UNIQUE, created_at)\n\nbalance_after on each ledger entry lets you reconstruct the balance at any point in time without a full replay.`,
      apiDesign:
        'Endpoints:\n\n    POST /wallets/:id/topup            -> credit from external payment\n    POST /wallets/:id/spend            -> debit for a purchase\n    POST /transfers                    (Idempotency-Key header)\n    GET  /wallets/:id/balance          -> current balance\n    GET  /wallets/:id/transactions     -> paginated history\n    GET  /wallets/:id/stream           -> SSE balance stream\n\nAll mutating endpoints require an idempotency key. Balance reads can be served from the Redis cache.',
      messageFlow:
        'After each successful ledger write, publish a wallet.balance_changed event (wallet id, new balance) to Redis Pub/Sub. WebSocket gateway nodes subscribe and push to the right session. The same event lands on Kafka for fraud scoring and analytics. Top-up events are triggered by webhooks from the payment service, processed idempotently using the payment provider event id.',
      scalingStrategy:
        'Shard wallets by wallet_id across Postgres instances; most transactions touch a single wallet and stay local. Cache current balances in Redis with write-through on every ledger insert so reads never hit Postgres. WebSocket connections are load-balanced across stateless gateway nodes that share the Redis Pub/Sub channel. For high-value wallets with many concurrent readers, fan out to a read replica before serving history.',
      tradeoffs:
        'Storing balance_after on every ledger row duplicates data but eliminates expensive full-history replays for current balance and arbitrary point-in-time lookups. Optimistic locking is preferred over row-level pessimistic locks because contention on a single wallet is low in practice and retries are cheap. Cross-shard P2P transfers require a saga with compensation, which introduces brief inconsistency windows — acceptable because both parties see a pending state before the transfer commits.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'kyc-verification-pipeline',
    title: 'Design a KYC verification pipeline',
    difficulty: 'medium',
    timeEstimate: '30-45 minutes',
    prompt:
      'Design the backend pipeline that verifies user identity (Know Your Customer) for a fintech app. Users submit personal data and documents; the system checks them against external providers and gates product access on the result.',
    requirements: [
      'Accept document uploads (passport, driving licence) and personal data',
      'Orchestrate checks against one or more external KYC vendors',
      'Gate wallet and payment features behind KYC tier thresholds',
      'Allow manual review override for edge cases',
      'Maintain a full audit trail for regulatory compliance',
    ],
    constraints: [
      'Document files up to 10 MB; store durably',
      'Vendor response times are 2-30 seconds (async callbacks)',
      'PII must be encrypted at rest and in transit',
      'Audit logs must be tamper-evident and retained for 7 years',
    ],
    modelAnswer: {
      overview:
        'Model KYC as a pipeline of check stages (identity, document, sanctions screening) driven by a state machine. The user submits documents and personal data via a short-lived pre-signed upload URL; the orchestrator kicks off the pipeline asynchronously and tracks each check as an independent step that can pass, fail, or require manual review. A webhook from the vendor transitions the step, and once all steps resolve the orchestrator computes an overall KYC tier and publishes an event that other services (wallet, payments) subscribe to for gate enforcement.',
      dataModel:
        'Tables:\n\n    kyc_profiles(id, user_id, tier ENUM(none,basic,full), status, created_at, updated_at)\n    kyc_documents(id, profile_id, type, s3_key, encrypted_key_ref, uploaded_at)\n    kyc_checks(id, profile_id, vendor, check_type, status, vendor_ref, result_json JSONB, created_at, completed_at)\n    kyc_audit_log(id, profile_id, actor, action, detail JSONB, created_at)\n\nPII fields (name, DOB, address) in kyc_profiles are encrypted at the application layer with a per-user key stored in a KMS. kyc_audit_log rows include a chain hash for tamper evidence.',
      apiDesign:
        'Endpoints:\n\n    POST /kyc/start                   -> create profile, return pre-signed upload URLs\n    POST /kyc/:profileId/submit       -> trigger pipeline after uploads complete\n    GET  /kyc/:profileId/status       -> current tier and check statuses\n    POST /kyc/:profileId/review       -> admin manual override\n    POST /webhooks/kyc-vendor         -> vendor async callback\n\nThe submit endpoint validates that all required documents are present before enqueuing the pipeline.',
      messageFlow:
        'On submit, publish kyc.pipeline_started to a topic. The orchestrator consumer fires each check as a command to a vendor-adapter worker. Vendor callbacks arrive on a webhook endpoint, get verified (HMAC signature), and are published as kyc.check_completed events. When all checks for a profile complete, the orchestrator computes the tier and emits kyc.tier_updated, which the wallet and payment services consume to enforce limits.',
      scalingStrategy:
        'Document storage is S3; the service never stores file bytes directly. Vendor adapters are stateless workers that can be scaled per vendor queue depth independently. The pipeline state is the database; if a worker crashes, the orchestrator can re-drive any incomplete check after a timeout. Redis caches current tier for hot-path gate checks so every API call does not query Postgres.',
      tradeoffs:
        'Async vendor callbacks mean the user waits minutes rather than seconds, which requires a status-polling or push notification UX. Encrypting PII at the application layer (rather than relying solely on database encryption) provides defense in depth but adds operational complexity around key rotation. Storing result_json as JSONB is flexible across vendors but sacrifices strict schema validation — a JSON Schema check at ingest time compensates.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'analytics-event-pipeline',
    title: 'Design an analytics event pipeline',
    difficulty: 'medium',
    timeEstimate: '30-45 minutes',
    prompt:
      'Design a pipeline that ingests high-volume events from client SDKs and server-side producers, transforms and validates them, and makes them queryable for both real-time dashboards and historical reports.',
    requirements: [
      'Ingest events from web, mobile, and server SDKs at very high throughput',
      'Validate and enrich events (geo-IP, device parsing) before storage',
      'Support real-time metrics with sub-minute latency',
      'Support ad-hoc historical queries over months of data',
      'Allow schema evolution without breaking downstream consumers',
    ],
    constraints: [
      '500k events/second at peak',
      'Events must not be lost even if the processing layer is down',
      'Cold storage must be cost-effective at petabyte scale',
      'Schema changes are frequent from product teams',
    ],
    modelAnswer: {
      overview:
        'Use a lambda-architecture-inspired split: a hot path for real-time aggregates and a cold path for durable storage and batch queries. Client SDKs batch and post events to a lightweight collector tier that writes directly to Kafka without any heavy processing. Kafka is the durability buffer. A stream processor (Flink or Kafka Streams) handles enrichment and real-time aggregation into a time-series store (ClickHouse or Druid). The same Kafka topics are consumed by a sink that writes Parquet files to object storage for historical queries via an OLAP engine.',
      dataModel:
        'Canonical event schema (Avro/Protobuf, versioned in a schema registry):\n\n    event_id        UUID\n    event_type      string\n    user_id         string (nullable)\n    session_id      string\n    occurred_at     timestamp (ms, UTC)\n    properties      map(string, any)\n    context         object  -- enriched: ip, user_agent, geo, device\n    schema_version  int\n\nPartition key in Kafka is event_type + date so consumers can filter cheaply. Parquet files are partitioned by event_type / year / month / day in S3.',
      apiDesign:
        'Ingest endpoints (collector tier):\n\n    POST /v1/batch    -> accept array of events, return 200 immediately\n    POST /v1/event    -> single event (convenience)\n\nQuery endpoints (analytics API, backed by ClickHouse):\n\n    GET /metrics/:eventType?from=&to=&granularity=   -> time-series counts\n    POST /query                                       -> arbitrary SQL for ad-hoc use\n\nThe collector is intentionally thin; all validation and enrichment happen in the stream processor.',
      messageFlow:
        'Client SDK batches events every 5 seconds or at 50 events, whichever comes first, and retries with back-off on network failure. Collector writes to Kafka with acks=all for durability. Flink job reads from Kafka, validates schema (reject to a dead-letter topic on failure), enriches with geo-IP and device-parser lookups (cached in RocksDB state), and writes to ClickHouse for real-time and to S3 via Parquet sink for cold storage. A schema registry enforces backward compatibility on schema evolution.',
      scalingStrategy:
        'The collector tier is stateless and horizontally scalable; Kafka absorbs burst by adding partitions. Flink scales by adding task slots per partition. ClickHouse is sharded by date; merges and compaction happen asynchronously without affecting ingest. S3 + Athena/Trino handles petabyte-scale historical queries without managing cluster capacity. Keep hot data (last 30 days) in ClickHouse; archive older data to S3 only.',
      tradeoffs:
        'Lambda architecture duplicates logic (stream and batch paths must agree) but gives the best latency-cost tradeoff at scale. A pure streaming approach (Kappa) is simpler but reprocessing months of events on schema changes requires re-reading all Kafka history, which is slow. Avro with a schema registry enforces compatibility but requires a registry deployment — JSON without a registry is simpler but silently breaks downstream consumers on field renames.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'nexuspay-from-scratch',
    title: 'Design NexusPay from scratch',
    difficulty: 'hard',
    timeEstimate: '50-60 minutes',
    prompt:
      'Design NexusPay, a fintech super-app offering wallets, peer-to-peer payments, and KYC. This is the meta-challenge: tie together services, data ownership, messaging, and consistency.',
    requirements: [
      'User onboarding with KYC verification gating wallet limits',
      'Wallets with accurate balances and a transaction ledger',
      'Peer-to-peer transfers that are atomic across two wallets',
      'Notifications on every money movement',
      'An analytics/event stream for fraud and reporting',
    ],
    constraints: [
      '5M users, 1M daily active',
      'Strong correctness for balances; eventual consistency acceptable for derived data',
      'Regulatory audit trail required',
      '99.99% availability for reads',
    ],
    modelAnswer: {
      overview:
        'Decompose into services by business capability: auth, kyc, wallet, payments, notifications, and analytics, each owning its own database. NestJS services communicate with commands over RabbitMQ and emit domain events; a P2P transfer that spans two wallets is coordinated as a Saga with compensating actions rather than a distributed transaction. Kafka carries the event stream for fraud detection and reporting.',
      dataModel:
        'Wallet service (its own DB):\n\n    wallets(id, user_id, currency, balance NUMERIC(18,4), status, version)\n    ledger_entries(id, wallet_id, direction, amount, transfer_id, created_at)\n\nPayments service:\n\n    transfers(id, from_wallet, to_wallet, amount, status, saga_state, idempotency_key UNIQUE, created_at)\n\nBalances are derived from and reconciled against the append-only ledger. Optimistic locking via the version column prevents lost updates.',
      apiDesign:
        'Endpoints:\n\n    POST /kyc/submit\n    GET  /wallets/:id\n    POST /transfers            (Idempotency-Key header)\n    GET  /transfers/:id\n\nThe transfer endpoint validates KYC limits, then kicks off the transfer saga and returns a pending transfer id.',
      messageFlow:
        'Transfer saga: reserve funds on the source wallet -> credit the destination wallet -> mark complete. If the credit fails, a compensating command releases the source reservation. Each step is an idempotent command on RabbitMQ keyed by transfer id. Every committed ledger change publishes to Kafka for analytics and fraud scoring; notifications subscribe to money.moved events.',
      scalingStrategy:
        'Reads dominate, so cache wallet balances in Redis with write-through invalidation on ledger commits. Partition wallets by user_id. Keep the write path small and transactional inside the wallet service. Scale analytics independently off Kafka so reporting load never touches the transactional path.',
      tradeoffs:
        'Database-per-service and Sagas buy independent deployability and availability but cost you cross-service JOINs and instant global consistency, so balances are strongly consistent while derived views are eventually consistent. Optimistic locking favors throughput over the blocking safety of pessimistic locks, which is acceptable because conflicts on a single wallet are rare and retryable.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'rate-limiting-service',
    title: 'Design a rate limiting service for an API gateway',
    difficulty: 'medium',
    timeEstimate: '30-45 minutes',
    prompt:
      'Design a centralized rate limiting service that enforces per-client and per-endpoint quotas for a large API gateway fleet. The service must be accurate, low-latency, and available even when parts of it are degraded.',
    requirements: [
      'Enforce per-API-key and per-IP rate limits configurable per endpoint',
      'Support multiple algorithms: token bucket for burst, sliding window for smoothing',
      'Return standard rate-limit headers (X-RateLimit-Limit, Remaining, Reset)',
      'Allow real-time configuration changes without redeployment',
      'Provide usage metrics per client for billing and observability',
    ],
    constraints: [
      'Decision latency under 5ms p99 (cannot block the request path)',
      'Gateway fleet is 200 nodes; limits must be globally consistent, not per-node',
      'Must degrade gracefully: if the rate limiter is unavailable, allow traffic (fail-open)',
      '10k unique API keys, each with potentially different limits',
    ],
    modelAnswer: {
      overview:
        'Use Redis as the shared counter store because atomic Lua scripts make token-bucket and sliding-window increments race-free across all gateway nodes. Each gateway node makes a single Redis call per request (a pipeline of EVAL + EXPIRE) before proxying. A sidecar config cache on every node holds the limit rules (refreshed every 10 seconds from a config service) so rule lookups never add latency. If Redis is unreachable, the gateway fails open and logs the decision for post-hoc audit.',
      dataModel:
        'Redis key schema:\n\n    rl:{key_id}:{endpoint}:{window}   -> integer counter or token bucket state\n    config:{key_id}                   -> hash of limit rules per endpoint\n\nPersistent config stored in Postgres:\n\n    rate_limit_rules(id, key_id, endpoint_pattern, algorithm, limit, window_seconds, burst, updated_at)\n    rate_limit_events(key_id, endpoint, timestamp, allowed BOOL, remaining INT)\n\nrate_limit_events is written asynchronously to a time-series table for billing and dashboards.',
      apiDesign:
        'The rate limiter is not a public API; it is an in-process library or sidecar. Its interface:\n\n    check(key_id, endpoint, cost=1) -> { allowed: bool, remaining: int, reset_at: timestamp }\n\nThe config service exposes:\n\n    GET  /config/rules?key_id=\n    PUT  /config/rules/:ruleId    -> update limit (propagated via pub/sub)\n    GET  /metrics/usage?key_id=&from=&to=\n\nGateway nodes subscribe to a Redis Pub/Sub channel to receive rule invalidations and refresh the local cache immediately.',
      messageFlow:
        'On each request: gateway sidecar reads the rule from local cache (TTL 10s), executes the Redis Lua script atomically (increment counter, check against limit, set TTL on first touch), reads the result, and attaches rate-limit headers. Allowed and denied decisions are batched and written asynchronously every second to Postgres for usage reporting. A background job aggregates daily totals per API key for billing.',
      scalingStrategy:
        'Redis is the single bottleneck; use Redis Cluster partitioned by key_id so no single shard holds all counters. Lua scripts keep the operation atomic without distributed locks. For the most aggressive callers (burst events), use a local token-bucket pre-filter in the gateway process to absorb noise before hitting Redis. The config cache eliminates per-request Postgres reads entirely.',
      tradeoffs:
        'Centralized Redis gives exact global counts but adds a network hop and a Redis dependency. A purely local counter is faster but allows 200x over-limit during bursts (one per gateway node). The chosen hybrid (local pre-filter + Redis for enforcement) balances accuracy and latency. Fail-open on Redis outage keeps the API available but risks a brief quota bypass — acceptable because the window is short and audited. Fixed-window counters are simpler but create boundary spikes; sliding-window Redis scripts are slightly more expensive but eliminate the problem.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'distributed-job-queue',
    title: 'Design a distributed job queue with retry and DLQ',
    difficulty: 'medium',
    timeEstimate: '30-45 minutes',
    prompt:
      'Design a general-purpose distributed job queue used by many internal services to schedule background work. Jobs must survive worker crashes, support retries with back-off, and failed jobs must be routable to a dead-letter queue for inspection and replay.',
    requirements: [
      'Enqueue jobs with priority and optional scheduled delay',
      'At-least-once delivery with configurable retry limit and back-off',
      'Dead-letter queue for jobs that exhaust retries',
      'Job status queryable in real time',
      'Support multiple named queues with isolated workers',
    ],
    constraints: [
      '100k job enqueues/second at peak',
      'No job must be silently lost even on worker or broker crash',
      'Workers are heterogeneous (Node, Python, Go services)',
      'Job payloads up to 1 MB',
    ],
    modelAnswer: {
      overview:
        'Build on top of a durable broker (Kafka or RabbitMQ with quorum queues) with a thin orchestration layer that tracks job state in Postgres. Each enqueue writes a row to the jobs table and publishes to the broker. A worker claims a job by updating its status to running and sets a visibility timeout; if the heartbeat stops, the orchestrator re-enqueues after the timeout. Retries use exponential back-off with jitter stored on the job row. After max_attempts exhaustion, the orchestrator moves the job to the dead-letter topic and marks it dlq.',
      dataModel:
        'Tables:\n\n    jobs(id, queue, payload JSONB, status ENUM(pending,running,success,failed,dlq), priority INT, attempts INT, max_attempts INT, run_at TIMESTAMP, locked_until TIMESTAMP, worker_id, created_at, updated_at)\n    job_events(id, job_id, event_type, detail JSONB, created_at)\n\nstatus + run_at + priority together drive the fetch query. locked_until implements the visibility timeout; the orchestrator scans for rows where status=running AND locked_until < now() to re-queue stale jobs.',
      apiDesign:
        'REST + language SDKs wrap the REST:\n\n    POST /queues/:name/jobs        -> enqueue (returns job id)\n    GET  /queues/:name/jobs/:id   -> status\n    GET  /queues/:name/dlq        -> list DLQ jobs\n    POST /queues/:name/dlq/:id/replay  -> re-enqueue from DLQ\n    POST /queues/:name/jobs/:id/cancel\n\nWorkers use a poll or long-poll endpoint or a broker SDK directly:\n\n    POST /queues/:name/fetch      -> claim next job',
      messageFlow:
        'Enqueue: write job row (pending) + publish to broker topic. Worker fetch: SELECT ... FOR UPDATE SKIP LOCKED on the pending row, set running + locked_until. Worker heartbeat: extend locked_until every 30 seconds. On success: update to success, ack broker message. On failure: increment attempts; if attempts < max_attempts set status=pending and run_at = now() + back_off, else set status=dlq and publish to dead-letter topic. Orchestrator sweeps every 10 seconds for stuck running jobs.',
      scalingStrategy:
        'Partition broker topics by queue name so queues are isolated. Scale workers horizontally per queue; the SELECT FOR UPDATE SKIP LOCKED pattern in Postgres handles contention without explicit locking overhead. For very high enqueue rates (100k/s), buffer in Kafka first and batch-insert to Postgres asynchronously, trading some status freshness for throughput. Separate read replicas serve status queries so they never block the write path.',
      tradeoffs:
        'Using Postgres as the job store alongside a broker gives strong durability and queryability but means two writes per enqueue (DB + broker) — a broker-only approach is faster but loses the rich status querying. At-least-once delivery means workers must be idempotent; enforcing this in the framework (by providing the job id as a deduplication key to the worker) pushes the burden to callers. Exponential back-off with jitter prevents thundering-herd retries but means a flapping downstream can pile up DLQ messages faster than reviewers can handle them — a circuit-breaker per queue is a useful addition.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'real-time-fraud-detection',
    title: 'Design a real-time fraud detection system',
    difficulty: 'hard',
    timeEstimate: '40-55 minutes',
    prompt:
      'Design the backend for a real-time fraud detection system that evaluates every transaction as it happens, scores it against behavioral and rule-based signals, and can block or flag suspicious activity before money moves.',
    requirements: [
      'Score every transaction in under 200ms before authorization',
      'Apply configurable rule sets (velocity, geo-anomaly, device fingerprint)',
      'Feed a machine learning model with live feature vectors',
      'Allow analysts to update rules without redeployment',
      'Produce a decision log for compliance and model retraining',
    ],
    constraints: [
      '5,000 transactions/second at peak',
      'Decision latency budget is 200ms end-to-end (shared with payment auth)',
      'Model features require history up to 30 days per user',
      'False positive rate must stay below 0.5% to avoid frustrating real users',
    ],
    modelAnswer: {
      overview:
        'Split the decision path into two tracks: a synchronous rules engine that runs in-process within the payment service (sub-10ms) and an asynchronous ML scoring service contacted over gRPC with a hard timeout. The rules engine catches obvious fraud (velocity breaches, blocked countries) early. The ML service reads pre-computed feature vectors from a low-latency feature store (Redis) and returns a risk score. If the ML service does not respond within 150ms, the rules-only score is used. Decisions and all input signals are written to Kafka for the compliance log and model retraining pipeline.',
      dataModel:
        'Feature store (Redis Hashes, one per user):\n\n    fraud:features:{user_id} -> txn_count_1h, txn_count_24h, amount_sum_7d, distinct_countries_7d, last_device_id, last_ip, ...30 fields\n\nDecision log (Postgres + Kafka sink):\n\n    fraud_decisions(id, transaction_id, user_id, score NUMERIC(5,4), action ENUM(allow,flag,block), rules_triggered JSONB, model_version, latency_ms, created_at)\n\nRule config:\n\n    fraud_rules(id, name, condition_expr, action, priority, enabled, updated_at)',
      apiDesign:
        'Internal gRPC service (not public):\n\n    EvaluateTransaction(request: {txn_id, user_id, amount, currency, device_id, ip, merchant_id}) -> {score, action, triggered_rules}\n\nAdmin REST API:\n\n    GET  /rules                     -> list active rules\n    POST /rules                     -> create rule\n    PUT  /rules/:id                 -> update / enable / disable (hot reload)\n    GET  /decisions?user_id=&from=  -> decision history for a user\n\nRule changes are published to a Redis Pub/Sub channel; all engine instances reload within 1 second.',
      messageFlow:
        'Payment service calls EvaluateTransaction via gRPC with a 180ms deadline. The fraud service: (1) fetches feature vector from Redis (single HGETALL, under 2ms); (2) runs the in-memory rules engine against the vector; (3) concurrently calls the ML model inference service with the same features; (4) merges rule action and model score using a policy (highest severity wins); (5) returns decision and asynchronously publishes fraud.decision_made to Kafka. A Flink job consumes Kafka and updates the Redis feature vectors for future requests.',
      scalingStrategy:
        'The fraud service is stateless and scales horizontally. The Redis feature store is sharded by user_id and replicated for read scalability. Feature updates from Flink are batched (every 5 seconds) to avoid thundering writes. The ML model is loaded in-process (ONNX runtime) on each fraud service instance to eliminate a network hop — model updates are distributed as versioned S3 objects and loaded by a file-watcher without restart. Rule config is cached in-memory and invalidated via Pub/Sub.',
      tradeoffs:
        'Running the model in-process eliminates a network round-trip but means every service instance uses extra RAM and model updates require a rolling reload. A separate model inference service is easier to update but adds latency. Falling back to rules-only on ML timeout keeps the p99 latency within budget at the cost of a slightly less accurate score during ML degradation — this is safer than blocking the payment path. Pre-computing features in a streaming job rather than computing them on the fly makes scoring fast but means very recent events (< 5s) are not yet reflected in the feature vector, a known and acceptable gap.',
    },
    scoringDimensions: SCORING,
  },
  {
    id: 'multi-tenant-saas-backend',
    title: 'Design a multi-tenant SaaS backend',
    difficulty: 'hard',
    timeEstimate: '40-55 minutes',
    prompt:
      'Design the backend infrastructure for a B2B SaaS platform that serves thousands of business tenants, each with their own users, data, and configuration, while sharing the same application fleet. The design must handle isolation, fair resource allocation, and operational scalability.',
    requirements: [
      'Tenant onboarding: create an account, invite users, configure branding and feature flags',
      'Strong data isolation so one tenant cannot access another\'s data',
      'Per-tenant rate limiting and resource quotas',
      'Tenant-specific feature flags and plan-based feature gating',
      'Usage metering for billing (API calls, storage, seats)',
    ],
    constraints: [
      '10k tenants, up to 50k users per large tenant',
      'Most tenants are small (under 100 users); a few are very large',
      'Shared application tier; dedicated database tier optional for enterprise tenants',
      'Data residency requirements: EU tenants must store data in EU regions',
    ],
    modelAnswer: {
      overview:
        'Use a shared-schema multi-tenancy model for small and mid-size tenants (tenant_id foreign key on every table, row-level security enforced in the database and the application layer) and offer dedicated database clusters for enterprise tenants who need stricter isolation or data residency. A central tenant registry service holds plan, configuration, and routing metadata. Every API request passes through an authentication middleware that resolves the tenant from the JWT or subdomain, attaches the tenant context, and enforces plan-level gates before hitting business logic.',
      dataModel:
        'Tenant registry (shared, its own DB):\n\n    tenants(id, slug UNIQUE, plan, region, db_pool_ref, status, created_at)\n    tenant_features(tenant_id, feature_key, enabled, config JSONB)\n    tenant_quotas(tenant_id, resource, limit_value, current_value, reset_at)\n\nApplication tables (shared schema example):\n\n    users(id, tenant_id, email, role, created_at)  -- partial index ON tenant_id\n    resources(id, tenant_id, ...)                   -- all tables carry tenant_id\n\nRow-level security policy in Postgres:\n    CREATE POLICY tenant_isolation ON users USING (tenant_id = current_setting(\'app.tenant_id\')::uuid)',
      apiDesign:
        'Public endpoints (all authenticated; tenant resolved from JWT claim or subdomain):\n\n    POST /tenants                            -> create tenant (super-admin)\n    POST /tenants/:id/users/invite           -> invite user\n    GET  /tenants/:id/features               -> feature flag state\n    PUT  /tenants/:id/features/:key          -> enable/disable feature\n    GET  /tenants/:id/usage?from=&to=        -> metered usage for billing\n    GET  /tenants/:id/quotas                 -> current quota consumption\n\nAll endpoints enforce that the calling user belongs to the tenant in the path. Super-admin routes are guarded by a separate scope in the JWT.',
      messageFlow:
        'On every request, the auth middleware resolves the tenant, sets the Postgres session variable (app.tenant_id) for RLS, and checks the feature gate cache (Redis, keyed by tenant_id + feature_key, TTL 60 seconds). Usage events (API call, storage write) are published asynchronously to a Kafka topic per region. A metering consumer aggregates events per tenant per billing period and upserts into tenant_quotas. When a quota is exceeded, a quota.exceeded event triggers rate-limit enforcement and an alert to the tenant admin.',
      scalingStrategy:
        'Small tenants share connection pool and database shards; route by tenant_id mod N. Large enterprise tenants get their own Postgres cluster in their required region, referenced by db_pool_ref in the tenant registry. The application tier is region-aware: requests are routed to the cluster nearest the tenant\'s data residency region by a global load balancer. Feature flags and quota limits are cached in Redis per tenant to avoid per-request registry DB reads. Metering is write-heavy but append-only, so a separate write-optimized store (ClickHouse or TimescaleDB) handles aggregation without loading the transactional database.',
      tradeoffs:
        'Shared-schema multi-tenancy is operationally simple and cost-effective for many small tenants but requires careful indexing (all major indexes must include tenant_id as the leading column) and careful RLS policy testing to avoid data leaks. Silo-per-tenant (dedicated DB) is safest for isolation but multiplies operational complexity and cost. The hybrid model balances both: shared for the long tail, dedicated for the few large or regulated tenants. Eventual consistency in the quota counters means a burst of concurrent requests can briefly exceed quota before enforcement kicks in — an accepted trade-off to keep the enforcement path off the critical request path.',
    },
    scoringDimensions: SCORING,
  },
];
