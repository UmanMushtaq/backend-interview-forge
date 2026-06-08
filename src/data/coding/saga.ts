import type { CodingProblem } from '../../types';

export const saga: CodingProblem[] = [
  {
    id: 'saga-sequence-001',
    title: 'Sequential step executor',
    difficulty: 'easy',
    category: 'saga',
    description:
      'Implement runSteps(steps) where steps is an array of async functions. Run them strictly in order (each awaited before the next) and return an array of their results.',
    starterCode: `export async function runSteps(steps: Array<() => Promise<any>>): Promise<any[]> {
  // TODO: run sequentially and collect results
  return [];
}
`,
    solution: `export async function runSteps(steps: Array<() => Promise<any>>): Promise<any[]> {
  const results: any[] = [];
  for (const step of steps) {
    results.push(await step());
  }
  return results;
}
`,
    testCases: [
      {
        name: 'runs steps in order and collects results',
        input: 'return await runSteps([() => Promise.resolve(1), async () => 2, async () => 3]);',
        expectedOutput: [1, 2, 3],
      },
    ],
    hints: ['A for...of loop with await runs sequentially; .map does not.', 'Push each awaited result into an array.'],
    interviewContext:
      'A saga orchestrator is fundamentally a sequential async runner. Getting ordering right (await inside the loop) is the first thing to demonstrate.',
  },
  {
    id: 'saga-rollback-001',
    title: 'Saga with compensation',
    difficulty: 'medium',
    category: 'saga',
    description:
      'Implement runSaga(steps), where each step is { action, compensate } (both async). Run actions in order. If an action throws, run compensate() for every already-completed step in REVERSE order, then return { ok: false, compensated: [indices] }. On full success return { ok: true, results, compensated: [] }.',
    starterCode: `interface SagaStep {
  action: () => Promise<any>;
  compensate: () => Promise<void>;
}

export async function runSaga(steps: SagaStep[]): Promise<any> {
  // TODO
  return { ok: true, results: [], compensated: [] };
}
`,
    solution: `interface SagaStep {
  action: () => Promise<any>;
  compensate: () => Promise<void>;
}

export async function runSaga(steps: SagaStep[]): Promise<any> {
  const results: any[] = [];
  const done: number[] = [];
  for (let i = 0; i < steps.length; i++) {
    try {
      results.push(await steps[i].action());
      done.push(i);
    } catch {
      const compensated: number[] = [];
      for (let j = done.length - 1; j >= 0; j--) {
        await steps[done[j]].compensate();
        compensated.push(done[j]);
      }
      return { ok: false, results, compensated };
    }
  }
  return { ok: true, results, compensated: [] };
}
`,
    testCases: [
      {
        name: 'returns results on success with no compensation',
        input: "const mk = (v) => ({ action: async () => v, compensate: async () => {} }); const r = await runSaga([mk(1), mk(2)]); return r;",
        expectedOutput: { ok: true, results: [1, 2], compensated: [] },
      },
      {
        name: 'compensates completed steps in reverse on failure',
        input: "const ok = (v) => ({ action: async () => v, compensate: async () => {} }); const bad = { action: async () => { throw new Error('x'); }, compensate: async () => {} }; const r = await runSaga([ok(1), ok(2), bad]); return r.compensated;",
        expectedOutput: [1, 0],
      },
    ],
    hints: ['Track the indices of completed steps.', 'On failure, iterate that list backwards calling compensate.'],
    interviewContext:
      'This is the heart of the Saga pattern for distributed transactions: forward actions plus compensating actions that undo work when a later step fails.',
  },
];
