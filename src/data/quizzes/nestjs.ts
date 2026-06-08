import type { QuizQuestion } from '../../types';

export const nestjs: QuizQuestion[] = [
  {
    id: 'nestjs-di-001',
    category: 'nestjs',
    subcategory: 'dependency-injection',
    difficulty: 'core',
    question: 'How does NestJS resolve a provider that another provider depends on via constructor injection?',
    options: [
      'It scans the constructor parameter metadata emitted by TypeScript and resolves each token from the module\'s injector',
      'It uses runtime reflection on parameter names and matches them to exported classes',
      'It requires every dependency to be passed manually when the class is instantiated',
      'It looks up dependencies lazily the first time a method is called',
    ],
    correctIndex: 0,
    explanation:
      'Nest relies on emitDecoratorMetadata: TypeScript emits the constructor parameter types, and the IoC container resolves each type token from the module injector. Providers are singletons by default and cached per module scope. This is why a class must be decorated (e.g. @Injectable) and registered in a module providers array for the metadata to be usable.',
    interviewTip: 'Mention that DI is token-based and the default scope is a single shared instance.',
  },
  {
    id: 'nestjs-lifecycle-001',
    category: 'nestjs',
    subcategory: 'request-lifecycle',
    difficulty: 'core',
    question: 'What is the correct order of the NestJS request pipeline?',
    options: [
      'Guard -> Middleware -> Controller -> Interceptor -> Pipe',
      'Middleware -> Guard -> Interceptor -> Pipe -> Controller',
      'Pipe -> Guard -> Middleware -> Interceptor -> Controller',
      'Middleware -> Interceptor -> Guard -> Controller -> Pipe',
    ],
    correctIndex: 1,
    explanation:
      'Requests flow through middleware first, then guards (authorization), then interceptors (which wrap the handler), then pipes (validation/transformation of arguments), and finally the controller handler. The response then travels back out through the interceptors. Knowing this order explains why a guard cannot read a body transformed by a pipe.',
    interviewTip: 'Remember: middleware -> guard -> interceptor -> pipe -> handler.',
  },
  {
    id: 'nestjs-scope-001',
    category: 'nestjs',
    subcategory: 'provider-scopes',
    difficulty: 'expert',
    question: 'What is the main cost of marking a provider with REQUEST scope?',
    options: [
      'It is instantiated once but shared across requests, causing data leaks',
      'A new instance is created per request, and that scope bubbles up to every provider that injects it',
      'It can only be used inside controllers, never in services',
      'It disables dependency injection for that provider',
    ],
    correctIndex: 1,
    explanation:
      'REQUEST-scoped providers are created fresh for each incoming request, which lets you inject the request object but adds per-request instantiation overhead. Crucially, scope is contagious: any provider that depends on a request-scoped provider also becomes request-scoped, which can ripple performance costs up the graph. Prefer DEFAULT (singleton) scope unless you genuinely need per-request state.',
    interviewTip: 'Call out that request scope is contagious up the dependency chain.',
  },
  {
    id: 'nestjs-circular-001',
    category: 'nestjs',
    subcategory: 'circular-dependencies',
    difficulty: 'expert',
    question: 'Two services depend on each other. What is the idiomatic NestJS fix?',
    options: [
      'Merge them into one giant service',
      'Use forwardRef(() => OtherService) on both sides of the injection',
      'Make both providers REQUEST scoped',
      'Remove the @Injectable decorator from one of them',
    ],
    correctIndex: 1,
    explanation:
      'When a true circular dependency is unavoidable, Nest provides forwardRef so the container can defer resolving one side until both classes are defined. You wrap the token on both the @Inject site and the module reference. That said, a circular dependency is often a design smell, so the better long-term fix is to extract the shared logic into a third provider or emit an event instead.',
  },
];
