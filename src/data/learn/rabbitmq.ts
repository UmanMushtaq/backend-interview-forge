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
        'Producers publish to an exchange, which routes to queues by type: direct matches an exact routing key, topic matches wildcard patterns (star is one word, hash is zero or more), fanout broadcasts to all bound queues, and headers routes on message attributes. Model a command (do this, one handler) with direct routing and an event (this happened, many subscribers) with topic or fanout. Choosing the exchange is really choosing your coupling.',
    },
    {
      id: 'rmq-reliability',
      title: 'Reliability: acks, DLQ, idempotency, Saga',
      content:
        'Manual acknowledgements give at-least-once delivery: the broker redelivers if a consumer crashes before acking, so consumers must be idempotent — dedupe on a unique message or operation id stored with the side effect. A dead-letter queue captures messages that are rejected, expire, or exceed retries, isolating poison messages. For a transaction spanning services, a Saga runs local steps and compensating actions to undo earlier ones on failure, trading strict isolation for availability.',
    },
  ],
};
