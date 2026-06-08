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
        'NestJS organises code into modules, each declaring providers (injectables), controllers, imports, and exports. The IoC container builds a dependency graph from constructor parameter types and injects shared singletons by default. Provider scopes (default singleton, request, transient) control lifetime — request scope is contagious up the graph, so use it sparingly. Use forRoot/forRootAsync to configure dynamic modules like database or config at startup. In interviews, be ready to explain what happens when a module exports a provider: any module that imports that module gains access to the provider without re-declaring it. The AppModule is the root that stitches everything together, and lazy-loaded modules can reduce startup time for large applications.',
    },
    {
      id: 'nest-lifecycle',
      title: 'The request lifecycle',
      content:
        'A request flows through middleware, then guards (authorization), then interceptors (which wrap the handler before and after), then pipes (validation/transformation), then the controller; the response travels back out through the interceptors. Exception filters wrap the whole chain to turn thrown errors into responses. Knowing this order explains, for example, why a guard cannot see a value a pipe will later transform. Middleware is Express/Fastify-level and has no access to Nest metadata, while guards receive an ExecutionContext and can inspect decorators. Interceptors use RxJS observables, so you can tap, map, or timeout the response stream — a common pattern is adding a logging interceptor that measures handler duration by noting the time before calling next.handle() and subscribing to the result.',
    },
    {
      id: 'nest-custom-providers',
      title: 'Custom providers: useClass, useValue, and useFactory',
      content:
        'When the default "provide a class, inject an instance" pattern is not enough, NestJS offers three custom provider forms. useValue injects a plain value or mock object — perfect for injecting a config object or a Jest mock during tests. useClass lets you swap one class for another based on environment, for example providing a MockMailService in development and the real one in production. useFactory is the most powerful: it calls an async function with injected dependencies and uses the return value as the provider — ideal for constructing a database connection pool that needs config values resolved first. All three forms accept a string or Symbol token for the provide key, and you inject them with the Inject decorator rather than relying on type inference. In interviews, explain the difference between a provider token (the key) and the provider value (what gets injected) to show deep understanding of the DI system.',
    },
    {
      id: 'nest-guards-interceptors-pipes-filters',
      title: 'Guards, interceptors, pipes, and exception filters',
      content:
        'Guards implement CanActivate and return a boolean or observable; they are the canonical place for authentication and authorization checks because they run after middleware but before the handler. Interceptors implement NestInterceptor and receive a CallHandler whose handle() method returns an observable of the response — this lets you transform, cache, or timeout responses using RxJS operators. Pipes implement PipeTransform and serve two roles: validation (throw a BadRequestException if the input is invalid) and transformation (parse "42" into the number 42); the built-in ValidationPipe combined with class-validator decorators handles most REST validation needs. Exception filters implement ExceptionFilter and catch specific error types, converting them to HTTP responses; a global HttpExceptionFilter is a clean place to log errors and normalise response shapes across the entire API. All four can be applied at the global level (app.useGlobalGuards etc.), at the controller level with decorator syntax, or at the individual handler level — scoping them narrowly keeps your code easier to reason about.',
    },
    {
      id: 'nest-custom-decorators-dynamic-modules',
      title: 'Custom decorators and dynamic modules',
      content:
        'Custom parameter decorators let you extract request data once and reuse the logic everywhere, for example a CurrentUser decorator that reads req.user (populated by a guard) so your handlers never touch the raw request. You create them with createParamDecorator, which receives the data argument (the value passed in the decorator call) and the ExecutionContext. Custom method or class decorators are composed with applyDecorators, letting you bundle a guard and a Swagger annotation into a single ApiAuth decorator. Dynamic modules extend this further: a module\'s static forRoot method accepts options and returns a DynamicModule object, allowing callers to configure the module at import time. The forRootAsync variant accepts a useFactory function so the options themselves can be resolved from injected providers, which is essential when your database URL comes from a ConfigService that is itself async. In interviews, be prepared to draw the flow from AppModule importing DatabaseModule.forRootAsync to the factory receiving ConfigService and returning a connection object.',
    },
    {
      id: 'nest-microservices-testing',
      title: 'Microservices, configuration, and testing',
      content:
        'NestJS microservices swap the HTTP layer for a transport: TCP, Redis pub/sub, RabbitMQ, Kafka, and NATS are all supported via a common ClientProxy interface so application code stays transport-agnostic. Patterns are matched with the MessagePattern and EventPattern decorators; the difference is that MessagePattern expects a reply while EventPattern is fire-and-forget. The ConfigModule (from @nestjs/config) loads .env files and exposes a ConfigService with typed get calls; using ConfigModule.forRoot with isGlobal: true means you do not have to import it in every feature module. For testing, Test.createTestingModule mirrors the real module system but lets you override providers with mocks using overrideProvider().useValue() or useClass(). The testing module compiles, injects, and wires providers the same way the runtime does, so unit tests for guards or interceptors run against real Nest lifecycle logic rather than hand-rolled fakes. A common interview question asks how to test a service that depends on a repository: override the repository token with a plain object that has jest.fn() methods, compile the module, and call service methods directly.',
    },
  ],
};
