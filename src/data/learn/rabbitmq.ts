import type { LearnModule } from '../../types';

export const rabbitmq: LearnModule = {
  id: 'rabbitmq',
  title: 'RabbitMQ + Saga',
  blurb: 'Exchanges, acknowledgements, dead-letter queues, and the Saga pattern.',
  quizCategory: 'rabbitmq',
  lessons: [
    {
      id: 'rmq-routing',
      title: 'Exchanges and routing',
      content:
        'Producers publish to an exchange, which routes to queues by type: direct matches an exact routing key, topic matches wildcard patterns (star is one word, hash is zero or more), fanout broadcasts to all bound queues, and headers routes on message attributes. Model a command (do this, one handler) with direct routing and an event (this happened, many subscribers) with topic or fanout. Choosing the exchange is really choosing your coupling. In practice a direct exchange named after the target queue is the simplest starting point; switch to topic when you need multiple subscribers to filter by category, such as "orders.created" vs "orders.cancelled". Fanout is useful for cache-invalidation broadcasts where every running instance must react. Headers exchange is rarely needed but allows routing without encoding information in the routing key, which is useful when callers are in different languages with different key-formatting conventions.',
    },
    {
      id: 'rmq-queues-bindings',
      title: 'Queues, bindings, and QoS',
      content:
        'A queue is a durable FIFO buffer; a binding is the rule that ties an exchange to a queue with an optional routing key. Queues can be durable (survive broker restart), exclusive (tied to one connection), or auto-delete (removed when the last consumer disconnects). The prefetch count (basic.qos) controls how many unacknowledged messages a consumer may hold at once — setting it to 1 gives round-robin fair dispatch so a slow consumer does not starve while a fast one sits idle. In high-throughput scenarios a prefetch of 10-50 amortises the round-trip cost without letting one slow worker accumulate a huge backlog. Quorum queues, introduced in RabbitMQ 3.8, use the Raft consensus algorithm to replicate messages across a majority of nodes, replacing classic mirrored queues and offering much stronger durability guarantees without split-brain risk. Always enable durable queues and persistent message delivery mode together; a durable queue with transient messages still loses data on restart.',
    },
    {
      id: 'rmq-reliability',
      title: 'Acknowledgements, nack, and requeue',
      content:
        'With auto-ack enabled the broker removes a message as soon as it is delivered, giving at-most-once semantics — if the consumer crashes the message is gone. Manual acknowledgement (basic.ack) flips this to at-least-once: the broker redelivers any unacknowledged message when the channel closes. A consumer can call basic.nack with requeue=true to put the message back at the head of the queue for an immediate retry, or requeue=false to discard it (or route it to a dead-letter exchange if one is configured). Reject with requeue=true is safe only when the failure is transient; for a poison message or a bug, always nack with requeue=false so the same bad message does not loop forever. Because at-least-once delivery means you may process a message more than once, every consumer must be idempotent — check a processed-ids store or use a database unique constraint before applying the side effect.',
    },
    {
      id: 'rmq-dlq-retry',
      title: 'Dead-letter queues and retry patterns',
      content:
        'A dead-letter exchange (DLX) is a regular exchange that receives messages when they are rejected without requeue, expire (per-message or queue TTL), or exceed the queue max-length. Attach a DLX to a queue by setting the x-dead-letter-exchange argument at queue declaration time. A common retry pattern uses multiple queues with increasing TTLs: the DLX on the primary queue routes to a "wait-30s" queue whose DLX routes back to the primary, implementing exponential back-off without a scheduler. After a fixed number of retries (tracked via the x-death header, which records each dead-lettering event), route permanently failed messages to a "dead" queue for manual inspection or alerting. This isolates poison messages from live traffic and gives you a full audit trail. Always monitor dead-letter queue depth in production — a growing count signals that a downstream dependency is degraded or that a code bug was deployed.',
    },
    {
      id: 'rmq-publisher-confirms',
      title: 'Publisher confirms and idempotency',
      content:
        'Publisher confirms (also called broker acknowledgements) make the producer side durable: the broker sends a basic.ack back to the producer after it has written the message to disk on all replicas, or basic.nack if it could not. Without confirms a publish call returns before the message is persisted, so a broker crash in that window loses the message silently. In code, enable confirms on the channel and either wait synchronously (simple but slower) or collect confirms asynchronously in a callback and retry nacked messages. Combined with a unique message id field, this gives you idempotent publish: if the network drops after the broker commits but before the ack arrives, the producer retries with the same id, and the consumer deduplicates using that id stored alongside the side-effect record. This pattern — persist the message id with the business transaction in one DB write — is the lightweight version of the outbox pattern and is suitable when producer and consumer share a database.',
    },
    {
      id: 'rmq-saga',
      title: 'Saga pattern, compensation, and 2PC vs Saga',
      content:
        'A distributed transaction spanning multiple services cannot use two-phase commit (2PC) in practice: it requires all participants to hold locks until the coordinator says commit, creating availability problems and coupling the services to a single coordinator whose failure blocks everything. The Saga pattern replaces 2PC with a sequence of local transactions, each publishing an event or command that triggers the next step. If any step fails, the saga executes compensating transactions in reverse order — for example, if "charge card" succeeds but "reserve inventory" fails, a compensation action voids the charge. In the choreography style each service reacts to events autonomously; in the orchestration style a central saga orchestrator sends commands and awaits results, which makes the overall flow explicit and testable but re-introduces a coordinator. Key interview point: sagas give ACD without the I — they lack isolation, so an intermediate state is visible to concurrent requests. Design compensating actions to be idempotent because they may be retried. RabbitMQ fits saga orchestration well because the orchestrator can publish commands to specific queues and consume result events from reply queues.',
    },
  ],
};
