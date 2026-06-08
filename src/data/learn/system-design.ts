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
        'Most systems combine a handful of blocks: a load balancer spreading traffic across stateless app instances, a cache (Redis) for hot reads, a database for the source of truth, a message broker for async work, and a CDN for static assets. Scale stateless tiers horizontally by adding instances; scale data with read replicas, partitioning/sharding, and caching. Always name the bottleneck first (usually the database) and design around it. CAP reminds you that during a network partition you trade consistency for availability per operation.',
    },
    {
      id: 'sd-patterns',
      title: 'Architecture patterns and trade-offs',
      content:
        'Domain-Driven Design and hexagonal (ports and adapters) architecture keep business logic independent of frameworks and infrastructure. Microservices with a database per service buy independent deployability at the cost of cross-service joins and transactions, which pushes you toward Sagas and eventual consistency. CQRS separates read and write models when their loads diverge; event sourcing stores an append-only log of events as the source of truth. For a young product, prefer a modular monolith and extract services only where real pressure appears.',
    },
  ],
};
