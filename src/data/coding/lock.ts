import type { CodingProblem } from '../../types';

export const lock: CodingProblem[] = [
  {
    id: 'lock-manager-001',
    title: 'In-memory lock manager',
    difficulty: 'easy',
    category: 'lock',
    description:
      'Implement a LockManager. acquire(key) returns true and takes the lock if it is free, or false if already held. release(key) frees it. isLocked(key) reports the current state.',
    starterCode: `export class LockManager {
  acquire(key: string): boolean {
    // TODO
    return false;
  }
  release(key: string): void {
    // TODO
  }
  isLocked(key: string): boolean {
    // TODO
    return false;
  }
}
`,
    solution: `export class LockManager {
  private held = new Set<string>();
  acquire(key: string): boolean {
    if (this.held.has(key)) return false;
    this.held.add(key);
    return true;
  }
  release(key: string): void {
    this.held.delete(key);
  }
  isLocked(key: string): boolean {
    return this.held.has(key);
  }
}
`,
    testCases: [
      {
        name: 'second acquire fails until release',
        input: "const m = new LockManager(); const a = m.acquire('k'); const b = m.acquire('k'); m.release('k'); const c = m.acquire('k'); return [a, b, c];",
        expectedOutput: [true, false, true],
      },
      {
        name: 'isLocked reflects state',
        input: "const m = new LockManager(); m.acquire('k'); const before = m.isLocked('k'); m.release('k'); return [before, m.isLocked('k')];",
        expectedOutput: [true, false],
      },
    ],
    hints: ['A Set of held keys is enough for the basic version.', 'acquire must check membership before adding.'],
    interviewContext:
      'A mutual-exclusion primitive is the basis of distributed locks. The natural follow-up is TTL expiry and fencing tokens for when a holder crashes.',
  },
];
