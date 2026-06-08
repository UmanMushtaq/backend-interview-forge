import type { DesignChallenge } from '../../types';
import { designChallenges } from './challenges';

export const allDesignChallenges: DesignChallenge[] = designChallenges;

export const designById: Record<string, DesignChallenge> = Object.fromEntries(
  designChallenges.map((d) => [d.id, d]),
);
