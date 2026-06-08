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
];
