import type { SqlChallenge } from '../../types';
import { sqlChallenges } from './challenges';

export const allSqlChallenges: SqlChallenge[] = sqlChallenges;

export const sqlById: Record<string, SqlChallenge> = Object.fromEntries(
  sqlChallenges.map((s) => [s.id, s]),
);
