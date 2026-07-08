import type { CodingProblem } from '../../types';

// Jest-writing challenges: instead of implementing a function, the user
// writes real Jest test code (describe/it/expect/jest.fn) against an
// implementation that is already given in the file. A lightweight Jest-lite
// shim (describe/it/expect/jest) is injected by the runner sandbox, so these
// run as real executable test code, not string pattern matching. Grading
// inspects `__jestResults` (one entry per `it(...)` block that actually ran)
// and `__expectCalls` / `__mockFnCount` / `__usedFakeTimers` to verify the
// candidate wrote a real, passing, sufficiently thorough test suite.

export const jestPractice: CodingProblem[] = [
  {
    id: 'jest-001',
    title: 'Write tests for a sum function',
    difficulty: 'easy',
    category: 'jest',
    description:
      'You are given this implemented function. Write Jest tests that fully cover it including edge cases.\n\n```typescript\nfunction sum(a: number, b: number): number {\n  return a + b;\n}\n```\n\nYour tests should cover: basic addition, negative numbers, decimal numbers, and zero.',
    starterCode: `// Given implementation (do not modify):
function sum(a: number, b: number): number {
  return a + b;
}

describe('sum', () => {
  it('adds two positive numbers', () => {
    // write your test here
  });

  it('handles negative numbers', () => {
    // write your test here
  });

  it('handles zero', () => {
    // write your test here
  });

  it('handles decimals', () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
function sum(a: number, b: number): number {
  return a + b;
}

describe('sum', () => {
  it('adds two positive numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });

  it('handles negative numbers', () => {
    expect(sum(-2, -3)).toBe(-5);
    expect(sum(-2, 3)).toBe(1);
  });

  it('handles zero', () => {
    expect(sum(0, 0)).toBe(0);
    expect(sum(5, 0)).toBe(5);
  });

  it('handles decimals', () => {
    expect(sum(0.1, 0.2)).toBeGreaterThan(0.29);
  });
});
`,
    testCases: [
      {
        name: 'writes at least 4 passing tests',
        input: 'return __jestResults.length >= 4 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'uses a meaningful number of assertions',
        input: 'return __expectCalls >= 4;',
        expectedOutput: true,
      },
      {
        name: 'covers the negative-number case',
        input: "return __jestResults.some((r) => /negative/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Use expect(sum(a, b)).toBe(expected) for each scenario.',
      'Negative + positive numbers should still just add normally.',
      'Floating point addition can be imprecise, so avoid exact equality on decimals.',
    ],
    interviewContext:
      'Interviewers use trivial functions like this to see whether you actually think about edge cases (zero, negatives, floats) instead of writing a single happy-path test.',
  },
  {
    id: 'jest-002',
    title: 'Write tests for a stack implementation',
    difficulty: 'easy',
    category: 'jest',
    description:
      'Write Jest tests for this Stack class.\n\n```typescript\nclass Stack<T> {\n  private items: T[] = [];\n  push(item: T): void { this.items.push(item); }\n  pop(): T | undefined { return this.items.pop(); }\n  peek(): T | undefined { return this.items[this.items.length - 1]; }\n  isEmpty(): boolean { return this.items.length === 0; }\n  size(): number { return this.items.length; }\n}\n```\n\nCover: push and pop, peek without removing, isEmpty on empty and non-empty stack, popping from empty stack.',
    starterCode: `// Given implementation (do not modify):
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
}

describe('Stack', () => {
  it('pushes and pops in LIFO order', () => {
    // write your test here
  });

  it('peek does not remove the item', () => {
    // write your test here
  });

  it('isEmpty reflects the current state', () => {
    // write your test here
  });

  it('pop on an empty stack returns undefined', () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
}

describe('Stack', () => {
  it('pushes and pops in LIFO order', () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    expect(s.pop()).toBe(2);
    expect(s.pop()).toBe(1);
  });

  it('peek does not remove the item', () => {
    const s = new Stack<number>();
    s.push(1);
    expect(s.peek()).toBe(1);
    expect(s.size()).toBe(1);
  });

  it('isEmpty reflects the current state', () => {
    const s = new Stack<number>();
    expect(s.isEmpty()).toBe(true);
    s.push(1);
    expect(s.isEmpty()).toBe(false);
  });

  it('pop on an empty stack returns undefined', () => {
    const s = new Stack<number>();
    expect(s.pop()).toBeUndefined();
  });
});
`,
    testCases: [
      {
        name: 'writes at least 4 passing tests',
        input: 'return __jestResults.length >= 4 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'uses a meaningful number of assertions',
        input: 'return __expectCalls >= 5;',
        expectedOutput: true,
      },
      {
        name: 'covers the empty-stack pop case',
        input: "return __jestResults.some((r) => /empty/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Push a couple of items, then assert pop() returns them in reverse order.',
      'peek() should leave size() unchanged.',
      'An empty stack popping should not throw - check what it actually returns.',
    ],
    interviewContext:
      'Data structure classes are a classic warm-up for testing discipline: does the candidate test state transitions (empty -> non-empty) or just one call in isolation?',
  },
  {
    id: 'jest-003',
    title: 'Write tests for a bank account',
    difficulty: 'easy',
    category: 'jest',
    description:
      'Write Jest tests for this BankAccount class. Make sure your tests catch bugs in deposit, withdraw, and balance validation.\n\n```typescript\nclass BankAccount {\n  private balance: number;\n  constructor(initialBalance: number) {\n    if (initialBalance < 0) throw new Error("Initial balance cannot be negative");\n    this.balance = initialBalance;\n  }\n  deposit(amount: number): void {\n    if (amount <= 0) throw new Error("Deposit amount must be positive");\n    this.balance += amount;\n  }\n  withdraw(amount: number): void {\n    if (amount <= 0) throw new Error("Withdrawal amount must be positive");\n    if (amount > this.balance) throw new Error("Insufficient funds");\n    this.balance -= amount;\n  }\n  getBalance(): number { return this.balance; }\n}\n```\n\nYour tests must cover: successful deposit, successful withdrawal, negative initial balance throws, insufficient funds throws, invalid deposit amount throws.',
    starterCode: `// Given implementation (do not modify):
class BankAccount {
  private balance: number;
  constructor(initialBalance: number) {
    if (initialBalance < 0) throw new Error("Initial balance cannot be negative");
    this.balance = initialBalance;
  }
  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Deposit amount must be positive");
    this.balance += amount;
  }
  withdraw(amount: number): void {
    if (amount <= 0) throw new Error("Withdrawal amount must be positive");
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
  }
  getBalance(): number { return this.balance; }
}

describe('BankAccount', () => {
  it('deposits successfully', () => {
    // write your test here
  });

  it('withdraws successfully', () => {
    // write your test here
  });

  it('throws on negative initial balance', () => {
    // write your test here
  });

  it('throws on insufficient funds', () => {
    // write your test here
  });

  it('throws on invalid deposit amount', () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
class BankAccount {
  private balance: number;
  constructor(initialBalance: number) {
    if (initialBalance < 0) throw new Error("Initial balance cannot be negative");
    this.balance = initialBalance;
  }
  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Deposit amount must be positive");
    this.balance += amount;
  }
  withdraw(amount: number): void {
    if (amount <= 0) throw new Error("Withdrawal amount must be positive");
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
  }
  getBalance(): number { return this.balance; }
}

describe('BankAccount', () => {
  it('deposits successfully', () => {
    const acc = new BankAccount(100);
    acc.deposit(50);
    expect(acc.getBalance()).toBe(150);
  });

  it('withdraws successfully', () => {
    const acc = new BankAccount(100);
    acc.withdraw(40);
    expect(acc.getBalance()).toBe(60);
  });

  it('throws on negative initial balance', () => {
    expect(() => new BankAccount(-10)).toThrow('Initial balance cannot be negative');
  });

  it('throws on insufficient funds', () => {
    const acc = new BankAccount(10);
    expect(() => acc.withdraw(20)).toThrow('Insufficient funds');
  });

  it('throws on invalid deposit amount', () => {
    const acc = new BankAccount(10);
    expect(() => acc.deposit(0)).toThrow('Deposit amount must be positive');
  });
});
`,
    testCases: [
      {
        name: 'writes at least 5 passing tests',
        input: 'return __jestResults.length >= 5 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'uses a meaningful number of assertions',
        input: 'return __expectCalls >= 5;',
        expectedOutput: true,
      },
      {
        name: 'covers both error-throwing scenarios',
        input:
          "return __jestResults.some((r) => /insufficient|withdraw/i.test(r.name)) && __jestResults.some((r) => /negative|deposit|invalid/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Wrap the call in an arrow function before passing it to expect().toThrow(): expect(() => acc.withdraw(999)).toThrow(...)',
      'toThrow can take a substring of the expected error message.',
      'Test the boundary: withdrawing exactly the current balance should succeed, more than it should throw.',
    ],
    interviewContext:
      'Financial code is exactly where untested error paths become production incidents. Interviewers look for whether you test the failure modes, not just the happy path.',
  },
  {
    id: 'jest-004',
    title: 'Write tests for an async fetchUser function',
    difficulty: 'medium',
    category: 'jest',
    description:
      'Write Jest tests for this async function that fetches a user. You must mock the fetch call and test both success and error cases.\n\n```typescript\nasync function fetchUser(id: string): Promise<{ id: string; name: string }> {\n  const response = await fetch(`/api/users/${id}`);\n  if (!response.ok) throw new Error(`User not found: ${id}`);\n  return response.json();\n}\n```\n\nCover: successful fetch returns user data, failed fetch (non-ok response) throws an error, correct URL is called with the given id.',
    starterCode: `// Given implementation (do not modify):
async function fetchUser(id: string): Promise<{ id: string; name: string }> {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) throw new Error(\`User not found: \${id}\`);
  return response.json();
}

describe('fetchUser', () => {
  it('returns user data on a successful fetch', async () => {
    // mock globalThis.fetch with jest.fn() and write your test here
  });

  it('throws when the response is not ok', async () => {
    // write your test here
  });

  it('calls fetch with the correct URL', async () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
async function fetchUser(id: string): Promise<{ id: string; name: string }> {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) throw new Error(\`User not found: \${id}\`);
  return response.json();
}

describe('fetchUser', () => {
  it('returns user data on a successful fetch', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Ada' }),
    });
    const user = await fetchUser('1');
    expect(user).toEqual({ id: '1', name: 'Ada' });
  });

  it('throws when the response is not ok', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
    try {
      await fetchUser('missing');
      throw new Error('should have thrown');
    } catch (e: unknown) {
      expect((e as Error).message).toBe('User not found: missing');
    }
  });

  it('calls fetch with the correct URL', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: '1', name: 'Ada' }) });
    globalThis.fetch = mockFetch;
    await fetchUser('42');
    expect(mockFetch).toHaveBeenCalledWith('/api/users/42');
  });
});
`,
    testCases: [
      {
        name: 'writes at least 3 passing tests',
        input: 'return __jestResults.length >= 3 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'mocks a dependency with jest.fn()',
        input: 'return __mockFnCount >= 1;',
        expectedOutput: true,
      },
      {
        name: 'covers the error-throwing case',
        input: "return __jestResults.some((r) => /throw|error|not.*ok/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Replace globalThis.fetch with jest.fn() so no real network call happens.',
      'mockResolvedValue(...) lets you fake an async return value.',
      'Wrap the throwing call in try/catch, or use expect(() => ...).toThrow with an async IIFE.',
    ],
    interviewContext:
      'Testing code with I/O side effects requires isolating the dependency. This is the same skill as mocking a repository or an HTTP client in a NestJS service test.',
  },
  {
    id: 'jest-005',
    title: 'Write tests for a rate limiter',
    difficulty: 'medium',
    category: 'jest',
    description:
      'Write Jest tests for this RateLimiter. Use jest.useFakeTimers() to control time.\n\n```typescript\nclass RateLimiter {\n  private requests: Map<string, number[]> = new Map();\n\n  isAllowed(clientId: string, maxRequests: number, windowMs: number): boolean {\n    const now = Date.now();\n    const timestamps = (this.requests.get(clientId) ?? [])\n      .filter(t => now - t < windowMs);\n    if (timestamps.length >= maxRequests) {\n      this.requests.set(clientId, timestamps);\n      return false;\n    }\n    timestamps.push(now);\n    this.requests.set(clientId, timestamps);\n    return true;\n  }\n}\n```\n\nCover: allows requests within limit, blocks when limit exceeded, resets after window expires (use jest.advanceTimersByTime), different clients are tracked independently.',
    starterCode: `// Given implementation (do not modify):
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(clientId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = (this.requests.get(clientId) ?? [])
      .filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      this.requests.set(clientId, timestamps);
      return false;
    }
    timestamps.push(now);
    this.requests.set(clientId, timestamps);
    return true;
  }
}

describe('RateLimiter', () => {
  beforeEachIsNotSupportedHere: {
    // instantiate a fresh RateLimiter inside each test instead of a beforeEach
  }

  it('allows requests within the limit', () => {
    // write your test here
  });

  it('blocks requests once the limit is exceeded', () => {
    // write your test here
  });

  it('resets after the window expires', () => {
    // use jest.useFakeTimers() and jest.advanceTimersByTime()
  });

  it('tracks different clients independently', () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(clientId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = (this.requests.get(clientId) ?? [])
      .filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      this.requests.set(clientId, timestamps);
      return false;
    }
    timestamps.push(now);
    this.requests.set(clientId, timestamps);
    return true;
  }
}

describe('RateLimiter', () => {
  it('allows requests within the limit', () => {
    const limiter = new RateLimiter();
    expect(limiter.isAllowed('a', 2, 1000)).toBe(true);
    expect(limiter.isAllowed('a', 2, 1000)).toBe(true);
  });

  it('blocks requests once the limit is exceeded', () => {
    const limiter = new RateLimiter();
    limiter.isAllowed('a', 1, 1000);
    expect(limiter.isAllowed('a', 1, 1000)).toBe(false);
  });

  it('resets after the window expires', () => {
    jest.useFakeTimers();
    const limiter = new RateLimiter();
    limiter.isAllowed('a', 1, 1000);
    expect(limiter.isAllowed('a', 1, 1000)).toBe(false);
    jest.advanceTimersByTime(1001);
    expect(limiter.isAllowed('a', 1, 1000)).toBe(true);
  });

  it('tracks different clients independently', () => {
    const limiter = new RateLimiter();
    limiter.isAllowed('a', 1, 1000);
    expect(limiter.isAllowed('b', 1, 1000)).toBe(true);
  });
});
`,
    testCases: [
      {
        name: 'writes at least 4 passing tests',
        input: 'return __jestResults.length >= 4 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'uses fake timers to test window expiry',
        input: 'return __usedFakeTimers === true;',
        expectedOutput: true,
      },
      {
        name: 'covers independent client tracking',
        input: "return __jestResults.some((r) => /client/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'jest.useFakeTimers() lets Date.now() be advanced deterministically instead of using real setTimeout delays.',
      'jest.advanceTimersByTime(ms) moves the fake clock forward before your next assertion.',
      'Since there is no beforeEach in this sandbox, create a fresh RateLimiter inside each it() block.',
    ],
    interviewContext:
      'Testing time-dependent code without fake timers leads to slow, flaky tests. Knowing jest.useFakeTimers() is a strong signal in interviews for rate limiters, TTL caches, and token buckets.',
  },
  {
    id: 'jest-006',
    title: 'Write tests for a NestJS service using mocks',
    difficulty: 'medium',
    category: 'jest',
    description:
      'Write Jest tests for this UserService. Mock the userRepository dependency.\n\n```typescript\ninterface UserRepository {\n  findById(id: string): Promise<{ id: string; email: string } | null>;\n  save(user: { email: string }): Promise<{ id: string; email: string }>;\n}\n\nclass UserService {\n  constructor(private userRepository: UserRepository) {}\n\n  async getUser(id: string): Promise<{ id: string; email: string }> {\n    const user = await this.userRepository.findById(id);\n    if (!user) throw new Error(`User ${id} not found`);\n    return user;\n  }\n\n  async createUser(email: string): Promise<{ id: string; email: string }> {\n    return this.userRepository.save({ email });\n  }\n}\n```\n\nCover: getUser returns the user when found, getUser throws when not found, createUser calls save with the correct email, verify the repository was called with the right arguments using expect(mockFn).toHaveBeenCalledWith().',
    starterCode: `// Given implementation (do not modify):
interface UserRepository {
  findById(id: string): Promise<{ id: string; email: string } | null>;
  save(user: { email: string }): Promise<{ id: string; email: string }>;
}

class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUser(id: string): Promise<{ id: string; email: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error(\`User \${id} not found\`);
    return user;
  }

  async createUser(email: string): Promise<{ id: string; email: string }> {
    return this.userRepository.save({ email });
  }
}

describe('UserService', () => {
  it('returns the user when found', async () => {
    // build a fake repository with jest.fn() and write your test here
  });

  it('throws when the user is not found', async () => {
    // write your test here
  });

  it('createUser calls save with the correct email', async () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
interface UserRepository {
  findById(id: string): Promise<{ id: string; email: string } | null>;
  save(user: { email: string }): Promise<{ id: string; email: string }>;
}

class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUser(id: string): Promise<{ id: string; email: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error(\`User \${id} not found\`);
    return user;
  }

  async createUser(email: string): Promise<{ id: string; email: string }> {
    return this.userRepository.save({ email });
  }
}

describe('UserService', () => {
  it('returns the user when found', async () => {
    const repo = { findById: jest.fn().mockResolvedValue({ id: '1', email: 'a@b.com' }), save: jest.fn() };
    const service = new UserService(repo as any);
    const user = await service.getUser('1');
    expect(user).toEqual({ id: '1', email: 'a@b.com' });
  });

  it('throws when the user is not found', async () => {
    const repo = { findById: jest.fn().mockResolvedValue(null), save: jest.fn() };
    const service = new UserService(repo as any);
    try {
      await service.getUser('99');
      throw new Error('should have thrown');
    } catch (e: unknown) {
      expect((e as Error).message).toBe('User 99 not found');
    }
  });

  it('createUser calls save with the correct email', async () => {
    const repo = { findById: jest.fn(), save: jest.fn().mockResolvedValue({ id: '2', email: 'x@y.com' }) };
    const service = new UserService(repo as any);
    await service.createUser('x@y.com');
    expect(repo.save).toHaveBeenCalledWith({ email: 'x@y.com' });
  });
});
`,
    testCases: [
      {
        name: 'writes at least 3 passing tests',
        input: 'return __jestResults.length >= 3 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'mocks the repository dependency',
        input: 'return __mockFnCount >= 2;',
        expectedOutput: true,
      },
      {
        name: 'covers the not-found error path',
        input: "return __jestResults.some((r) => /not found|throw/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Build a fake repository object with jest.fn() for each method you need.',
      'mockResolvedValue(...) simulates an async database result without a real DB.',
      'toHaveBeenCalledWith(...) verifies the exact arguments passed to the mock.',
    ],
    interviewContext:
      'This is the day-to-day shape of NestJS service tests: mock the repository/provider, assert on behavior and on calls, never hit a real database in a unit test.',
  },
  {
    id: 'jest-007',
    title: 'Write tests for an event emitter',
    difficulty: 'medium',
    category: 'jest',
    description:
      'Write Jest tests for this simple EventEmitter. Use jest.fn() to verify callbacks are called.\n\n```typescript\nclass EventEmitter {\n  private listeners: Map<string, Function[]> = new Map();\n\n  on(event: string, listener: Function): void {\n    const existing = this.listeners.get(event) ?? [];\n    this.listeners.set(event, [...existing, listener]);\n  }\n\n  off(event: string, listener: Function): void {\n    const existing = this.listeners.get(event) ?? [];\n    this.listeners.set(event, existing.filter(l => l !== listener));\n  }\n\n  emit(event: string, ...args: unknown[]): void {\n    (this.listeners.get(event) ?? []).forEach(l => l(...args));\n  }\n}\n```\n\nCover: listener is called when event emits, listener receives correct arguments, off removes the listener, multiple listeners all fire, removing one listener does not affect others.',
    starterCode: `// Given implementation (do not modify):
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, listener]);
  }

  off(event: string, listener: Function): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, existing.filter(l => l !== listener));
  }

  emit(event: string, ...args: unknown[]): void {
    (this.listeners.get(event) ?? []).forEach(l => l(...args));
  }
}

describe('EventEmitter', () => {
  it('calls the listener when the event is emitted', () => {
    // write your test here
  });

  it('passes the correct arguments to the listener', () => {
    // write your test here
  });

  it('off removes the listener', () => {
    // write your test here
  });

  it('multiple listeners all fire', () => {
    // write your test here
  });

  it('removing one listener does not affect others', () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, listener]);
  }

  off(event: string, listener: Function): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, existing.filter(l => l !== listener));
  }

  emit(event: string, ...args: unknown[]): void {
    (this.listeners.get(event) ?? []).forEach(l => l(...args));
  }
}

describe('EventEmitter', () => {
  it('calls the listener when the event is emitted', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.on('ping', listener);
    emitter.emit('ping');
    expect(listener).toHaveBeenCalled();
  });

  it('passes the correct arguments to the listener', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.on('greet', listener);
    emitter.emit('greet', 'hello', 42);
    expect(listener).toHaveBeenCalledWith('hello', 42);
  });

  it('off removes the listener', () => {
    const emitter = new EventEmitter();
    const listener = jest.fn();
    emitter.on('ping', listener);
    emitter.off('ping', listener);
    emitter.emit('ping');
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('multiple listeners all fire', () => {
    const emitter = new EventEmitter();
    const a = jest.fn();
    const b = jest.fn();
    emitter.on('ping', a);
    emitter.on('ping', b);
    emitter.emit('ping');
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });

  it('removing one listener does not affect others', () => {
    const emitter = new EventEmitter();
    const a = jest.fn();
    const b = jest.fn();
    emitter.on('ping', a);
    emitter.on('ping', b);
    emitter.off('ping', a);
    emitter.emit('ping');
    expect(a).toHaveBeenCalledTimes(0);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
`,
    testCases: [
      {
        name: 'writes at least 5 passing tests',
        input: 'return __jestResults.length >= 5 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'uses jest.fn() mocks for listeners',
        input: 'return __mockFnCount >= 2;',
        expectedOutput: true,
      },
      {
        name: 'covers listener removal',
        input: "return __jestResults.some((r) => /remov|off/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'jest.fn() creates a spy you can pass in as the listener itself.',
      'toHaveBeenCalledWith checks the exact arguments emit() passed through.',
      'Test that off() only removes the specific listener reference, not all listeners for that event.',
    ],
    interviewContext:
      'Pub/sub primitives show up everywhere (WebSocket gateways, domain events, RxJS subjects). Testing add/remove/fire-once-per-listener catches the classic "removes everything" bug.',
  },
  {
    id: 'jest-008',
    title: 'Write tests for a JWT utility',
    difficulty: 'hard',
    category: 'jest',
    description:
      'Write Jest tests for this JWT utility. Mock the underlying JWT library dependency rather than calling a real signing library.\n\n```typescript\ninterface JwtLib {\n  sign(payload: Record<string, unknown>, secret: string, opts: { expiresIn: string }): string;\n  verify(token: string, secret: string): Record<string, unknown>;\n}\n\nclass JwtUtil {\n  constructor(private jwtLib: JwtLib, private secret: string, private expiresIn: string = "15m") {}\n\n  sign(payload: Record<string, unknown>): string {\n    return this.jwtLib.sign(payload, this.secret, { expiresIn: this.expiresIn });\n  }\n\n  verify(token: string): Record<string, unknown> {\n    try {\n      return this.jwtLib.verify(token, this.secret);\n    } catch {\n      throw new Error("Invalid or expired token");\n    }\n  }\n}\n```\n\nCover: sign calls jwtLib.sign with correct payload and secret, verify calls jwtLib.verify with correct token and secret, verify throws a clean error when jwtLib.verify throws, the error message is always "Invalid or expired token" regardless of the underlying error.',
    starterCode: `// Given implementation (do not modify). jwtLib stands in for the
// "jsonwebtoken" library so it can be mocked with jest.fn() in this sandbox.
interface JwtLib {
  sign(payload: Record<string, unknown>, secret: string, opts: { expiresIn: string }): string;
  verify(token: string, secret: string): Record<string, unknown>;
}

class JwtUtil {
  constructor(private jwtLib: JwtLib, private secret: string, private expiresIn: string = "15m") {}

  sign(payload: Record<string, unknown>): string {
    return this.jwtLib.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): Record<string, unknown> {
    try {
      return this.jwtLib.verify(token, this.secret);
    } catch {
      throw new Error("Invalid or expired token");
    }
  }
}

describe('JwtUtil', () => {
  it('sign calls jwtLib.sign with the correct payload and secret', () => {
    // write your test here
  });

  it('verify calls jwtLib.verify with the correct token and secret', () => {
    // write your test here
  });

  it('verify throws a clean error when the underlying library throws', () => {
    // write your test here
  });

  it('the error message is always "Invalid or expired token"', () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify).
interface JwtLib {
  sign(payload: Record<string, unknown>, secret: string, opts: { expiresIn: string }): string;
  verify(token: string, secret: string): Record<string, unknown>;
}

class JwtUtil {
  constructor(private jwtLib: JwtLib, private secret: string, private expiresIn: string = "15m") {}

  sign(payload: Record<string, unknown>): string {
    return this.jwtLib.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): Record<string, unknown> {
    try {
      return this.jwtLib.verify(token, this.secret);
    } catch {
      throw new Error("Invalid or expired token");
    }
  }
}

describe('JwtUtil', () => {
  it('sign calls jwtLib.sign with the correct payload and secret', () => {
    const jwtLib = { sign: jest.fn().mockReturnValue('signed-token'), verify: jest.fn() };
    const util = new JwtUtil(jwtLib as any, 'my-secret');
    util.sign({ userId: '1' });
    expect(jwtLib.sign).toHaveBeenCalledWith({ userId: '1' }, 'my-secret', { expiresIn: '15m' });
  });

  it('verify calls jwtLib.verify with the correct token and secret', () => {
    const jwtLib = { sign: jest.fn(), verify: jest.fn().mockReturnValue({ userId: '1' }) };
    const util = new JwtUtil(jwtLib as any, 'my-secret');
    util.verify('abc.def.ghi');
    expect(jwtLib.verify).toHaveBeenCalledWith('abc.def.ghi', 'my-secret');
  });

  it('verify throws a clean error when the underlying library throws', () => {
    const jwtLib = { sign: jest.fn(), verify: jest.fn().mockImplementation(() => { throw new Error('jwt expired'); }) };
    const util = new JwtUtil(jwtLib as any, 'my-secret');
    expect(() => util.verify('bad-token')).toThrow('Invalid or expired token');
  });

  it('the error message is always "Invalid or expired token"', () => {
    const jwtLib = { sign: jest.fn(), verify: jest.fn().mockImplementation(() => { throw new TypeError('totally different'); }) };
    const util = new JwtUtil(jwtLib as any, 'my-secret');
    try {
      util.verify('bad-token');
      throw new Error('should have thrown');
    } catch (e: unknown) {
      expect((e as Error).message).toBe('Invalid or expired token');
    }
  });
});
`,
    testCases: [
      {
        name: 'writes at least 4 passing tests',
        input: 'return __jestResults.length >= 4 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'mocks the JWT library dependency',
        input: 'return __mockFnCount >= 2;',
        expectedOutput: true,
      },
      {
        name: 'verifies exact call arguments to the mock',
        input: "return __jestResults.some((r) => /sign|verify.*call|correct/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Pass a fake jwtLib object with jest.fn() methods into the JwtUtil constructor.',
      'mockImplementation(() => { throw ... }) simulates an expired/invalid token.',
      'The error message should never leak the real error - always assert the exact wrapped message.',
    ],
    interviewContext:
      'Auth code hides a common bug: leaking internal error details to callers. Testing that verify() always normalizes the error message is exactly the kind of thing security-conscious reviewers check for.',
  },
  {
    id: 'jest-009',
    title: 'Write tests for a distributed lock',
    difficulty: 'hard',
    category: 'jest',
    description:
      'Write Jest tests for this DistributedLock. Mock the Redis client.\n\n```typescript\ninterface RedisClient {\n  set(key: string, value: string, options: { NX: boolean; PX: number }): Promise<string | null>;\n  del(key: string): Promise<number>;\n}\n\nclass DistributedLock {\n  constructor(private redis: RedisClient) {}\n\n  async acquire(key: string, ttlMs: number): Promise<boolean> {\n    const result = await this.redis.set(`lock:${key}`, "1", { NX: true, PX: ttlMs });\n    return result !== null;\n  }\n\n  async release(key: string): Promise<void> {\n    await this.redis.del(`lock:${key}`);\n  }\n}\n```\n\nCover: acquire returns true when Redis returns a value (lock acquired), acquire returns false when Redis returns null (already locked), release calls del with the correct prefixed key, the lock key is always prefixed with "lock:".',
    starterCode: `// Given implementation (do not modify):
interface RedisClient {
  set(key: string, value: string, options: { NX: boolean; PX: number }): Promise<string | null>;
  del(key: string): Promise<number>;
}

class DistributedLock {
  constructor(private redis: RedisClient) {}

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(\`lock:\${key}\`, "1", { NX: true, PX: ttlMs });
    return result !== null;
  }

  async release(key: string): Promise<void> {
    await this.redis.del(\`lock:\${key}\`);
  }
}

describe('DistributedLock', () => {
  it('acquire returns true when the lock is acquired', async () => {
    // write your test here
  });

  it('acquire returns false when already locked', async () => {
    // write your test here
  });

  it('release calls del with the correctly prefixed key', async () => {
    // write your test here
  });

  it('the lock key is always prefixed with "lock:"', async () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
interface RedisClient {
  set(key: string, value: string, options: { NX: boolean; PX: number }): Promise<string | null>;
  del(key: string): Promise<number>;
}

class DistributedLock {
  constructor(private redis: RedisClient) {}

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(\`lock:\${key}\`, "1", { NX: true, PX: ttlMs });
    return result !== null;
  }

  async release(key: string): Promise<void> {
    await this.redis.del(\`lock:\${key}\`);
  }
}

describe('DistributedLock', () => {
  it('acquire returns true when the lock is acquired', async () => {
    const redis = { set: jest.fn().mockResolvedValue('OK'), del: jest.fn() };
    const lock = new DistributedLock(redis as any);
    const result = await lock.acquire('order-1', 30000);
    expect(result).toBe(true);
  });

  it('acquire returns false when already locked', async () => {
    const redis = { set: jest.fn().mockResolvedValue(null), del: jest.fn() };
    const lock = new DistributedLock(redis as any);
    const result = await lock.acquire('order-1', 30000);
    expect(result).toBe(false);
  });

  it('release calls del with the correctly prefixed key', async () => {
    const redis = { set: jest.fn(), del: jest.fn().mockResolvedValue(1) };
    const lock = new DistributedLock(redis as any);
    await lock.release('order-1');
    expect(redis.del).toHaveBeenCalledWith('lock:order-1');
  });

  it('the lock key is always prefixed with "lock:"', async () => {
    const redis = { set: jest.fn().mockResolvedValue('OK'), del: jest.fn() };
    const lock = new DistributedLock(redis as any);
    await lock.acquire('payment-42', 5000);
    expect(redis.set).toHaveBeenCalledWith('lock:payment-42', '1', { NX: true, PX: 5000 });
  });
});
`,
    testCases: [
      {
        name: 'writes at least 4 passing tests',
        input: 'return __jestResults.length >= 4 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'mocks the Redis client dependency',
        input: 'return __mockFnCount >= 2;',
        expectedOutput: true,
      },
      {
        name: 'covers both acquired and already-locked outcomes',
        input: "return __jestResults.some((r) => /true|acquire/i.test(r.name)) && __jestResults.some((r) => /false|already/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Mock redis.set to resolve to a string ("OK") for the success path and null for the already-locked path.',
      'Assert the exact NX/PX options object passed to redis.set.',
      'release() should always operate on the prefixed key, never the raw key.',
    ],
    interviewContext:
      'Distributed locks built on SET NX PX are a recurring fintech interview topic (preventing double-spends). Testing both branches of the boolean result is the key signal here.',
  },
  {
    id: 'jest-010',
    title: 'Write tests for a Saga orchestrator',
    difficulty: 'hard',
    category: 'jest',
    description:
      'Write Jest tests for this simple Saga. Mock the wallet service calls and verify compensating transactions run on failure.\n\n```typescript\ninterface WalletService {\n  debit(walletId: string, amount: number): Promise<void>;\n  credit(walletId: string, amount: number): Promise<void>;\n}\n\nclass TransferSaga {\n  constructor(private walletService: WalletService) {}\n\n  async execute(fromId: string, toId: string, amount: number): Promise<void> {\n    await this.walletService.debit(fromId, amount);\n    try {\n      await this.walletService.credit(toId, amount);\n    } catch (error) {\n      await this.walletService.credit(fromId, amount); // compensate\n      throw new Error("Transfer failed, amount returned to sender");\n    }\n  }\n}\n```\n\nCover: successful transfer calls debit then credit in order, when credit fails the compensating credit is called on the sender, when credit fails the error message is "Transfer failed, amount returned to sender", debit is always called exactly once regardless of outcome.',
    starterCode: `// Given implementation (do not modify):
interface WalletService {
  debit(walletId: string, amount: number): Promise<void>;
  credit(walletId: string, amount: number): Promise<void>;
}

class TransferSaga {
  constructor(private walletService: WalletService) {}

  async execute(fromId: string, toId: string, amount: number): Promise<void> {
    await this.walletService.debit(fromId, amount);
    try {
      await this.walletService.credit(toId, amount);
    } catch (error) {
      await this.walletService.credit(fromId, amount); // compensate
      throw new Error("Transfer failed, amount returned to sender");
    }
  }
}

describe('TransferSaga', () => {
  it('calls debit then credit in order on a successful transfer', async () => {
    // write your test here
  });

  it('compensates by crediting the sender when credit fails', async () => {
    // write your test here
  });

  it('surfaces a clean error message when credit fails', async () => {
    // write your test here
  });

  it('debit is always called exactly once', async () => {
    // write your test here
  });
});
`,
    solution: `// Given implementation (do not modify):
interface WalletService {
  debit(walletId: string, amount: number): Promise<void>;
  credit(walletId: string, amount: number): Promise<void>;
}

class TransferSaga {
  constructor(private walletService: WalletService) {}

  async execute(fromId: string, toId: string, amount: number): Promise<void> {
    await this.walletService.debit(fromId, amount);
    try {
      await this.walletService.credit(toId, amount);
    } catch (error) {
      await this.walletService.credit(fromId, amount); // compensate
      throw new Error("Transfer failed, amount returned to sender");
    }
  }
}

describe('TransferSaga', () => {
  it('calls debit then credit in order on a successful transfer', async () => {
    const order: string[] = [];
    const wallet = {
      debit: jest.fn().mockImplementation(async () => { order.push('debit'); }),
      credit: jest.fn().mockImplementation(async () => { order.push('credit'); }),
    };
    const saga = new TransferSaga(wallet as any);
    await saga.execute('a', 'b', 100);
    expect(order).toEqual(['debit', 'credit']);
  });

  it('compensates by crediting the sender when credit fails', async () => {
    let callCount = 0;
    const walletService = {
      debit: jest.fn(),
      credit: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) throw new Error('credit failed');
        return Promise.resolve();
      }),
    };
    const saga = new TransferSaga(walletService as any);
    try {
      await saga.execute('a', 'b', 100);
    } catch {
      // expected
    }
    expect(walletService.credit).toHaveBeenCalledWith('a', 100);
  });

  it('surfaces a clean error message when credit fails', async () => {
    let callCount = 0;
    const walletService = {
      debit: jest.fn(),
      credit: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) throw new Error('network error');
        return Promise.resolve();
      }),
    };
    const saga = new TransferSaga(walletService as any);
    try {
      await saga.execute('a', 'b', 100);
      throw new Error('should have thrown');
    } catch (e: unknown) {
      expect((e as Error).message).toBe('Transfer failed, amount returned to sender');
    }
  });

  it('debit is always called exactly once', async () => {
    const walletService = {
      debit: jest.fn(),
      credit: jest.fn().mockImplementation(() => { throw new Error('fail'); }),
    };
    const saga = new TransferSaga(walletService as any);
    try {
      await saga.execute('a', 'b', 100);
    } catch {
      // expected
    }
    expect(walletService.debit).toHaveBeenCalledTimes(1);
  });
});
`,
    testCases: [
      {
        name: 'writes at least 4 passing tests',
        input: 'return __jestResults.length >= 4 && __jestResults.every((r) => r.passed);',
        expectedOutput: true,
      },
      {
        name: 'mocks the wallet service dependency',
        input: 'return __mockFnCount >= 2;',
        expectedOutput: true,
      },
      {
        name: 'covers the compensating-transaction path',
        input: "return __jestResults.some((r) => /compensat|fail/i.test(r.name));",
        expectedOutput: true,
      },
    ],
    hints: [
      'Make credit() throw on its first call (to the recipient) but succeed on the second (the compensation to the sender).',
      'Use toHaveBeenCalledWith to prove the compensating credit went to the original sender, not the recipient.',
      'debit() should never be retried, even when the later credit step fails.',
    ],
    interviewContext:
      'Saga compensation logic is exactly where fintech transfer bugs hide. Verifying the compensating transaction targets the correct wallet is the difference between a passing demo and a real financial bug.',
  },
];
