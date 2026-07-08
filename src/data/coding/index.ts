import type { CodingProblem } from '../../types';
import { diContainer } from './di-container';
import { saga } from './saga';
import { rateLimiter } from './rate-limiter';
import { lock } from './lock';
import { cache } from './cache';
import { eventEmitter } from './event-emitter';
import { algorithms } from './algorithms';
import { jestPractice } from './jest-practice';

export const allCodingProblems: CodingProblem[] = [
  ...diContainer,
  ...saga,
  ...rateLimiter,
  ...lock,
  ...cache,
  ...eventEmitter,
  ...algorithms,
  ...jestPractice,
];

export const codingById: Record<string, CodingProblem> = Object.fromEntries(
  allCodingProblems.map((p) => [p.id, p]),
);
