import type { CodingProblem } from '../../types';

export const cache: CodingProblem[] = [
  {
    id: 'cache-lru-001',
    title: 'LRU cache',
    difficulty: 'medium',
    category: 'cache',
    description:
      'Implement an LRUCache(capacity) with get(key) and set(key, value). When capacity is exceeded, evict the least-recently-used entry. A get or set counts as a use. get on a missing key returns undefined.',
    starterCode: `export class LRUCache {
  constructor(capacity: number) {
    // TODO
  }
  get(key: string): any {
    // TODO
    return undefined;
  }
  set(key: string, value: any): void {
    // TODO
  }
}
`,
    solution: `export class LRUCache {
  private cap: number;
  private map = new Map<string, any>();
  constructor(capacity: number) {
    this.cap = capacity;
  }
  get(key: string): any {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }
  set(key: string, value: any): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.cap) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }
}
`,
    testCases: [
      {
        name: 'keeps recently used, evicts the rest',
        input: "const c = new LRUCache(2); c.set('a', 1); c.set('b', 2); c.get('a'); c.set('c', 3); return [c.get('a'), c.get('c')];",
        expectedOutput: [1, 3],
      },
      {
        name: 'evicts the least-recently-used key',
        input: "const c = new LRUCache(2); c.set('a', 1); c.set('b', 2); c.get('a'); c.set('c', 3); return c.get('b') === undefined;",
        expectedOutput: true,
      },
    ],
    hints: ['A JS Map preserves insertion order — exploit that.', 'On use, delete then re-set the key so it becomes newest; evict map.keys().next().value when over capacity.'],
    interviewContext:
      'LRU is the canonical cache eviction question. Using Map ordering for O(1) operations shows you know the language as well as the algorithm.',
  },
];
