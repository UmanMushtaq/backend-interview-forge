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
        'JavaScript runs on a single thread with an event loop. Synchronous code runs first; async work is scheduled as either microtasks (promise callbacks, queueMicrotask) or macrotasks (setTimeout, setInterval, I/O). After each synchronous run completes, the engine drains the ENTIRE microtask queue before taking the next macrotask. That is why a resolved promise callback runs before a setTimeout(…, 0) scheduled at the same time. Understanding this ordering explains async bugs, starvation, and why long synchronous loops freeze everything.',
    },
    {
      id: 'js-closures',
      title: 'Closures and scope',
      content:
        'A closure is a function bundled with references to the variables in scope where it was created, so it keeps access to them even after that outer function returns. This is the basis of data privacy, function factories, memoization, and debounce/throttle. Watch the classic loop trap: using var in a for loop shares one binding, so all callbacks see the final value, while let creates a fresh binding per iteration.',
    },
    {
      id: 'js-this-prototypes',
      title: 'this, prototypes, and equality',
      content:
        'The value of this is set by how a function is called: a normal call gives the global object or undefined in strict mode, a method call gives the object, and arrow functions capture this from their enclosing scope. Objects delegate to their prototype for missing properties, which is how inheritance works without classes. For comparisons prefer === (strict) over == (which coerces types), and remember NaN is not equal to itself.',
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
  ],
};
