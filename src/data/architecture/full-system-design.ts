import type { ArchitectureModule } from '../../types';

export const fullSystemDesign: ArchitectureModule = {
  id: 'full-system-design',
  title: 'Full System Design Challenges',
  blurb: 'Bigger canvases, end to end: a URL shortener, a rate limiter, a payment system, and more.',
  lessons: [],
  plannedLessons: [
    'Design a URL shortener',
    'Design a rate limiter as a standalone service',
    "Design a payment and wallet system (mapped onto NexusPay's real architecture)",
    'Design a notification system',
    'Design a real-time analytics pipeline',
  ],
};
