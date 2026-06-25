import {
  Braces,
  FileCode2,
  Hexagon,
  Boxes,
  Database,
  Zap,
  Rabbit,
  Radio,
  Network,
  FlaskConical,
  GitMerge,
  BrainCircuit,
  Landmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Display configuration for each learning course. The `id` must match the
 * corresponding LearnModule id in src/data/learn. Tailwind color classes are
 * written as complete literal strings so the JIT compiler keeps them.
 */
export interface CourseConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  estimatedHours: number;
  /** Text color class for the icon / accents, e.g. 'text-yellow-400'. */
  color: string;
  /** Background color class for progress fills, e.g. 'bg-yellow-400'. */
  bar: string;
  /** Subtle background tint, e.g. 'bg-yellow-400/10'. */
  tint: string;
}

export const COURSES: CourseConfig[] = [
  {
    id: 'javascript',
    title: 'JavaScript',
    description: 'Core language: closures, async, prototypes, and every ES version.',
    icon: Braces,
    estimatedHours: 10,
    color: 'text-yellow-400',
    bar: 'bg-yellow-400',
    tint: 'bg-yellow-400/10',
  },
  {
    id: 'typescript',
    title: 'TypeScript',
    description: 'Static typing, generics, and advanced type-level programming.',
    icon: FileCode2,
    estimatedHours: 5,
    color: 'text-blue-400',
    bar: 'bg-blue-400',
    tint: 'bg-blue-400/10',
  },
  {
    id: 'nodejs',
    title: 'Node.js',
    description: 'The runtime: event loop, streams, and non-blocking I/O.',
    icon: Hexagon,
    estimatedHours: 5,
    color: 'text-green-400',
    bar: 'bg-green-400',
    tint: 'bg-green-400/10',
  },
  {
    id: 'nestjs',
    title: 'NestJS',
    description: 'Modules, dependency injection, and building scalable APIs.',
    icon: Boxes,
    estimatedHours: 5,
    color: 'text-rose-400',
    bar: 'bg-rose-400',
    tint: 'bg-rose-400/10',
  },
  {
    id: 'postgresql',
    title: 'PostgreSQL',
    description: 'Relational modeling, indexing, transactions, and TypeORM.',
    icon: Database,
    estimatedHours: 5,
    color: 'text-sky-400',
    bar: 'bg-sky-400',
    tint: 'bg-sky-400/10',
  },
  {
    id: 'redis',
    title: 'Redis',
    description: 'Caching, data structures, pub/sub, and persistence.',
    icon: Zap,
    estimatedHours: 4,
    color: 'text-red-400',
    bar: 'bg-red-400',
    tint: 'bg-red-400/10',
  },
  {
    id: 'rabbitmq',
    title: 'RabbitMQ',
    description: 'Message queues, exchanges, routing, and the saga pattern.',
    icon: Rabbit,
    estimatedHours: 4,
    color: 'text-orange-400',
    bar: 'bg-orange-400',
    tint: 'bg-orange-400/10',
  },
  {
    id: 'kafka',
    title: 'Kafka',
    description: 'Event streaming, partitions, consumer groups, and offsets.',
    icon: Radio,
    estimatedHours: 4,
    color: 'text-violet-400',
    bar: 'bg-violet-400',
    tint: 'bg-violet-400/10',
  },
  {
    id: 'system-design',
    title: 'System Design',
    description: 'Scalability, architecture patterns, and engineering trade-offs.',
    icon: Network,
    estimatedHours: 6,
    color: 'text-teal-400',
    bar: 'bg-teal-400',
    tint: 'bg-teal-400/10',
  },
  {
    id: 'testing',
    title: 'Testing',
    description: 'Unit, integration, and end-to-end testing with Jest.',
    icon: FlaskConical,
    estimatedHours: 3,
    color: 'text-emerald-400',
    bar: 'bg-emerald-400',
    tint: 'bg-emerald-400/10',
  },
  {
    id: 'microservices',
    title: 'Microservices',
    description: 'Saga, CQRS, event sourcing, circuit breakers, and distributed system patterns.',
    icon: GitMerge,
    estimatedHours: 6,
    color: 'text-pink-400',
    bar: 'bg-pink-400',
    tint: 'bg-pink-400/10',
  },
  {
    id: 'dsa',
    title: 'DSA Patterns',
    description: 'Algorithmic patterns that appear in backend interviews at EU tech companies.',
    icon: BrainCircuit,
    estimatedHours: 5,
    color: 'text-indigo-400',
    bar: 'bg-indigo-400',
    tint: 'bg-indigo-400/10',
  },
  {
    id: 'nexuspay',
    title: 'NexusPay Deep Dive',
    description: 'Own your flagship project. Every architectural decision, every flow, every trade-off — ready for interviews.',
    icon: Landmark,
    estimatedHours: 4,
    color: 'text-violet-400',
    bar: 'bg-violet-400',
    tint: 'bg-violet-400/10',
  },
];

export const courseConfigById: Record<string, CourseConfig> = Object.fromEntries(
  COURSES.map((c) => [c.id, c]),
);
