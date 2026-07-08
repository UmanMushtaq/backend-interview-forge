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

/**
 * Minimal Jest-lite shim so "jest" category problems (which ask the user to
 * write real `describe`/`it`/`expect` test code) can run inside this sandbox,
 * which has no real module system or test runner. `describe`/`it` execute
 * immediately; async `it` bodies are awaited via `__jestPending` right after
 * the candidate's code block, before the grading `input` snippet runs.
 */
const JEST_SHIM = `
const __jestResults = [];
const __jestPending = [];
let __expectCalls = 0;
let __mockFnCount = 0;
let __usedFakeTimers = false;
let __fakeNow = Date.now();
function describe(_name, fn) { fn(); }
function it(name, fn) {
  try {
    const ret = fn();
    if (ret && typeof ret.then === 'function') {
      __jestPending.push(ret.then(
        () => { __jestResults.push({ name, passed: true }); },
        (e) => { __jestResults.push({ name, passed: false, error: e && e.message ? e.message : String(e) }); }
      ));
    } else {
      __jestResults.push({ name, passed: true });
    }
  } catch (e) {
    __jestResults.push({ name, passed: false, error: e && e.message ? e.message : String(e) });
  }
}
it.skip = function () {};
function __deepEq(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Number.isNaN(a) && Number.isNaN(b);
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const ak = Object.keys(a), bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && __deepEq(a[k], b[k]));
}
function expect(actual) {
  __expectCalls++;
  return {
    toBe(expected) { if (actual !== expected) throw new Error('expected ' + JSON.stringify(actual) + ' to be ' + JSON.stringify(expected)); },
    toEqual(expected) { if (!__deepEq(actual, expected)) throw new Error('expected ' + JSON.stringify(actual) + ' to equal ' + JSON.stringify(expected)); },
    toBeNull() { if (actual !== null) throw new Error('expected null, got ' + JSON.stringify(actual)); },
    toBeUndefined() { if (actual !== undefined) throw new Error('expected undefined, got ' + JSON.stringify(actual)); },
    toBeTruthy() { if (!actual) throw new Error('expected a truthy value'); },
    toBeFalsy() { if (actual) throw new Error('expected a falsy value'); },
    toBeGreaterThan(n) { if (!(actual > n)) throw new Error('expected ' + actual + ' > ' + n); },
    toBeLessThan(n) { if (!(actual < n)) throw new Error('expected ' + actual + ' < ' + n); },
    toThrow(msg) {
      if (typeof actual !== 'function') throw new Error('expect(...).toThrow() requires a function');
      let threw = false, err;
      try { actual(); } catch (e) { threw = true; err = e; }
      if (!threw) throw new Error('expected function to throw');
      if (msg && !String((err && err.message) || err).includes(msg)) throw new Error('expected error message to include "' + msg + '"');
    },
    toHaveBeenCalled() { if (!actual || !actual.mock || actual.mock.calls.length === 0) throw new Error('expected mock to have been called'); },
    toHaveBeenCalledTimes(n) { if (!actual || !actual.mock || actual.mock.calls.length !== n) throw new Error('expected mock to have been called ' + n + ' time(s)'); },
    toHaveBeenCalledWith(...args) {
      if (!actual || !actual.mock) throw new Error('expected a mock function');
      if (!actual.mock.calls.some((c) => __deepEq(c, args))) throw new Error('expected mock to have been called with ' + JSON.stringify(args));
    },
    not: {
      toBe(expected) { if (actual === expected) throw new Error('expected ' + JSON.stringify(actual) + ' not to be ' + JSON.stringify(expected)); },
      toEqual(expected) { if (__deepEq(actual, expected)) throw new Error('expected values not to be equal'); },
    },
  };
}
function __mockFn(defaultImpl) {
  __mockFnCount++;
  const fn = (...args) => {
    fn.mock.calls.push(args);
    if (fn.__impl) return fn.__impl(...args);
    if (defaultImpl) return defaultImpl(...args);
  };
  fn.mock = { calls: [] };
  fn.__impl = null;
  fn.mockImplementation = (impl) => { fn.__impl = impl; return fn; };
  fn.mockReturnValue = (v) => { fn.__impl = () => v; return fn; };
  fn.mockResolvedValue = (v) => { fn.__impl = () => Promise.resolve(v); return fn; };
  fn.mockRejectedValue = (v) => { fn.__impl = () => Promise.reject(v); return fn; };
  return fn;
}
const __realDateNow = Date.now.bind(Date);
const jest = {
  fn: __mockFn,
  useFakeTimers() { __usedFakeTimers = true; __fakeNow = __realDateNow(); Date.now = () => __fakeNow; },
  useRealTimers() { Date.now = __realDateNow; },
  advanceTimersByTime(ms) { __fakeNow += ms; },
  clearAllMocks() {},
};
`;

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
        JEST_SHIM +
        jsCode +
        '\nreturn (async () => {\n' +
        'await Promise.all(__jestPending);\n' +
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
