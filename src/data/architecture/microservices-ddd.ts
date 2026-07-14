import type { ArchitectureModule } from '../../types';

export const microservicesDdd: ArchitectureModule = {
  id: 'microservices-ddd',
  title: 'Microservices & DDD',
  blurb: 'When to split a monolith, bounded contexts, sagas, the API Gateway pattern, and service discovery.',
  lessons: [],
  plannedLessons: [
    "Monolith to microservices, when it's actually worth it",
    'Bounded contexts and DDD in practice',
    'Saga pattern: orchestration vs choreography (the NexusPay transfer flow)',
    'API Gateway pattern',
    'Service discovery',
  ],
};
