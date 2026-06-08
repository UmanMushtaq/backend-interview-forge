import type { LearnModule } from '../../types';

export const javascript: LearnModule = {
  id: 'javascript',
  title: 'JavaScript',
  blurb: 'The language fundamentals every backend interview assumes you know cold.',
  lessons: [
    {
      id: 'js-event-loop',
      title: 'The event loop, microtasks and macrotasks',
      content:
        'JavaScript runs on a single thread with an event loop. Synchronous code runs first; async work is scheduled as either microtasks (promise callbacks, queueMicrotask) or macrotasks (setTimeout, setInterval, I/O). After each synchronous run completes, the engine drains the ENTIRE microtask queue before taking the next macrotask. That is why a resolved promise callback runs before a setTimeout(..., 0) scheduled at the same time. Understanding this ordering explains async bugs, starvation, and why long synchronous loops freeze everything. In an interview, you may be asked to trace through mixed promise and setTimeout code — always start with synchronous code, then microtasks, then macrotasks. If microtasks keep scheduling more microtasks, macrotasks starve completely, which is a real production bug pattern.',
    },
    {
      id: 'js-closures',
      title: 'Closures and scope',
      content:
        'A closure is a function bundled with references to the variables in scope where it was created, so it keeps access to them even after that outer function returns. This is the basis of data privacy, function factories, memoization, and debounce/throttle. Watch the classic loop trap: using var in a for loop shares one binding, so all callbacks see the final value, while let creates a fresh binding per iteration. Closures are also memory considerations — a closure holds a reference to its outer scope, so if a closure is kept alive (e.g. stored in a cache), all variables in that scope stay in memory too. In interviews, closures come up in questions about module patterns, the revealing module pattern, and counter factories.',
    },
    {
      id: 'js-this-prototypes',
      title: 'this, prototypes, and equality',
      content:
        'The value of this is set by how a function is called: a normal call gives the global object or undefined in strict mode, a method call gives the object, and arrow functions capture this from their enclosing scope. Objects delegate to their prototype for missing properties, which is how inheritance works without classes. For comparisons prefer === (strict) over == (which coerces types), and remember NaN is not equal to itself. The prototype chain ends at Object.prototype, whose prototype is null. Class syntax in ES6 is syntactic sugar over prototype-based inheritance — under the hood, methods are placed on the class prototype, not on each instance. You can check the chain with Object.getPrototypeOf or the instanceof operator.',
    },
    {
      id: 'js-hoisting-tdz',
      title: 'Hoisting, TDZ, and variable declarations',
      content:
        'Hoisting moves declarations (not initialisations) to the top of their scope during compilation. var declarations are hoisted and initialised to undefined, so reading a var before its line returns undefined. Function declarations are hoisted whole, so they can be called before their source line. let and const are hoisted but placed in the Temporal Dead Zone (TDZ) until the declaration line executes — any access before that line throws a ReferenceError. The TDZ exists to catch bugs where code assumes a variable is ready. In interviews, be precise: "hoisted but in the TDZ" is the correct phrasing for let/const, not "not hoisted".',
    },
    {
      id: 'js-promises-async',
      title: 'Promises, async/await, and error handling',
      content:
        'A Promise represents a future value and can be pending, fulfilled, or rejected. Chaining .then returns a new Promise, making sequential async logic readable. async/await is syntactic sugar: an async function always returns a Promise, and await unwraps it, suspending the function until settled. Error handling should use try/catch around await or a .catch at the end of a chain — never rely on both, as that causes duplicate handling. Promise.all runs multiple promises concurrently and rejects fast on any failure; Promise.allSettled waits for all regardless of outcome; Promise.race resolves or rejects with the first settled promise. Forgetting to await is a common bug that makes assertions run before the async work finishes.',
    },
    {
      id: 'js-generators-modules',
      title: 'Generators, iterators, and ES modules',
      content:
        'A generator function (function*) returns an iterator that produces values lazily via yield, pausing execution between calls to .next(). This enables infinite sequences, cooperative multitasking, and custom iteration. ES modules (import/export) are the standard; they are statically analysed so bundlers can tree-shake unused code. CommonJS (require) uses synchronous dynamic loading, which is why mixing the two in Node requires care. Named exports and a default export can coexist, but most style guides pick one. Understanding tree-shaking — bundlers removing unreachable exports — matters for backend startup performance and library authoring.',
    },
  ],
  questions: [
    {
      id: 'js-q-eventloop',
      category: 'javascript',
      subcategory: 'event-loop',
      difficulty: 'core',
      question: 'A resolved Promise.then callback and a setTimeout(fn, 0) are scheduled in the same tick. Which runs first?',
      options: ['The setTimeout callback', 'The promise callback', 'Whichever was written first', 'They run at the same time'],
      correctIndex: 1,
      explanation:
        'Promise callbacks are microtasks and the entire microtask queue is drained after the current synchronous run, before the next macrotask (setTimeout). So the promise callback runs first.',
      interviewTip: 'Microtasks (promises) beat macrotasks (timers) every tick.',
    },
    {
      id: 'js-q-closure-loop',
      category: 'javascript',
      subcategory: 'closures',
      difficulty: 'core',
      question: 'A for loop with var i schedules three setTimeouts logging i. What prints?',
      options: ['0 1 2', '3 3 3', '1 2 3', 'undefined three times'],
      correctIndex: 1,
      explanation:
        'var has function scope, so all three closures share one i which is 3 by the time the timers fire. Using let gives each iteration its own binding, printing 0 1 2.',
      interviewTip: 'var shares one binding; let creates a fresh one per iteration.',
    },
    {
      id: 'js-q-equality',
      category: 'javascript',
      subcategory: 'equality',
      difficulty: 'foundation',
      question: 'Which expression is true?',
      options: ['NaN === NaN', "0 === '0'", 'null == undefined', "[] === []"],
      correctIndex: 2,
      explanation:
        'null == undefined is true under loose equality. NaN is never equal to itself, strict === does not coerce so 0 === string is false, and two different array references are not equal.',
    },
    {
      id: 'js-q-this',
      category: 'javascript',
      subcategory: 'this',
      difficulty: 'core',
      question: 'How does an arrow function determine the value of this?',
      options: [
        'From the object it is called on',
        'It is always undefined',
        'It captures this from the enclosing lexical scope',
        'From the first argument passed',
      ],
      correctIndex: 2,
      explanation:
        'Arrow functions do not have their own this; they capture it from where they are defined. That is why they are handy for callbacks inside methods, and why you cannot rebind them with call/apply.',
    },
    {
      id: 'js-q-hoisting',
      category: 'javascript',
      subcategory: 'hoisting',
      difficulty: 'core',
      question: 'What happens when you access a let variable before its declaration line?',
      options: [
        'It returns undefined',
        'It throws a ReferenceError (temporal dead zone)',
        'It returns null',
        'It silently creates a global',
      ],
      correctIndex: 1,
      explanation:
        'let and const are hoisted but stay in the temporal dead zone until the declaration runs, so accessing them early throws a ReferenceError. var would instead be undefined.',
    },
    {
      id: 'js-q-promise-all',
      category: 'javascript',
      subcategory: 'promises',
      difficulty: 'core',
      question: 'What does Promise.all do if one of the promises rejects?',
      options: [
        'It waits for all promises to settle',
        'It ignores the rejection and resolves with the rest',
        'It immediately rejects with that error',
        'It retries the rejected promise',
      ],
      correctIndex: 2,
      explanation:
        'Promise.all uses fail-fast semantics: as soon as any promise rejects, the whole returned promise rejects. Use Promise.allSettled if you want to wait for all regardless of outcome.',
      interviewTip: 'Promise.all = fail fast. Promise.allSettled = wait for all. Know both.',
    },
    {
      id: 'js-q-async-await',
      category: 'javascript',
      subcategory: 'promises',
      difficulty: 'foundation',
      question: 'What does an async function always return?',
      options: ['The raw value you return', 'A Promise', 'undefined', 'A generator'],
      correctIndex: 1,
      explanation:
        'An async function always wraps its return value in a Promise. If you return 42, the caller gets Promise.resolve(42). This makes async/await composable with .then chains.',
    },
    {
      id: 'js-q-closure-factory',
      category: 'javascript',
      subcategory: 'closures',
      difficulty: 'core',
      question: 'A function makeCounter returns an inner function that increments and returns a private count variable. After two calls, count is 2. Why can the inner function still access count?',
      options: [
        'count is a global variable',
        'The inner function closes over the outer scope where count lives',
        'JavaScript copies all variables into each function',
        'count is on the prototype chain',
      ],
      correctIndex: 1,
      explanation:
        'The inner function forms a closure over the outer function\'s scope. Even after makeCounter returns, the closure keeps a live reference to count, allowing it to read and mutate it across calls.',
    },
    {
      id: 'js-q-prototype',
      category: 'javascript',
      subcategory: 'prototypes',
      difficulty: 'core',
      question: 'When you access a property on an object that does not exist directly on it, what happens?',
      options: [
        'JavaScript throws a TypeError immediately',
        'JavaScript returns undefined without further lookup',
        'JavaScript walks up the prototype chain looking for the property',
        'JavaScript checks the global scope',
      ],
      correctIndex: 2,
      explanation:
        'Property access triggers prototype chain lookup. The engine checks the object, then its prototype, then that prototype\'s prototype, up to Object.prototype. If not found anywhere, undefined is returned.',
    },
    {
      id: 'js-q-typeof-null',
      category: 'javascript',
      subcategory: 'equality',
      difficulty: 'foundation',
      question: 'What does typeof null return?',
      options: ['null', 'undefined', 'object', 'boolean'],
      correctIndex: 2,
      explanation:
        'typeof null returns "object" — a historical bug in JavaScript that cannot be fixed without breaking the web. To check for null safely, use strict equality: value === null.',
    },
    {
      id: 'js-q-generator',
      category: 'javascript',
      subcategory: 'generators',
      difficulty: 'expert',
      question: 'What does calling a generator function return?',
      options: [
        'The first yielded value directly',
        'A Promise',
        'An iterator object with a .next() method',
        'An array of all yielded values',
      ],
      correctIndex: 2,
      explanation:
        'Calling a generator function does not run any of its body — it returns an iterator. Each call to .next() runs the body until the next yield, returning { value, done }. This enables lazy evaluation.',
    },
    {
      id: 'js-q-esm-cjs',
      category: 'javascript',
      subcategory: 'modules',
      difficulty: 'core',
      question: 'What is a key difference between ES module imports and CommonJS require?',
      options: [
        'ES modules are only for browsers; CommonJS is only for Node',
        'ES module imports are static and analysed at parse time; require is dynamic and runs at runtime',
        'CommonJS supports named exports; ES modules do not',
        'They are identical at runtime',
      ],
      correctIndex: 1,
      explanation:
        'ES module imports are hoisted and resolved statically before code runs, enabling tree-shaking. CommonJS require executes at runtime and can appear inside conditionals, making static analysis harder.',
    },
    {
      id: 'js-q-microtask-starvation',
      category: 'javascript',
      subcategory: 'event-loop',
      difficulty: 'expert',
      question: 'If microtasks keep scheduling new microtasks in a loop, what happens to macrotasks like setTimeout?',
      options: [
        'They run interleaved with microtasks',
        'They are cancelled',
        'They are deferred indefinitely because the microtask queue never empties',
        'They run in a separate thread',
      ],
      correctIndex: 2,
      explanation:
        'The event loop drains the entire microtask queue before processing the next macrotask. If microtasks perpetually add more microtasks, macrotasks (timers, I/O callbacks) starve and never run — a real production bug.',
    },
    {
      id: 'js-q-var-hoisting',
      category: 'javascript',
      subcategory: 'hoisting',
      difficulty: 'foundation',
      question: 'What does the following code log? console.log(x); var x = 5;',
      options: ['5', 'ReferenceError', 'null', 'undefined'],
      correctIndex: 3,
      explanation:
        'var declarations are hoisted and initialised to undefined before the code runs. So x exists at the point of the log, but its value has not been assigned yet, giving undefined.',
    },
    {
      id: 'js-q-spread-rest',
      category: 'javascript',
      subcategory: 'array-object-methods',
      difficulty: 'foundation',
      question: 'What is the difference between the spread operator (...) and rest parameters?',
      options: [
        'They are the same syntax with identical behaviour',
        'Spread expands an iterable into positions; rest collects multiple arguments into an array',
        'Rest expands; spread collects',
        'Spread only works on objects; rest only works on arrays',
      ],
      correctIndex: 1,
      explanation:
        'Spread (...arr) fans out elements into a function call or literal. Rest (...args) in a parameter list gathers remaining arguments into an array. Same syntax, opposite directions of data flow.',
    },
    {
      id: 'js-q-error-handling',
      category: 'javascript',
      subcategory: 'error-handling',
      difficulty: 'core',
      question: 'You have: async function load() { const data = await fetchData(); return data; }. Where should you handle a fetch rejection?',
      options: [
        'Rejections cannot happen in async functions',
        'In a try/catch block around the await, or by calling load().catch(...) at the call site',
        'With a synchronous try/catch outside the async function',
        'By checking typeof data === "undefined"',
      ],
      correctIndex: 1,
      explanation:
        'An unhandled rejection inside an async function propagates as a rejected Promise from that function. Handle it with try/catch around the await, or attach .catch() where load() is called.',
    },
  ],
};
