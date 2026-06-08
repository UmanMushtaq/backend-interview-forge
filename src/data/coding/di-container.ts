import type { CodingProblem } from '../../types';

export const diContainer: CodingProblem[] = [
  {
    id: 'di-registry-001',
    title: 'Service registry',
    difficulty: 'easy',
    category: 'di-container',
    description:
      'Build a minimal service registry. register(name, factory) stores a factory function under a name, and resolve(name) invokes the factory and returns the value. Resolving an unknown name should throw.',
    starterCode: `export class ServiceRegistry {
  register(name: string, factory: () => any): void {
    // TODO: store the factory
  }
  resolve(name: string): any {
    // TODO: invoke and return the factory result
    return undefined;
  }
}
`,
    solution: `export class ServiceRegistry {
  private factories = new Map<string, () => any>();
  register(name: string, factory: () => any): void {
    this.factories.set(name, factory);
  }
  resolve(name: string): any {
    const factory = this.factories.get(name);
    if (!factory) throw new Error('Unknown service: ' + name);
    return factory();
  }
}
`,
    testCases: [
      {
        name: 'resolves a registered factory',
        input: "const r = new ServiceRegistry(); r.register('answer', () => 42); return r.resolve('answer');",
        expectedOutput: 42,
      },
      {
        name: 'invokes the factory on every resolve',
        input: "let n = 0; const r = new ServiceRegistry(); r.register('counter', () => ++n); r.resolve('counter'); return r.resolve('counter');",
        expectedOutput: 2,
      },
    ],
    hints: ['A Map from name to factory function is enough.', 'resolve should call the stored function, not return it.'],
    interviewContext:
      'Every DI container starts here: a registry of tokens to factories. It shows you understand that the container owns construction, not the caller.',
  },
  {
    id: 'di-singleton-001',
    title: 'Singleton scope',
    difficulty: 'medium',
    category: 'di-container',
    description:
      'Extend the container so that resolve(name) returns the SAME instance every time (singleton scope): the factory must run at most once per token, and its result is cached.',
    starterCode: `export class SingletonContainer {
  register(name: string, factory: () => any): void {
    // TODO
  }
  resolve(name: string): any {
    // TODO: return a cached instance, creating it once
    return undefined;
  }
}
`,
    solution: `export class SingletonContainer {
  private factories = new Map<string, () => any>();
  private instances = new Map<string, any>();
  register(name: string, factory: () => any): void {
    this.factories.set(name, factory);
  }
  resolve(name: string): any {
    if (this.instances.has(name)) return this.instances.get(name);
    const factory = this.factories.get(name);
    if (!factory) throw new Error('Unknown service: ' + name);
    const instance = factory();
    this.instances.set(name, instance);
    return instance;
  }
}
`,
    testCases: [
      {
        name: 'returns the same instance and runs the factory once',
        input: "const c = new SingletonContainer(); let n = 0; c.register('svc', () => ({ id: ++n })); const a = c.resolve('svc'); const b = c.resolve('svc'); return a === b && n === 1;",
        expectedOutput: true,
      },
    ],
    hints: ['Keep a second Map for already-created instances.', 'Check the instance cache before calling the factory.'],
    interviewContext:
      'Singleton scope is the NestJS default. Interviewers want to hear that the container caches instances so shared state and connections are reused.',
  },
  {
    id: 'di-resolve-001',
    title: 'Recursive dependency resolution',
    difficulty: 'hard',
    category: 'di-container',
    description:
      'Build a Container whose factories receive the container so they can resolve their own dependencies. resolve(name) must resolve transitive dependencies and throw if it detects a circular dependency.',
    starterCode: `export class Container {\n  register(name: string, factory: (c: Container) => any): void {\n    // TODO\n  }\n  resolve(name: string): any {\n    // TODO\n    return undefined;\n  }\n}\n`,
    solution: `export class Container {\n  private factories = new Map<string, (c: Container) => any>();\n  private instances = new Map<string, any>();\n  private resolving = new Set<string>();\n  register(name: string, factory: (c: Container) => any): void {\n    this.factories.set(name, factory);\n  }\n  resolve(name: string): any {\n    if (this.instances.has(name)) return this.instances.get(name);\n    if (this.resolving.has(name)) throw new Error('Circular dependency: ' + name);\n    const factory = this.factories.get(name);\n    if (!factory) throw new Error('Unknown service: ' + name);\n    this.resolving.add(name);\n    const instance = factory(this);\n    this.resolving.delete(name);\n    this.instances.set(name, instance);\n    return instance;\n  }\n}\n`,
    testCases: [
      {
        name: 'resolves transitive dependencies',
        input: "const c = new Container(); c.register('a', () => 'A'); c.register('b', (ct) => ct.resolve('a') + 'B'); return c.resolve('b');",
        expectedOutput: 'AB',
      },
      {
        name: 'throws on a circular dependency',
        input: "const c = new Container(); c.register('x', (ct) => ct.resolve('y')); c.register('y', (ct) => ct.resolve('x')); try { c.resolve('x'); return 'no-throw'; } catch { return 'threw'; }",
        expectedOutput: 'threw',
      },
    ],
    hints: [
      'Pass `this` into each factory so it can resolve its own dependencies.',
      'Track names currently being resolved in a Set; seeing one twice means a cycle.',
    ],
    interviewContext:
      'This is what a real IoC container does: build the dependency graph on demand and fail loudly on cycles instead of overflowing the stack.',
  },
];
