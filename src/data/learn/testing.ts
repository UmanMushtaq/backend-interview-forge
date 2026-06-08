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
        'The testing pyramid suggests many fast unit tests, fewer integration tests, and a small number of slow end-to-end tests. Unit tests isolate a single function or class and run in milliseconds; integration tests check that modules work together (e.g. a service plus a real database in Docker); e2e tests drive the whole system through its public API. Aim for fast feedback: most logic should be covered by unit tests, with integration and e2e reserved for the wiring and critical flows.',
    },
    {
      id: 'test-jest-basics',
      title: 'Jest essentials: describe, it, expect, mocks',
      content:
        'A Jest test groups cases with describe and defines each with it (or test), asserting via expect(...).toBe / toEqual / toThrow. Use beforeEach/afterEach for setup and teardown. jest.fn() creates a mock function you can assert was called with certain arguments, and jest.mock(...) replaces a whole module so you can isolate the unit under test. For async code, return or await the promise and assert with resolves/rejects.',
    },
    {
      id: 'test-good-tests',
      title: 'What makes a good test',
      content:
        'Good tests are deterministic, independent, and readable: they do not depend on each other or on real time, network, or shared state. Test behaviour and public contracts, not private implementation, so refactors do not break them. Prefer a few meaningful assertions over snapshotting everything, and treat a failing test as a precise description of the bug. Coverage is a guide, not a goal — 100% of trivial code is less valuable than solid tests of the tricky parts.',
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
  ],
};
