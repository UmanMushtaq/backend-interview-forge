import type { TestCase } from '../types';

export interface TestResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error?: string;
  isHidden?: boolean;
}

/** Transpile TypeScript to runnable CommonJS JS using the TS compiler. */
async function transpile(tsCode: string): Promise<string> {
  const ts = await import('typescript');
  const out = ts.transpileModule(tsCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2019,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  });
  return out.outputText;
}

function failAll(tests: TestCase[], error: string): TestResult[] {
  return tests.map((t) => ({
    name: t.name,
    passed: false,
    expected: t.expectedOutput,
    actual: undefined,
    error,
    isHidden: t.isHidden,
  }));
}

/**
 * Transpile the candidate's TypeScript in the main thread, then execute the
 * test cases inside a Web Worker so a runaway loop can be terminated.
 */
export async function runTests(tsCode: string, tests: TestCase[]): Promise<TestResult[]> {
  let jsCode: string;
  try {
    jsCode = await transpile(tsCode);
  } catch (err) {
    return failAll(tests, 'Compile error: ' + (err instanceof Error ? err.message : String(err)));
  }

  return new Promise<TestResult[]>((resolve) => {
    const worker = new Worker(new URL('./codeRunner.worker.ts', import.meta.url), {
      type: 'module',
    });
    const budgetMs = tests.length * 5000 + 2000;
    const master = setTimeout(() => {
      worker.terminate();
      resolve(failAll(tests, 'Execution timed out (possible infinite loop)'));
    }, budgetMs);

    worker.onmessage = (e: MessageEvent<{ results: TestResult[] }>) => {
      clearTimeout(master);
      worker.terminate();
      resolve(e.data.results);
    };
    worker.onerror = (e) => {
      clearTimeout(master);
      worker.terminate();
      resolve(failAll(tests, e.message || 'Worker error'));
    };

    worker.postMessage({ jsCode, tests });
  });
}
