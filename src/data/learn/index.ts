import type { LearnModule } from '../../types';
import { javascript } from './javascript';
import { typescript } from './typescript';
import { nodejs } from './nodejs';
import { nestjs } from './nestjs';
import { postgresql } from './postgresql';
import { redis } from './redis';
import { rabbitmq } from './rabbitmq';
import { kafka } from './kafka';
import { systemDesign } from './system-design';
import { testing } from './testing';
import { microservices } from './microservices';
import { dsa } from './dsa';

// Ordered as a learning path: language fundamentals first, then runtime,
// frameworks, data stores, messaging, design, and testing.
export const LEARN_MODULES: LearnModule[] = [
  javascript,
  typescript,
  nodejs,
  nestjs,
  postgresql,
  redis,
  rabbitmq,
  kafka,
  systemDesign,
  testing,
  microservices,
  dsa,
];

export const moduleById: Record<string, LearnModule> = Object.fromEntries(
  LEARN_MODULES.map((m) => [m.id, m]),
);
