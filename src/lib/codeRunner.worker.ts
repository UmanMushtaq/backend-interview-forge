/// <reference lib="webworker" />

interface TestSpec {
  name: string;
  input: string;
  expectedOutput: unknown;
  isHidden?: boolean;
}
interface RunRequest {
  jsCode: string;
  tests: TestSpec[];
}
interface WorkerTestResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error?: string;
  isHidden?: boolean;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') {
    return Number.isNaN(a) && Number.isNaN(b);
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  const arrA = Array.isArray(a);
  const arrB = Array.isArray(b);
  if (arrA || arrB) {
    if (!arrA || !arrB || (a as unknown[]).length !== (b as unknown[]).length) return false;
    return (a as unknown[]).every((v, i) => deepEqual(v, (b as unknown[])[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.prototype.hasOwnProperty.call(bo, k) && deepEqual(ao[k], bo[k]));
}

function runOne(jsCode: string, t: TestSpec): Promise<WorkerTestResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r: WorkerTestResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    const timer = setTimeout(
      () =>
        finish({
          name: t.name,
          passed: false,
          expected: t.expectedOutput,
          actual: undefined,
          error: 'Timed out after 5000ms (possible infinite loop)',
          isHidden: t.isHidden,
        }),
      5000,
    );
    try {
      const body =
        '"use strict";\n' +
        'const module = { exports: {} };\n' +
        'const exports = module.exports;\n' +
        jsCode +
        '\nreturn (async () => {\n' +
        t.input +
        '\n})();';
      const fn = new Function(body);
      Promise.resolve(fn()).then(
        (actual) => {
          clearTimeout(timer);
          finish({
            name: t.name,
            passed: deepEqual(actual, t.expectedOutput),
            expected: t.expectedOutput,
            actual,
            isHidden: t.isHidden,
          });
        },
        (err: unknown) => {
          clearTimeout(timer);
          finish({
            name: t.name,
            passed: false,
            expected: t.expectedOutput,
            actual: undefined,
            error: err instanceof Error ? err.message : String(err),
            isHidden: t.isHidden,
          });
        },
      );
    } catch (err: unknown) {
      clearTimeout(timer);
      finish({
        name: t.name,
        passed: false,
        expected: t.expectedOutput,
        actual: undefined,
        error: err instanceof Error ? err.message : String(err),
        isHidden: t.isHidden,
      });
    }
  });
}

async function runAll(req: RunRequest): Promise<WorkerTestResult[]> {
  const out: WorkerTestResult[] = [];
  for (const t of req.tests) {
    // eslint-disable-next-line no-await-in-loop
    out.push(await runOne(req.jsCode, t));
  }
  return out;
}

self.onmessage = (e: MessageEvent<RunRequest>) => {
  runAll(e.data).then((results) => self.postMessage({ results }));
};
