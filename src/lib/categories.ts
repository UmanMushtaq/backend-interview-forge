import { Boxes, Database, Zap, Rabbit, Radio, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { QuizCategory } from '../types';

export interface CategoryMeta {
  id: QuizCategory;
  label: string;
  short: string;
  /** Weight in the overall readiness score (sums to 1). */
  weight: number;
  icon: LucideIcon;
  /** Tailwind text color class used for accents. */
  accent: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'nestjs', label: 'NestJS', short: 'NestJS', weight: 0.25, icon: Boxes, accent: 'text-rose-400' },
  { id: 'postgresql', label: 'PostgreSQL + TypeORM', short: 'PostgreSQL', weight: 0.15, icon: Database, accent: 'text-sky-400' },
  { id: 'redis', label: 'Redis', short: 'Redis', weight: 0.15, icon: Zap, accent: 'text-amber-400' },
  { id: 'rabbitmq', label: 'RabbitMQ + Saga', short: 'RabbitMQ', weight: 0.15, icon: Rabbit, accent: 'text-orange-400' },
  { id: 'kafka', label: 'Kafka', short: 'Kafka', weight: 0.15, icon: Radio, accent: 'text-violet-400' },
  { id: 'system-design', label: 'System Design + Architecture', short: 'System Design', weight: 0.15, icon: Network, accent: 'text-teal-400' },
];

export const CATEGORY_BY_ID: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);
