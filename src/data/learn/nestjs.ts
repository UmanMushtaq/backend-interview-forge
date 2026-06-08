import type { LearnModule } from '../../types';

export const nestjs: LearnModule = {
  id: 'nestjs',
  title: 'NestJS',
  blurb: 'Modules, dependency injection, and the request lifecycle.',
  quizCategory: 'nestjs',
  lessons: [
    {
      id: 'nest-di-modules',
      title: 'Modules and dependency injection',
      content:
        'NestJS organises code into modules, each declaring providers (injectables), controllers, imports, and exports. The IoC container builds a dependency graph from constructor parameter types and injects shared singletons by default. Provider scopes (default singleton, request, transient) control lifetime — request scope is contagious up the graph, so use it sparingly. Use forRoot/forRootAsync to configure dynamic modules like database or config at startup.',
    },
    {
      id: 'nest-lifecycle',
      title: 'The request lifecycle',
      content:
        'A request flows through middleware, then guards (authorization), then interceptors (which wrap the handler before and after), then pipes (validation/transformation), then the controller; the response travels back out through the interceptors. Exception filters wrap the whole chain to turn thrown errors into responses. Knowing this order explains, for example, why a guard cannot see a value a pipe will later transform.',
    },
  ],
};
