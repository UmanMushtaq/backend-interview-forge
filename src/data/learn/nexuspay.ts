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
Most backend portfolios are indistinguishable. A todo app. A blog API. A CRUD service with three tables. These projects do not demonstrate the skills that senior engineering roles actually require. They demonstrate that you can read documentation.

NexusPay was built to be different. It is a production-grade event-driven payment platform, and the entire point of building it was to prove one thing: that we can design, build, and operate the kind of distributed system that real fintech companies run.

**NexusPay** is a platform for wallet-to-wallet transfers with full KYC (Know Your Customer) verification, event-driven microservices communication, and multiple API protocol layers. It is not a demo. It processes transfers with real concurrency concerns, handles partial failures with compensating transactions, and streams every event to downstream services.

Here is the full tech stack:

\`\`\`
Runtime:        Node.js 20 LTS
Framework:      NestJS 10
Language:       TypeScript 5.3
Monorepo:       Nx 17
Databases:      PostgreSQL 16 (one per service) via TypeORM 0.3
Cache / locks:  Redis 7 via ioredis 5
Messaging:      RabbitMQ 3.12, Kafka 3.6 via @nestjs/microservices
API protocols:  REST (Phases 1-3), gRPC (Phase 4), GraphQL (Phase 5)
Testing:        Jest 29, Supertest 6
CI/CD:          GitHub Actions
Containers:     Docker, Docker Compose
\`\`\`

The project was delivered in five phases. Phase 1 built the foundation: User Service, Wallet Service, and Transaction Service with REST APIs and JWT authentication. Phase 2 added the RabbitMQ event bus and the KYC flow - when a user is approved, Wallet Service creates their wallet automatically. Phase 3 added the full transfer Saga with compensating transactions and Notification Service. Phase 4 replaced internal HTTP calls with gRPC using Protocol Buffers. Phase 5 added GraphQL at the Gateway with real-time subscriptions for balance updates.

What does this prove? It proves we can make and defend architectural decisions. Why RabbitMQ for commands and Kafka for streams? Why seven separate databases? Why gRPC for internal calls but GraphQL for the client? Every decision has a reason, and we know what it is.

In an interview, introduce NexusPay in under 30 seconds: "I built NexusPay - a production-grade payment platform with 7 NestJS microservices in an Nx monorepo, each with its own PostgreSQL database. RabbitMQ handles directed commands like KYC approval and wallet creation. Kafka handles event streaming to Analytics and Fraud Detection. Redis handles caching, rate limiting, distributed locks, and JWT blacklisting. I can walk you through any part of it in depth." Then stop and let them choose where to go.
      `.trim(),
    },
    {
      id: 'nexuspay-monorepo-structure',
      title: 'The Nx monorepo - how 7 services share code without coupling',
      content: `
When you have seven NestJS services, you immediately face a question that sounds simple but has real consequences: where do you put shared code? You could publish npm packages. You could copy types between services. You could have each service define its own version of everything. All of these create problems. The answer we chose for NexusPay is a monorepo.

A **monorepo** is a single Git repository that contains multiple projects - in our case, all 7 NestJS services and their shared libraries. The alternative is a polyrepo, where each service lives in its own repository. Polyrepos feel clean until you need to make a change that touches three services at once - then you have three pull requests, three CI runs, and a dependency hell where services can be temporarily out of sync with each other.

**Nx** is the tool that makes a monorepo practical at scale. It understands the dependency graph between your projects, so it can run only the builds and tests affected by a given change rather than running everything every time. Our monorepo has this structure:

\`\`\`
nexuspay/
├── apps/
│   ├── api-gateway/
│   │   └── src/
│   ├── user-service/
│   │   └── src/
│   ├── wallet-service/
│   │   └── src/
│   ├── transaction-service/
│   │   └── src/
│   ├── notification-service/
│   │   └── src/
│   ├── analytics-service/
│   │   └── src/
│   └── payment-gateway-service/
│       └── src/
├── libs/
│   └── shared/
│       ├── dtos/           <- request/response shapes
│       ├── events/         <- RabbitMQ and Kafka event payload types
│       ├── types/          <- enums like KycStatus, TransactionStatus
│       └── utils/          <- shared guards, interceptors, decorators
├── nx.json
└── package.json
\`\`\`

The \`libs/shared\` folder is where the real value lives. When Transaction Service publishes a \`transaction.completed\` event to Kafka, it does so with a TypeScript type defined in \`libs/shared/events\`. When Analytics Service consumes that event, it imports the same type. Both services agree on the exact shape of the payload, and TypeScript enforces it at compile time across the entire repo.

Here is what the shared event type looks like:

\`\`\`typescript
// libs/shared/events/src/transaction-events.ts
export interface TransactionCompletedEvent {
  transactionId: string;
  sourceWalletId: string;
  destinationWalletId: string;
  amount: string;          // string to avoid float precision loss
  currency: string;
  completedAt: string;     // ISO 8601
}
\`\`\`

The critical constraint is that \`libs/shared\` contains only types and utility code - never business logic, never database entities, never service-specific implementations. This keeps the shared layer thin. If Wallet Service's \`Wallet\` entity were in the shared library, every other service would depend on Wallet Service's database schema. Instead, each service owns its own entities entirely.

Nx enforces this boundary through **module boundary rules** in \`.eslintrc.json\`. We configure rules that prevent a service from importing from another service's source directly. Imports must go through the shared libraries. If a developer accidentally imports from \`apps/wallet-service/src\` inside \`apps/transaction-service/src\`, the linter fails the build.

\`\`\`json
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "depConstraints": [
        {
          "sourceTag": "type:app",
          "onlyDependOnLibsWithTags": ["type:shared-lib"]
        }
      ]
    }
  ]
}
\`\`\`

When Nx runs a build or test command, it first builds a dependency graph of the entire workspace. If you change a file in \`libs/shared/events\`, Nx knows that every service depends on it and reruns all of them. If you only change a file in \`apps/user-service\`, Nx runs only the user-service build and tests. This keeps CI fast even as the codebase grows.

In an interview, when asked about the monorepo setup, say: "We use Nx, which gives us two things: a single source of truth for shared TypeScript types - event payloads, DTOs, enums - and affected builds in CI so we only test what changed. Module boundary rules in ESLint prevent services from importing each other's source directly. If the Transaction Service needs to know about KycStatus, it imports it from the shared library, not from the User Service."
      `.trim(),
    },
    {
      id: 'nexuspay-architecture',
      title: 'The architecture in one mental model',
      content: `
The hardest thing about explaining a complex system is knowing where to start. If you start with the databases, you lose the listener before the interesting parts. If you start with the messaging layer, there is no context for why it exists. The right place to start is the boundary - the single point where everything external enters the system.

**The API Gateway** is that boundary. Every HTTP request from a mobile app, web browser, or third-party integration goes through the Gateway first. It validates JWTs, enforces rate limits, and routes requests to the right downstream service. It contains no business logic and owns no database. It is a traffic director, not a decision maker.

Behind the Gateway live six domain services. Each one owns a specific business capability: **User Service** manages identities and KYC, **Wallet Service** manages balances, **Transaction Service** orchestrates transfers, **Notification Service** sends messages to users, **Analytics Service** builds read-optimised views of transaction data, and **Payment Gateway Service** integrates with external providers like Stripe.

Services communicate in two ways. The first is **RabbitMQ** for directed commands and notifications - messages that go to one specific consumer. When the User Service approves a KYC submission, it publishes to RabbitMQ and Wallet Service creates the wallet. The message is consumed once and gone. The second is **Kafka** for persistent event streams - events that multiple consumers need, possibly at different times. Every completed transaction goes to Kafka's \`transactions.stream\` topic where Analytics Service and Fraud Detection read it independently through separate consumer groups.

**Redis** is the cross-cutting fast layer. Every service that needs caching, rate limiting, distributed locks, or JWT blacklisting reaches for Redis. It is not a service - it is infrastructure that all services share.

\`\`\`
External Client (web / mobile / API)
         │
         ▼
    API Gateway  ← JWT validation, rate limiting, routing
         │
    ┌────┼──────────────────────┐
    ▼    ▼                      ▼
User    Transaction     Payment Gateway
Service  Service         Service
    │       │
    │  RabbitMQ ──────────────────────┐
    │  (commands)                     ▼
    │                          Wallet Service
    │                                 │
    │                          RabbitMQ ──► Notification Service
    │
    └── Kafka (transactions.stream)
              ├──► Analytics Service
              └──► Fraud Detection

Redis ←── all services (cache · locks · rate limits · JWT blacklist)
\`\`\`

The most important property of this architecture is that no service calls another service directly over HTTP. Inter-service communication always goes through RabbitMQ or Kafka. This means if Notification Service goes down, payment processing keeps running. Messages accumulate in the queue and are delivered when Notification Service recovers. The failure scope is limited to the failed service.

In an interview, draw this on a whiteboard starting with the API Gateway as the single external entry point. Name the six services. Draw RabbitMQ as the command bus and Kafka as the event stream. Add Redis as a horizontal layer across everything. Say: "Every service has its own PostgreSQL database. No shared tables, no shared schemas. I can explain the bounded context reasoning if you want to go deeper there."
      `.trim(),
    },
    {
      id: 'nexuspay-bounded-contexts',
      title: 'Why 7 separate databases - the bounded context principle',
      content: `
When you build your first multi-service system, the most tempting shortcut is to use one shared database. The reasoning makes sense on the surface: you avoid data duplication, you can JOIN across services, and you only have one migration to run. But this shortcut becomes a serious liability the moment the system needs to change.

Imagine User Service and Wallet Service both read from a shared \`users\` table. The Wallet team needs to add an \`average_balance\` column to understand spending patterns. They add it to the shared table. Now every other service that reads from \`users\` sees this new column in their query results. Their TypeORM entities are out of sync. Their tests break. What looked like a Wallet Service change is actually a cross-system change.

**Bounded contexts** are the solution. A bounded context is a clear boundary around a domain model where terms and data have specific, consistent meanings. Inside the User Service, a "user" has an identity, an email, a KYC status, and a role. Inside the Wallet Service, a "user" is just an ID that a wallet belongs to. These are different models of the same real-world concept, and that is intentional.

Here is what the User entity looks like inside User Service:

\`\`\`typescript
// apps/user-service/src/users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NONE })
  kycStatus: KycStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
\`\`\`

And here is the Wallet entity inside Wallet Service. Notice it has a \`userId\` column but no relationship to any User entity from User Service. It does not import from User Service at all.

\`\`\`typescript
// apps/wallet-service/src/wallets/entities/wallet.entity.ts
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  userId: string;          // just a UUID, no foreign key to User Service

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0.00' })
  balance: string;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @VersionColumn()
  version: number;         // for optimistic locking

  @CreateDateColumn()
  createdAt: Date;
}
\`\`\`

When Wallet Service needs to know that a user was KYC-approved, it does not query the User Service database. It listens for a \`user.kyc.approved\` event on RabbitMQ. The event contains just the \`userId\`. Wallet Service creates the wallet with that ID and never looks up anything else about the user.

This boundary gives us three concrete properties. Independent deployability - we can deploy Wallet Service with a schema migration and User Service never knows it happened. Independent scalability - Transaction Service handles high write volume, so we can add read replicas or tune PostgreSQL for its specific workload without touching any other service's database. Failure isolation - if the Analytics database goes down, the core payment flow keeps running.

The cost is real. We cannot do a JOIN across service boundaries. To get a user's profile alongside their wallet balance, we need two separate queries assembled by the API Gateway. For a payment platform where data integrity and independent deployability matter more than query convenience, this trade-off is correct.

In an interview, say: "Each service owns its data - that is the bounded context principle. Wallet Service has a userId column that is just a UUID, with no foreign key or ORM relationship pointing at User Service. When Wallet Service needs to react to something that happened in User Service, it does so through events on RabbitMQ, not through a shared table. The cost is no cross-service JOINs. For a payment platform, that is the right trade-off."
      `.trim(),
    },
    {
      id: 'nexuspay-kyc-flow',
      title: 'The KYC flow end to end',
      content: `
KYC stands for Know Your Customer. It is a legal requirement for any financial platform that handles real money. Before a user can send or receive transfers, we need to verify their identity. This sounds like a simple feature until you think through the implementation: the verification involves human review, which is asynchronous by nature and could take minutes or hours. You cannot hold an HTTP connection open while a compliance officer looks at a passport scan.

The NexusPay KYC flow involves three services and two messaging steps. Here is the complete sequence.

A user submits their identity documents via \`POST /users/:id/kyc\`. The API Gateway validates their JWT and forwards the request to User Service. The controller looks like this:

\`\`\`typescript
// apps/user-service/src/users/users.controller.ts
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':id/kyc')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitKyc(
    @Param('id') userId: string,
    @Body() dto: SubmitKycDto,
    @CurrentUser() requestingUser: JwtPayload,
  ): Promise<{ message: string }> {
    if (requestingUser.sub !== userId) {
      throw new ForbiddenException('You can only submit KYC for your own account');
    }
    await this.usersService.submitKyc(userId, dto);
    return { message: 'KYC submission received. Review is in progress.' };
  }

  @Patch(':id/kyc/approve')
  @Roles('admin')
  async approveKyc(@Param('id') userId: string): Promise<User> {
    return this.usersService.approveKyc(userId);
  }
}
\`\`\`

The key detail is the 202 Accepted response code. This tells the client: "We received your submission and it is being processed, but it is not done yet." A 200 OK would imply the operation completed synchronously, which would be misleading.

When an admin calls the approve endpoint, User Service updates the database and then publishes an event to RabbitMQ:

\`\`\`typescript
// apps/user-service/src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject('EVENTS_SERVICE')
    private readonly eventsClient: ClientProxy,
  ) {}

  async approveKyc(userId: string): Promise<User> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (user.kycStatus !== KycStatus.PENDING) {
      throw new BadRequestException('User is not in PENDING KYC status');
    }

    user.kycStatus = KycStatus.APPROVED;
    const saved = await this.userRepo.save(user);

    // Publish after the database write succeeds
    this.eventsClient.emit<void, UserKycApprovedEvent>('user.kyc.approved', {
      userId: saved.id,
      approvedAt: new Date().toISOString(),
    });

    return saved;
  }
}
\`\`\`

Notice that the event is emitted after the database write succeeds. If the database write fails, we never publish the event. This prevents the case where Wallet Service creates a wallet for a user whose KYC approval was never actually saved.

On the other side, Wallet Service is running as a RabbitMQ microservice, listening for this exact event:

\`\`\`typescript
// apps/wallet-service/src/wallets/wallets.controller.ts
@Controller()
export class WalletsMicroserviceController {
  constructor(private readonly walletsService: WalletsService) {}

  @EventPattern('user.kyc.approved')
  async handleKycApproved(
    @Payload() data: UserKycApprovedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      await this.walletsService.createWallet(data.userId);
      channel.ack(message);  // acknowledge only on success
    } catch (error) {
      // nack without requeue if wallet already exists (idempotency)
      const alreadyExists = error instanceof ConflictException;
      channel.nack(message, false, !alreadyExists);
    }
  }
}
\`\`\`

The \`@EventPattern\` decorator registers this method as a subscriber to the \`user.kyc.approved\` pattern. The explicit \`ack\` and \`nack\` calls are why we configure RabbitMQ with \`noAck: false\` in the microservice options. If \`createWallet\` throws, we \`nack\` the message and RabbitMQ redelivers it. If the wallet already exists (which means we already processed this event), we \`nack\` without requeue to avoid an infinite retry loop.

Notification Service subscribes to the same exchange with a different binding and independently sends the user a confirmation email. User Service published once, two services reacted independently.

In an interview, explain this flow clearly and point to the 202 status code decision: "KYC approval is asynchronous, so we return 202 Accepted immediately. The admin approval writes to the database first and only publishes to RabbitMQ after the write succeeds, preventing phantom events. The Wallet Service consumer uses manual acknowledgement so if createWallet fails, the message is redelivered. We also handle the duplicate case explicitly so a retry does not create two wallets."
      `.trim(),
    },
    {
      id: 'nexuspay-rabbitmq-decision',
      title: 'Why RabbitMQ for KYC and not Kafka',
      content: `
When you have both RabbitMQ and Kafka in the same system, every team member will eventually ask: why do we have two messaging systems? Could we not just use one? The question is fair, and the answer reveals one of the most important distinctions in distributed systems design.

The fundamental difference is not performance or even reliability. It is the question of what kind of communication you are doing. Are you sending a **command** - an instruction for a specific service to do a specific thing? Or are you publishing an **event** - an announcement that something happened, for any interested party to react to in whatever way makes sense to them?

RabbitMQ is built for commands. A message goes into a queue, one consumer picks it up, processes it, and the message is gone. This is exactly right for KYC approval. When a user is approved, we are not announcing a fact to the world. We are sending an instruction: "Wallet Service, create a wallet for this user." The message has one intended consumer. Once Wallet Service creates the wallet, there is nothing left to do with that message.

Kafka is built for events. A message goes into a topic partition and stays there until the retention period expires. Every consumer group maintains its own offset - its own position in the log. Consumer A reads at its own pace, Consumer B reads at its own pace, and neither affects the other. This is exactly right for transaction completion events, where Analytics Service and Fraud Detection both need every event, possibly at different times.

Here is a direct comparison for every use case in NexusPay:

\`\`\`
Use case                        RabbitMQ or Kafka?   Reason
------------------------------  -------------------  ---------------------------------
KYC approved → create wallet    RabbitMQ             Directed command, one consumer,
                                                     transient after processing

KYC approved → send email       RabbitMQ             Directed command, one consumer
(Notification Service)          (separate binding)   (fan-out routing on same exchange)

Transfer → debit wallet         RabbitMQ             Saga step, directed to one
                                                     specific service, transient

Transfer completed →            Kafka                Multiple independent consumers,
  Analytics, Fraud Detection                         replay needed if consumer offline

Payment provider webhook →      RabbitMQ             Directed to Transaction Service
  confirm transaction                                for status update, one consumer
\`\`\`

A common interview follow-up is: "Could you have used Kafka for the KYC flow too?" The honest answer is yes, but it would be wrong for the job. Using Kafka for KYC commands means setting up a separate consumer group for every service that needs the event, managing offsets, and dealing with the fact that messages are retained even after every consumer has processed them. You are using a persistent event log where you want a transient command queue. The tool does not fit the use case.

There is also a practical reliability argument for RabbitMQ on commands. RabbitMQ has sophisticated routing logic - direct, fanout, topic, and header exchanges let you route messages precisely. It has built-in dead-letter queues for messages that fail processing. Its acknowledgement model (explicit ack/nack per message) integrates naturally with transactional processing.

In an interview, say: "I chose RabbitMQ for commands and Kafka for events. RabbitMQ is for messages that go to a specific service, are consumed once, and can be discarded after processing. Kafka is for events that multiple consumers need independently, where replay matters, and where we might add new consumers in the future without touching the publisher. The KYC approval message is a command - create this wallet now. The transaction completion event is a fact that Analytics, Fraud Detection, and any future compliance service all need to know about."
      `.trim(),
    },
    {
      id: 'nexuspay-saga-flow',
      title: 'The transfer Saga flow end to end',
      content: `
A bank transfer looks simple: subtract from one account, add to another. But in a distributed system with separate services, those two operations happen in different places, possibly processed by different server instances, with a messaging system in between them. If anything fails after the subtract but before the add, you have an inconsistency. The user lost money but it never arrived anywhere.

The solution is the **Saga pattern**. A Saga is a sequence of local transactions, where each step publishes an event that triggers the next step. If any step fails, the Saga executes **compensating transactions** - operations that undo the completed steps. In NexusPay, the transfer Saga has six happy-path steps and a failure path with compensation.

Here is the Saga from start to finish. The client calls \`POST /transactions\` on the API Gateway, which routes to Transaction Service. Transaction Service is the Saga orchestrator.

\`\`\`typescript
// apps/transaction-service/src/transactions/transactions.service.ts
@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @Inject('WALLET_EVENTS')
    private readonly walletClient: ClientProxy,
    private readonly lockService: DistributedLockService,
  ) {}

  async initiateTransfer(dto: CreateTransferDto): Promise<Transaction> {
    return this.lockService.withLock(
      \`transfer:source:\${dto.sourceWalletId}\`,
      30,
      async () => {
        // Save PENDING first - we have a record even if we crash here
        const tx = this.txRepo.create({
          sourceWalletId: dto.sourceWalletId,
          destinationWalletId: dto.destinationWalletId,
          amount: dto.amount,
          currency: dto.currency,
          status: TransactionStatus.PENDING,
        });
        const saved = await this.txRepo.save(tx);

        // Fire the first Saga step
        this.walletClient.emit<void, DebitRequestedEvent>('transaction.debit.requested', {
          transactionId: saved.id,
          walletId: dto.sourceWalletId,
          amount: dto.amount,
        });

        return saved;
      },
    );
  }
}
\`\`\`

Wallet Service picks up the debit request, checks the balance, and either succeeds or fails:

\`\`\`typescript
// apps/wallet-service/src/wallets/wallets.controller.ts
@EventPattern('transaction.debit.requested')
async handleDebitRequested(
  @Payload() data: DebitRequestedEvent,
  @Ctx() context: RmqContext,
): Promise<void> {
  const channel = context.getChannelRef();
  const message = context.getMessage();

  try {
    await this.walletsService.debit(data.walletId, data.amount, data.transactionId);
    this.eventsClient.emit('wallet.debited', {
      transactionId: data.transactionId,
      walletId: data.walletId,
    });
    channel.ack(message);
  } catch (error) {
    if (error instanceof InsufficientFundsException) {
      // Business failure - do not retry, compensate instead
      this.eventsClient.emit('wallet.debit.failed', {
        transactionId: data.transactionId,
        reason: 'insufficient_funds',
      });
      channel.nack(message, false, false);  // nack, no requeue
    } else {
      // Transient failure - requeue for retry
      channel.nack(message, false, true);
    }
  }
}
\`\`\`

This distinction between business failures and transient failures is critical. An \`InsufficientFundsException\` is not a bug - it is a valid business outcome. Requeuing it would cause an infinite retry loop. We \`nack\` without requeue and publish a failure event so Transaction Service can mark the transaction as FAILED and release the Redis lock.

When the debit succeeds, Transaction Service receives \`wallet.debited\` and issues the credit:

\`\`\`typescript
@EventPattern('wallet.debited')
async handleWalletDebited(@Payload() data: WalletDebitedEvent): Promise<void> {
  // Issue the credit step
  this.walletClient.emit('transaction.credit.requested', {
    transactionId: data.transactionId,
    walletId: data.destinationWalletId,
    amount: data.amount,
  });
}

@EventPattern('wallet.credited')
async handleWalletCredited(@Payload() data: WalletCreditedEvent): Promise<void> {
  // Saga complete - update status and publish to Kafka
  await this.txRepo.update(
    { id: data.transactionId },
    { status: TransactionStatus.COMPLETED },
  );
  this.kafkaClient.emit('transactions.stream', {
    key: data.transactionId,
    value: { transactionId: data.transactionId, status: 'COMPLETED', ... } as TransactionCompletedEvent,
  });
}

@EventPattern('wallet.debit.failed')
async handleDebitFailed(@Payload() data: DebitFailedEvent): Promise<void> {
  // Compensate - mark failed, release lock
  await this.txRepo.update(
    { id: data.transactionId },
    { status: TransactionStatus.FAILED, failureReason: data.reason },
  );
  await this.lockService.releaseLock(\`transfer:source:\${data.sourceWalletId}\`);
}
\`\`\`

The Saga's guarantee is not that all steps always succeed. It is that either all steps succeed, or the completed steps are undone. In the failure path, the debit is not reversed - it was never applied because we nacked without requeue. The lock is released. The transaction is marked FAILED. The user's balance is unchanged.

In an interview, the hardest question here is: "What happens if Transaction Service crashes after the debit but before it processes wallet.debited?" Answer: "The RabbitMQ message is still in the queue because it was not acknowledged. When Transaction Service restarts, it redelivers the message. Transaction Service checks if the credit was already issued using the transactionId, and if so, skips the duplicate. Each step is idempotent - applying it twice has the same result as applying it once."
      `.trim(),
    },
    {
      id: 'nexuspay-kafka-decision',
      title: 'Why Kafka for transaction events and not RabbitMQ',
      content: `
After a transfer completes, we publish to both RabbitMQ (for the Notification Service) and Kafka (for Analytics and Fraud Detection). A common question is why we need Kafka at all. The answer comes down to one property that Kafka has and RabbitMQ does not: message retention.

RabbitMQ deletes messages after they are consumed. If Analytics Service is down for two hours during a deployment, it misses every transaction event that occurred in that window. When it comes back online, those events are gone. Kafka, by contrast, retains messages in the log until the retention period expires - we configure 7 days. When Analytics Service comes back, it seeks to its last committed offset and replays every event it missed.

The second reason is independent consumption. In Kafka, each **consumer group** maintains its own offset - its own position in the log. Analytics Service and Fraud Detection both read every event from \`transactions.stream\`, but they do so independently. Neither knows the other exists. Neither affects the other's position. Adding Fraud Detection to the system required zero changes to Transaction Service.

Here is how Analytics Service consumes the Kafka stream using \`@nestjs/microservices\`:

\`\`\`typescript
// apps/analytics-service/src/main.ts
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AnalyticsModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
        },
        consumer: {
          groupId: 'analytics-service',  // unique per service
        },
      },
    },
  );
  await app.listen();
}
\`\`\`

\`\`\`typescript
// apps/analytics-service/src/analytics/analytics.controller.ts
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern('transactions.stream')
  async handleTransactionEvent(
    @Payload() message: TransactionCompletedEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const { offset, partition, topic } = context.getMessage();

    try {
      await this.analyticsService.recordTransaction(message);
      // Kafka offset commit happens automatically via autoCommit
    } catch (error) {
      // Log with context so we can investigate stuck consumers
      this.logger.error('Failed to process transaction event', {
        offset,
        partition,
        transactionId: message.transactionId,
        error: error.message,
      });
      // Do not throw - let the consumer continue to the next message
      // Failed events go to the dead-letter topic configured in Kafka
    }
  }
}
\`\`\`

Inside the analytics service, we maintain a read-optimised table for fast aggregation queries:

\`\`\`typescript
// apps/analytics-service/src/analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(TransactionSummary)
    private readonly summaryRepo: Repository<TransactionSummary>,
  ) {}

  async recordTransaction(event: TransactionCompletedEvent): Promise<void> {
    const dateKey = event.completedAt.substring(0, 10); // 'YYYY-MM-DD'

    await this.summaryRepo
      .createQueryBuilder()
      .insert()
      .into(TransactionSummary)
      .values({
        dateKey,
        currency: event.currency,
        transactionCount: 1,
        totalVolume: event.amount,
      })
      .onConflict(
        '("dateKey", "currency") DO UPDATE SET ' +
        '"transactionCount" = "TransactionSummary"."transactionCount" + 1, ' +
        '"totalVolume" = "TransactionSummary"."totalVolume" + EXCLUDED."totalVolume"',
      )
      .execute();
  }
}
\`\`\`

The upsert pattern here is important. If Analytics Service processes the same event twice (due to a crash before the offset was committed), the \`ON CONFLICT\` clause ensures the row is updated, not duplicated. This makes the consumer **idempotent**.

In an interview, say: "I use Kafka for transaction events because multiple downstream services need the same event independently. RabbitMQ deletes a message after consumption. Kafka retains it. If Analytics Service is down for two hours, it seeks to its last offset when it comes back and replays everything it missed. Each service has its own consumer group with its own offset - adding Fraud Detection required zero changes to Transaction Service."
      `.trim(),
    },
    {
      id: 'nexuspay-redis',
      title: 'Redis: four jobs, one tool',
      content: `
Redis is often described as a cache. That is accurate but incomplete. In NexusPay, Redis plays four distinct roles, and understanding each one separately is important because they use different Redis primitives and have different failure implications.

**Job 1: User profile caching**

Every authenticated request needs the user's profile to check permissions and KYC status. Without caching, that is a database query on every single request. The API Gateway handles hundreds of requests per second, and most of them are from the same active users. Caching their profiles reduces Database load dramatically.

\`\`\`typescript
// apps/user-service/src/users/users.service.ts
@Injectable()
export class UsersService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async findById(id: string): Promise<User> {
    const cacheKey = \`user:\${id}\`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as User;

    const user = await this.userRepo.findOneOrFail({ where: { id } });
    await this.redis.set(cacheKey, JSON.stringify(user), 'EX', this.CACHE_TTL);
    return user;
  }

  async invalidateCache(id: string): Promise<void> {
    await this.redis.del(\`user:\${id}\`);
  }
}
\`\`\`

When a user updates their profile or their KYC status changes, we call \`invalidateCache\` immediately so the stale data cannot persist for the full 5 minutes.

**Job 2: Rate limiting**

The API Gateway enforces 100 requests per minute per IP address using Redis's atomic increment commands:

\`\`\`typescript
// apps/api-gateway/src/guards/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const minute = Math.floor(Date.now() / 60000);
    const key = \`rate:\${ip}:\${minute}\`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      // First request in this window - set expiry
      await this.redis.expire(key, 60);
    }

    if (count > 100) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
\`\`\`

The \`INCR\` command is atomic in Redis. Two concurrent requests incrementing the same key will always produce two different values - 1 and 2 - never both producing 1. This is the property that makes Redis suitable for rate limiting where a database or in-memory counter would fail under concurrency.

**Job 3: Distributed lock for wallet operations**

This is covered in depth in the double-spend lesson. The short version: before any wallet debit, we acquire a Redis lock using \`SET NX EX\` to prevent two simultaneous transfers from reading the same balance and both passing the check.

**Job 4: JWT blacklisting**

When a user logs out, their JWT remains cryptographically valid until it expires. Without blacklisting, a stolen token remains usable for up to 15 minutes. We fix this by storing revoked token IDs in Redis:

\`\`\`typescript
// apps/api-gateway/src/auth/auth.service.ts
async logout(userId: string, jti: string, expiresAt: number): Promise<void> {
  const ttl = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
  if (ttl > 0) {
    await this.redis.set(\`blacklist:\${jti}\`, '1', 'EX', ttl);
  }
}
\`\`\`

\`\`\`typescript
// apps/api-gateway/src/auth/jwt.strategy.ts
async validate(payload: JwtPayload): Promise<RequestUser> {
  const isBlacklisted = await this.redis.exists(\`blacklist:\${payload.jti}\`);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token has been revoked');
  }
  return { id: payload.sub, email: payload.email, role: payload.role };
}
\`\`\`

The TTL on the blacklist entry equals the token's remaining lifetime. Once the token would have expired anyway, the Redis key expires too. We never accumulate stale blacklist entries.

In an interview, never just say "we use Redis for caching." Say: "Redis plays four roles in NexusPay. Profile caching with a 5-minute TTL reduces database load on every authenticated request. Fixed-window rate limiting using atomic INCR prevents abuse at the edge. Distributed locks using SET NX EX prevent double-spending across multiple service instances. JWT blacklisting by JTI on logout prevents stolen token reuse. Each use case needs atomic operations and sub-millisecond latency that a relational database cannot provide."
      `.trim(),
    },
    {
      id: 'nexuspay-double-spend',
      title: 'How we prevent double-spending',
      content: `
Double-spending is the scenario where a user manages to spend the same funds twice. In a single-process application, a simple database transaction prevents this. In a distributed system with multiple service instances and asynchronous messaging, the problem is more subtle.

Consider this scenario: two transfer requests arrive for wallet A within milliseconds. Both reach different instances of Transaction Service simultaneously. Both query Wallet Service for the current balance - say, 200 EUR. Both check: is 200 EUR sufficient for a 150 EUR transfer? Both pass the check. Both publish a debit request to RabbitMQ. Wallet Service processes both. Balance goes to -100 EUR.

The database alone does not protect us here because the balance check and the debit happen in separate services across separate messages. We need something that spans the entire operation.

The answer is a **distributed lock** - a mutex that works across multiple processes and machines using Redis as the coordination point. Here is our \`DistributedLockService\`:

\`\`\`typescript
// libs/shared/utils/src/distributed-lock.service.ts
@Injectable()
export class DistributedLockService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async withLock<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const lockKey = \`lock:\${key}\`;
    const lockValue = crypto.randomUUID(); // unique value to identify our lock

    // SET NX EX - only set if not exists, with expiry
    const acquired = await this.redis.set(
      lockKey,
      lockValue,
      'NX',
      'EX',
      ttlSeconds,
    );

    if (!acquired) {
      throw new ConflictException(
        \`Operation already in progress for \${key}\`,
      );
    }

    try {
      return await fn();
    } finally {
      // Only delete if we still own the lock
      // Uses a Lua script for atomic check-and-delete
      await this.redis.eval(
        \`if redis.call("get", KEYS[1]) == ARGV[1] then
           return redis.call("del", KEYS[1])
         else
           return 0
         end\`,
        1,
        lockKey,
        lockValue,
      );
    }
  }
}
\`\`\`

Several details in this implementation matter. The \`NX\` flag makes the SET atomic - there is no gap between "check if key exists" and "set the key." Redis processes commands in a single thread, so \`SET NX\` is guaranteed to have only one winner across any number of concurrent callers.

The lock value is a random UUID, not a static string. This matters in the \`finally\` block: before deleting the key, we verify we still own it using a Lua script. Without this check, the following race condition is possible: our operation takes longer than \`ttlSeconds\`, the lock expires, another process acquires it, then our \`finally\` block runs and deletes the other process's lock. The Lua script runs atomically - check and delete happen together with no gap between them.

The TTL is the safety net. If our service crashes between \`acquired\` and the \`finally\` block, the lock expires automatically after \`ttlSeconds\`. Without the TTL, a crashed service would leave a permanent lock and that wallet could never be used again.

Here is how Transaction Service uses this:

\`\`\`typescript
async initiateTransfer(dto: CreateTransferDto): Promise<Transaction> {
  return this.lockService.withLock(
    \`wallet:\${dto.sourceWalletId}\`,
    30,  // 30 second TTL
    async () => {
      // Everything inside here is protected from concurrent access
      const transaction = await this.createPendingTransaction(dto);
      await this.publishDebitRequest(transaction);
      return transaction;
    },
  );
}
\`\`\`

The two simultaneous transfer requests we described at the start both race to the \`SET NX\` call. One wins, the other gets \`null\` back and immediately receives a 409 Conflict. There is no way for both to proceed.

In an interview, say: "We prevent double-spending with a distributed lock in Redis using SET NX EX. NX makes it atomic - only one caller wins. The lock value is a UUID, and we release it with a Lua script that checks we still own it before deleting, preventing a race where an expired lock gets re-acquired by another process just before our finally block runs. The TTL is the safety net: if the service crashes, the lock auto-expires after 30 seconds and the wallet is not permanently blocked."
      `.trim(),
    },
    {
      id: 'nexuspay-auth-flow',
      title: 'JWT authentication - the full flow from login to protected route',
      content: `
Authentication is one of those features that feels simple until you think through every edge case. How do tokens get revoked before they expire? How do you keep users logged in without compromising security? What happens to a valid token after the user changes their password?

NexusPay uses a two-token authentication system. A **JWT** - JSON Web Token - is a digitally signed token containing encoded claims about the user, with three parts: a header describing the algorithm, a payload containing the claims, and a signature that proves the token was issued by our server. JWTs are stateless - the server does not need a database lookup to validate one, because the signature proves authenticity. This is fast, but it means a JWT remains valid until it expires even if we want to invalidate it early.

A **refresh token** is a long-lived opaque token stored in the database. When the short-lived JWT expires (after 15 minutes), the client sends the refresh token to get a new JWT. This lets us genuinely revoke access by deleting the refresh token from the database.

Here is the full login flow:

\`\`\`typescript
// apps/api-gateway/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersClient: ClientProxy,
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    // Call User Service via RabbitMQ to validate credentials
    const user = await firstValueFrom(
      this.usersClient.send<User>('users.validate-credentials', { email, password }),
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const jti = crypto.randomUUID(); // unique token ID for blacklisting
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti },
      { expiresIn: '15m' },
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.refreshTokenRepo.save({
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt,
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  async refreshTokens(rawRefreshToken: string): Promise<LoginResponse> {
    // Find all non-expired tokens and check each hash
    // (better: store a prefix to narrow the search)
    const records = await this.refreshTokenRepo.find({
      where: { expiresAt: MoreThan(new Date()) },
    });
    const record = await this.findValidRecord(records, rawRefreshToken);
    if (!record) throw new UnauthorizedException('Invalid or expired refresh token');

    // Rotate: delete old token, issue new pair
    await this.refreshTokenRepo.delete(record.id);
    return this.issueTokenPair(record.userId);
  }

  async logout(userId: string, jti: string, jwtExpiresAt: number): Promise<void> {
    const ttl = Math.max(0, jwtExpiresAt - Math.floor(Date.now() / 1000));
    if (ttl > 0) {
      await this.redis.set(\`blacklist:\${jti}\`, '1', 'EX', ttl);
    }
    await this.refreshTokenRepo.delete({ userId });
  }
}
\`\`\`

The JwtStrategy runs on every protected request. It validates the token signature, checks the blacklist, and attaches the decoded user to the request:

\`\`\`typescript
// apps/api-gateway/src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const isBlacklisted = await this.redis.exists(\`blacklist:\${payload.jti}\`);
    if (isBlacklisted) throw new UnauthorizedException('Token has been revoked');

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
\`\`\`

The JwtAuthGuard is applied globally on the API Gateway using a NestJS APP_GUARD provider. Individual routes that do not require authentication - the login and registration endpoints - are decorated with \`@Public()\`:

\`\`\`typescript
// apps/api-gateway/src/app.module.ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
],

// In the controller:
@Public()
@Post('auth/login')
async login(@Body() dto: LoginDto) { ... }
\`\`\`

**Refresh token rotation** is the security property that limits the damage from a stolen refresh token. Each time a refresh token is used, it is deleted and a new one is issued. If an attacker steals a refresh token and uses it, the legitimate user's next refresh attempt will fail (their token is already deleted). We detect the anomaly and can revoke all of the user's sessions.

In an interview, explain the two-token design clearly: "Short-lived JWTs expire in 15 minutes so a stolen access token has limited utility. Refresh tokens are long-lived but stored in the database and rotated on every use. Logout blacklists the JWT's JTI in Redis for its remaining lifetime. Together these give us stateless performance on the hot path and genuine revocation when we need it."
      `.trim(),
    },
    {
      id: 'nexuspay-gateway',
      title: 'The API Gateway - what it owns and what it does not',
      content: `
The API Gateway is the most visible part of NexusPay from the outside, but it is deliberately thin on the inside. Its job is to be a trusted enforcer at the border - validating credentials, applying limits, and directing traffic. The moment it starts making business decisions, it becomes a bottleneck and a coupling point.

Here is what the Gateway module structure looks like:

\`\`\`typescript
// apps/api-gateway/src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    // RabbitMQ client for auth operations (validate credentials, etc.)
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow('RABBITMQ_URL')],
            queue: 'user_service_queue',
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    RedisModule,
    AuthModule,
    ProxyModule,   // routes to downstream services
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
\`\`\`

The \`APP_GUARD\` providers apply globally to every route. \`JwtAuthGuard\` runs first: it validates the JWT and populates \`request.user\`. \`RolesGuard\` runs second: if a route has a \`@Roles('admin')\` decorator, it checks the user's role. Routes decorated with \`@Public()\` skip the \`JwtAuthGuard\` entirely.

The Gateway does not import from any downstream service's codebase. It communicates with downstream services in two ways. For synchronous operations where the response needs to go back to the client immediately (like fetching a wallet balance), it uses gRPC calls in Phase 4 and GraphQL resolvers in Phase 5. For operations that trigger downstream processing (like submitting KYC documents), it proxies the HTTP request via NestJS's \`HttpModule\` or publishes directly to RabbitMQ.

What the Gateway does not do is equally important. It does not contain wallet logic. It does not validate transfer amounts. It does not know what KYC status is required for a transfer. Those decisions live in the services that own the relevant domains. If the Gateway made those decisions, every change to the business rules would require a Gateway deployment.

Inter-service communication also does not go through the Gateway. When Transaction Service needs to tell Wallet Service to debit, it publishes to RabbitMQ directly. Routing that through the Gateway would add latency, create a single point of failure for internal operations, and couple all services to the Gateway's availability.

In an interview, say: "The Gateway owns three things: JWT validation, rate limiting, and routing. It owns no database and makes no business decisions. Services never call each other through the Gateway - internal communication goes through RabbitMQ and Kafka. If the Gateway went down, external clients could not reach the system, but internal Saga flows and event processing would continue uninterrupted."
      `.trim(),
    },
    {
      id: 'nexuspay-protocol-evolution',
      title: 'REST to gRPC to GraphQL - why the evolution',
      content: `
NexusPay went through three API protocol layers across five development phases. Each transition solved a specific problem the previous approach created. Understanding why we changed, not just what we changed to, is what makes this interesting to talk about.

Phases 1 through 3 used REST everywhere - both for external client APIs and for internal service-to-service calls. REST was the right starting choice because every developer knows it, every HTTP client supports it, and tooling like Postman makes development fast. But as the number of services grew, an internal REST call problem emerged: the contract was implicit in JSON. If Wallet Service changed the shape of its response, Transaction Service would fail at runtime, not at compile time. We needed stronger typing for the internal communication layer.

Phase 4 introduced **gRPC** for internal service-to-service calls. gRPC uses **Protocol Buffers** - a language-neutral binary serialization format where the contract is defined in a \`.proto\` file. Both sides compile from the same \`.proto\`, so a contract change is caught at build time. Here is the Wallet Service proto definition:

\`\`\`proto
// libs/shared/proto/wallet.proto
syntax = "proto3";

package wallet;

service WalletService {
  rpc GetWallet(GetWalletRequest) returns (WalletResponse);
  rpc GetBalance(GetBalanceRequest) returns (BalanceResponse);
}

message GetWalletRequest {
  string wallet_id = 1;
}

message WalletResponse {
  string id = 1;
  string user_id = 2;
  string balance = 3;
  string currency = 4;
  bool is_active = 5;
}

message GetBalanceRequest {
  string wallet_id = 1;
}

message BalanceResponse {
  string balance = 1;
  string currency = 2;
}
\`\`\`

The API Gateway uses this proto to call Wallet Service:

\`\`\`typescript
// apps/api-gateway/src/wallet/wallet.module.ts
ClientsModule.registerAsync([
  {
    name: 'WALLET_GRPC',
    useFactory: (config: ConfigService) => ({
      transport: Transport.GRPC,
      options: {
        url: config.getOrThrow('WALLET_SERVICE_GRPC_URL'),
        package: 'wallet',
        protoPath: join(__dirname, '../../../libs/shared/proto/wallet.proto'),
      },
    }),
    inject: [ConfigService],
  },
]),
\`\`\`

Phase 5 introduced **GraphQL** at the API Gateway. The client-side problem gRPC solves (strong typing) does not exist for frontend clients - browsers cannot use gRPC directly. But frontends have a different problem: they need data from multiple services in a single request. A dashboard page needs the user's profile, their wallet balance, and their last 10 transactions. With REST, that is three round trips. With GraphQL, the client defines exactly what it needs in one query, and the Gateway resolves it by calling the appropriate gRPC services:

\`\`\`typescript
// apps/api-gateway/src/dashboard/dashboard.resolver.ts
@Resolver(() => DashboardData)
export class DashboardResolver {
  constructor(
    private readonly walletGrpc: WalletGrpcService,
    private readonly transactionGrpc: TransactionGrpcService,
  ) {}

  @Query(() => DashboardData)
  @UseGuards(GqlJwtAuthGuard)
  async dashboard(@CurrentUser() user: RequestUser): Promise<DashboardData> {
    const [wallet, transactions] = await Promise.all([
      this.walletGrpc.getWalletByUserId(user.id),
      this.transactionGrpc.getRecentTransactions(user.id, 10),
    ]);
    return { wallet, transactions };
  }

  @Subscription(() => WalletBalance)
  balanceUpdated(@Args('walletId') walletId: string) {
    return this.pubSub.asyncIterator(\`balance.updated.\${walletId}\`);
  }
}
\`\`\`

GraphQL subscriptions over WebSockets power the real-time balance updates. When a transfer completes, Transaction Service publishes to a PubSub channel. Any client subscribed to \`balanceUpdated\` receives the new balance immediately without polling.

In an interview, say: "We use three protocols for three different contexts. REST for the external API in early phases - universal support, easy to test. gRPC for internal service-to-service calls in Phase 4 - Protocol Buffer contracts are enforced at compile time across the entire monorepo, which REST with JSON cannot do. GraphQL for the client dashboard in Phase 5 - clients specify exactly what data they need in one request, and subscriptions give real-time balance updates. Each protocol is the right tool for its specific communication context."
      `.trim(),
    },
    {
      id: 'nexuspay-notification-service',
      title: 'The Notification Service - how it knows when to fire',
      content: `
The Notification Service has a property that makes it unusually easy to extend: it never initiates anything. It only reacts. This is not an accident of implementation - it is a deliberate design decision that comes directly from the event-driven architecture.

Every notification in NexusPay is triggered by an event published on RabbitMQ by another service. The Notification Service subscribes to those events and maps them to templates and delivery channels. When the engineering team wants to add a new notification type - say, a warning when a wallet balance drops below 10 EUR - they add a subscriber and a template. They never modify the service that produces the low-balance event.

Here is the Notification Service microservice setup and its event consumers:

\`\`\`typescript
// apps/notification-service/src/notifications/notifications.controller.ts
@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('user.kyc.approved')
  async onKycApproved(@Payload() data: UserKycApprovedEvent): Promise<void> {
    await this.notificationsService.send({
      userId: data.userId,
      templateId: 'kyc-approved',
      channels: ['email'],
      variables: { approvedAt: data.approvedAt },
    });
  }

  @EventPattern('transaction.completed')
  async onTransactionCompleted(
    @Payload() data: TransactionCompletedEvent,
  ): Promise<void> {
    await this.notificationsService.send({
      userId: data.sourceUserId,
      templateId: 'transfer-sent',
      channels: ['email', 'push'],
      variables: {
        amount: data.amount,
        currency: data.currency,
        recipientName: data.destinationUserName,
      },
    });
  }

  @EventPattern('transaction.failed')
  async onTransactionFailed(
    @Payload() data: TransactionFailedEvent,
  ): Promise<void> {
    await this.notificationsService.send({
      userId: data.sourceUserId,
      templateId: 'transfer-failed',
      channels: ['email', 'sms'],
      variables: { amount: data.amount, reason: data.reason },
    });
  }

  @EventPattern('wallet.created')
  async onWalletCreated(@Payload() data: WalletCreatedEvent): Promise<void> {
    await this.notificationsService.send({
      userId: data.userId,
      templateId: 'wallet-ready',
      channels: ['email'],
      variables: {},
    });
  }
}
\`\`\`

The channel selection is handled by a strategy pattern inside \`NotificationsService\`. Each channel - email, SMS, push - implements the same interface:

\`\`\`typescript
// apps/notification-service/src/channels/channel.interface.ts
export interface NotificationChannel {
  readonly channelId: 'email' | 'sms' | 'push';
  send(to: string, template: NotificationTemplate, variables: Record<string, string>): Promise<void>;
}

// apps/notification-service/src/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  private readonly channels = new Map<string, NotificationChannel>();

  constructor(
    emailChannel: EmailChannel,
    smsChannel: SmsChannel,
    pushChannel: PushChannel,
    private readonly userPrefsClient: ClientProxy,
    private readonly templateService: TemplateService,
  ) {
    this.channels.set('email', emailChannel);
    this.channels.set('sms', smsChannel);
    this.channels.set('push', pushChannel);
  }

  async send(params: SendNotificationParams): Promise<void> {
    const userPrefs = await firstValueFrom(
      this.userPrefsClient.send('users.get-notification-prefs', { userId: params.userId }),
    );
    const template = this.templateService.render(params.templateId, params.variables);

    for (const channelId of params.channels) {
      if (!userPrefs[channelId]) continue; // user opted out of this channel
      const channel = this.channels.get(channelId);
      if (!channel) continue;

      try {
        await channel.send(userPrefs.contactInfo[channelId], template, params.variables);
      } catch (error) {
        // Log failure but do not throw - one channel failure should not block others
        this.logger.error(\`Failed to send via \${channelId}\`, error);
      }
    }
  }
}
\`\`\`

The error handling in \`send\` is a deliberate choice. If the SMS provider is down, we still want to send the email. We log the failure for alerting but do not throw, because a failed SMS should not prevent a successful email delivery.

If Notification Service itself is down, RabbitMQ holds the messages in the queue. They accumulate and are processed in order when the service restarts. The payment flow is never blocked by a notification failure, because Notification Service is a downstream observer, never part of the critical path.

In an interview, say: "Notification Service only listens - it never initiates. Adding a new notification type means adding an event subscriber and a template. No other service is modified. If Notification Service is down, messages queue in RabbitMQ and are processed when it recovers. The payment flow is never blocked because Notification Service has no place in the Saga - it is downstream of everything."
      `.trim(),
    },
    {
      id: 'nexuspay-wallet-service-deep',
      title: 'The Wallet Service - balance management and concurrency',
      content: `
Money is the one domain where precision is non-negotiable. Every other domain can tolerate approximations. Analytics can round to two decimal places. Timestamps can be off by a second. But a balance that is wrong by even one cent is a genuine problem with legal consequences.

This is why the Wallet entity stores balance as a \`decimal(15, 2)\` column, not a JavaScript \`number\` or a PostgreSQL \`float\`. Floating-point numbers use binary fractions internally. 0.1 + 0.2 does not equal exactly 0.3 in any language that uses IEEE 754 floating point, which includes JavaScript, Python, and Java. Store a balance as a float and you will eventually accumulate rounding errors across thousands of transactions.

**Decimal types** in PostgreSQL store exact decimal values with a specified precision and scale. \`decimal(15, 2)\` means up to 15 digits total, 2 of which are after the decimal point. A balance of 99999999999.99 EUR fits. We store and retrieve it as a string in TypeScript to avoid JavaScript's float conversion:

\`\`\`typescript
// apps/wallet-service/src/wallets/entities/wallet.entity.ts
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0.00' })
  balance: string;   // string in TypeScript, exact decimal in PostgreSQL

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @VersionColumn()
  version: number;   // optimistic locking version counter

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
\`\`\`

The \`@VersionColumn()\` decorator enables **optimistic locking**. Optimistic locking assumes conflicts are rare. Instead of locking the row before reading it, we store a version number on every row. When we update, we include the version we read in our WHERE clause. If the version changed since we read the row - meaning another process updated it between our read and our write - the update affects zero rows, and TypeORM throws an \`OptimisticLockVersionMismatchError\`.

Here is the debit method with both the Redis distributed lock (at the application layer) and optimistic locking (at the database layer):

\`\`\`typescript
// apps/wallet-service/src/wallets/wallets.service.ts
@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly lockService: DistributedLockService,
  ) {}

  async debit(
    walletId: string,
    amount: string,
    transactionId: string,
  ): Promise<Wallet> {
    return this.lockService.withLock(\`wallet:\${walletId}\`, 30, async () => {
      const wallet = await this.walletRepo.findOneOrFail({
        where: { id: walletId, isActive: true },
        lock: { mode: 'optimistic', version: undefined }, // read with version
      });

      const currentBalance = parseFloat(wallet.balance);
      const debitAmount = parseFloat(amount);

      if (debitAmount <= 0) {
        throw new BadRequestException('Debit amount must be positive');
      }
      if (currentBalance < debitAmount) {
        throw new InsufficientFundsException(
          \`Insufficient funds: balance \${wallet.balance}, requested \${amount}\`,
        );
      }

      wallet.balance = (currentBalance - debitAmount).toFixed(2);
      // TypeORM will include the version in the WHERE clause
      // and throw if version has changed
      return this.walletRepo.save(wallet);
    });
  }

  async credit(walletId: string, amount: string): Promise<Wallet> {
    return this.lockService.withLock(\`wallet:\${walletId}\`, 30, async () => {
      const wallet = await this.walletRepo.findOneOrFail({
        where: { id: walletId, isActive: true },
      });

      const newBalance = (parseFloat(wallet.balance) + parseFloat(amount)).toFixed(2);
      wallet.balance = newBalance;
      return this.walletRepo.save(wallet);
    });
  }
}
\`\`\`

We use the Redis lock and optimistic locking together, and that might seem redundant. The Redis lock prevents concurrent requests from even getting to the database query. Optimistic locking is the second line of defense for scenarios where the Redis lock is not held - for example, an admin correction applied directly to the balance outside normal transfer flows. Two layers of protection for the most critical data in the system.

In an interview, say: "Balance is decimal(15,2), never float. JavaScript's number type uses IEEE 754 floating point, which cannot represent 0.1 exactly in binary - accumulate enough transfers and you will see rounding errors. We store as string in TypeScript and exact decimal in PostgreSQL. We use a Redis distributed lock as the primary concurrency guard and TypeORM's optimistic locking as a secondary defense. Two independent layers for the data that matters most."
      `.trim(),
    },
    {
      id: 'nexuspay-payment-gateway-service',
      title: 'The Payment Gateway Service - integrating with external providers',
      content: `
Every real payment platform must eventually connect to the outside world - to Stripe, Adyen, PayPal, or a bank's direct API. This is where real money flows out of your system and into someone else's. Getting it wrong has direct financial consequences.

The **Payment Gateway Service** is NexusPay's abstraction layer over external payment providers. It presents a single internal interface to the rest of the system, regardless of which provider is actually processing the payment. Transaction Service tells the Payment Gateway Service "charge this card for this amount" - it does not know or care whether that goes to Stripe or Adyen underneath.

Here is the provider abstraction:

\`\`\`typescript
// apps/payment-gateway-service/src/providers/payment-provider.interface.ts
export interface PaymentProvider {
  readonly providerId: string;
  charge(params: ChargeParams): Promise<ChargeResult>;
  refund(params: RefundParams): Promise<RefundResult>;
  verifyWebhook(payload: Buffer, signature: string): boolean;
}

// Stripe implementation
@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly providerId = 'stripe';
  private readonly stripe: Stripe;

  constructor(config: ConfigService) {
    this.stripe = new Stripe(config.getOrThrow('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(parseFloat(params.amount) * 100), // Stripe uses cents
      currency: params.currency.toLowerCase(),
      payment_method: params.paymentMethodId,
      confirm: true,
      idempotency_key: params.idempotencyKey,
    });
    return { providerId: intent.id, status: this.mapStatus(intent.status) };
  }
}
\`\`\`

**Idempotency keys** are critical for payment operations. An idempotency key is a unique identifier sent with a request so the provider can recognise and safely ignore duplicate requests - critical when retrying payment operations. If our service crashes after sending a charge request but before receiving the response, we do not know whether the charge succeeded. When we retry with the same idempotency key, Stripe returns the result of the original request instead of charging twice.

We generate idempotency keys from the transaction ID:

\`\`\`typescript
async processPayment(transactionId: string, params: ChargeParams): Promise<void> {
  const idempotencyKey = \`nexuspay-\${transactionId}\`;
  const result = await this.activeProvider.charge({
    ...params,
    idempotencyKey,
  });
  // ...
}
\`\`\`

External payment providers communicate results asynchronously via **webhooks** - HTTP POST requests sent to our server when a payment status changes. The webhook handler is a critical piece that requires careful validation:

\`\`\`typescript
// apps/payment-gateway-service/src/webhooks/webhooks.controller.ts
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly pgService: PaymentGatewayService,
    @Inject('TRANSACTION_EVENTS')
    private readonly txClient: ClientProxy,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @RawBody() payload: Buffer,       // must be raw bytes for signature verification
    @Headers('stripe-signature') sig: string,
  ): Promise<void> {
    // Verify the webhook came from Stripe, not an attacker
    const isValid = this.pgService.verifyWebhook('stripe', payload, sig);
    if (!isValid) throw new BadRequestException('Invalid webhook signature');

    const event = JSON.parse(payload.toString());

    if (event.type === 'payment_intent.succeeded') {
      this.txClient.emit('payment.confirmed', {
        externalId: event.data.object.id,
        amount: (event.data.object.amount / 100).toFixed(2),
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      this.txClient.emit('payment.failed', {
        externalId: event.data.object.id,
        reason: event.data.object.last_payment_error?.message,
      });
    }
    // Always return 200 quickly - processing happens asynchronously
  }
}
\`\`\`

Webhook endpoints must return 200 quickly. If we take too long, Stripe retries the webhook. If we process it again, we publish a duplicate event to RabbitMQ. We prevent this with the same idempotency pattern: before processing a webhook event, we check whether we have already seen this \`event.id\` in a Redis set.

In an interview, say: "The Payment Gateway Service abstracts external providers behind a single interface. Transaction Service never knows if the money goes through Stripe or Adyen. Idempotency keys prevent double-charging on retries - we derive them from the internal transaction ID so the same transaction always produces the same key. Webhooks are verified with the provider's signature before processing, and we use a Redis deduplication check to handle Stripe's at-least-once webhook delivery."
      `.trim(),
    },
    {
      id: 'nexuspay-analytics-service',
      title: 'The Analytics Service - consuming Kafka and building metrics',
      content: `
Analytics Service illustrates one of the most powerful aspects of event-driven architecture: you can build a complete read-optimised view of your system's data without touching the write-side services at all. Transaction Service does not know Analytics Service exists. Analytics Service does not need to ask Transaction Service for data. It simply reads the same events that Transaction Service has always published to Kafka.

This is **CQRS in practice**. CQRS - Command Query Responsibility Segregation - separates the write model from the read model. Transaction Service is the write model: it validates business rules, orchestrates Sagas, and writes transactions to its own PostgreSQL database optimised for writes. Analytics Service is the read model: it consumes transaction events and maintains its own denormalised database optimised for the queries the business actually runs.

The read model's database schema looks nothing like the write model's. Transaction Service stores individual transactions in a normalised table. Analytics Service maintains pre-aggregated summaries:

\`\`\`typescript
// apps/analytics-service/src/entities/daily-summary.entity.ts
@Entity('daily_transaction_summaries')
export class DailyTransactionSummary {
  @PrimaryColumn({ length: 10 })
  dateKey: string;           // 'YYYY-MM-DD'

  @PrimaryColumn({ length: 3 })
  currency: string;

  @Column({ type: 'int', default: 0 })
  transactionCount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: '0.00' })
  totalVolume: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: '0.00' })
  avgTransactionSize: string;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
\`\`\`

The Kafka consumer updates this summary on every transaction event:

\`\`\`typescript
// apps/analytics-service/src/analytics/analytics.controller.ts
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern('transactions.stream')
  async handleTransaction(
    @Payload() event: TransactionCompletedEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const heartbeat = context.getHeartbeat();

    try {
      // Call heartbeat during slow processing to prevent session timeout
      await heartbeat();
      await this.analyticsService.ingestTransaction(event);
    } catch (error) {
      this.logger.error('Ingestion failed', {
        transactionId: event.transactionId,
        offset: context.getMessage().offset,
        error: error.message,
      });
      // Do not rethrow - we cannot reprocess without re-reading from Kafka
      // Instead: emit to a dead-letter topic for investigation
      await this.analyticsService.sendToDeadLetter(event, error);
    }
  }
}
\`\`\`

\`\`\`typescript
// apps/analytics-service/src/analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  async ingestTransaction(event: TransactionCompletedEvent): Promise<void> {
    const dateKey = event.completedAt.substring(0, 10);

    // Atomic upsert - idempotent if we process the same event twice
    await this.summaryRepo.query(
      \`INSERT INTO daily_transaction_summaries
         ("dateKey", currency, "transactionCount", "totalVolume")
       VALUES ($1, $2, 1, $3)
       ON CONFLICT ("dateKey", currency)
       DO UPDATE SET
         "transactionCount" = daily_transaction_summaries."transactionCount" + 1,
         "totalVolume" = daily_transaction_summaries."totalVolume" + EXCLUDED."totalVolume",
         "avgTransactionSize" = (daily_transaction_summaries."totalVolume" + EXCLUDED."totalVolume")
                                 / (daily_transaction_summaries."transactionCount" + 1),
         "updatedAt" = NOW()\`,
      [dateKey, event.currency, event.amount],
    );
  }
}
\`\`\`

The \`ON CONFLICT DO UPDATE\` clause makes this operation idempotent. If we process the same Kafka message twice (Kafka guarantees at-least-once delivery), the summary row is updated to the same final state rather than double-counting.

When a business user queries "total transaction volume for Q1", that query runs in milliseconds against the pre-aggregated \`daily_transaction_summaries\` table. Without CQRS, the same query would scan millions of rows in Transaction Service's database, competing with write operations.

In an interview, say: "Analytics Service demonstrates CQRS. The write model - Transaction Service - is optimised for transactional writes. The read model - Analytics Service - consumes Kafka events and maintains pre-aggregated summaries optimised for queries. A daily volume query runs in milliseconds against the summary table. Neither service touches the other's database. The two models can evolve independently, and we can add new read models for new query patterns without changing a single line in Transaction Service."
      `.trim(),
    },
    {
      id: 'nexuspay-error-handling',
      title: 'Error handling across 7 services - what happens when things go wrong',
      content: `
Distributed systems fail in ways that monoliths do not. In a monolith, an unhandled exception propagates up the call stack and you get a 500 response. In a distributed system, a failure in one service might leave another service waiting forever, accumulate messages in a queue that never get processed, or silently corrupt data. Good error handling is not defensive programming - it is the difference between a system that degrades gracefully and one that collapses.

NexusPay's error handling strategy has four layers. Each layer handles a different failure mode.

**Layer 1: Global exception filters**

Every NestJS service has a global exception filter that catches unhandled exceptions and returns structured error responses. This prevents raw stack traces from reaching clients and ensures every error has a consistent format:

\`\`\`typescript
// libs/shared/utils/src/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error('Unhandled exception', {
      correlationId: request.headers['x-correlation-id'],
      path: request.url,
      method: request.method,
      status,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      statusCode: status,
      message,
      correlationId: request.headers['x-correlation-id'],
      timestamp: new Date().toISOString(),
    });
  }
}
\`\`\`

The \`correlationId\` header is generated by the API Gateway on every incoming request and propagated to all downstream services. When a user reports an error, we can trace the exact path their request took through the system using this single ID.

**Layer 2: Dead-letter queues**

A **dead-letter queue** is a queue where messages go when they cannot be processed successfully after a set number of retries. Instead of losing the message or crashing the consumer, we park it for investigation.

\`\`\`typescript
// apps/wallet-service/src/wallets/wallets.module.ts
ClientsModule.registerAsync([{
  name: 'RMQ_CLIENT',
  useFactory: (config: ConfigService) => ({
    transport: Transport.RMQ,
    options: {
      urls: [config.getOrThrow('RABBITMQ_URL')],
      queue: 'wallet_service_queue',
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'nexuspay.dlx',
          'x-dead-letter-routing-key': 'wallet.service.dead',
          'x-message-ttl': 86400000,  // 24 hours before auto-expiry
        },
      },
    },
  }),
  inject: [ConfigService],
}]),
\`\`\`

When a consumer \`nack\`s a message without requeue, RabbitMQ routes it to the dead-letter exchange \`nexuspay.dlx\`, which delivers it to the DLQ. We monitor the DLQ depth as an alert. If it grows, something is consistently failing and needs investigation.

**Layer 3: Saga timeout watchdog**

When a Saga starts, the transaction is saved as \`PENDING\`. If the Saga never completes - because a service crashed and the message was lost, or a network partition prevented delivery - that transaction stays \`PENDING\` forever without a watchdog.

\`\`\`typescript
// apps/transaction-service/src/tasks/saga-watchdog.task.ts
@Injectable()
export class SagaWatchdogTask {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupStalePendingTransactions(): Promise<void> {
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes

    const stale = await this.txRepo.find({
      where: {
        status: TransactionStatus.PENDING,
        createdAt: LessThan(staleThreshold),
      },
      take: 100,
    });

    for (const tx of stale) {
      await this.txRepo.update(tx.id, { status: TransactionStatus.FAILED });
      this.logger.warn('Saga timeout - marked FAILED', { transactionId: tx.id });
      // Publish compensation event to release any held locks
      this.eventsClient.emit('saga.timed-out', { transactionId: tx.id });
    }
  }
}
\`\`\`

**Layer 4: Circuit breaker on external calls**

The Payment Gateway Service calls external providers that can be slow or unavailable. Without a circuit breaker, a slow Stripe API causes Transaction Service's thread pool to fill with waiting requests, eventually taking down Transaction Service too. A **circuit breaker** stops calls to a failing dependency and fails fast while it recovers:

\`\`\`typescript
// Implemented using the 'opossum' library
const breaker = new CircuitBreaker(this.stripeProvider.charge.bind(this.stripeProvider), {
  timeout: 3000,          // 3 second timeout per call
  errorThresholdPercentage: 50,  // open after 50% failures
  resetTimeout: 30000,    // try again after 30 seconds
});

breaker.fallback(() => ({ status: 'circuit_open', error: 'Payment provider unavailable' }));
\`\`\`

In an interview, say: "We have four error handling layers. Global exception filters on every service with correlation IDs for tracing. Dead-letter queues in RabbitMQ so failed messages are preserved for investigation, not lost. A Saga watchdog that marks PENDING transactions as FAILED after 10 minutes, preventing phantom pending states. A circuit breaker on the Payment Gateway Service so a slow external provider does not cascade into Transaction Service. Each layer addresses a different failure mode in the distributed system."
      `.trim(),
    },
    {
      id: 'nexuspay-testing',
      title: 'Testing strategy: 85% coverage across 7 services',
      content: `
85% test coverage across 7 microservices is not achieved by writing tests for the sake of coverage numbers. It is achieved by writing the right tests in the right places - tests that catch real bugs and give you confidence to refactor without fear.

The testing strategy in NexusPay follows the testing pyramid: many unit tests at the base, fewer integration tests in the middle, and a small number of end-to-end tests at the top. Each layer serves a different purpose.

**Unit tests** test individual classes in isolation. Dependencies are mocked with Jest. These tests run in milliseconds and catch logic errors early. Here is a unit test for the transfer use case:

\`\`\`typescript
// apps/transaction-service/src/transactions/transactions.service.spec.ts
describe('TransactionsService', () => {
  let service: TransactionsService;
  let txRepo: jest.Mocked<Repository<Transaction>>;
  let walletClient: jest.Mocked<ClientProxy>;
  let lockService: jest.Mocked<DistributedLockService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: 'WALLET_EVENTS',
          useValue: { emit: jest.fn() },
        },
        {
          provide: DistributedLockService,
          useValue: { withLock: jest.fn((key, ttl, fn) => fn()) },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    txRepo = module.get(getRepositoryToken(Transaction));
    walletClient = module.get('WALLET_EVENTS');
    lockService = module.get(DistributedLockService);
  });

  describe('initiateTransfer', () => {
    it('should save a PENDING transaction and emit debit request', async () => {
      const dto: CreateTransferDto = {
        sourceWalletId: 'wallet-a',
        destinationWalletId: 'wallet-b',
        amount: '50.00',
        currency: 'EUR',
      };
      const savedTx = { id: 'tx-123', ...dto, status: TransactionStatus.PENDING };
      txRepo.create.mockReturnValue(savedTx as any);
      txRepo.save.mockResolvedValue(savedTx as any);

      const result = await service.initiateTransfer(dto);

      expect(txRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TransactionStatus.PENDING }),
      );
      expect(walletClient.emit).toHaveBeenCalledWith(
        'transaction.debit.requested',
        expect.objectContaining({ transactionId: 'tx-123', walletId: 'wallet-a' }),
      );
      expect(result.status).toBe(TransactionStatus.PENDING);
    });

    it('should throw ConflictException if lock is already held', async () => {
      lockService.withLock.mockRejectedValue(new ConflictException('locked'));

      await expect(
        service.initiateTransfer({
          sourceWalletId: 'wallet-a',
          destinationWalletId: 'wallet-b',
          amount: '50.00',
          currency: 'EUR',
        }),
      ).rejects.toThrow(ConflictException);

      expect(txRepo.save).not.toHaveBeenCalled();
    });
  });
});
\`\`\`

**Integration tests** test a service against real infrastructure. We use Jest with \`@testcontainers/postgresql\` to spin up a real PostgreSQL instance for the test run:

\`\`\`typescript
// apps/wallet-service/test/wallets.integration.spec.ts
describe('WalletsService (integration)', () => {
  let app: INestApplication;
  let walletService: WalletsService;
  let pgContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer().start();

    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: pgContainer.getConnectionUri(),
          entities: [Wallet],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Wallet]),
        WalletsModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    walletService = module.get(WalletsService);
  });

  afterAll(async () => {
    await app.close();
    await pgContainer.stop();
  });

  it('should debit a wallet and persist the new balance', async () => {
    const wallet = await walletService.createWallet('user-abc');
    await walletService.credit(wallet.id, '100.00');

    const after = await walletService.debit(wallet.id, '30.00', 'tx-1');

    expect(after.balance).toBe('70.00');
  });

  it('should throw InsufficientFundsException when balance is too low', async () => {
    const wallet = await walletService.createWallet('user-def');
    // balance is 0.00

    await expect(
      walletService.debit(wallet.id, '10.00', 'tx-2'),
    ).rejects.toThrow(InsufficientFundsException);
  });
});
\`\`\`

**End-to-end tests** cover the three most critical flows using Supertest against a fully running application:

\`\`\`typescript
// apps/user-service/test/kyc-approval.e2e-spec.ts
describe('KYC approval flow (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    // Start the service with test config pointing at Docker test infrastructure
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Seed: create a user and get an admin token
    const registerRes = await request(app.getHttpServer())
      .post('/users/register')
      .send({ email: 'test@example.com', password: 'Password123!' });
    userId = registerRes.body.id;

    adminToken = await getAdminToken(app);
  });

  it('should set kycStatus to PENDING on submission', async () => {
    await request(app.getHttpServer())
      .post(\`/users/\${userId}/kyc\`)
      .set('Authorization', \`Bearer \${adminToken}\`)
      .send({ documentType: 'passport', documentNumber: 'AB123456' })
      .expect(202);

    const user = await request(app.getHttpServer())
      .get(\`/users/\${userId}\`)
      .set('Authorization', \`Bearer \${adminToken}\`)
      .expect(200);

    expect(user.body.kycStatus).toBe('PENDING');
  });

  it('should set kycStatus to APPROVED and emit RabbitMQ event', async () => {
    const eventSpy = jest.spyOn(eventsClient, 'emit');

    await request(app.getHttpServer())
      .patch(\`/users/\${userId}/kyc/approve\`)
      .set('Authorization', \`Bearer \${adminToken}\`)
      .expect(200);

    expect(eventSpy).toHaveBeenCalledWith(
      'user.kyc.approved',
      expect.objectContaining({ userId }),
    );
  });
});
\`\`\`

We target 85% coverage, not 100%. The remaining 15% is NestJS module configuration files, DTO class definitions with no logic, and database migration files. Testing whether a \`@Module\` decorator has the correct \`providers\` array finds no real bugs. It adds tests that break every time you add a dependency. The pyramid principle: write tests where bugs actually live - in business logic and integration points.

In an interview, say: "We have three test levels. Unit tests mock all dependencies and run in milliseconds - they cover every business logic branch in use cases and services. Integration tests use real PostgreSQL via Testcontainers and test the full request-to-database path. E2E tests cover the three highest-risk flows: KYC approval, successful transfer, and failed transfer with compensation. 85% is our threshold because the remaining 15% is framework boilerplate where tests add maintenance overhead without finding bugs."
      `.trim(),
    },
    {
      id: 'nexuspay-docker',
      title: 'Docker Compose: running 7 services locally',
      content: `
Being able to spin up the entire NexusPay system with one command is not just a convenience for developers. It demonstrates that you understand how the pieces fit together and can operate what you built. Here is a simplified version of our \`docker-compose.yml\` that shows the key patterns:

\`\`\`yaml
version: '3.9'

networks:
  nexuspay-net:
    driver: bridge

volumes:
  pg-user-data:
  pg-wallet-data:
  pg-transaction-data:
  redis-data:
  rabbitmq-data:

services:
  # ── Infrastructure ──────────────────────────────────

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    volumes: [redis-data:/data]
    networks: [nexuspay-net]
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports: ['5672:5672', '15672:15672']
    volumes: [rabbitmq-data:/var/lib/rabbitmq]
    networks: [nexuspay-net]
    environment:
      RABBITMQ_DEFAULT_USER: nexuspay
      RABBITMQ_DEFAULT_PASS: secret
    healthcheck:
      test: ['CMD', 'rabbitmq-diagnostics', '-q', 'ping']
      interval: 10s
      timeout: 5s
      retries: 10

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports: ['9092:9092']
    networks: [nexuspay-net]
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      CLUSTER_ID: nexuspay-local-cluster
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'false'
    healthcheck:
      test: ['CMD', 'kafka-topics', '--bootstrap-server', 'localhost:9092', '--list']
      interval: 10s
      timeout: 5s
      retries: 10

  # ── Databases (one per service) ──────────────────────

  pg-user:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: user_service
      POSTGRES_USER: nexuspay
      POSTGRES_PASSWORD: secret
    volumes: [pg-user-data:/var/lib/postgresql/data]
    networks: [nexuspay-net]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nexuspay -d user_service']
      interval: 5s
      timeout: 3s
      retries: 10

  pg-wallet:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: wallet_service
      POSTGRES_USER: nexuspay
      POSTGRES_PASSWORD: secret
    volumes: [pg-wallet-data:/var/lib/postgresql/data]
    networks: [nexuspay-net]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nexuspay -d wallet_service']
      interval: 5s
      timeout: 3s
      retries: 10

  # ── Services ─────────────────────────────────────────

  user-service:
    build:
      context: .
      dockerfile: apps/user-service/Dockerfile
    networks: [nexuspay-net]
    environment:
      DATABASE_URL: postgresql://nexuspay:secret@pg-user:5432/user_service
      RABBITMQ_URL: amqp://nexuspay:secret@rabbitmq:5672
      JWT_SECRET: local-dev-secret-change-in-production
    depends_on:
      pg-user:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy

  wallet-service:
    build:
      context: .
      dockerfile: apps/wallet-service/Dockerfile
    networks: [nexuspay-net]
    environment:
      DATABASE_URL: postgresql://nexuspay:secret@pg-wallet:5432/wallet_service
      RABBITMQ_URL: amqp://nexuspay:secret@rabbitmq:5672
      REDIS_URL: redis://redis:6379
    depends_on:
      pg-wallet:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy

  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/Dockerfile
    ports: ['3000:3000']
    networks: [nexuspay-net]
    environment:
      JWT_SECRET: local-dev-secret-change-in-production
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://nexuspay:secret@rabbitmq:5672
      USER_SERVICE_URL: http://user-service:3001
      WALLET_SERVICE_URL: http://wallet-service:3002
    depends_on:
      - user-service
      - wallet-service
      - redis
      - rabbitmq
\`\`\`

The \`condition: service_healthy\` in \`depends_on\` is the critical detail. Without it, Docker starts services in dependency order but does not wait for them to be ready. A NestJS service that starts before its PostgreSQL database can connect will crash on the first TypeORM connection attempt. Health checks make Docker Compose wait until the dependency is genuinely ready before starting the dependent service.

Named networks (\`nexuspay-net\`) let services reference each other by their Compose service name: \`pg-user\`, \`rabbitmq\`, \`kafka\`. No hardcoded IP addresses. No port mapping required for inter-service communication - only the services that external clients need (the API Gateway, RabbitMQ management UI) expose ports to the host.

Running the whole system locally takes one command and about 60 seconds on a modern laptop. Running the E2E test suite against the local stack takes another two minutes. This is the workflow that makes local development of a 7-service system practical.

In an interview, say: "Docker Compose starts everything - 7 services, 7 PostgreSQL databases, RabbitMQ, Kafka, and Redis - in one command. Services wait for their databases via health check conditions before starting. Inter-service communication uses Docker's internal DNS - services refer to each other by name, not IP. I use this locally for development and as the environment for E2E tests in CI."
      `.trim(),
    },
    {
      id: 'nexuspay-cicd',
      title: 'GitHub Actions CI/CD - from code push to deployed service',
      content: `
A CI/CD pipeline is how a team deploys software consistently. Without it, "it works on my machine" is the test suite. With it, every change to the codebase goes through the same verification steps before anyone sees it in production.

NexusPay's GitHub Actions pipeline has two workflows. The first runs on every pull request. The second runs when a PR merges to main.

**PR workflow - validation gates:**

\`\`\`yaml
# .github/workflows/pr-check.yml
name: PR Check

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # required for Nx affected to work correctly

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Derive Nx base and head SHAs
        uses: nrwl/nx-set-shas@v4

      - name: Lint affected projects
        run: npx nx affected --target=lint --parallel=3

      - name: Type check affected projects
        run: npx nx affected --target=type-check --parallel=3

      - name: Unit test affected projects
        run: npx nx affected --target=test --parallel=3 --coverage

      - name: Build affected projects
        run: npx nx affected --target=build --parallel=3
\`\`\`

The \`nx affected\` commands are the performance key. If a PR only changes \`apps/wallet-service\`, Nx only lints, tests, and builds \`wallet-service\` and any project that depends on it. A change to \`libs/shared/events\` would affect all services. A change to \`apps/notification-service\` would only affect that service. In a team of 10 engineers with many PRs open simultaneously, this difference between "30 seconds" and "8 minutes" per CI run matters.

**Merge to main workflow - integration, build, and deploy:**

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  integration-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: nexuspay
          POSTGRES_PASSWORD: secret
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 3s
          --health-retries 10

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Run integration tests
        run: npx nx run-many --target=test:integration --all
        env:
          DATABASE_URL: postgresql://nexuspay:secret@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

  build-and-push:
    needs: integration-test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: nrwl/nx-set-shas@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker images for affected services
        run: |
          SERVICES=$(npx nx show projects --affected --type=app)
          for SERVICE in \$SERVICES; do
            docker build -t ghcr.io/nexuspay/\${SERVICE}:\${{ github.sha }} \
              -f apps/\${SERVICE}/Dockerfile .
            docker push ghcr.io/nexuspay/\${SERVICE}:\${{ github.sha }}
          done

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy affected services
        run: |
          # In a real deployment: kubectl set image, Helm upgrade, etc.
          echo "Deploying \${{ github.sha }} to production"
\`\`\`

Secrets - database URLs, API keys, JWT secrets, container registry credentials - are stored in GitHub repository secrets and injected as environment variables at runtime. They are never committed to the repository.

The deployment step (represented here as a placeholder) would in production apply a Kubernetes rolling update or a Helm chart upgrade. The key property is that only affected services are rebuilt and redeployed. An unrelated service does not get a new image and does not get restarted.

In an interview, say: "Our CI pipeline uses Nx affected on pull requests so only changed services are linted, type-checked, and tested. On merge to main, we run integration tests with real PostgreSQL and Redis via GitHub Actions service containers, build Docker images only for affected services, and push to the container registry. Secrets live in GitHub repository secrets and are never in the codebase. The affected builds are what make this fast enough to run on every PR without team frustration."
      `.trim(),
    },
    {
      id: 'nexuspay-interview-qa',
      title: 'The questions interviewers will ask - and exactly what to say',
      content: `
These are the questions every interviewer asks about NexusPay, roughly in order of frequency. For each one, here is exactly what to say - not a general answer, but the specific words that demonstrate depth.

---

**"Walk me through the architecture."**

"NexusPay is a fintech platform with 7 NestJS microservices in an Nx monorepo. All external traffic goes through the API Gateway, which handles JWT validation and rate limiting. Behind it are six domain services - User, Wallet, Transaction, Notification, Analytics, and Payment Gateway. Each service owns its own PostgreSQL database. RabbitMQ carries directed commands between services - KYC approvals, Saga steps. Kafka carries event streams to the transactions.stream topic, where Analytics and Fraud Detection consume independently with separate consumer groups. Redis handles caching, rate limiting, distributed locks, and JWT blacklisting."

Pause there. Wait for the follow-up. You have given them six places to go deeper.

---

**"Why separate databases?"**

"Each service owns its data - that is the bounded context principle from DDD. Wallet Service has a userId column that is just a UUID with no ORM relationship pointing at User Service. Schema changes in one service never affect others. Services can scale independently. The cost is no cross-service JOINs - we assemble data through events or API composition at the Gateway. For a payment platform where data integrity and independent deployability matter more than query convenience, that is the right trade-off."

---

**"How do you prevent double-spending?"**

"We use a Redis distributed lock with SET NX EX before any wallet debit. NX is atomic - Redis processes it in a single thread, so only one caller wins. The loser gets null and receives 409 immediately. The lock key includes the wallet ID. The TTL is 30 seconds - if our service crashes before the finally block runs, the lock auto-expires and the wallet is not permanently blocked. We also verify we still own the lock before deleting it using a Lua script, to handle the case where the lock expired and was re-acquired by another process just before our release."

---

**"What happens if the Wallet Service crashes mid-Saga?"**

"The RabbitMQ message is not acknowledged because we use manual acknowledgement. When Wallet Service restarts, RabbitMQ redelivers the message. The debit method is idempotent - it checks whether the operation was already applied using the transactionId before re-applying. The transaction stays PENDING in the database. If the Saga does not complete within 10 minutes, our watchdog cron job marks it FAILED and publishes a compensation event to release any held locks."

---

**"Why both RabbitMQ and Kafka?"**

"RabbitMQ is for directed, transient commands consumed once - create this wallet, send this notification, debit this specific wallet as part of this Saga. Kafka is for persistent event streams where multiple consumers need the same event independently, possibly at different times. Analytics and Fraud Detection both read every transaction from Kafka in separate consumer groups. If Fraud Detection is down for two hours, it seeks to its last offset when it comes back and replays everything it missed. That replay is impossible with RabbitMQ - it deletes messages after consumption."

---

**"How does the Notification Service know when to fire?"**

"It only listens - never initiates. It subscribes to events using @EventPattern decorators: user.kyc.approved, transaction.completed, transaction.failed, wallet.created. Each event maps to a template and a set of channels. If the user opted out of SMS, we skip that channel. If Notification Service is down, messages accumulate in RabbitMQ and are delivered when it recovers. The payment flow is never blocked because Notification Service is downstream of everything - it has no part in the Saga."

---

**"How would you handle a Kafka consumer that has fallen behind by millions of events?"**

"First, determine why it fell behind - was it a deployment, a crash, a slow processing bug? If the consumer just needs to catch up, the answer is to increase the number of consumer instances in the group. Kafka partitions the topic, so more consumers can process partitions in parallel. If the lag is because individual message processing is too slow, we look at the processing code. If the consumer crashed and lost its offset, Kafka has the events stored - we reset the offset to the last committed position and let it replay. The key property is that the consumer catching up does not affect any other consumer group. Analytics catching up does not slow down Fraud Detection."

---

**"What happens if two users transfer to the same destination wallet simultaneously?"**

"The destination wallet does not have the same concurrency concern as the source wallet. We only lock the source wallet during a transfer because the balance check and debit on the source must be atomic. For credits on the destination, two concurrent credits cannot produce an incorrect result - they are additive. We use optimistic locking on the Wallet entity with a @VersionColumn, so if two credits update the same row concurrently, one succeeds and the other retries the update with the new version. The final balance is always the sum of both credits."

---

**"How do you run database migrations across 7 services without downtime?"**

"Each service runs its own migrations independently. We use TypeORM migrations with the convention that migrations must be backward compatible with the previous deployed version. This means we use the expand-contract pattern: first deploy a migration that adds a new column as nullable (expand), then deploy the application code that writes to it, then deploy a migration that makes it required (contract). For column renames, we add the new column, backfill it, deploy code that writes to both, then drop the old one in a later migration. Services are deployed with rolling updates, so old and new code run simultaneously for a brief period. The backward compatible migration ensures both versions can operate against the same schema."

---

**"Why NestJS and not plain Express?"**

"Express gives you a minimal HTTP server and total flexibility. NestJS gives you a complete application framework built on top of Express - or Fastify if you prefer. The key things NestJS provides are: a dependency injection container so services, repositories, and providers are wired up automatically; a module system that enforces architectural boundaries; decorators for controllers, guards, interceptors, and pipes that make cross-cutting concerns composable; and first-class support for microservices transports including RabbitMQ, Kafka, gRPC, and WebSockets. In a 7-service system, the DI container and module system alone justify the choice. With Express, you build that infrastructure yourself. With NestJS, you inherit it."

---

**"How would you scale NexusPay to 10x the current traffic?"**

"At 10x traffic, the bottlenecks would be different for each service. The API Gateway scales horizontally behind a load balancer - it is stateless. Transaction Service scales horizontally too, but more Kafka consumers per consumer group means more parallel event processing. The real constraints are at the database layer. For read-heavy services like User Service, we add PostgreSQL read replicas and route read queries to them. For write-heavy services like Transaction Service, we evaluate sharding by source wallet ID - transactions for wallet A always go to shard 1, ensuring the distributed lock works within a shard. Redis scales with Redis Cluster for distributed locking at scale. RabbitMQ scales with quorum queues across a 3-node cluster for HA. The Kafka cluster gets more brokers and more partitions on transactions.stream so more Analytics consumer instances can run in parallel."
      `.trim(),
    },
  ],
};
