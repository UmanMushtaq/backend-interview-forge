import type { LearnModule } from '../../types';

export const systemDesign: LearnModule = {
  id: 'system-design',
  title: 'System Design & Architecture',
  blurb: 'Building blocks, scaling, and the patterns interviewers probe.',
  quizCategory: 'system-design',
  lessons: [
    {
      id: 'sd-building-blocks',
      title: 'Building blocks and scaling',
      content:
        'Most systems combine a handful of blocks: a load balancer spreading traffic across stateless app instances, a cache (Redis) for hot reads, a database for the source of truth, a message broker for async work, and a CDN for static assets. Scale stateless tiers horizontally by adding instances; scale data with read replicas, partitioning/sharding, and caching. Always name the bottleneck first (usually the database) and design around it. CAP reminds you that during a network partition you trade consistency for availability per operation. In an interview, establish requirements and estimate the order-of-magnitude load (requests per second, data volume) before jumping to solutions — this narrows the design space quickly. A system handling 1k RPS with a single-digit GB dataset needs a very different architecture than one handling 100k RPS with petabyte-scale storage, and naming that difference early shows senior thinking.',
    },
    {
      id: 'sd-cap-consistency',
      title: 'CAP theorem and consistency models',
      content:
        'The CAP theorem states that a distributed system can guarantee at most two of Consistency, Availability, and Partition tolerance; since network partitions are unavoidable in practice, you are really choosing between CP (reject requests to stay consistent) and AP (serve stale data to stay available). In reality the choice is per-operation: a checkout flow might be CP (never double-charge) while a product catalogue view is AP (briefly stale is acceptable). PACELC extends CAP by acknowledging that even without a partition you trade latency for consistency: quorum writes (waiting for multiple replicas) reduce latency variance but increase average write latency. Strong consistency (linearizability) means every read sees the most recent write; eventual consistency means replicas converge given no new writes; read-your-own-writes consistency is a useful middle ground where a user always sees their own changes. Choose the consistency level per use-case and document it explicitly, because mismatched expectations between teams are a common source of production bugs.',
    },
    {
      id: 'sd-ddd-hexagonal',
      title: 'DDD layers and hexagonal architecture',
      content:
        'Domain-Driven Design organises code into four layers: the domain layer holds entities, value objects, aggregates, and domain services with zero framework dependencies; the application layer orchestrates use cases using domain objects and calls ports; the infrastructure layer provides adapters that implement those ports (HTTP controllers, database repositories, message publishers); and the interfaces layer handles serialisation and transport concerns. Hexagonal architecture (ports and adapters) formalises this by defining the domain as a hexagon with named ports on its boundary, each port implemented by a swappable adapter. This means you can test the entire domain and application layer with in-memory adapters, then plug in real database and broker adapters for integration tests. In interviews, this pattern answers "how do you keep your business logic testable as the system grows?" — the answer is to make all I/O cross a boundary defined by the domain, never call infrastructure directly from domain objects.',
    },
    {
      id: 'sd-microservices-monolith',
      title: 'Microservices vs monolith and database-per-service',
      content:
        'A modular monolith has a single deployable unit with well-defined internal module boundaries; it is easier to develop, test, debug, and operate than microservices, and should be the default for a new product or small team. Extract a service only when a specific module has a scaling requirement, release cadence, or technology choice that genuinely differs from the rest. Microservices buy independent deployability and fault isolation at the cost of network latency, distributed tracing overhead, and the loss of ACID transactions across services. The database-per-service pattern enforces this boundary: each service owns its schema, preventing the tight coupling that develops when services share tables. The downside is that cross-service queries require API composition (gateway aggregates multiple service calls) or a read-side projection (one service subscribes to events from another and maintains a local denormalised view). In interviews, always acknowledge that "microservices" is not a free upgrade — articulate the operational maturity and team size that justifies the cost.',
    },
    {
      id: 'sd-cqrs-event-sourcing',
      title: 'CQRS and event sourcing',
      content:
        'CQRS (Command Query Responsibility Segregation) splits the write model (commands that mutate state) from the read model (queries that return data). The write side can be a normalised relational store optimised for integrity; the read side can be a denormalised projection in Redis, Elasticsearch, or a read replica, optimised for specific query patterns. Updates flow from write to read asynchronously, so read models are eventually consistent. Event sourcing takes this further: instead of storing current state, the system stores an immutable append-only log of domain events ("OrderPlaced", "PaymentConfirmed", "OrderShipped"). Current state is derived by replaying events, and any read projection can be rebuilt from the log at any time. This gives a complete audit trail, time-travel debugging, and the ability to add new projections retroactively. The trade-off is query complexity (you cannot simply SELECT * from an events table to get current state) and the need to handle event schema evolution carefully using techniques like upcasting.',
    },
    {
      id: 'sd-resilience-caching-outbox',
      title: 'Circuit breakers, caching strategies, idempotency, and the outbox',
      content:
        'A circuit breaker wraps calls to a downstream dependency and trips to an open state after a threshold of failures, returning an error immediately instead of letting threads queue up waiting for a slow service. After a timeout it enters half-open state and allows one probe request; on success it resets to closed. This prevents cascading failures: if the payment service is down, the order service fails fast instead of exhausting its thread pool. Cache-aside (lazy loading) reads from cache and populates on miss; write-through writes to cache and DB together on every write, keeping them in sync at the cost of higher write latency. Write-behind (write-back) writes to cache immediately and flushes to DB asynchronously, giving lower write latency but risking data loss on cache failure. Idempotency keys on mutating API endpoints let clients safely retry: the server stores the key with the result and returns the cached result on duplicate requests. The outbox pattern solves dual-write between a database and a message broker: write the event to an outbox table in the same transaction as the business change, then a relay (or CDC tool like Debezium) publishes committed outbox rows to the broker, guaranteeing exactly-once publish relative to the database transaction.',
    },
  ],
};
