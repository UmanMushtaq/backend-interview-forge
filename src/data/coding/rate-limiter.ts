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
];
