import type { CodingProblem } from '../../types';

export const algorithms: CodingProblem[] = [
  {
    id: 'algorithms-debounce-001',
    title: 'Implement debounce',
    difficulty: 'easy',
    category: 'algorithms',
    description:
      'Implement debounce(fn, delayMs): return a function that delays invoking fn until delayMs have elapsed since the last call. Rapid calls collapse into one, using the most recent arguments.',
    starterCode: `export function debounce(fn: (...args: any[]) => void, delayMs: number) {
  // TODO
}
`,
    solution: `export function debounce(fn: (...args: any[]) => void, delayMs: number) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
`,
    testCases: [
      {
        name: 'invokes once after a burst of calls',
        input: 'let n = 0; const d = debounce(() => { n += 1; }, 20); d(); d(); d(); await new Promise((r) => setTimeout(r, 60)); return n;',
        expectedOutput: 1,
      },
      {
        name: 'uses the most recent arguments',
        input: 'let v = 0; const d = debounce((x) => { v = x; }, 20); d(1); d(2); d(3); await new Promise((r) => setTimeout(r, 60)); return v;',
        expectedOutput: 3,
      },
    ],
    hints: ['Hold a timer handle in a closure.', 'Clear the previous timer on every call before scheduling the new one.'],
    interviewContext:
      'Debounce probes closures and the event loop. It is the textbook fix for search-as-you-type and resize storms.',
  },
  {
    id: 'algorithms-deepclone-001',
    title: 'Deep clone',
    difficulty: 'hard',
    category: 'algorithms',
    description:
      'Implement deepClone(value) that recursively clones plain objects and arrays, and also handles Date, Map, and Set. Primitives are returned as-is. The clone must be fully independent of the original.',
    starterCode: `export function deepClone(value: any): any {
  // TODO
  return value;
}
`,
    solution: `export function deepClone(value: any): any {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof Map) {
    const out = new Map();
    for (const [k, v] of value) out.set(deepClone(k), deepClone(v));
    return out;
  }
  if (value instanceof Set) {
    const out = new Set();
    for (const v of value) out.add(deepClone(v));
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => deepClone(v));
  const out: any = {};
  for (const key of Object.keys(value)) out[key] = deepClone(value[key]);
  return out;
}
`,
    testCases: [
      {
        name: 'clone is independent of the original',
        input: "const o = { a: 1, b: { c: 2 }, d: [3, 4] }; const cl = deepClone(o); cl.b.c = 99; cl.d.push(5); return [o.b.c, o.d.length, cl.b.c, cl.d.length];",
        expectedOutput: [2, 2, 99, 3],
      },
      {
        name: 'handles Map values',
        input: "const m = new Map([['k', { n: 1 }]]); const cl = deepClone(m); cl.get('k').n = 7; return m.get('k').n;",
        expectedOutput: 1,
      },
    ],
    hints: ['Recurse on objects and arrays; copy primitives directly.', 'Handle Date, Map, and Set before the generic object branch.'],
    interviewContext:
      'Deep clone forces you to reason about reference vs value semantics and the prototype chain — and to ask whether structuredClone already exists in the runtime.',
  },
];
