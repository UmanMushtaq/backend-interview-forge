import type { LearnModule } from '../../types';

export const nexuspay: LearnModule = {
  id: 'nexuspay',
  title: 'NexusPay Deep Dive',
  blurb: 'Own your flagship project. Every architectural decision, every flow, every trade-off.',
  lessons: [
    {
      id: 'nexuspay-intro',
      title: 'Why NexusPay exists and what it proves',
      content: `
Imagine walking into a senior backend interview with nothing to show except tutorials. Every candidate can talk about REST APIs and databases in the abstract. Very few can say: "I built a production-grade fintech platform with 7 microservices, event-driven architecture, and 85% test coverage  -  and I can explain every decision I made."

That is what NexusPay is.

**NexusPay** is a fully functional payment platform we built to demonstrate exactly the skills senior backend roles demand. It is not a toy project. It processes transfers between wallets, enforces KYC (Know Your Customer) compliance, handles failed transactions with compensating operations, and streams every event to downstream analytics services.

So what does it actually prove?

It proves we can design distributed systems. Seven services, each with its own database, communicating through RabbitMQ and Kafka  -  this is not a CRUD app. It requires understanding bounded contexts, eventual consistency, and what happens when one service crashes mid-flow.

It proves we make deliberate architectural trade-offs. We chose RabbitMQ for directed commands and Kafka for event streaming. We chose gRPC for internal service calls in Phase 4. We chose GraphQL subscriptions for real-time frontend updates in Phase 5. Every choice has a reason.

It proves we own the full engineering lifecycle. Docker Compose runs all 7 services locally in one command. GitHub Actions runs the CI/CD pipeline on every push. Jest tests cover 85% of the codebase. We did not just write features  -  we built a system.

**In an interview**, introduce NexusPay like this: "I built NexusPay  -  a production-grade event-driven payment platform with 7 NestJS microservices in an Nx monorepo. Each service owns its own PostgreSQL database. RabbitMQ handles directed commands like KYC approval and wallet creation, Kafka handles event streaming for analytics and fraud detection, and Redis handles caching, rate limiting, distributed locks, and JWT blacklisting. I can walk you through any part of it in depth." Say this in under 30 seconds. Then stop. Let them choose where to go.
      `.trim(),
    },
    {
      id: 'nexuspay-architecture',
      title: 'The architecture in one mental model',
      content: `
The hardest thing about explaining a complex system is knowing where to start. Start with the boundary: everything external goes through one door.

**The API Gateway** is that door. All HTTP traffic  -  from mobile apps, web clients, third-party integrations  -  hits the Gateway first. The Gateway handles authentication, rate limiting, and routing. It does not contain business logic. It is a traffic director, not a decision maker.

Behind the Gateway live six domain services: **User Service**, **Wallet Service**, **Transaction Service**, **Notification Service**, **Analytics Service**, and **Payment Gateway Service**. Each service owns exactly one PostgreSQL database. They do not share tables. They do not share schemas. They are completely independent deployments.

Services communicate in two ways. For commands  -  "create this wallet", "send this notification"  -  they use **RabbitMQ**. A message goes into a queue, the right service picks it up, the message is gone. For events that multiple consumers need  -  "a transaction completed"  -  they use **Kafka**. An event goes into the \`transactions.stream\` topic and stays there, so Analytics, Fraud Detection, and any future service can consume it independently at their own pace.

**Redis** sits across every service as a shared fast layer: caching user profiles, enforcing rate limits, holding distributed locks, and blacklisting revoked JWT tokens.

Here is the architecture as a flow:

\`\`\`
External Client
      │
      ▼
  API Gateway  (auth · rate limiting · routing)
      │
      ├──► User Service         (PostgreSQL: users, KYC)
      │         │
      │    RabbitMQ ──► Wallet Service     (PostgreSQL: wallets, balances)
      │                      │
      │              RabbitMQ ──► Notification Service  (email · SMS · push)
      │
      ├──► Transaction Service  (PostgreSQL: transactions, ledger)
      │         │
      │    Kafka (transactions.stream)
      │         ├──► Analytics Service   (aggregations, reports)
      │         └──► Fraud Detection     (pattern matching, risk scoring)
      │
      └──► Payment Gateway Service  (external payment provider integration)

Redis  ←── All services  (cache · rate limit · locks · JWT blacklist)
\`\`\`

**In an interview**, draw this on a whiteboard from memory. Start with the Gateway, name the six services, point to RabbitMQ and Kafka separately, mention Redis as the cross-cutting layer. Say: "Every service has its own database  -  I can explain why if you want." They will ask. That is lesson 3.
      `.trim(),
    },
    {
      id: 'nexuspay-bounded-contexts',
      title: 'Why 7 separate databases  -  the bounded context principle',
      content: `
When most developers build a multi-service system for the first time, they share a single database between services. It feels like the pragmatic choice. One schema, one connection pool, no duplication. But this creates a coupling problem that only becomes visible when the system grows.

Imagine the User Service and Wallet Service both read from a shared \`users\` table. Now the Wallet team needs to add an \`is_high_risk\` flag to users for fraud checks. They add a column. The User Service deployment breaks because the column was not in its migration. Both teams now coordinate every schema change. Every "independent" service now has a deployment dependency.

**Bounded contexts** solve this. The concept comes from Domain-Driven Design. A bounded context is a clear boundary around a domain model. Inside the boundary, terms and data have specific meanings. Outside it, other contexts have their own representation of the same real-world entity.

In NexusPay, the User Service's concept of a "user" is: name, email, phone, KYC status, role. The Wallet Service's concept of a "user" is: just a \`userId\` foreign key on the wallet record. The Wallet Service does not care about KYC status  -  that is the User Service's concern. When KYC is approved, User Service publishes an event. Wallet Service listens, creates the wallet, and stores only the \`userId\` it needs.

This gives us three concrete benefits.

**Independent deployability.** We can deploy the Wallet Service without touching the User Service. Schema changes in one database do not affect any other service.

**Independent scalability.** The Transaction Service handles high write volume. We can scale its database  -  add replicas, tune autovacuum, add an index  -  without touching the User or Wallet databases.

**Failure isolation.** If the Analytics Service's PostgreSQL goes down, the core payment flow keeps running. A shared database would make one service's problems everyone's problems.

The trade-off is real: we cannot do a JOIN across services. To get a user's wallet balance alongside their profile, we need two queries  -  one to User Service, one to Wallet Service  -  and assemble the result in the API Gateway or a backend-for-frontend layer. For NexusPay, that trade-off is worth it.

**In an interview**, if asked "why separate databases?", say: "Each service owns its data  -  that is the bounded context principle from DDD. It gives us independent deployability and failure isolation. The cost is no cross-service JOINs, which we handle by assembling data at the Gateway or in response to events. For a payment platform, the isolation is worth the trade-off."
      `.trim(),
    },
    {
      id: 'nexuspay-kyc-flow',
      title: 'The KYC flow end to end',
      content: `
**Know Your Customer (KYC)** is a legal requirement for payment platforms. Before a user can send or receive money, we must verify their identity. The KYC flow in NexusPay touches four services and three technologies. Walk through it step by step.

**Step 1  -  Submission.** The user sends \`POST /users/kyc\` with their identity documents. The API Gateway routes this to the User Service. User Service stores the document references and sets \`kycStatus = PENDING\` on the user record. It returns a 202 Accepted  -  the review is asynchronous.

Why not process KYC synchronously? Because real KYC involves manual review or a third-party verification service that takes minutes or hours. The user should not wait with an open HTTP connection.

**Step 2  -  Admin approval.** An admin reviews the submission and calls \`PATCH /users/:id/kyc\` with \`{ status: "APPROVED" }\`. User Service updates the user's \`kycStatus = APPROVED\` in its database.

**Step 3  -  Event published.** After saving, User Service publishes a \`user.kyc.approved\` message to RabbitMQ. The message contains the userId and nothing else the consumers did not already know.

Why RabbitMQ and not a direct HTTP call? Because we want loose coupling. User Service should not know that Wallet Service exists. It just announces what happened. Any service that cares can listen.

**Step 4  -  Wallet created.** Wallet Service is subscribed to the \`user.kyc.approved\` queue. It receives the message, creates a new wallet with a zero balance, and stores it in its own PostgreSQL database.

**Step 5  -  Notification sent.** Notification Service is also subscribed  -  to a separate binding on the same exchange. It receives the event and sends a confirmation email: "Your identity has been verified. Your wallet is ready."

This is the power of the fan-out pattern. One event triggers two independent side effects. User Service published once. Wallet and Notification services acted independently. Neither service depends on the other.

**In an interview**, draw this as a sequence diagram: User → Gateway → User Service → RabbitMQ → (Wallet Service + Notification Service). Say: "RabbitMQ lets us add new reactions to this event without modifying the User Service. If we add a Rewards Service later, we just subscribe it to the same exchange."
      `.trim(),
    },
    {
      id: 'nexuspay-rabbitmq-decision',
      title: 'Why RabbitMQ for KYC and not Kafka',
      content: `
This is one of the most important decisions in NexusPay and the one interviewers push hardest on. The question is not "which is better?"  -  it is "which tool fits which job?"

Think about what the KYC approval event is trying to do. User Service is saying: "Wallet Service, please create a wallet for this user  -  right now." It is a **command**. There is one intended consumer. The message is consumed, acted on, and discarded. It does not need to exist after Wallet Service reads it.

Now imagine we used Kafka. Kafka stores messages in an ordered log. Messages stay in the log until the retention period expires (days or weeks). Multiple consumer groups can read the same message independently. That is Kafka's power  -  but it is completely unnecessary here.

We do not need replay. If Wallet Service creates the wallet successfully, there is nothing to replay. If it fails, we have a dead-letter queue in RabbitMQ to handle the retry.

We do not need multiple independent consumers reading the same message as if for the first time. Both Wallet Service and Notification Service need the KYC event, but they consume it from separate queues on the same RabbitMQ exchange  -  fan-out routing. Each gets their own copy. This is different from Kafka's consumer group model.

We do need guaranteed delivery to a specific service. RabbitMQ's queue holds the message until a consumer acknowledges it. If Wallet Service is down, the message waits. When it comes back, it processes. This is exactly what we need.

**RabbitMQ is for directed, transient commands.** It is "do this thing once, for you." **Kafka is for persistent event streams.** It is "this happened  -  everyone who cares can find out, now or later."

The KYC approval is a command. Wallet creation is a command. "Send this user a notification" is a command. These belong on RabbitMQ.

"A transfer completed at 14:32:17 for €250" is an event that Analytics needs for dashboards, Fraud Detection needs for pattern matching, and a future Compliance Service might need for regulatory reporting. That belongs on Kafka.

**In an interview**, say: "I chose RabbitMQ for KYC because it is a directed command  -  create this wallet now, for this user. Messages are consumed once and discarded. Kafka would be wrong here because we do not need replay, and we do not need multiple independent consumer groups reading the same message as a persistent log entry. Kafka's strengths are durability and fan-out at scale, which is exactly why I use it for transaction events."
      `.trim(),
    },
    {
      id: 'nexuspay-saga-flow',
      title: 'The transfer Saga flow end to end',
      content: `
A transfer between two wallets looks simple on the surface: subtract from source, add to destination. But in a distributed system with separate services, "subtract from source" and "add to destination" happen in different places. If anything fails between those two operations, we have a consistency problem.

This is why we use the **Saga pattern**. A Saga is a sequence of local transactions, each of which publishes an event that triggers the next step. If a step fails, the Saga executes **compensating transactions**  -  operations that undo the completed steps.

Here is the NexusPay transfer flow, step by step.

**Step 1  -  Request received.** The client sends \`POST /transactions\` with source wallet, destination wallet, and amount. The API Gateway routes this to Transaction Service.

**Step 2  -  Distributed lock acquired.** Before writing anything, Transaction Service sets \`SET lock:wallet:sourceId NX EX 30\` in Redis. If the key already exists, another transfer is in progress on this wallet and we return 409. This prevents double-spending.

**Step 3  -  Transaction created as PENDING.** Transaction Service inserts a transaction record with status \`PENDING\` into its PostgreSQL database. We have a record that this transfer was initiated, even if everything else fails.

**Step 4  -  Debit requested.** Transaction Service publishes \`transaction.debit.requested\` to RabbitMQ with the amount and source wallet ID.

**Step 5  -  Wallet debited.** Wallet Service picks up the message, checks the balance, and debits the source wallet. It publishes \`wallet.debited\` back to RabbitMQ.

**Step 6  -  Credit applied.** Transaction Service receives \`wallet.debited\` and publishes \`transaction.credit.requested\`. Wallet Service credits the destination wallet and publishes \`wallet.credited\`.

**Step 7  -  Transaction completed.** Transaction Service updates the record to \`COMPLETED\` and publishes \`transaction.completed\` to **Kafka's** \`transactions.stream\` topic.

**Step 8  -  Downstream consumers act.** Analytics Service and Fraud Detection both consume from \`transactions.stream\` independently, using separate consumer groups. Analytics aggregates the transaction. Fraud Detection scores the pattern.

Now the failure path.

If Wallet Service finds the balance is insufficient at Step 5, it publishes \`wallet.debit.failed\`. Transaction Service receives this, updates the transaction to \`FAILED\`, releases the Redis lock, and publishes a \`transaction.failed\` event to Kafka so Analytics and Fraud Detection know about the failure too.

If the credit step fails after a successful debit  -  a more serious problem  -  the compensating transaction re-credits the source wallet and marks the transaction \`FAILED\`. This is the Saga's guarantee: either all steps complete, or the completed steps are rolled back.

**In an interview**, the follow-up question is always: "What happens if the Wallet Service crashes mid-Saga?" Answer: "The RabbitMQ message is not acknowledged, so it is redelivered when Wallet Service comes back. Each step is idempotent  -  we check if the operation was already applied before re-applying. The transaction stays PENDING in our database until the Saga completes or we detect a timeout and compensate."
      `.trim(),
    },
    {
      id: 'nexuspay-kafka-decision',
      title: 'Why Kafka for transaction events and not RabbitMQ',
      content: `
After a transfer completes, we publish the event to Kafka's \`transactions.stream\` topic. At the same time, we use RabbitMQ for the Saga steps within the transfer flow. Why the split?

The answer comes down to one question: **how many services need this event, and do they need it now or later?**

During the Saga, the messages are commands between two specific parties  -  Transaction Service and Wallet Service. "Debit this wallet." "Done, here is confirmation." The message is directed and consumed once. This is RabbitMQ's job.

After the Saga completes, \`transaction.completed\` is an **event fact**  -  something that happened, not a command to do something. Multiple downstream services need it:

- **Analytics Service** aggregates it into hourly summaries, daily revenue reports, and user spending dashboards.
- **Fraud Detection** scores the transaction against historical patterns and flags anomalies.
- Tomorrow, a **Compliance Service** might need every transaction for regulatory auditing.

With RabbitMQ, a message is consumed once per queue. We could create a separate queue for each consumer  -  but if Fraud Detection goes offline for two hours, we need RabbitMQ to buffer those messages for two hours. RabbitMQ can do this, but it is not built for long-term retention. More importantly, RabbitMQ deletes the message once all consumers acknowledge it. If we add a Compliance Service next quarter, it cannot access historical transactions.

**Kafka keeps every event in the log until the retention period expires.** By default we configure 7 days. When Fraud Detection comes back online after two hours of downtime, it seeks to its last committed offset and replays every missed event. When we add the Compliance Service next quarter, we can replay from the beginning of the log to bootstrap it with historical data.

Kafka's **consumer group model** is the other reason. Analytics and Fraud Detection each have their own consumer group. Each group maintains its own offset. Each reads every event independently, at its own pace. Adding a third consumer group does not affect the others.

**In an interview**, say: "I use Kafka for transaction events because multiple downstream services need the same event independently  -  and they may need to catch up after downtime or be bootstrapped with historical data. RabbitMQ deletes messages after consumption, so it cannot serve those use cases. Kafka's persistent log is exactly the right primitive here."
      `.trim(),
    },
    {
      id: 'nexuspay-redis',
      title: 'Redis: four jobs, one tool',
      content: `
Redis appears in every NexusPay service, but not for the same reason. It fills four distinct roles. Understand each one separately.

**Job 1: User profile caching.**

Every authenticated request hits the API Gateway. The Gateway validates the JWT and needs the user's profile to check permissions and KYC status. Without caching, this is a database query on every request.

We cache with: \`SET user:{userId} {profileJSON} EX 300\`. The TTL is 300 seconds (5 minutes). On a cache hit  -  which is the majority of requests  -  no database round trip happens. On logout or profile update, we delete the key immediately so the stale data cannot linger.

Why not an in-memory Map in Node.js? Because NexusPay runs multiple Gateway instances behind a load balancer. An in-memory cache on instance A is invisible to instance B. Redis is shared across all instances.

**Job 2: Rate limiting.**

We allow 100 requests per minute per IP address. On each request: \`INCR rate:{ip}:{windowMinute}\`. If the counter does not exist, Redis creates it. After the first INCR, we set an expiry: \`EXPIRE rate:{ip}:{windowMinute} 60\`. If the counter exceeds 100, we return 429.

This is the fixed-window counter algorithm. It is fast (two Redis commands), atomic (INCR is single-threaded in Redis), and resets cleanly every minute.

**Job 3: Distributed lock for wallet operations.**

This is the most critical Redis use case in NexusPay. When a transfer starts, we run:

\`\`\`
SET lock:wallet:{sourceId} "transfer-{txId}" NX EX 30
\`\`\`

\`NX\` means "only set if the key does not exist." If the key already exists  -  another transfer is already running on this wallet  -  the command returns nil. We return 409 Conflict. No double-spend.

If we get the lock, we proceed. In a \`finally\` block, we delete the key to release the lock. The 30-second TTL is a safety net: if the service crashes before the \`finally\` runs, the lock auto-expires and does not block the wallet forever.

**Job 4: JWT blacklisting.**

When a user logs out, their JWT is still cryptographically valid until it expires  -  typically 15 minutes. Without blacklisting, a stolen token remains usable for up to 15 minutes after logout.

We store: \`SETEX blacklist:{jti} {remainingTTL} "1"\`. The \`jti\` (JWT ID) is a unique identifier in the token payload. On every request, we check if the jti is in the blacklist. If it is, we reject the token.

The TTL equals the token's remaining lifetime  -  once the token would have expired anyway, the blacklist entry expires too. No memory leak.

**In an interview**, do not say "we use Redis for caching." Say: "Redis plays four roles in NexusPay  -  profile cache with 5-minute TTL to reduce DB load, fixed-window rate limiting at 100 requests per minute per IP, distributed locks with NX to prevent double-spending, and JWT blacklisting by JTI on logout. Each use case needs the atomic operations and sub-millisecond latency that Redis provides and that a database cannot match."
      `.trim(),
    },
    {
      id: 'nexuspay-double-spend',
      title: 'How we prevent double-spending',
      content: `
Double-spending is the nightmare scenario for any payment system. Two transfer requests arrive for the same source wallet within milliseconds. Both read the balance as €200. Both check: is €200 ≥ €150? Yes. Both debit €150. The balance becomes -€100. Money was created from nothing.

This is a classic **race condition**. It happens when two concurrent processes read shared state before either has written their result. In a single-process system with a mutex it is trivial to prevent. In a distributed system with multiple Node.js instances, a mutex on one instance does not protect against requests hitting a different instance.

**The solution: a distributed lock in Redis.**

When Transaction Service starts a transfer, it runs:

\`\`\`typescript
const acquired = await redis.set(
  \`lock:wallet:\${sourceWalletId}\`,
  transferId,
  'NX',   // only set if key does not exist
  'EX',   // set expiry
  30      // 30 seconds
);

if (!acquired) {
  throw new ConflictException('A transfer is already in progress for this wallet.');
}
\`\`\`

The \`NX\` flag is the key. Redis processes commands in a single thread. \`SET NX\` is atomic  -  there is no gap between "check if key exists" and "set the key." Two concurrent requests race to this command. One wins, one gets nil back. The loser returns 409.

The winner proceeds: read balance, check balance ≥ amount, publish debit command to RabbitMQ. In a \`finally\` block after the operation completes (or fails):

\`\`\`typescript
await redis.del(\`lock:wallet:\${sourceWalletId}\`);
\`\`\`

The 30-second TTL is a safety net. If the service crashes between acquiring the lock and releasing it  -  power cut, out of memory kill  -  the lock expires automatically after 30 seconds. Without the TTL, a crashed process would lock the wallet forever.

**Why not use a database transaction?** A \`SELECT FOR UPDATE\` in PostgreSQL would work within a single service instance. But our Wallet Service may run as multiple instances. The debit and credit happen in separate messages processed by potentially different instances. The Redis lock spans the entire Saga, not just a single database transaction.

**In an interview**, say: "We prevent double-spending with a Redis distributed lock using SET NX EX. NX means atomic check-and-set  -  only one request wins the lock. The EX ensures the lock auto-expires if the service crashes before releasing it. Two concurrent transfers on the same wallet: one gets 409, one proceeds. No race condition."
      `.trim(),
    },
    {
      id: 'nexuspay-gateway',
      title: 'The API Gateway  -  what it owns and what it does not',
      content: `
The API Gateway is the first thing every external request touches. Its role is specific and its boundaries are deliberately narrow.

**What the Gateway owns:**

**Authentication.** Every request must carry a valid JWT. The Gateway validates the token signature and expiry, checks the JWT blacklist in Redis, and attaches the decoded user payload to the request context. Services behind the Gateway trust this context  -  they do not re-validate tokens.

**Rate limiting.** 100 requests per minute per IP, enforced at the edge before any service processes the request. This prevents a single bad actor from exhausting downstream service resources.

**Routing.** \`POST /transactions\` routes to Transaction Service. \`GET /wallets/:id\` routes to Wallet Service. The Gateway is the single source of truth for the external API surface.

**CORS and request normalization.** Headers, allowed origins, and HTTP method policies are set once at the Gateway, not in every service.

**What the Gateway does not own:**

It has no database. It makes no business decisions. It does not know what a "valid transfer" looks like  -  that is Transaction Service's concern. It does not know the wallet balance  -  that is Wallet Service's concern.

Services behind the Gateway **do not** call each other through the Gateway. Inter-service communication goes directly through RabbitMQ or Kafka. Routing all inter-service traffic through the Gateway would make it a bottleneck and a single point of failure for internal operations.

**The evolution across phases:**

- Phase 1–3: The Gateway is an HTTP reverse proxy. Services expose REST endpoints and the Gateway forwards requests.
- Phase 4: Internal service-to-service calls migrate to gRPC. The Gateway still exposes REST externally, but when it needs data from multiple services to compose a response, it calls those services over gRPC instead of HTTP.
- Phase 5: The Gateway exposes a GraphQL endpoint. The client sends a single query specifying exactly what fields it needs. The Gateway resolves the query by calling the appropriate services  -  over gRPC  -  and assembles the response.

**In an interview**, say: "The API Gateway owns auth, rate limiting, and routing  -  nothing else. Services never call each other through the Gateway. Inter-service communication is always RabbitMQ or Kafka. The Gateway's job is to be the external contract, not the internal orchestrator."
      `.trim(),
    },
    {
      id: 'nexuspay-protocol-evolution',
      title: 'REST to gRPC to GraphQL  -  why the evolution',
      content: `
NexusPay went through three API protocol phases. Each phase solved a real problem the previous approach created.

**Phase 1–3: REST**

REST is the right starting point. Every developer knows it. Every HTTP client supports it. Postman, curl, browser devtools  -  the entire ecosystem works. For external-facing APIs that clients like mobile apps and web frontends consume, REST is hard to beat for simplicity and tooling.

But as NexusPay grew to seven services, internal REST calls started showing problems. Service A calls Service B's REST endpoint. Service B's schema changes  -  a field is renamed, a new required field is added. Service A breaks. The contract was implicit in JSON, not enforced at build time.

**Phase 4: gRPC for internal service calls**

gRPC uses **Protocol Buffers**  -  binary-encoded, strongly typed contracts defined in \`.proto\` files. Every field has a name, a type, and a field number. If Service B changes its contract, the \`.proto\` file changes, both services recompile, and mismatches are caught at compile time, not in production.

gRPC also uses HTTP/2, which supports multiplexed streams over a single connection. Multiple in-flight requests share one TCP connection. For high-frequency internal calls, the performance difference over HTTP/1.1 JSON is meaningful.

The trade-off: gRPC is not browser-compatible without a proxy. It is harder to debug than REST  -  you cannot just curl a gRPC endpoint. This is why we keep the external API as REST (or GraphQL) and use gRPC only for internal service-to-service calls where the latency and type safety benefits outweigh the debugging friction.

**Phase 5: GraphQL for the frontend dashboard**

The dashboard needs data from multiple services simultaneously: the user's profile, their wallet balance, their last 10 transactions, and their KYC status. With REST, the frontend makes four separate HTTP requests, or we build a dedicated endpoint that aggregates the data manually.

GraphQL lets the client define exactly the shape it needs in one request:

\`\`\`graphql
query Dashboard {
  me {
    name
    kycStatus
    wallet {
      balance
      currency
    }
    recentTransactions(limit: 10) {
      amount
      status
      createdAt
    }
  }
}
\`\`\`

The Gateway resolves each field by calling the appropriate service  -  over gRPC. The client gets exactly what it asked for, in one round trip, with no over-fetching.

**GraphQL subscriptions** push real-time updates to the frontend. When a transaction completes, the frontend's open WebSocket connection receives the updated balance immediately. No polling.

**In an interview**, say: "We started with REST because it is universal and easy to test. We added gRPC for internal service calls in Phase 4 because Protocol Buffers give us compile-time contract enforcement and better performance. We moved to GraphQL in Phase 5 for the dashboard because clients need data from multiple services in one request, and subscriptions give us real-time balance updates. Each choice solved a specific problem."
      `.trim(),
    },
    {
      id: 'nexuspay-notification-service',
      title: 'The Notification Service  -  how it knows when to fire',
      content: `
The Notification Service never initiates anything. It only reacts. This design choice is deliberate and it makes the service exceptionally easy to extend.

The service subscribes to RabbitMQ events across several exchanges. Here are the events it listens to:

- \`user.kyc.approved\` → "Your identity has been verified. Your wallet is ready."
- \`transaction.completed\` → "You sent €150 to Jane Doe. Remaining balance: €430."
- \`transaction.failed\` → "Your transfer of €150 could not be completed. No funds were moved."
- \`wallet.created\` → "Welcome to NexusPay. Your wallet is open."

For each event, the service maps the event type to a notification template and a channel. Some notifications go to email, some to SMS, some to push  -  based on the user's preferences stored in the User Service (fetched once and cached in Redis).

The critical design principle: **Notification Service knows nothing about why these events happen.** It does not know how KYC works. It does not know the Saga steps that led to \`transaction.completed\`. It just knows: "when this event arrives, send this message."

This is **loose coupling** in practice. When the Transaction team adds a new transaction type  -  say, a scheduled recurring payment  -  they publish a new event. The Notification team adds a handler for that event. No team modifies the other's service. No deployment coordination required.

Compare this to the alternative: Transaction Service calls \`NotificationService.send()\` directly. Now Transaction Service must import, configure, and depend on Notification Service. If Notification Service is down, Transaction Service's request fails. The services are coupled at runtime.

With RabbitMQ, Transaction Service publishes an event and continues. If Notification Service is down, the message waits in the queue. When it comes back, it processes the backlog. The payment flow is never blocked by a notification failure.

**Channels and routing:**

The Notification Service uses a strategy pattern internally. An \`EmailChannel\`, \`SmsChannel\`, and \`PushChannel\` each implement the same interface. The service selects channels based on user preferences and notification priority. A failed transaction triggers both email and SMS for high-value amounts. A KYC approval triggers only email.

**In an interview**, say: "Notification Service only listens  -  it never initiates. It subscribes to events on RabbitMQ and maps each event to a template and channel. Adding a new notification means adding a consumer, not modifying the publishing service. If Notification Service is down, messages queue in RabbitMQ and are processed when it recovers. The payment flow is never blocked."
      `.trim(),
    },
    {
      id: 'nexuspay-testing',
      title: 'Testing strategy: 85% coverage across 7 services',
      content: `
85% coverage across 7 NestJS services is not achieved by accident. It requires a deliberate strategy that puts tests where they create the most value  -  and skips tests that provide noise without signal.

**Unit tests  -  the foundation.**

Every use case class is unit tested in isolation. A use case like \`TransferFundsUseCase\` has dependencies: a wallet repository, a transaction repository, a RabbitMQ publisher, a Redis lock service. In unit tests, every dependency is a Jest mock.

We test the logic, not the infrastructure. "Given a valid source wallet with sufficient balance, \`execute()\` should publish \`transaction.debit.requested\`." "Given insufficient balance, it should throw \`InsufficientFundsException\`." These tests run in milliseconds with no external dependencies.

We do not unit test NestJS module configuration, controller routing, or Swagger decorators. These are framework behavior, not our logic. Testing them adds maintenance cost without finding bugs.

**Integration tests  -  where the real confidence lives.**

Each service has integration tests that run against a real PostgreSQL instance (spun up via Docker in CI) and a real Redis instance. We test the full request path from controller to database, but we mock external dependencies  -  RabbitMQ publishers, other services.

A transaction service integration test: create two wallets in the test database, call the transfer endpoint, assert the transaction record in the database has status \`PENDING\`, assert the mock RabbitMQ publisher was called with the correct payload.

**End-to-end tests  -  critical flows only.**

E2E tests are expensive. They require all services running, all databases seeded, all queues configured. We run them only for the three flows that matter most:

1. KYC approval → wallet creation (User Service → RabbitMQ → Wallet Service)
2. Successful transfer (Transaction Service → RabbitMQ → Wallet Service → Kafka)
3. Failed transfer with compensation (balance check fails → rollback → FAILED status)

**Why 85% and not 100%?**

The last 15% is configuration files, module bootstrapping, and DTOs with no logic. Testing that a \`@Module\` decorator has the right providers array finds zero bugs. It adds tests that break every time you add a new provider. 85% is the threshold where every meaningful logic path is covered.

**In an interview**, explain the testing pyramid: "Most tests are unit tests  -  fast, isolated, no infrastructure. Integration tests cover the database and Redis interactions with real instances via Docker. E2E tests cover the three most critical flows end-to-end. We target 85%  -  the remaining 15% is framework boilerplate where tests add maintenance overhead without catching real bugs."
      `.trim(),
    },
    {
      id: 'nexuspay-docker',
      title: 'Docker Compose: running 7 services locally',
      content: `
Being able to run the entire system locally is not just a convenience  -  it is proof that you understand how the system fits together. A developer who can only run one service at a time has never seen the full picture.

NexusPay's \`docker-compose.yml\` brings up the complete system with one command: \`docker compose up --build\`.

Here is what it starts:

- **7 NestJS services**  -  each built from its own Dockerfile, each with its own environment variables
- **7 PostgreSQL databases**  -  one per service, each initialized with a seed script
- **RabbitMQ**  -  with the management UI available on port 15672
- **Kafka + Zookeeper**  -  configured with the \`transactions.stream\` topic auto-created on startup
- **Redis**  -  single instance, available on port 6379

**Health checks and startup ordering** are critical. A NestJS service that starts before its PostgreSQL database is ready will crash on the first connection attempt. Docker Compose \`depends_on\` with \`condition: service_healthy\` handles this. Each database has a health check:

\`\`\`yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 5
\`\`\`

The service waits until the database passes this check before starting. No race conditions.

**Environment variables** are set per service in \`docker-compose.yml\`. Each service knows only its own database URL, its own RabbitMQ queue names, and its own Redis prefix. No service has credentials for another service's database.

**Named networks** isolate service communication. All services share a \`nexuspay-network\` bridge network. Services reference each other by their Compose service name: \`postgres-user-service:5432\`, \`redis:6379\`, \`rabbitmq:5672\`. No hardcoded IP addresses.

**Why this matters for interviews:**

Any interviewer can ask about architecture. Fewer candidates can say: "I spin up the complete system  -  7 services, 7 databases, RabbitMQ, Kafka, Redis  -  locally in one command and run the full E2E test suite against it." It signals that you operate what you build, not just write code.

**In an interview**, say: "Our Docker Compose file brings up the full system in one command. Services wait for their databases via health checks before starting. Each service has its own database container with separate credentials. I use this setup for local development and as the environment for our E2E test suite in CI."
      `.trim(),
    },
    {
      id: 'nexuspay-interview-qa',
      title: 'The questions interviewers will ask  -  and exactly what to say',
      content: `
These are the questions every interviewer asks about NexusPay, in order of frequency. For each one, here is exactly what to say.

---

**"Walk me through the architecture."**

"NexusPay is a fintech platform with 7 NestJS microservices in an Nx monorepo. All external traffic goes through the API Gateway, which handles authentication and rate limiting. The Gateway routes to six domain services  -  User, Wallet, Transaction, Notification, Analytics, and Payment Gateway. Each service owns its own PostgreSQL database. RabbitMQ carries directed commands between services  -  KYC approvals, wallet creation, transfer steps. Kafka carries event streams to the \`transactions.stream\` topic, where Analytics and Fraud Detection consume independently. Redis handles caching, rate limiting, distributed locks, and JWT blacklisting."

Stop there. Wait for the follow-up. You have given them four places to go deeper.

---

**"Why separate databases?"**

"Each service owns its data  -  bounded contexts from DDD. Schema changes in one service do not break others. Services can scale independently. If the Analytics database goes down, the payment flow keeps running. The cost is no cross-service JOINs, which we handle through events and data assembly at the Gateway. For a payment platform, the isolation is worth it."

---

**"How do you prevent double-spending?"**

"When a transfer starts, we run \`SET lock:wallet:{sourceId} NX EX 30\` in Redis. NX is atomic  -  only one request wins the lock. The loser gets 409. The 30-second TTL releases the lock if the service crashes. Without this, two concurrent requests could both read the same balance, both pass the balance check, and both debit  -  creating a negative balance."

---

**"What happens if the Wallet Service crashes mid-Saga?"**

"The RabbitMQ message is not acknowledged, so it stays in the queue. When Wallet Service restarts, it re-processes the message. Each Saga step is idempotent  -  we check if the operation was already applied before re-applying. The transaction stays PENDING in the database until either the Saga completes or a timeout watchdog marks it FAILED and publishes a compensation event."

---

**"Why both RabbitMQ and Kafka?"**

"RabbitMQ is for directed commands consumed once  -  create this wallet, send this notification. Messages are transient. Kafka is for event streams that multiple consumers need independently, and where replay matters. Analytics and Fraud Detection both read every transaction from Kafka in separate consumer groups. If Fraud Detection goes offline for two hours, it catches up by seeking to its last offset. That is impossible with RabbitMQ  -  it deletes messages after consumption."

---

**"How does the Notification Service know when to fire?"**

"It only listens  -  never initiates. It subscribes to RabbitMQ events: KYC approved, transaction completed, transaction failed, wallet created. Each event maps to a template and a channel. If Notification Service is down, messages queue and are processed when it recovers. The payment flow is never blocked by a notification failure."

---

**"What would you change if you had more time?"**

This is your chance to show architectural maturity. Say: "Three things. First, replace Zookeeper with KRaft for Kafka  -  Zookeeper adds operational complexity we do not need. Second, add an API Gateway BFF layer  -  a dedicated backend-for-frontend that aggregates service responses for the mobile app, separate from the web GraphQL schema. Third, add distributed tracing with OpenTelemetry across all services so we can see the full Saga flow in one trace in Jaeger."

---

**The meta-advice:**

Answer every question in 3–5 sentences. Name the specific technology. Give the trade-off. Stop talking. The interviewer who wants more depth will ask. The one who wants to move on will move on. Both are happy.
      `.trim(),
    },
  ],
};
