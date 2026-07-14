import type { ArchitectureModule } from '../../types';

export const dataStorage: ArchitectureModule = {
  id: 'data-storage',
  title: 'Data & Storage',
  blurb: 'Choosing the right database, indexing at scale, replication, sharding, and caching.',
  lessons: [],
  plannedLessons: [
    'SQL vs NoSQL, choosing the right one for the job',
    'Indexing at scale, what it costs you',
    'Database replication (primary-replica)',
    'Database sharding and partition keys',
    'Caching strategies: cache-aside, write-through, write-behind',
    'CDNs and static asset delivery',
  ],
};
