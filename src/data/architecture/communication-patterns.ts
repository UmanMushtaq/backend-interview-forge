import type { ArchitectureModule } from '../../types';

export const communicationPatterns: ArchitectureModule = {
  id: 'communication-patterns',
  title: 'Communication Patterns',
  blurb: 'REST, gRPC, GraphQL, sync vs async, and how message queues and event streams fit in.',
  lessons: [],
  plannedLessons: [
    'REST vs gRPC vs GraphQL, picking the right contract',
    'Synchronous vs asynchronous communication',
    'Message queues and RabbitMQ patterns',
    'Event streaming and Kafka patterns',
    'Webhooks vs polling',
  ],
};
