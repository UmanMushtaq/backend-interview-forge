import type { CodingProblem } from '../../types';

export const rateLimiter: CodingProblem[] = [
  {
    id: 'ratelimiter-fixed-001',
    title: 'Fixed-window rate limiter',
    difficulty: 'easy',
    category: 'rate-limiter',
    description:
      'Implement a FixedWindowLimiter with isAllowed(clientId, maxRequests, windowMs). Within a window of windowMs, allow up to maxRequests calls per client; further calls return false until the window rolls over.',
    starterCode: `export class FixedWindowLimiter {
  isAllowed(clientId: string, maxRequests: number, windowMs: number): boolean {
    // TODO
    return true;
  }
}
`,
    solution: `export class FixedWindowLimiter {
  private windows = new Map<string, { start: number; count: number }>();
  isAllowed(clientId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const w = this.windows.get(clientId);
    if (!w || now - w.start >= windowMs) {
      this.windows.set(clientId, { start: now, count: 1 });
      return true;
    }
    if (w.count < maxRequests) {
      w.count += 1;
      return true;
    }
    return false;
  }
}
`,
    testCases: [
      {
        name: 'allows up to the limit then blocks',
        input: "const l = new FixedWindowLimiter(); const out = []; for (let i = 0; i < 4; i++) out.push(l.isAllowed('u', 3, 1000)); return out;",
        expectedOutput: [true, true, true, false],
      },
      {
        name: 'tracks clients independently',
        input: "const l = new FixedWindowLimiter(); l.isAllowed('a', 1, 1000); return l.isAllowed('b', 1, 1000);",
        expectedOutput: true,
      },
    ],
    hints: ['Store per-client window start time and a counter.', 'If the window has elapsed, reset start and count.'],
    interviewContext:
      'Fixed-window limiting is the simplest token-bucket cousin. Interviewers then ask about its burst-at-the-boundary weakness, which motivates the sliding window.',
  },
  {
    id: 'ratelimiter-sliding-001',
    title: 'Sliding-window rate limiter',
    difficulty: 'hard',
    category: 'rate-limiter',
    description:
      'Implement a SlidingWindowLimiter with isAllowed(clientId, maxRequests, windowMs). Allow a request only if fewer than maxRequests occurred within the trailing windowMs, using individual timestamps rather than a fixed bucket.',
    starterCode: `export class SlidingWindowLimiter {\n  isAllowed(clientId: string, maxRequests: number, windowMs: number): boolean {\n    // TODO\n    return true;\n  }\n}\n`,
    solution: `export class SlidingWindowLimiter {\n  private hits = new Map<string, number[]>();\n  isAllowed(clientId: string, maxRequests: number, windowMs: number): boolean {\n    const now = Date.now();\n    const recent = (this.hits.get(clientId) ?? []).filter((t) => now - t < windowMs);\n    if (recent.length < maxRequests) {\n      recent.push(now);\n      this.hits.set(clientId, recent);\n      return true;\n    }\n    this.hits.set(clientId, recent);\n    return false;\n  }\n}\n`,
    testCases: [
      {
        name: 'allows up to the limit then blocks within the window',
        input: "const l = new SlidingWindowLimiter(); const out = []; for (let i = 0; i < 4; i++) out.push(l.isAllowed('u', 3, 1000)); return out;",
        expectedOutput: [true, true, true, false],
      },
      {
        name: 'frees capacity after old timestamps age out',
        input: "const l = new SlidingWindowLimiter(); l.isAllowed('u', 1, 30); const blocked = l.isAllowed('u', 1, 30); await new Promise((r) => setTimeout(r, 50)); const after = l.isAllowed('u', 1, 30); return [blocked, after];",
        expectedOutput: [false, true],
      },
    ],
    hints: [
      'Keep an array of request timestamps per client.',
      'On each call drop timestamps older than the window, then compare the remaining count to the limit.',
    ],
    interviewContext:
      'The sliding window fixes the fixed-window burst-at-the-boundary flaw; the trade-off is storing timestamps, which you later approximate with counters in Redis.',
  },
];
