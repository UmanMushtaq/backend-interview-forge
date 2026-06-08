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
];
