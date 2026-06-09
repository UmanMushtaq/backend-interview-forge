import type { LearnModule } from '../../types';

export const testing: LearnModule = {
  id: 'testing',
  title: 'Testing (Jest)',
  blurb: 'Unit, integration, and e2e testing with Jest — a must-have on your CV.',
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
        'A Jest test groups cases with describe and defines each with it (or test), asserting via expect(...).toBe / toEqual / toThrow. Use beforeEach/afterEach for setup and teardown. jest.fn() creates a mock function you can assert was called with certain arguments, and jest.mock(...) replaces a whole module so you can isolate the unit under test. For async code, return or await the promise and assert with resolves/rejects. jest.spyOn wraps an existing method on a real object so you can verify calls without fully replacing it — useful when you only want to observe, not stub. Matchers like toMatchObject (partial match on objects) and toContain (array/string membership) reduce test brittleness by not over-asserting on irrelevant fields.',
    },
    {
      id: 'test-good-tests',
      title: 'What makes a good test',
      content:
        'Good tests are deterministic, independent, and readable: they do not depend on each other or on real time, network, or shared state. Test behaviour and public contracts, not private implementation, so refactors do not break them. Prefer a few meaningful assertions over snapshotting everything, and treat a failing test as a precise description of the bug. Coverage is a guide, not a goal — 100% of trivial code is less valuable than solid tests of the tricky parts. A good test has three clear sections: Arrange (set up data and mocks), Act (call the code under test), Assert (verify outcomes). This AAA pattern makes the intent obvious at a glance during code review.',
    },
    {
      id: 'test-async-timers',
      title: 'Async testing and fake timers',
      content:
        'Testing async code in Jest requires either awaiting the promise inside the test, returning it, or using expect(promise).resolves/.rejects. Forgetting to await is silent — the test passes vacuously because assertions never run. For code that depends on setTimeout, setInterval, or Date.now, use jest.useFakeTimers() to take control of time. After calling useFakeTimers(), time does not advance until you call jest.advanceTimersByTime(ms) or jest.runAllTimers(). This lets you test debounce functions, exponential backoff, or cache TTLs without real delays. Always call jest.useRealTimers() in afterEach to avoid leaking fake timers into other tests.',
    },
    {
      id: 'test-integration-supertest',
      title: 'Integration testing and supertest for HTTP',
      content:
        'Integration tests verify that components work correctly together — a route handler, its middleware, validation logic, and the service layer. For HTTP APIs, supertest lets you make real HTTP requests against an Express (or Fastify) app without starting an actual server. You wrap the app with request(app).get("/users").expect(200), and assertions happen on the HTTP response. The key practice is using a test database (in-memory like sqlite or a real Postgres in Docker) or stubbing the data layer. Clean up between tests with beforeEach/afterEach to avoid state bleed. Supertest tests catch wiring bugs — wrong status codes, missing headers, incorrect serialisation — that unit tests miss.',
    },
    {
      id: 'test-doubles-coverage',
      title: 'Test doubles (mocks, stubs, spies) and coverage',
      content:
        'A test double is any object that stands in for a real dependency in a test. A stub returns a canned response; a mock additionally verifies it was called correctly; a spy wraps a real implementation and records calls. In Jest, jest.fn() creates a mock/stub, jest.spyOn creates a spy, and jest.mock replaces an entire module. Overusing mocks leads to tests that verify implementation details rather than behaviour — they break when you refactor the internals even if the public contract is unchanged. Code coverage (statement, branch, function, line) measures how much of the code is exercised by tests. High coverage does not mean high quality, but low branch coverage often reveals untested error paths. Use coverage as a red flag detector, not a success metric.',
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
      interviewTip: 'Most tests unit, some integration, few e2e — fast feedback at the base.',
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
        'A stub returns pre-configured data without verifying how it was used. A mock additionally has expectations — it verifies it was called the right number of times with the right arguments. A fake has a working implementation; a dummy is an unused placeholder.',
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
        'Unit tests isolate one function or class with all dependencies mocked. Integration tests let multiple real modules interact — a handler calling a real service calling a real (or seeded test) database — verifying the wiring is correct.',
    },
  ],
};
