import type { LearnModule } from '../../types';

export const testing: LearnModule = {
  id: 'testing',
  title: 'Testing (Jest)',
  blurb: 'Unit, integration, and e2e testing with Jest  -  a must-have on your CV.',
  lessons: [
    {
      id: 'test-pyramid',
      title: 'The testing pyramid',
      content:
        'The testing pyramid suggests many fast unit tests, fewer integration tests, and a small number of slow end-to-end tests. Unit tests isolate a single function or class and run in milliseconds; integration tests check that modules work together (e.g. a service plus a real database in Docker); e2e tests drive the whole system through its public API. Aim for fast feedback: most logic should be covered by unit tests, with integration and e2e reserved for the wiring and critical flows. An inverted pyramid (mostly e2e, few units) leads to slow, flaky CI pipelines and poor fault isolation. Some teams use the testing trophy shape: a wide integration layer and lighter unit/e2e layers, reflecting the value of medium-level integration tests in modern frameworks.',
    },
    {
      id: 'test-jest-basics',
      title: 'Jest essentials: describe, it, expect, mocks',
      content:
        'A Jest test groups cases with describe and defines each with it (or test), asserting via expect(...).toBe / toEqual / toThrow. Use beforeEach/afterEach for setup and teardown. jest.fn() creates a mock function you can assert was called with certain arguments, and jest.mock(...) replaces a whole module so you can isolate the unit under test. For async code, return or await the promise and assert with resolves/rejects. jest.spyOn wraps an existing method on a real object so you can verify calls without fully replacing it  -  useful when you only want to observe, not stub. Matchers like toMatchObject (partial match on objects) and toContain (array/string membership) reduce test brittleness by not over-asserting on irrelevant fields.',
    },
    {
      id: 'test-good-tests',
      title: 'What makes a good test',
      content:
        'Good tests are deterministic, independent, and readable: they do not depend on each other or on real time, network, or shared state. Test behaviour and public contracts, not private implementation, so refactors do not break them. Prefer a few meaningful assertions over snapshotting everything, and treat a failing test as a precise description of the bug. Coverage is a guide, not a goal  -  100% of trivial code is less valuable than solid tests of the tricky parts. A good test has three clear sections: Arrange (set up data and mocks), Act (call the code under test), Assert (verify outcomes). This AAA pattern makes the intent obvious at a glance during code review.',
    },
    {
      id: 'test-async-timers',
      title: 'Async testing and fake timers',
      content:
        'Testing async code in Jest requires either awaiting the promise inside the test, returning it, or using expect(promise).resolves/.rejects. Forgetting to await is silent  -  the test passes vacuously because assertions never run. For code that depends on setTimeout, setInterval, or Date.now, use jest.useFakeTimers() to take control of time. After calling useFakeTimers(), time does not advance until you call jest.advanceTimersByTime(ms) or jest.runAllTimers(). This lets you test debounce functions, exponential backoff, or cache TTLs without real delays. Always call jest.useRealTimers() in afterEach to avoid leaking fake timers into other tests.',
    },
    {
      id: 'test-integration-supertest',
      title: 'Integration testing and supertest for HTTP',
      content:
        'Integration tests verify that components work correctly together  -  a route handler, its middleware, validation logic, and the service layer. For HTTP APIs, supertest lets you make real HTTP requests against an Express (or Fastify) app without starting an actual server. You wrap the app with request(app).get("/users").expect(200), and assertions happen on the HTTP response. The key practice is using a test database (in-memory like sqlite or a real Postgres in Docker) or stubbing the data layer. Clean up between tests with beforeEach/afterEach to avoid state bleed. Supertest tests catch wiring bugs  -  wrong status codes, missing headers, incorrect serialisation  -  that unit tests miss.',
    },
    {
      id: 'test-doubles-coverage',
      title: 'Test doubles (mocks, stubs, spies) and coverage',
      content:
        'A test double is any object that stands in for a real dependency in a test. A stub returns a canned response; a mock additionally verifies it was called correctly; a spy wraps a real implementation and records calls. In Jest, jest.fn() creates a mock/stub, jest.spyOn creates a spy, and jest.mock replaces an entire module. Overusing mocks leads to tests that verify implementation details rather than behaviour  -  they break when you refactor the internals even if the public contract is unchanged. Code coverage (statement, branch, function, line) measures how much of the code is exercised by tests. High coverage does not mean high quality, but low branch coverage often reveals untested error paths. Use coverage as a red flag detector, not a success metric.',
    },
    {
      id: 'test-nestjs-testing',
      title: 'Testing NestJS with Test.createTestingModule',
      content:
        'NestJS provides a powerful testing utility that lets you create a full NestJS application context in isolation for unit and integration tests. The `Test.createTestingModule()` method from `@nestjs/testing` bootstraps a module with real or overridden providers, giving you access to the full DI container in tests.\n\nThe standard pattern for testing a service:\n\n```typescript\nimport { Test, TestingModule } from \'@nestjs/testing\';\nimport { OrdersService } from \'./orders.service\';\nimport { getRepositoryToken } from \'@nestjs/typeorm\';\nimport { Order } from \'./order.entity\';\n\ndescribe(\'OrdersService\', () => {\n  let service: OrdersService;\n  const mockRepo = { findOne: jest.fn(), save: jest.fn() };\n\n  beforeEach(async () => {\n    const module: TestingModule = await Test.createTestingModule({\n      providers: [\n        OrdersService,\n        { provide: getRepositoryToken(Order), useValue: mockRepo },\n      ],\n    }).compile();\n    service = module.get<OrdersService>(OrdersService);\n  });\n\n  afterEach(() => jest.clearAllMocks());\n\n  it(\'should find an order by id\', async () => {\n    mockRepo.findOne.mockResolvedValue({ id: \'1\', amount: 100 });\n    const result = await service.findOne(\'1\');\n    expect(result.amount).toBe(100);\n    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: \'1\' } });\n  });\n});\n```\n\nThe `useValue` provider replaces the real TypeORM repository with a plain object of `jest.fn()` mocks. Use `overrideProvider(SomeService).useValue(mockService)` to swap out specific providers in an otherwise real module context  -  useful for integration tests where you want real business logic but mocked external calls.\n\nFor HTTP controller testing, use `supertest` with the full `app` instance created by `module.createNestApplication()`. This tests the full request pipeline: guards, interceptors, pipes, the controller, and the service  -  catching wiring bugs that pure unit tests miss. Always close the app in `afterAll` with `await app.close()` to release ports and database connections.',
    },
    {
      id: 'test-db-transactions',
      title: 'Database testing with transactions that roll back',
      content:
        'Testing code that writes to a real database requires a strategy for keeping tests isolated and leaving the database in a clean state after each test. The two main approaches are truncating tables in afterEach, and wrapping each test in a transaction that is rolled back after the test completes.\n\nThe transaction rollback pattern is faster than truncation and does not require knowing which tables were written to. With TypeORM, you can wrap each test in a QueryRunner transaction:\n\n```typescript\nlet queryRunner: QueryRunner;\n\nbeforeEach(async () => {\n  queryRunner = dataSource.createQueryRunner();\n  await queryRunner.connect();\n  await queryRunner.startTransaction();\n  // Override the EntityManager in the test context\n  jest.spyOn(dataSource, \'createEntityManager\')\n    .mockReturnValue(queryRunner.manager);\n});\n\nafterEach(async () => {\n  await queryRunner.rollbackTransaction();\n  await queryRunner.release();\n});\n```\n\nThis approach works cleanly when your service code uses the injected EntityManager or Repository rather than calling `dataSource.query` directly. A simpler variant for plain SQL: begin a transaction before the test, run assertions, then rollback  -  the database is reset to exactly the state before the test with no cleanup code needed.\n\nFor integration test suites that need a real PostgreSQL instance, use `testcontainers` to spin up a fresh Postgres container per test suite: `const pg = await new PostgreSqlContainer().start()`. The container is destroyed after the suite, giving you a completely isolated, reproducible database without needing a shared test environment. Combine this with schema migrations run on the fresh container so your tests exercise the actual production schema, catching column-missing or constraint errors that would only surface in production otherwise.',
    },
    {
      id: 'test-contract-pact',
      title: 'Contract testing with Pact',
      content:
        'Contract testing verifies that a consumer (an API client) and a provider (the API server) agree on the interface between them, without requiring both to be deployed simultaneously. It is the missing layer between unit tests (which test internals) and e2e tests (which require the whole system running).\n\nPact is the leading contract testing framework. The workflow has two phases. First, the consumer defines the expected request-response interactions and generates a Pact file (a JSON contract): `"when I call GET /users/1, I expect a response with status 200 and body {id: 1, name: string}"`. This runs in the consumer\'s test suite against a Pact mock server, verifying the consumer code handles the response correctly. The Pact file is published to a Pact Broker (a shared repository of contracts).\n\nSecond, the provider runs the Pact verification step in its own test suite: Pact replays each consumer interaction against the real provider, asserting the real responses match what the consumer contracted. If the provider changes a field name or status code that a consumer depends on, verification fails  -  catching the breaking change before deployment.\n\n```typescript\n// Consumer side (Jest)\nconst provider = new Pact({ consumer: \'OrderService\', provider: \'UserService\', port: 1234 });\nbeforeAll(() => provider.setup());\naftereAll(() => provider.finalize());\n\nit(\'fetches a user\', async () => {\n  await provider.addInteraction({\n    uponReceiving: \'a request for user 1\',\n    withRequest: { method: \'GET\', path: \'/users/1\' },\n    willRespondWith: { status: 200, body: { id: 1, name: like(\'Alice\') } },\n  });\n  const user = await userClient.getUser(1); // calls localhost:1234\n  expect(user.name).toBeDefined();\n});\n```\n\nThe `like()` matcher means "any string is acceptable here", making contracts resilient to value changes while catching structural changes. Contract testing is especially valuable in microservices where teams deploy independently  -  a broken contract surfaces in CI rather than in production at 3am.',
    },
    {
      id: 'test-advanced-jest',
      title: 'Advanced Jest: asymmetric matchers, custom matchers, and coverage strategy',
      content:
        'Mastering Jest\'s advanced features reduces test brittleness and makes assertions more expressive. Asymmetric matchers let you assert on part of a value without pinning every field: `expect(result).toEqual(expect.objectContaining({ id: expect.any(String), createdAt: expect.any(Date) }))` passes as long as those fields have the right types, regardless of other fields. `expect.arrayContaining([\'a\', \'b\'])` asserts the array contains at least those elements. `expect.stringMatching(/^\d{4}$/)` matches a string against a regex. These matchers compose: `expect.objectContaining({ tags: expect.arrayContaining([\'urgent\']) })` is perfectly valid.\n\nCustom matchers extend `expect` with domain-specific assertions, making test intent clearer:\n\n```typescript\nexpect.extend({\n  toBeValidUUID(received: string) {\n    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;\n    return {\n      pass: uuidRegex.test(received),\n      message: () => `expected ${received} to be a valid UUID v4`,\n    };\n  },\n});\n// Usage:\nexpect(order.id).toBeValidUUID();\n```\n\nRegister custom matchers in a Jest setup file (`setupFilesAfterFramework: [\'./jest.setup.ts\']`) so they are available in every test file without importing.\n\nFor coverage strategy: configure Jest with `collectCoverageFrom` to include all source files, not just those that were imported in tests (which hides untested files). Set branch coverage thresholds  -  80% branch coverage is a reasonable minimum; 100% is unrealistic and discourages testing important paths by padding with trivial assertions. Focus coverage efforts on: business logic (services, domain models), error paths (what happens when a repository call throws), and edge cases in pure utility functions. Skip coverage for framework boilerplate (module definitions, simple DTO classes) and generated code (TypeORM migrations). Use `/* istanbul ignore next */` sparingly and only for genuinely untestable code paths.',
    },
    {
      id: 'test-k6-load',
      title: 'Load testing with k6  -  writing a test and reading p95/p99',
      content:
        'Unit and integration tests verify correctness under one user. Load tests verify behaviour under thousands of concurrent users. **k6** is the modern load testing tool for Node.js-adjacent teams  -  tests are written in JavaScript, and results include the latency percentiles that matter in production SLAs.\n\nA basic k6 test that ramps up to 100 virtual users:\n\n```javascript\nimport http from \'k6/http\';\nimport { check, sleep } from \'k6\';\n\nexport const options = {\n  stages: [\n    { duration: \'30s\', target: 20 },\n    { duration: \'1m\',  target: 100 },\n    { duration: \'30s\', target: 0 },\n  ],\n  thresholds: {\n    http_req_duration: [\'p(95)<200\'],\n    http_req_failed: [\'rate<0.01\'],\n  },\n};\n\nexport default function () {\n  const res = http.get(\'https://api.example.com/orders\', {\n    headers: { Authorization: \'Bearer test-token\' },\n  });\n  check(res, { \'status is 200\': (r) => r.status === 200 });\n  sleep(1);\n}\n```\n\nRun with `k6 run load-test.js`. The output shows:\n\n```\nhttp_req_duration: avg=45ms min=12ms med=38ms p(90)=95ms p(95)=180ms p(99)=820ms\nhttp_reqs:        8432  140/s\nhttp_req_failed:  0.12%\n```\n\n**Reading the percentiles**: `p(95)=180ms` means 95% of requests completed in under 180ms. `p(99)=820ms` means 1% of requests took over 820ms  -  these are the worst-case experiences for 1 in 100 users.\n\nThe average (`avg=45ms`) is almost meaningless. A few very slow requests pull the average up without signalling how bad the experience is for most users. Always report p95 and p99 as your primary latency SLI.\n\n**What to test**: the happy path of your most critical flows  -  checkout, login, order creation  -  under realistic concurrency. Include realistic think time between requests with `sleep(1)`. Use k6 scenarios to model different user types (anonymous browser, authenticated customer, admin).\n\nIn an interview, k6 tests demonstrate production-readiness thinking. Load tests belong in CI on a staging environment before each major release  -  catching a 5x latency regression on a new database query before it reaches production is far cheaper than a post-incident fix.',
    },
    {
      id: 'test-owasp-nodejs',
      title: 'OWASP Top 10 for Node.js',
      content:
        'The OWASP Top 10 is the standard list of the most critical web application security risks. Every backend developer is expected to know it, and to know how each risk manifests in a Node.js / NestJS stack.\n\n**A01  -  Broken Access Control**: the most common vulnerability. Your API returns data the caller is not authorised to see. In NestJS, enforce access control with guards on every route, not just the ones you remember. Use row-level security in PostgreSQL as a defence-in-depth layer. Test with a second user\'s token to verify you cannot access the first user\'s data.\n\n**A02  -  Cryptographic Failures**: storing passwords in plaintext or with MD5/SHA1. Use bcrypt, scrypt, or Argon2 for passwords  -  they are slow by design, making brute-force attacks impractical. Never log JWT tokens, API keys, or passwords. Use TLS everywhere, including internal service-to-service calls.\n\n**A03  -  Injection**: SQL injection, NoSQL injection, command injection. In Node.js, use parameterised queries (TypeORM, Prisma, or `pg`\'s `$1` parameters)  -  never concatenate user input into SQL strings. For shell commands, use `execFile()` with an argument array instead of `exec()` with a string.\n\n**A05  -  Security Misconfiguration**: running with `NODE_ENV=development` in production, exposing stack traces in error responses, enabling CORS for `*`. In NestJS, use a global exception filter that logs the full error internally and returns only a sanitised message externally.\n\n**A07  -  Identification and Authentication Failures**: weak JWT secrets, no refresh token expiry, no rate limiting on login. Rate limit login with ThrottlerModule. Set JWT access token TTL to 15 minutes. Implement account lockout after N failed attempts stored in Redis.\n\n**A08  -  Software and Data Integrity Failures**: the npm supply chain. Lock dependencies with `package-lock.json`, run `npm audit` in CI, and scan with Snyk for vulnerabilities not yet in the npm advisory database.\n\n**A09  -  Security Logging and Monitoring Failures**: no logs when authentication fails, no alerts when error rates spike. Log every failed authentication attempt with IP and user agent. Alert on > 10 failed login attempts per IP per minute.\n\nIn an interview, running through the OWASP Top 10 with concrete Node.js examples demonstrates security-first thinking. The interviewer wants to see that you consider attack vectors during design, not just after a breach.',
    },
    {
      id: 'test-dependency-scanning',
      title: 'Dependency vulnerability scanning',
      content:
        'The npm ecosystem has millions of packages, and any one of them can introduce a known vulnerability into your application. Dependency scanning automatically detects packages with published CVEs so you can update before attackers exploit them.\n\n**npm audit** is the built-in tool. Run it in CI and fail the build on high-severity findings:\n\n```bash\nnpm audit --audit-level=high\n```\n\nThis exits with a non-zero code if any high or critical vulnerability is found, blocking the deployment. `npm audit fix` automatically upgrades to the nearest non-vulnerable version  -  review the diff before committing, because version bumps can introduce breaking changes.\n\n**Snyk** is the professional alternative. It has a larger vulnerability database than npm audit, provides automated fix PRs, and monitors your production deployments for newly disclosed vulnerabilities:\n\n```bash\nnpx snyk test      # scan current project\nnpx snyk monitor   # send snapshot to Snyk dashboard\n```\n\nIntegrate into GitHub Actions to block merges on new high-severity findings:\n\n```yaml\n- name: Security audit\n  run: npx snyk test --severity-threshold=high\n  env:\n    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}\n```\n\n**GitHub Dependabot** watches your `package-lock.json` and opens automated PRs to update vulnerable dependencies. Enable in `.github/dependabot.yml`:\n\n```yaml\nversion: 2\nupdates:\n  - package-ecosystem: npm\n    directory: /\n    schedule: { interval: weekly }\n```\n\nDependabot PRs run your test suite automatically, so you can merge with confidence if tests pass.\n\n**Lockfile hygiene**: always commit `package-lock.json`. Without it, `npm install` may silently install a newer patch version of a transitive dependency that contains a vulnerability.\n\nIn an interview, dependency scanning demonstrates supply chain security awareness. Mention that scanning should block deployment for critical vulnerabilities, but medium-severity findings should be tracked with a deadline rather than blocking every deploy  -  pragmatic risk management rather than zero-tolerance that paralyses engineering.',
    },
  ],
  questions: [
    {
      id: 'test-q-pyramid',
      category: 'testing',
      subcategory: 'strategy',
      difficulty: 'foundation',
      question: 'According to the testing pyramid, which tests should you have the most of?',
      options: ['End-to-end tests', 'Manual tests', 'Unit tests', 'Performance tests'],
      correctIndex: 2,
      explanation:
        'Unit tests are fast, cheap, and pinpoint failures, so they form the wide base of the pyramid. Integration and e2e tests are fewer because they are slower and broader.',
      interviewTip: 'Most tests unit, some integration, few e2e  -  fast feedback at the base.',
    },
    {
      id: 'test-q-mock',
      category: 'testing',
      subcategory: 'jest',
      difficulty: 'core',
      question: 'What is jest.fn() used for?',
      options: [
        'To run tests in parallel',
        'To create a mock function whose calls and arguments you can assert on',
        'To measure code coverage',
        'To start a test database',
      ],
      correctIndex: 1,
      explanation:
        'jest.fn() creates a spy/mock you can pass in place of a real dependency, then assert it was called the expected number of times and with the expected arguments.',
    },
    {
      id: 'test-q-async',
      category: 'testing',
      subcategory: 'jest',
      difficulty: 'core',
      question: 'How do you correctly test an async function that resolves a value in Jest?',
      options: [
        'Call it and ignore the promise',
        'await it inside the test (or return expect(p).resolves.toBe(...))',
        'Wrap it in setTimeout',
        'Async functions cannot be tested',
      ],
      correctIndex: 1,
      explanation:
        'You must await the promise or return it so Jest waits for completion; otherwise the test finishes before the assertion runs. expect(promise).resolves / .rejects also works.',
    },
    {
      id: 'test-q-isolation',
      category: 'testing',
      subcategory: 'quality',
      difficulty: 'core',
      question: 'Why should unit tests avoid depending on real time, network, or shared state?',
      options: [
        'To make them slower',
        'To keep them deterministic and independent so they do not flake or affect each other',
        'Because Jest forbids it',
        'To increase coverage automatically',
      ],
      correctIndex: 1,
      explanation:
        'Shared or external dependencies make tests flaky and order-dependent. Isolating them (fake timers, mocks, fresh fixtures) keeps tests reliable and fast.',
    },
    {
      id: 'test-q-what-to-test',
      category: 'testing',
      subcategory: 'quality',
      difficulty: 'expert',
      question: 'Testing behaviour rather than implementation means…',
      options: [
        'asserting on private methods and internal variables',
        'asserting on the public contract and observable outcomes so refactors do not break tests',
        'only writing snapshot tests',
        'testing third-party libraries',
      ],
      correctIndex: 1,
      explanation:
        'Coupling tests to internals makes every refactor painful. Testing the public contract lets you change the implementation freely as long as behaviour holds.',
    },
    {
      id: 'test-q-fake-timers',
      category: 'testing',
      subcategory: 'jest',
      difficulty: 'core',
      question: 'When should you use jest.useFakeTimers() in a test?',
      options: [
        'To make tests run faster by skipping real async I/O',
        'When the code under test uses setTimeout, setInterval, or Date so you can control time without waiting',
        'To replace network calls with stubs',
        'To run tests in a different timezone',
      ],
      correctIndex: 1,
      explanation:
        'Fake timers let you synchronously advance virtual time using jest.advanceTimersByTime(), making it possible to test debouncing, retries, and TTL logic without real delays.',
      interviewTip: 'Always restore with jest.useRealTimers() in afterEach to avoid leaking state.',
    },
    {
      id: 'test-q-spy-vs-mock',
      category: 'testing',
      subcategory: 'jest',
      difficulty: 'core',
      question: 'What is the difference between jest.fn() and jest.spyOn()?',
      options: [
        'jest.fn() is for async code; jest.spyOn is for sync code',
        'jest.fn() creates a standalone mock function; jest.spyOn wraps an existing method on a real object',
        'jest.spyOn cannot assert on calls',
        'They are identical',
      ],
      correctIndex: 1,
      explanation:
        'jest.fn() creates a brand-new mock function you inject as a dependency. jest.spyOn replaces a method on an existing object (e.g. a class instance or module), keeping the original available via mockRestore().',
    },
    {
      id: 'test-q-supertest',
      category: 'testing',
      subcategory: 'integration',
      difficulty: 'core',
      question: 'What does supertest allow you to test in a Node.js HTTP API project?',
      options: [
        'Database schema migrations',
        'Real HTTP requests against an Express app without starting a server process',
        'Load testing with thousands of concurrent connections',
        'Frontend UI interactions',
      ],
      correctIndex: 1,
      explanation:
        'supertest wraps your app and lets you make HTTP assertions (status, headers, body) in-process. It catches integration bugs like wrong status codes or missing middleware that unit tests miss.',
    },
    {
      id: 'test-q-before-each',
      category: 'testing',
      subcategory: 'jest',
      difficulty: 'foundation',
      question: 'What is beforeEach typically used for in a Jest test suite?',
      options: [
        'To define which tests run in parallel',
        'To reset shared state, clear mocks, or seed data before each test so tests stay independent',
        'To import modules used by multiple tests',
        'To set the test timeout globally',
      ],
      correctIndex: 1,
      explanation:
        'beforeEach runs before every test in its describe block. Using it to reset mocks (jest.clearAllMocks()) and restore shared state ensures each test starts clean and does not inherit side effects from a previous test.',
    },
    {
      id: 'test-q-coverage',
      category: 'testing',
      subcategory: 'strategy',
      difficulty: 'core',
      question: 'Why is 100% code coverage not sufficient proof that your tests are good?',
      options: [
        'Coverage tools are always inaccurate',
        'Coverage measures which lines were executed, not whether assertions verify correct behaviour',
        'Jest only supports 80% coverage',
        'High coverage causes tests to run slower',
      ],
      correctIndex: 1,
      explanation:
        'You can achieve 100% coverage with assertions that never fail (e.g. expect(true).toBe(true)). Coverage tells you what was executed, not what was verified. Meaningful assertions on correct outcomes matter more than the percentage.',
    },
    {
      id: 'test-q-jest-mock-module',
      category: 'testing',
      subcategory: 'jest',
      difficulty: 'core',
      question: 'What does jest.mock("../emailService") do at the top of a test file?',
      options: [
        'It imports emailService so you can use it in tests',
        'It replaces the entire emailService module with auto-mocked stubs for the duration of the test file',
        'It runs the emailService in a sandboxed environment',
        'It records all calls to emailService for later inspection only',
      ],
      correctIndex: 1,
      explanation:
        'jest.mock hoists to the top of the file and replaces the module with auto-generated mocks (all exports become jest.fn()). This prevents real side effects (sending emails) and lets you assert calls were made.',
    },
    {
      id: 'test-q-test-doubles',
      category: 'testing',
      subcategory: 'quality',
      difficulty: 'core',
      question: 'Which type of test double verifies that it was called with specific arguments?',
      options: ['Stub', 'Mock', 'Fake', 'Dummy'],
      correctIndex: 1,
      explanation:
        'A stub returns pre-configured data without verifying how it was used. A mock additionally has expectations  -  it verifies it was called the right number of times with the right arguments. A fake has a working implementation; a dummy is an unused placeholder.',
    },
    {
      id: 'test-q-aaa',
      category: 'testing',
      subcategory: 'quality',
      difficulty: 'foundation',
      question: 'What do the three "A"s stand for in the AAA test pattern?',
      options: [
        'Async, Await, Assert',
        'Arrange, Act, Assert',
        'Automate, Analyse, Annotate',
        'Assert, Assert, Assert',
      ],
      correctIndex: 1,
      explanation:
        'Arrange: set up preconditions and mocks. Act: call the code under test. Assert: verify the outcome. The pattern makes tests easy to read and reason about, and makes the boundary between setup and assertion explicit.',
    },
    {
      id: 'test-q-flaky',
      category: 'testing',
      subcategory: 'strategy',
      difficulty: 'expert',
      question: 'A test passes locally but fails intermittently in CI. What is the most likely cause?',
      options: [
        'Jest has a known bug on CI',
        'The test depends on timing, shared state, or external services, making it non-deterministic',
        'CI always runs tests in reverse order',
        'The test file has a syntax error that only manifests on Linux',
      ],
      correctIndex: 1,
      explanation:
        'Flaky tests are almost always caused by non-determinism: real timers, race conditions in async code, ordering dependencies between tests, or unmocked external services. Fix by isolating state, using fake timers, and clearing shared resources.',
    },
    {
      id: 'test-q-integration-vs-unit',
      category: 'testing',
      subcategory: 'strategy',
      difficulty: 'core',
      question: 'An integration test differs from a unit test primarily because it…',
      options: [
        'Uses describe blocks instead of it blocks',
        'Exercises multiple real components working together rather than a single unit in isolation',
        'Must always hit a production database',
        'Only tests HTTP routes',
      ],
      correctIndex: 1,
      explanation:
        'Unit tests isolate one function or class with all dependencies mocked. Integration tests let multiple real modules interact  -  a handler calling a real service calling a real (or seeded test) database  -  verifying the wiring is correct.',
    },
  ],
};
