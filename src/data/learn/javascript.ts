import type { LearnModule } from '../../types';

export const javascript: LearnModule = {
  id: 'javascript',
  title: 'JavaScript',
  blurb: 'A complete JavaScript curriculum  -  from primitives to async patterns  -  at the depth senior backend interviews demand.',
  lessons: [
    {
      id: 'js-variables-types',
      title: 'Variables, Data Types & Type Coercion',
      content: `## Variables: var, let, and const

JavaScript has three ways to declare variables. Understanding the differences is fundamental.

**var**  -  function-scoped, hoisted and initialised to \`undefined\`, can be re-declared.

**let**  -  block-scoped, hoisted but stays in the Temporal Dead Zone (TDZ) until its declaration line, cannot be re-declared in the same scope.

**const**  -  same block-scoping as \`let\`, but the binding cannot be reassigned. Note: the value itself is not immutable  -  you can still mutate the contents of a \`const\` object or array.

\`\`\`javascript
const user = { name: 'Alice' };
user.name = 'Bob';     // fine  -  mutating the object
user = {};             // TypeError  -  rebinding const

let arr = [1, 2];
arr.push(3);           // fine
arr = [];              // fine  -  let can be reassigned
\`\`\`

## The Seven Primitive Types

JavaScript has **7 primitive types**: \`string\`, \`number\`, \`bigint\`, \`boolean\`, \`undefined\`, \`null\`, and \`symbol\`. Primitives are immutable and stored by value. Everything else is an **object** (including arrays, functions, dates, maps).

\`\`\`javascript
typeof 'hello'        // 'string'
typeof 42             // 'number'
typeof true           // 'boolean'
typeof undefined      // 'undefined'
typeof null           // 'object'  ← famous historical bug
typeof Symbol()       // 'symbol'
typeof 9007199254740993n // 'bigint'
typeof {}             // 'object'
typeof []             // 'object'
typeof function(){}   // 'function'
\`\`\`

**Number** is a 64-bit float. It cannot safely represent integers larger than \`Number.MAX_SAFE_INTEGER\` (2^53 − 1). Use **BigInt** for arbitrary-precision integers.

**Symbol** creates a globally unique identifier. Used to add properties to objects without risk of name collision  -  especially useful when extending third-party objects.

## Type Coercion

JavaScript converts types implicitly in many situations. This is the source of many bugs.

**Implicit (loose) equality** with \`==\` triggers coercion:

\`\`\`javascript
0 == false     // true  (false → 0)
'' == false    // true  (both → 0)
null == undefined  // true (special rule)
null == 0          // false
NaN == NaN         // false (NaN never equals anything)
\`\`\`

**Always use strict equality \`===\`** which compares type and value without coercion.

**String conversion** happens when you use \`+\` with a string operand:

\`\`\`javascript
'5' + 3     // '53'  -  number is coerced to string
'5' - 3     // 2    -  string is coerced to number (- has no string meaning)
\`\`\`

**Explicit conversion**:

\`\`\`javascript
Number('42')      // 42
Number('')        // 0
Number('abc')     // NaN
parseInt('42px')  // 42   -  stops at first non-digit
String(42)        // '42'
Boolean(0)        // false
Boolean('')       // false
Boolean(null)     // false
Boolean(undefined)// false
Boolean(NaN)      // false
Boolean({})       // true   -  empty object is truthy!
\`\`\`

**Falsy values** (the only 8): \`false\`, \`0\`, \`-0\`, \`0n\`, \`''\` (empty string), \`null\`, \`undefined\`, \`NaN\`. Everything else is truthy.`,
    },
    {
      id: 'js-operators',
      title: 'Operators, Expressions & Short-Circuit Evaluation',
      content: `## Arithmetic and Assignment Operators

Standard arithmetic: \`+\`, \`-\`, \`*\`, \`/\`, \`%\` (modulo), \`**\` (exponentiation).

\`\`\`javascript
2 ** 10        // 1024
10 % 3         // 1
-10 % 3        // -1  (sign follows dividend in JS)
\`\`\`

Compound assignment: \`+=\`, \`-=\`, \`*=\`, \`/=\`, \`%=\`, \`**=\`.

Increment/decrement: \`++x\` (pre-increment, returns new value), \`x++\` (post-increment, returns old value).

## Comparison Operators

\`===\` (strict equality), \`!==\` (strict inequality): compare value AND type.

\`>\`, \`<\`, \`>=\`, \`<=\`: comparison with coercion for non-numbers.

\`\`\`javascript
'10' > '9'     // false  -  string comparison, '1' < '9'
10 > 9         // true   -  numeric comparison
\`\`\`

## Logical Operators and Short-Circuit Evaluation

\`&&\` returns the **first falsy value** or the last value if all are truthy.
\`||\` returns the **first truthy value** or the last value if all are falsy.

\`\`\`javascript
const a = null && 'default'    // null   (short-circuits at null)
const b = null || 'default'    // 'default'
const c = 0 || 'fallback'      // 'fallback' (0 is falsy)
const d = false && riskyFn()   // false  (riskyFn never called)
\`\`\`

This is used extensively for conditional execution and default values.

## Nullish Coalescing (??) and Optional Chaining (?.)

**\`??\`** (nullish coalescing)  -  like \`||\` but only falls back when the left side is \`null\` or \`undefined\` (not for 0, '', or false):

\`\`\`javascript
const count = 0 || 10    // 10   -  treats 0 as falsy (wrong!)
const count = 0 ?? 10    // 0    -  only null/undefined triggers fallback
const name = user.name ?? 'Anonymous'
\`\`\`

**\`?.\`** (optional chaining)  -  safely accesses nested properties without throwing if an intermediate value is null/undefined:

\`\`\`javascript
const street = user?.address?.street    // undefined if user or address is null
const result = arr?.[0]                 // safe array access
const val = obj?.method?.()             // safe method call
\`\`\`

These two operators together replace many defensive null-check patterns.

## Logical Assignment Operators (ES2021)

\`\`\`javascript
x ||= 'default'   // x = x || 'default'  (assign if falsy)
x &&= transform(x) // x = x && transform(x)  (assign if truthy)
x ??= 'default'   // x = x ?? 'default'  (assign if null/undefined)
\`\`\`

## The Comma Operator and Ternary

The ternary \`condition ? valueIfTrue : valueIfFalse\` is an expression (returns a value), not a statement  -  useful inline.

\`\`\`javascript
const label = score >= 70 ? 'Pass' : 'Fail';
const role = isAdmin ? 'admin' : isPaid ? 'paid' : 'free';  // chaining
\`\`\``,
    },
    {
      id: 'js-control-flow',
      title: 'Control Flow, Loops & Iteration',
      content: `## Conditionals

**if / else if / else**  -  standard branching. The condition is coerced to boolean.

**switch / case**  -  uses strict equality (\`===\`) to match. Always use \`break\` to prevent fall-through (intentional fall-through should be commented):

\`\`\`javascript
switch (status) {
  case 'active':
    activate();
    break;
  case 'pending':
  case 'review':          // intentional fall-through
    flag();
    break;
  default:
    archive();
}
\`\`\`

## Loops

**for**  -  classic counter loop:

\`\`\`javascript
for (let i = 0; i < arr.length; i++) { /* ... */ }
\`\`\`

**while**  -  runs while condition is true:

\`\`\`javascript
while (queue.length > 0) {
  process(queue.shift());
}
\`\`\`

**do…while**  -  runs at least once:

\`\`\`javascript
do {
  input = prompt();
} while (!isValid(input));
\`\`\`

**for…of**  -  iterates over **values** of any iterable (arrays, strings, Maps, Sets, generators):

\`\`\`javascript
for (const item of items) { /* ... */ }
for (const char of 'hello') { /* ... */ }
for (const [key, val] of map) { /* ... */ }
\`\`\`

**for…in**  -  iterates over **enumerable property keys** of an object (including inherited ones  -  use \`hasOwnProperty\` or \`Object.keys()\` to be safe). Avoid for arrays.

\`\`\`javascript
for (const key in obj) {
  if (Object.hasOwn(obj, key)) { /* own properties only */ }
}
\`\`\`

## break, continue, and Labels

\`break\` exits a loop or switch. \`continue\` skips to the next iteration.

Labels allow breaking out of nested loops:

\`\`\`javascript
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) break outer;  // exits both loops
  }
}
\`\`\`

## Truthy/Falsy in Conditions

Any value can be used as a condition. The 8 falsy values: \`false\`, \`0\`, \`-0\`, \`0n\`, \`''\`, \`null\`, \`undefined\`, \`NaN\`. Everything else including empty arrays \`[]\` and objects \`{}\` is truthy.

\`\`\`javascript
if ([]) console.log('truthy');   // prints! empty array is truthy
if ({}) console.log('truthy');   // prints! empty object is truthy
if ([].length) console.log('has items');  // does NOT print  -  length 0 is falsy
\`\`\``,
    },
    {
      id: 'js-functions',
      title: 'Functions: Declarations, Expressions, Arrow & IIFE',
      content: `## Function Declarations vs Expressions

**Function declaration**  -  hoisted entirely, callable before its source line:

\`\`\`javascript
greet('Alice');  // works  -  declaration is hoisted
function greet(name) {
  return 'Hello, ' + name;
}
\`\`\`

**Function expression**  -  not hoisted (the variable is hoisted but not the function):

\`\`\`javascript
const greet = function(name) { return 'Hello, ' + name; };
\`\`\`

Named function expressions are useful for recursion and stack traces:

\`\`\`javascript
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1);  // can call itself by name
};
\`\`\`

## Arrow Functions

Arrow functions have a shorter syntax and **no own \`this\`**, \`arguments\`, \`super\`, or \`new.target\`. They inherit \`this\` from the enclosing lexical scope.

\`\`\`javascript
const add = (a, b) => a + b;                // single expression, implicit return
const double = x => x * 2;                 // single param, no parens needed
const noop = () => {};                      // no params
const getUser = () => ({ name: 'Alice' });  // wrap object in () for implicit return
\`\`\`

Arrow functions cannot be constructors (\`new Arrow()\` throws), and they do not have their own \`arguments\` object.

When to use arrows vs regular functions:
- **Callbacks and short expressions**  -  prefer arrows (lexical \`this\`)
- **Object methods**  -  use regular functions (need their own \`this\`)
- **Constructors / prototype methods**  -  must use regular functions

## Default Parameters

\`\`\`javascript
function createUser(name, role = 'viewer', active = true) {
  return { name, role, active };
}
createUser('Bob');             // { name: 'Bob', role: 'viewer', active: true }
createUser('Bob', undefined);  // undefined triggers the default
createUser('Bob', null);       // null does NOT trigger  -  null is explicit
\`\`\`

Default parameters can reference earlier parameters:

\`\`\`javascript
function range(start, end = start + 10) { /* ... */ }
\`\`\`

## Rest Parameters

Collects remaining arguments into a real Array (unlike the array-like \`arguments\` object):

\`\`\`javascript
function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4);  // 10
\`\`\`

Rest must be the last parameter. \`arguments\` is not available in arrow functions.

## IIFE (Immediately Invoked Function Expression)

A function that runs immediately  -  used to create a private scope:

\`\`\`javascript
const counter = (function () {
  let count = 0;
  return {
    increment() { count++; },
    value() { return count; },
  };
})();

counter.increment();
counter.value();  // 1
\`\`\`

IIFEs were the main encapsulation pattern before ES modules. Still useful for one-shot initialization.

## Higher-Order Functions

Functions that accept functions as arguments or return functions:

\`\`\`javascript
function withLogging(fn) {
  return function(...args) {
    console.log('Calling with', args);
    const result = fn(...args);
    console.log('Result:', result);
    return result;
  };
}

const loggedAdd = withLogging((a, b) => a + b);
loggedAdd(2, 3);  // logs calls, returns 5
\`\`\`

Higher-order functions are the basis of middleware patterns, decorators, and functional utilities.`,
    },
    {
      id: 'js-closures',
      title: 'Closures, Scope Chain & Lexical Environment',
      content: `## What Is a Closure?

A **closure** is a function that remembers the variables from the scope where it was defined, even after that outer scope has returned. Every function in JavaScript is a closure  -  it captures references to all variables in its enclosing scopes.

\`\`\`javascript
function makeCounter(start = 0) {
  let count = start;          // captured by the inner function
  return {
    increment() { count++; },
    decrement() { count--; },
    value() { return count; },
  };
}

const c = makeCounter(10);
c.increment();
c.increment();
c.value();    // 12  -  count persists across calls
\`\`\`

The \`count\` variable is private  -  there is no way to access it except through the returned methods.

## The Scope Chain

When a function looks up a variable, it searches:
1. Its own local scope
2. Each enclosing function's scope (in order)
3. The global scope

This chain is **lexical**  -  determined by where the function is written, not where it is called.

\`\`\`javascript
const x = 'global';

function outer() {
  const x = 'outer';
  function inner() {
    console.log(x);  // 'outer'  -  found in outer scope before global
  }
  inner();
}
\`\`\`

## The Classic Loop Trap

\`\`\`javascript
// BROKEN  -  var shares one binding across all iterations
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);  // prints: 3, 3, 3
}

// FIXED with let  -  each iteration gets its own block-scoped i
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);  // prints: 0, 1, 2
}

// FIXED with IIFE (pre-ES6)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 100);  // prints: 0, 1, 2
  })(i);
}
\`\`\`

## Practical Uses of Closures

**Memoization**  -  cache expensive results:

\`\`\`javascript
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const fib = memoize(function f(n) {
  return n <= 1 ? n : f(n - 1) + f(n - 2);
});
\`\`\`

**Partial application**:

\`\`\`javascript
function multiply(a) {
  return function(b) { return a * b; };
}
const double = multiply(2);
double(5);   // 10
double(10);  // 20
\`\`\`

**Module pattern** (encapsulation without classes):

\`\`\`javascript
const userService = (function() {
  const users = [];  // private
  return {
    add(user) { users.push(user); },
    getAll() { return [...users]; },  // defensive copy
    count() { return users.length; },
  };
})();
\`\`\`

## Memory Considerations

Closures keep the entire outer scope alive. A large closure capturing a big object can cause memory leaks if the closure is stored in a long-lived cache or event listener that is never cleaned up. Set captured references to \`null\` when done if the closure is long-lived.`,
    },
    {
      id: 'js-hoisting-tdz',
      title: 'Hoisting, Temporal Dead Zone & Variable Declarations',
      content: `## What Is Hoisting?

During the compilation phase, JavaScript scans the code and registers all declarations before executing any code. This is called **hoisting**. Only **declarations** are hoisted  -  not initialisations.

## var Hoisting

\`var\` declarations are hoisted and initialised to \`undefined\`:

\`\`\`javascript
console.log(x);  // undefined (not an error!)
var x = 5;
console.log(x);  // 5

// The engine sees it as:
var x;           // declaration hoisted, initialised to undefined
console.log(x);  // undefined
x = 5;           // assignment stays in place
console.log(x);  // 5
\`\`\`

\`var\` is **function-scoped**, not block-scoped. A \`var\` inside an \`if\` block leaks to the containing function:

\`\`\`javascript
function example() {
  if (true) {
    var leaked = 'oops';
  }
  console.log(leaked);  // 'oops'  -  leaked out of the if block
}
\`\`\`

## Function Declaration Hoisting

Function **declarations** are hoisted entirely  -  both the name and the body:

\`\`\`javascript
sayHello();           // works!
function sayHello() {
  console.log('Hello');
}
\`\`\`

Function **expressions** are NOT hoisted (the variable is hoisted as \`undefined\`):

\`\`\`javascript
sayHello();  // TypeError: sayHello is not a function
var sayHello = function() { console.log('Hello'); };
\`\`\`

## let and const: The Temporal Dead Zone (TDZ)

\`let\` and \`const\` ARE hoisted (the engine knows they exist), but they are placed in the **Temporal Dead Zone**  -  a special state where any access throws a \`ReferenceError\`:

\`\`\`javascript
console.log(y);  // ReferenceError: Cannot access 'y' before initialization
let y = 10;
\`\`\`

The TDZ starts at the beginning of the block and ends when the declaration line executes.

\`\`\`javascript
{
  // TDZ for x starts here
  console.log(x);  // ReferenceError
  let x = 5;       // TDZ ends here
  console.log(x);  // 5
}
\`\`\`

**Why the TDZ exists**: It was added intentionally to catch programming errors. If \`let\` silently returned \`undefined\` like \`var\`, bugs from using variables too early would be silent  -  hard to diagnose. The TDZ makes the error loud and immediate.

## Class Hoisting

Class declarations are also hoisted but remain in the TDZ:

\`\`\`javascript
const obj = new Foo();  // ReferenceError
class Foo {}
\`\`\`

## Summary

| | Hoisted? | Initialised to | Scope |
|---|---|---|---|
| var | Yes | undefined | Function |
| let | Yes (TDZ) | TDZ | Block |
| const | Yes (TDZ) | TDZ | Block |
| function declaration | Yes (whole) | Function body | Function |
| class | Yes (TDZ) | TDZ | Block |`,
    },
    {
      id: 'js-this',
      title: 'The this Keyword: Context, Binding & Arrow Functions',
      content: `## How this Is Determined

\`this\` is not fixed at definition time  -  it depends on **how the function is called**. There are four call patterns:

### 1. Method Call

\`this\` is the object before the dot:

\`\`\`javascript
const user = {
  name: 'Alice',
  greet() { return 'Hello, ' + this.name; },
};
user.greet();  // 'Hello, Alice'  -  this = user
\`\`\`

**Losing \`this\`**  -  extracting a method loses its context:

\`\`\`javascript
const fn = user.greet;
fn();  // 'Hello, undefined'  -  this is global/undefined in strict mode
\`\`\`

### 2. Plain Function Call

\`this\` is \`undefined\` in strict mode, or the global object (\`window\`/\`global\`) in sloppy mode:

\`\`\`javascript
function show() { console.log(this); }
show();  // undefined (in 'use strict') or global object
\`\`\`

### 3. Constructor Call (new)

\`this\` is the newly created object:

\`\`\`javascript
function Person(name) { this.name = name; }
const p = new Person('Bob');  // this = {} → returned as p
\`\`\`

### 4. Explicit Binding (call / apply / bind)

\`call\` and \`apply\` invoke the function immediately with a specific \`this\`:

\`\`\`javascript
function greet(greeting) { return greeting + ', ' + this.name; }
greet.call({ name: 'Alice' }, 'Hello');    // 'Hello, Alice'
greet.apply({ name: 'Alice' }, ['Hello']); // same  -  array of args
\`\`\`

\`bind\` creates a **new function** permanently bound to a \`this\`:

\`\`\`javascript
const boundGreet = greet.bind({ name: 'Bob' });
boundGreet('Hi');  // 'Hi, Bob'  -  this is permanently set
\`\`\`

## Arrow Functions Have No Own this

Arrow functions capture \`this\` from the lexical scope where they are **defined**, not called:

\`\`\`javascript
class Timer {
  constructor() { this.ticks = 0; }
  start() {
    // arrow captures 'this' from start()'s scope, which is the Timer instance
    setInterval(() => { this.ticks++; }, 1000);
  }
}

// If you used a regular function:
setInterval(function() {
  this.ticks++;  // 'this' is undefined or global  -  bug!
}, 1000);
\`\`\`

Arrow functions cannot be used as constructors, and \`call/apply/bind\` cannot change their \`this\`.

## this in Class Methods

Class bodies run in strict mode. Instance methods have \`this\` set to the instance when called normally. But passing a method as a callback loses \`this\`:

\`\`\`javascript
class Button {
  constructor(label) { this.label = label; }
  click() { console.log(this.label); }
}
const btn = new Button('Submit');
btn.click();                // 'Submit'
setTimeout(btn.click, 100); // undefined  -  this lost

// Fix 1: bind in constructor
this.click = this.click.bind(this);

// Fix 2: class field with arrow function
click = () => { console.log(this.label); };  // arrow captures this
\`\`\``,
    },
    {
      id: 'js-prototypes',
      title: 'Prototypes, Prototype Chain & Inheritance',
      content: `## What Is a Prototype?

Every JavaScript object has an internal \`[[Prototype]]\` link (accessible via \`Object.getPrototypeOf(obj)\` or the legacy \`obj.__proto__\`). When you access a property on an object, JavaScript first checks the object itself, then walks up the prototype chain until it finds it or reaches \`null\`.

\`\`\`javascript
const animal = {
  breathe() { return 'breathing'; },
};

const dog = Object.create(animal);  // dog's prototype is animal
dog.bark = function() { return 'woof'; };

dog.bark();     // 'woof'  -  own property
dog.breathe();  // 'breathing'  -  found on prototype
\`\`\`

## The Prototype Chain

Every plain object's chain ends at \`Object.prototype\`, which provides methods like \`toString\`, \`hasOwnProperty\`, etc. \`Object.prototype\`'s prototype is \`null\`  -  the end of the chain.

\`\`\`javascript
// dog → animal → Object.prototype → null
Object.getPrototypeOf(dog) === animal          // true
Object.getPrototypeOf(animal) === Object.prototype  // true
Object.getPrototypeOf(Object.prototype)        // null
\`\`\`

## Constructor Functions and .prototype

Before ES6 classes, inheritance was done with constructor functions and manually setting \`.prototype\`:

\`\`\`javascript
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  return this.name + ' makes a sound';
};

function Dog(name) {
  Animal.call(this, name);  // call parent constructor
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;  // fix constructor reference
Dog.prototype.bark = function() { return 'woof'; };

const d = new Dog('Rex');
d.speak();  // 'Rex makes a sound'  -  inherited
d.bark();   // 'woof'  -  own prototype method
\`\`\`

## hasOwnProperty and Object.hasOwn

To check if a property exists directly on an object (not inherited):

\`\`\`javascript
const obj = { a: 1 };
'a' in obj                     // true  -  checks chain too
obj.hasOwnProperty('a')        // true  -  own only
Object.hasOwn(obj, 'a')        // true  -  modern, safer version
Object.hasOwn(obj, 'toString') // false  -  inherited from Object.prototype
\`\`\`

## Shadowing Properties

Setting a property on an object creates an **own property** that shadows any property of the same name on the prototype:

\`\`\`javascript
const proto = { x: 1 };
const child = Object.create(proto);
child.x = 99;            // creates own property, shadows proto.x
child.x;                 // 99
proto.x;                 // 1  -  prototype unchanged
\`\`\`

## Object.create vs Object.assign

\`Object.create(proto)\`  -  creates a new object with \`proto\` as its \`[[Prototype]]\`.

\`Object.assign(target, source)\`  -  shallow-copies own enumerable properties; does NOT affect the prototype chain.

## instanceof

\`instanceof\` checks if a constructor's \`prototype\` property appears anywhere in the prototype chain:

\`\`\`javascript
d instanceof Dog     // true
d instanceof Animal  // true (Animal.prototype is in the chain)
d instanceof Object  // true (always  -  all objects inherit from Object.prototype)
\`\`\``,
    },
    {
      id: 'js-classes',
      title: 'ES6 Classes: Syntax, Inheritance & Private Fields',
      content: `## Class Syntax

ES6 classes are **syntactic sugar over prototype-based inheritance**. Under the hood, methods are placed on the prototype, not on each instance.

\`\`\`javascript
class Animal {
  constructor(name) {
    this.name = name;       // instance property
  }

  speak() {                 // placed on Animal.prototype
    return \`\${this.name} makes a sound\`;
  }

  static create(name) {     // static method  -  on Animal itself, not instances
    return new Animal(name);
  }
}

const a = Animal.create('Cat');
a.speak();  // 'Cat makes a sound'
\`\`\`

Methods defined in the class body go on the prototype  -  they are shared across all instances. Properties assigned in the constructor are own properties  -  each instance gets its own copy.

## Inheritance with extends and super

\`\`\`javascript
class Dog extends Animal {
  constructor(name, breed) {
    super(name);         // MUST call super() before using this
    this.breed = breed;
  }

  speak() {
    return \`\${this.name} barks\`;  // overrides Animal.speak
  }

  describe() {
    return super.speak() + ' and is a ' + this.breed;  // call parent method
  }
}

const d = new Dog('Rex', 'Labrador');
d.speak();     // 'Rex barks'
d.describe();  // 'Rex makes a sound and is a Labrador'
\`\`\`

## Getters and Setters

\`\`\`javascript
class Circle {
  constructor(radius) {
    this._radius = radius;
  }

  get radius() { return this._radius; }
  set radius(value) {
    if (value < 0) throw new Error('Radius cannot be negative');
    this._radius = value;
  }

  get area() { return Math.PI * this._radius ** 2; }  // computed, read-only
}

const c = new Circle(5);
c.area;          // ~78.5
c.radius = -1;   // throws Error
\`\`\`

## Private Fields (#)

True private fields using the \`#\` prefix (ES2022). Accessible only within the class body:

\`\`\`javascript
class BankAccount {
  #balance = 0;           // private field, initialised to 0

  deposit(amount) {
    if (amount <= 0) throw new Error('Invalid amount');
    this.#balance += amount;
  }

  get balance() { return this.#balance; }
}

const acc = new BankAccount();
acc.deposit(100);
acc.balance;     // 100
acc.#balance;    // SyntaxError  -  cannot access outside class
\`\`\`

## Class Fields

Public class fields are own properties initialised before the constructor:

\`\`\`javascript
class User {
  role = 'viewer';              // public field with default
  #id = Math.random();          // private field

  constructor(name) {
    this.name = name;
  }

  // Arrow function as class field  -  useful for callbacks (captures this)
  greet = () => \`Hello, \${this.name}\`;
}
\`\`\`

## Static Methods and Properties

Static members belong to the class, not instances. Common for factory methods, utilities, and constants:

\`\`\`javascript
class MathHelper {
  static PI = 3.14159;
  static square(n) { return n * n; }
}

MathHelper.square(4);  // 16
MathHelper.PI;         // 3.14159
\`\`\``,
    },
    {
      id: 'js-error-handling',
      title: 'Error Handling: try/catch, Custom Errors & Async Errors',
      content: `## Error Types

JavaScript has several built-in error types:

- **SyntaxError**  -  invalid code (parse time, cannot be caught at runtime in the same script)
- **ReferenceError**  -  accessing a variable that does not exist
- **TypeError**  -  wrong type (calling non-function, property access on null/undefined)
- **RangeError**  -  value out of allowed range (invalid array length, stack overflow)
- **URIError**  -  invalid URI encoding
- **EvalError**  -  (rarely used in modern JS)

\`\`\`javascript
null.property;          // TypeError
undeclaredVar;          // ReferenceError
new Array(-1);          // RangeError
\`\`\`

## try / catch / finally

\`\`\`javascript
try {
  const data = JSON.parse(input);  // may throw SyntaxError
  processData(data);
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Invalid JSON:', error.message);
  } else {
    throw error;  // re-throw unexpected errors  -  don't swallow them
  }
} finally {
  cleanup();  // always runs, even if catch throws
}
\`\`\`

**Error properties**: \`error.name\` (e.g. 'TypeError'), \`error.message\`, \`error.stack\` (full stack trace string).

## Custom Error Classes

Extending \`Error\` is the cleanest approach:

\`\`\`javascript
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    // Fix prototype chain for instanceof to work correctly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(\`\${resource} not found\`, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

throw new NotFoundError('User');
// error.message = 'User not found'
// error.code = 'NOT_FOUND'
// error instanceof NotFoundError = true
// error instanceof AppError = true
\`\`\`

## Async Error Handling

In promise chains, \`.catch()\` handles rejections:

\`\`\`javascript
fetchUser(id)
  .then(user => processUser(user))
  .catch(error => {
    if (error instanceof NotFoundError) handleMissing();
    else throw error;  // propagate unknown errors
  });
\`\`\`

With async/await, use \`try/catch\`:

\`\`\`javascript
async function loadUser(id) {
  try {
    const user = await fetchUser(id);
    return await processUser(user);
  } catch (error) {
    logger.error('loadUser failed', { id, error });
    throw error;  // caller decides whether to handle or propagate
  }
}
\`\`\`

**Never swallow errors silently:**

\`\`\`javascript
// BAD  -  hides bugs
try { riskyOp(); } catch (e) {}

// GOOD  -  at least log
try { riskyOp(); } catch (e) { logger.warn(e); }
\`\`\`

## Unhandled Promise Rejections

In Node.js, unhandled rejections cause the process to crash (since Node 15+). Always attach error handling:

\`\`\`javascript
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);  // fail loudly rather than limp on
});
\`\`\``,
    },
    {
      id: 'js-event-loop',
      title: 'The Event Loop: Call Stack, Microtasks & Macrotasks',
      content: `## The JavaScript Runtime Model

JavaScript is **single-threaded**  -  one call stack, one piece of code running at a time. Yet it handles thousands of async operations. The event loop is how.

The components:
- **Call Stack**  -  LIFO stack of executing function frames
- **Heap**  -  unstructured memory where objects are allocated
- **Web APIs / Node APIs**  -  timer, I/O, fetch  -  run outside the JS thread
- **Macrotask Queue** (callback queue)  -  completed I/O, setTimeout, setInterval
- **Microtask Queue**  -  Promise callbacks (\`.then\`), \`queueMicrotask\`, MutationObserver

## The Event Loop Algorithm

After each task (macrotask) the loop:
1. Runs the current synchronous code to completion (empties the call stack)
2. Drains the **entire microtask queue** (including any new microtasks added during drain)
3. Renders (browsers only)
4. Takes the **next macrotask** from the queue and runs it
5. Repeat

This means Promise callbacks run before the next setTimeout, even a \`setTimeout(fn, 0)\`:

\`\`\`javascript
console.log('1  -  sync');

setTimeout(() => console.log('4  -  macrotask'), 0);

Promise.resolve()
  .then(() => console.log('2  -  microtask'))
  .then(() => console.log('3  -  microtask'));

console.log('still sync');

// Output order:
// 1  -  sync
// still sync
// 2  -  microtask
// 3  -  microtask
// 4  -  macrotask
\`\`\`

## Microtask Starvation

If microtasks continuously schedule more microtasks, macrotasks (I/O, timers) **never get to run**:

\`\`\`javascript
function infiniteMicrotasks() {
  Promise.resolve().then(infiniteMicrotasks);  // schedules itself forever
}
infiniteMicrotasks();
setTimeout(() => console.log('never runs'), 0);  // starved
\`\`\`

This is a real production bug pattern. Keep microtask handlers short.

## Node.js: process.nextTick

In Node.js, \`process.nextTick\` callbacks run **before** the microtask queue:

\`\`\`javascript
setTimeout(() => console.log('timer'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));

// Typical output:
// nextTick
// promise
// timer  (or immediate  -  depends on libuv scheduling)
\`\`\`

\`process.nextTick\` fires after the current operation, before I/O callbacks. Overusing it causes the same starvation risk as infinite microtasks.

## Long Tasks and Main Thread Blocking

Any synchronous code that runs for more than ~16 ms (one frame at 60fps) blocks the event loop. Signs of blocking: timers fire late, UI freezes, requests time out.

For CPU-heavy work in Node:
- Use **worker_threads** to run JS on a separate thread
- Use **child_process** for isolating unstable code
- Break work into async chunks using \`setImmediate\` or \`queueMicrotask\`

\`\`\`javascript
// Chunked processing  -  yields control between batches
async function processInChunks(items, batchSize = 1000) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    batch.forEach(process);
    await new Promise(resolve => setImmediate(resolve));  // yield
  }
}
\`\`\``,
    },
    {
      id: 'js-promises',
      title: 'Promises: States, Chaining & Combinators',
      content: `## Promise Fundamentals

A **Promise** represents an eventual value. It is always in one of three states:
- **Pending**  -  initial state, neither fulfilled nor rejected
- **Fulfilled**  -  the operation succeeded, the promise has a value
- **Rejected**  -  the operation failed, the promise has a reason

State is **one-way**: pending → fulfilled or pending → rejected. Once settled, it never changes.

\`\`\`javascript
const p = new Promise((resolve, reject) => {
  // resolve(value)   -  fulfil the promise
  // reject(reason)   -  reject the promise
  setTimeout(() => resolve(42), 1000);
});

p.then(value => console.log(value));   // 42 after 1 second
\`\`\`

## .then(), .catch(), .finally()

Each of these returns a **new Promise**, enabling chaining:

\`\`\`javascript
fetchUser(id)
  .then(user => fetchPosts(user.id))   // returns a promise
  .then(posts => render(posts))         // receives the posts
  .catch(error => showError(error))     // handles any rejection in the chain
  .finally(() => hideSpinner());        // always runs
\`\`\`

If a \`.then\` handler throws or returns a rejected promise, the next \`.catch\` in the chain catches it.

If a \`.then\` handler returns a value, the next \`.then\` receives that value. If it returns a Promise, the chain waits for that promise to settle.

## Common Mistake: Nested Promises

\`\`\`javascript
// BAD  -  creates "promise hell"
fetchUser(id).then(user => {
  fetchPosts(user.id).then(posts => {  // nested, not chained
    render(posts);
  });
});

// GOOD  -  flat chain
fetchUser(id)
  .then(user => fetchPosts(user.id))
  .then(posts => render(posts));
\`\`\`

## Promise Combinators

**Promise.all(iterable)**  -  fulfils when ALL resolve, rejects immediately if ANY rejects:

\`\`\`javascript
const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchComments(id),
]);
// All three run concurrently  -  much faster than sequential
\`\`\`

**Promise.allSettled(iterable)**  -  waits for ALL to settle, never short-circuits:

\`\`\`javascript
const results = await Promise.allSettled([p1, p2, p3]);
results.forEach(result => {
  if (result.status === 'fulfilled') use(result.value);
  else log(result.reason);
});
\`\`\`

**Promise.race(iterable)**  -  resolves or rejects with the **first** settled promise:

\`\`\`javascript
const result = await Promise.race([
  fetch(url),
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
]);
\`\`\`

**Promise.any(iterable)**  -  fulfils with the first that **fulfils**; rejects only if ALL reject (with an AggregateError):

\`\`\`javascript
const fastest = await Promise.any([mirror1, mirror2, mirror3]);
\`\`\`

## Creating Resolved/Rejected Promises

\`\`\`javascript
Promise.resolve(value)   // returns an already-fulfilled promise
Promise.reject(reason)   // returns an already-rejected promise

// Useful for wrapping non-promise values in promise chains
const cached = Promise.resolve(cachedData);
\`\`\``,
    },
    {
      id: 'js-async-await',
      title: 'async/await: Syntax, Error Handling & Parallel Patterns',
      content: `## async Functions

The \`async\` keyword before a function makes it always return a Promise. The resolved value is what you \`return\`:

\`\`\`javascript
async function getUser(id) {
  return { id, name: 'Alice' };  // wrapped in Promise.resolve automatically
}

getUser(1).then(u => console.log(u.name));  // 'Alice'
\`\`\`

If the async function throws, the returned Promise rejects with that error.

## await

\`await\` pauses the async function until the Promise settles. It can only be used inside \`async\` functions (or at the top level of ES modules  -  "top-level await"):

\`\`\`javascript
async function loadDashboard(userId) {
  const user = await fetchUser(userId);    // waits for user
  const posts = await fetchPosts(user.id); // then waits for posts
  return { user, posts };
}
\`\`\`

This looks synchronous but is non-blocking  -  while awaiting, the event loop processes other tasks.

## Error Handling

Use \`try/catch\` around awaited calls:

\`\`\`javascript
async function saveUser(data) {
  try {
    const user = await db.users.create(data);
    await sendWelcomeEmail(user.email);
    return user;
  } catch (error) {
    if (error.code === '23505') {  // unique constraint violation
      throw new ConflictError('Email already exists');
    }
    throw error;  // propagate unexpected errors
  }
}
\`\`\`

**Avoid mixing** \`try/catch\` and \`.catch()\` on the same expression  -  you'll handle the error twice or miss it.

## Sequential vs Parallel Execution

\`\`\`javascript
// Sequential  -  each waits for the previous (total: 3 seconds)
const a = await delay(1000);
const b = await delay(1000);
const c = await delay(1000);

// Parallel  -  all run at once (total: ~1 second)
const [a, b, c] = await Promise.all([
  delay(1000),
  delay(1000),
  delay(1000),
]);
\`\`\`

Start the promises **before** awaiting them:

\`\`\`javascript
// WRONG  -  sequential despite intent
const a = await fetchA();  // starts and waits
const b = await fetchB();  // then starts and waits

// RIGHT  -  parallel
const pA = fetchA();  // starts immediately
const pB = fetchB();  // starts immediately
const [a, b] = await Promise.all([pA, pB]);  // await both
\`\`\`

## Async Iteration

For streaming data or paginated APIs:

\`\`\`javascript
async function* paginate(url) {
  let nextUrl = url;
  while (nextUrl) {
    const { data, next } = await fetch(nextUrl).then(r => r.json());
    yield data;
    nextUrl = next;
  }
}

for await (const page of paginate('/api/users')) {
  process(page);
}
\`\`\`

## Common Mistakes

**Forgetting await**  -  the promise is not awaited, assertions run before the result:

\`\`\`javascript
const user = fetchUser(1);  // forgot await  -  user is a Promise, not a user object
if (user.name) { /* ... */ }  // undefined
\`\`\`

**Unnecessary await on non-promise**:

\`\`\`javascript
return await value;  // redundant if value is not a promise
\`\`\`

Exception: \`return await\` inside a \`try/catch\` IS meaningful  -  without \`await\`, a thrown promise from \`value\` would not be caught by the surrounding catch.`,
    },
    {
      id: 'js-es6-features',
      title: 'ES6+ Modern JavaScript: Destructuring, Spread, Symbols & More',
      content: `## Destructuring

**Array destructuring**  -  extracts values by position:

\`\`\`javascript
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first = 1, second = 2, rest = [3, 4, 5]

const [a, , b] = [1, 2, 3];  // skip elements with empty commas
// a = 1, b = 3

const [x = 0, y = 0] = [10];  // defaults
// x = 10, y = 0
\`\`\`

**Object destructuring**  -  extracts by property name:

\`\`\`javascript
const { name, age, role = 'viewer' } = user;  // with default

// Renaming
const { name: userName, id: userId } = user;

// Nested
const { address: { city, country } } = user;

// In function parameters
function process({ name, options: { timeout = 5000 } = {} }) { /* ... */ }
\`\`\`

## Spread Operator

**Spread in arrays**  -  expands an iterable into individual elements:

\`\`\`javascript
const merged = [...arr1, ...arr2, extraItem];
const copy = [...original];  // shallow copy
Math.max(...numbers);        // spread as arguments
\`\`\`

**Spread in objects**  -  shallow-merges objects:

\`\`\`javascript
const updated = { ...user, name: 'NewName' };   // override specific field
const merged = { ...defaults, ...overrides };    // later keys win
const copy = { ...obj };                         // shallow copy
\`\`\`

## Template Literals

Backtick strings with embedded expressions and multiline support:

\`\`\`javascript
const msg = \`Hello, \${user.name}! You have \${count} messages.\`;
const multiline = \`
  SELECT *
  FROM users
  WHERE id = \${id}
\`;
\`\`\`

**Tagged templates**  -  a function processes the template:

\`\`\`javascript
function sql(strings, ...values) {
  // sanitise values to prevent SQL injection
  return strings.reduce((acc, str, i) => acc + str + sanitise(values[i] ?? ''), '');
}
const query = sql\`SELECT * FROM users WHERE id = \${userId}\`;
\`\`\`

## Symbol

Creates a guaranteed-unique identifier. Used for "well-known symbols" and extending objects without key collisions:

\`\`\`javascript
const id = Symbol('id');
const user = { [id]: 123, name: 'Alice' };
user[id];           // 123
user['id'];         // undefined  -  string 'id' and Symbol are different
Object.keys(user);  // ['name']  -  symbols are non-enumerable
\`\`\`

Well-known symbols customise language behaviour:

\`\`\`javascript
class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  [Symbol.iterator]() {
    let cur = this.start;
    const end = this.end;
    return { next() { return cur <= end ? { value: cur++, done: false } : { done: true }; } };
  }
}
[...new Range(1, 5)]  // [1, 2, 3, 4, 5]
\`\`\`

## WeakRef and FinalizationRegistry

For advanced memory management (rarely needed in application code, useful in caches):

\`\`\`javascript
const cache = new Map();
function getOrCompute(key, computeFn) {
  const ref = cache.get(key);
  const cached = ref?.deref();
  if (cached) return cached;
  const value = computeFn();
  cache.set(key, new WeakRef(value));
  return value;
}
\`\`\`

## Logical Assignment and Nullish Assignment

\`\`\`javascript
config.timeout ??= 3000;     // set only if null/undefined
config.retries ||= 3;        // set only if falsy
config.debug &&= verbose;    // set only if truthy
\`\`\`

## Object Shorthand and Computed Keys

\`\`\`javascript
const name = 'Alice';
const age = 30;
const user = { name, age };         // shorthand  -  same as { name: name, age: age }

const key = 'dynamic';
const obj = { [key]: 'value' };     // computed property name
obj.dynamic;  // 'value'

const { ['first-name']: firstName } = data;  // computed destructuring key
\`\`\``,
    },
    {
      id: 'js-array-methods',
      title: 'Array Methods: Transforming, Searching & Reducing',
      content: `## Mutating vs Non-Mutating

Understanding which methods mutate the original array matters for functional programming and avoiding bugs.

**Mutating**: \`push\`, \`pop\`, \`shift\`, \`unshift\`, \`splice\`, \`sort\`, \`reverse\`, \`fill\`, \`copyWithin\`

**Non-mutating** (return new array/value): \`map\`, \`filter\`, \`reduce\`, \`slice\`, \`concat\`, \`flat\`, \`flatMap\`, \`find\`, \`findIndex\`, \`every\`, \`some\`, \`includes\`, \`indexOf\`

## Transformation

**map**  -  transform each element, returns new array of same length:

\`\`\`javascript
const doubled = [1, 2, 3].map(n => n * 2);        // [2, 4, 6]
const names = users.map(u => u.name);               // extract field
\`\`\`

**filter**  -  keep elements matching a predicate:

\`\`\`javascript
const active = users.filter(u => u.active);
const evens = [1,2,3,4].filter(n => n % 2 === 0);  // [2, 4]
\`\`\`

**flatMap**  -  map + flatten one level (more efficient than \`.map().flat()\`):

\`\`\`javascript
const words = sentences.flatMap(s => s.split(' '));
\`\`\`

## Reduction

**reduce**  -  fold array into single value:

\`\`\`javascript
const sum = [1, 2, 3, 4].reduce((acc, n) => acc + n, 0);  // 10

// Build an object from an array
const byId = users.reduce((map, user) => {
  map[user.id] = user;
  return map;
}, {});

// Count occurrences
const counts = words.reduce((acc, word) => {
  acc[word] = (acc[word] ?? 0) + 1;
  return acc;
}, {});
\`\`\`

**reduceRight**  -  same as reduce but iterates right to left.

## Searching

\`\`\`javascript
const found = users.find(u => u.id === targetId);    // first match or undefined
const idx   = users.findIndex(u => u.id === targetId); // index or -1
const has   = users.some(u => u.active);              // true if any match
const all   = users.every(u => u.active);             // true if all match
const incl  = [1,2,3].includes(2);                   // true
const pos   = [1,2,3].indexOf(2);                    // 1 (uses ===, NaN issue)
\`\`\`

## splice vs slice

\`\`\`javascript
const arr = [1, 2, 3, 4, 5];

// splice  -  MUTATES: (start, deleteCount, ...items)
arr.splice(1, 2);         // removes [2,3], arr is now [1,4,5]
arr.splice(1, 0, 'a', 'b'); // inserts at index 1

// slice  -  NON-MUTATING: (start, end) [end exclusive]
arr.slice(1, 3);          // [2, 3]  -  original unchanged
arr.slice(-2);            // last 2 elements
arr.slice();              // shallow copy of entire array
\`\`\`

## sort

**Mutates** and sorts in place. Default sort converts to strings (wrong for numbers):

\`\`\`javascript
[10, 9, 2, 1].sort();              // [1, 10, 2, 9]  -  lexicographic!
[10, 9, 2, 1].sort((a, b) => a - b); // [1, 2, 9, 10]  -  numeric ascending
[10, 9, 2, 1].sort((a, b) => b - a); // [10, 9, 2, 1]  -  descending

// Sort objects
users.sort((a, b) => a.name.localeCompare(b.name));
\`\`\`

For immutable sort, spread first: \`[...arr].sort(...)\`

## Flattening

\`\`\`javascript
[1, [2, [3, [4]]]].flat();    // [1, 2, [3, [4]]]  -  one level
[1, [2, [3, [4]]]].flat(2);   // [1, 2, 3, [4]]
[1, [2, [3]]].flat(Infinity); // [1, 2, 3]  -  all levels
\`\`\`

## Array.from and Array.of

\`\`\`javascript
Array.from('hello');              // ['h','e','l','l','o']
Array.from({ length: 5 }, (_, i) => i);  // [0, 1, 2, 3, 4]
Array.from(new Set([1, 2, 2, 3])); // [1, 2, 3]  -  deduplicate

Array.of(7);    // [7]  (compare: new Array(7) creates 7 empty slots)
\`\`\``,
    },
    {
      id: 'js-object-methods',
      title: 'Object Methods, Property Descriptors & Immutability',
      content: `## Iterating Objects

\`\`\`javascript
const obj = { a: 1, b: 2, c: 3 };

Object.keys(obj);    // ['a', 'b', 'c']  -  own enumerable keys
Object.values(obj);  // [1, 2, 3]
Object.entries(obj); // [['a',1], ['b',2], ['c',3]]

// Convert entries back to object (great with filter/map):
const doubled = Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, v * 2])
);
// { a: 2, b: 4, c: 6 }
\`\`\`

## Object.assign

Shallow-copies own enumerable properties from sources to target:

\`\`\`javascript
const defaults = { timeout: 5000, retries: 3 };
const config = Object.assign({}, defaults, userConfig);

// Object spread is equivalent and preferred:
const config = { ...defaults, ...userConfig };
\`\`\`

## Object.freeze and Object.seal

**freeze**  -  prevents adding, removing, or changing properties (shallow):

\`\`\`javascript
const point = Object.freeze({ x: 1, y: 2 });
point.x = 99;        // silently fails in sloppy mode, throws in strict mode
point.z = 3;         // silently fails
// BUT nested objects are NOT frozen:
const config = Object.freeze({ db: { host: 'localhost' } });
config.db.host = 'prod';  // works! freeze is shallow
\`\`\`

**seal**  -  prevents adding/removing, but allows changing existing properties.

## Property Descriptors

Every property has a descriptor with flags: \`writable\`, \`enumerable\`, \`configurable\`:

\`\`\`javascript
Object.defineProperty(obj, 'id', {
  value: 42,
  writable: false,      // cannot change the value
  enumerable: false,    // hidden from for...in, Object.keys
  configurable: false,  // cannot delete or redefine the property
});

Object.getOwnPropertyDescriptor(obj, 'id');
// { value: 42, writable: false, enumerable: false, configurable: false }
\`\`\`

This is how built-in properties like \`Array.prototype.length\` are non-enumerable.

## Shallow vs Deep Clone

\`\`\`javascript
// Shallow copy  -  nested objects still share reference
const shallow = { ...obj };
const shallow2 = Object.assign({}, obj);

// Deep clone (modern, handles most cases)
const deep = structuredClone(obj);   // new in Node 17+, most browsers

// JSON round-trip (loses functions, undefined, symbols, dates become strings)
const jsonClone = JSON.parse(JSON.stringify(obj));
\`\`\`

## Object.create for Prototypal Inheritance

\`\`\`javascript
const vehicleProto = {
  describe() { return \`\${this.make} \${this.model}\`; },
};

const car = Object.create(vehicleProto);
car.make = 'Toyota';
car.model = 'Corolla';
car.describe();  // 'Toyota Corolla'

// Object.create(null)  -  object with NO prototype (pure hash map)
const map = Object.create(null);
map.key = 'value';
// No inherited toString, hasOwnProperty, etc.  -  safe as a dictionary
\`\`\``,
    },
    {
      id: 'js-map-set',
      title: 'Map, Set, WeakMap & WeakSet',
      content: `## Map vs Object

**Object** keys must be strings or Symbols. **Map** keys can be any value (including objects, functions).

Map maintains **insertion order** and has a built-in \`size\` property.

\`\`\`javascript
const map = new Map();
map.set('key', 'value');
map.set(42, 'number key');
map.set({ id: 1 }, 'object key');   // object as key
map.set(fn, 'function key');

map.get('key');   // 'value'
map.has(42);      // true
map.size;         // 4
map.delete('key');

// Iteration
for (const [key, value] of map) { /* ... */ }
map.forEach((value, key) => { /* ... */ });
[...map.keys()]    // array of keys
[...map.values()]  // array of values
[...map.entries()] // array of [key, value] pairs

// Initialize from entries
const map2 = new Map([['a', 1], ['b', 2]]);
\`\`\`

**When to use Map over Object:**
- Keys are not strings/symbols
- Need to iterate in insertion order reliably
- Frequently adding/removing entries (Map has better perf)
- Need \`.size\` without iterating

## Set

A collection of **unique values** (any type). Uses SameValueZero equality (like ===, except NaN equals NaN).

\`\`\`javascript
const set = new Set([1, 2, 2, 3, 3, 3]);
set;            // Set {1, 2, 3}  -  duplicates removed
set.size;       // 3
set.add(4);
set.has(2);     // true
set.delete(2);

// Deduplication pattern:
const unique = [...new Set(array)];

// Set operations:
const union = new Set([...setA, ...setB]);
const intersection = new Set([...setA].filter(x => setB.has(x)));
const difference = new Set([...setA].filter(x => !setB.has(x)));
\`\`\`

## WeakMap

Like Map but **keys must be objects** and they are **weakly referenced**  -  if no other reference to the key object exists, it can be garbage-collected and the entry is removed automatically.

\`\`\`javascript
const cache = new WeakMap();

function process(element) {
  if (cache.has(element)) return cache.get(element);
  const result = expensiveCompute(element);
  cache.set(element, result);   // element is weakly held
  return result;
}
// When element is garbage-collected, the cache entry is cleaned up automatically
\`\`\`

WeakMap is **not iterable** and has no \`size\`. Use it for:
- Associating private data with objects without preventing GC
- Caching results tied to DOM elements
- Storing metadata about objects in libraries

## WeakSet

Like Set but holds objects weakly and is not iterable.

\`\`\`javascript
const visited = new WeakSet();

function visit(node) {
  if (visited.has(node)) return;  // cycle detection
  visited.add(node);
  node.children.forEach(visit);
}
// nodes are GC'd when the tree is released  -  no leak
\`\`\``,
    },
    {
      id: 'js-generators',
      title: 'Generators, Iterators & the Iteration Protocol',
      content: `## The Iteration Protocol

An object is **iterable** if it has a \`[Symbol.iterator]()\` method that returns an **iterator**  -  an object with a \`next()\` method that returns \`{ value, done }\`.

\`\`\`javascript
// Custom iterable
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let cur = this.from;
    const to = this.to;
    return {
      next() {
        return cur <= to
          ? { value: cur++, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};

for (const n of range) { /* 1, 2, 3, 4, 5 */ }
[...range]  // [1, 2, 3, 4, 5]
\`\`\`

Built-in iterables: Array, String, Map, Set, TypedArray, arguments, NodeList.

## Generator Functions

A generator function (\`function*\`) returns a **generator object** that implements both the iterable and iterator protocols.

\`yield\` pauses execution and yields a value. The function resumes from that exact point on the next \`.next()\` call:

\`\`\`javascript
function* counter(start = 0) {
  while (true) {
    yield start++;          // pause here, resume on next .next()
  }
}

const gen = counter(10);
gen.next();  // { value: 10, done: false }
gen.next();  // { value: 11, done: false }
gen.next();  // { value: 12, done: false }

// Take first N values
function take(n, iterable) {
  const result = [];
  for (const val of iterable) {
    result.push(val);
    if (result.length >= n) break;
  }
  return result;
}
take(5, counter(0));  // [0, 1, 2, 3, 4]
\`\`\`

## Delegating with yield*

\`yield*\` delegates to another iterable:

\`\`\`javascript
function* concat(...iterables) {
  for (const it of iterables) {
    yield* it;
  }
}
[...concat([1,2], [3,4], [5])]  // [1, 2, 3, 4, 5]
\`\`\`

## Passing Values into Generators

\`next(value)\` sends a value back into the generator  -  the \`yield\` expression evaluates to that value:

\`\`\`javascript
function* accumulator() {
  let total = 0;
  while (true) {
    const n = yield total;  // yield current total, receive next number
    total += n;
  }
}
const acc = accumulator();
acc.next();    // { value: 0, done: false }  -  prime the generator
acc.next(10);  // { value: 10, done: false }
acc.next(20);  // { value: 30, done: false }
\`\`\`

## Practical Uses

**Infinite sequences**  -  generate IDs, pagination cursors, Fibonacci:

\`\`\`javascript
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
\`\`\`

**Async generators** for streaming/pagination:

\`\`\`javascript
async function* fetchAllPages(url) {
  let nextUrl = url;
  while (nextUrl) {
    const { data, next } = await fetch(nextUrl).then(r => r.json());
    yield* data;          // yield individual items
    nextUrl = next;
  }
}

for await (const user of fetchAllPages('/api/users')) {
  console.log(user);
}
\`\`\``,
    },
    {
      id: 'js-modules',
      title: 'Modules: ES Modules vs CommonJS & Dynamic Imports',
      content: `## ES Modules (ESM)

The standard module system for JavaScript. Files are isolated  -  no global leakage.

**Named exports**  -  export specific bindings by name:

\`\`\`javascript
// math.js
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export class Vector { /* ... */ }

// consumer.js
import { PI, add, Vector } from './math.js';
import { add as sum } from './math.js';   // rename
import * as Math from './math.js';        // namespace import
\`\`\`

**Default export**  -  one default per module:

\`\`\`javascript
// router.js
export default class Router { /* ... */ }

// consumer.js
import Router from './router.js';  // any name works for default
\`\`\`

**Re-exporting**  -  barrel file pattern:

\`\`\`javascript
// index.js
export { add, subtract } from './math.js';
export { default as Router } from './router.js';
export * from './utils.js';
\`\`\`

## ESM Characteristics

- **Static**  -  imports are resolved at parse time, before code runs. Enables tree-shaking.
- **Async**  -  modules are loaded asynchronously in browsers.
- **Live bindings**  -  exported names are live references, not copies. If the exporter updates a value, importers see the update.
- \`import\` declarations are **hoisted** to the top of the module.
- Modules run in **strict mode** by default.
- \`this\` at the top level is \`undefined\` (not \`window\`/\`global\`).

## CommonJS (CJS)

Node.js's original module system, still widely used:

\`\`\`javascript
// module.js
const helper = require('./helper');  // synchronous, runs at this line
module.exports = { doStuff, helper };
module.exports.extraFn = function() { /* ... */ };

// Or:
exports.doStuff = function() { /* ... */ };
// Note: do NOT do exports = { ... }  -  breaks the reference
\`\`\`

**CJS characteristics:**
- **Dynamic**  -  \`require\` runs at runtime, can be conditional
- **Synchronous**  -  blocks while loading (fine for Node.js startup, bad in browsers)
- Exports are **copies** at call time  -  changes to the original are not reflected
- Module is cached after first load  -  \`require\` is a cache lookup for subsequent calls

## ESM vs CJS Key Differences

| | ESM | CommonJS |
|---|---|---|
| Syntax | import/export | require/module.exports |
| Resolution | static, parse time | dynamic, runtime |
| Loading | async | sync |
| Live bindings | yes | no |
| Tree-shaking | yes | no |
| Top-level await | yes | no |

## Dynamic import()

Import a module lazily at runtime  -  returns a Promise:

\`\`\`javascript
// Code splitting / lazy loading
const { Parser } = await import('./heavy-parser.js');

// Conditional loading
if (process.env.NODE_ENV === 'development') {
  const { devtools } = await import('./devtools.js');
  devtools.enable();
}

// In a route handler
app.get('/report', async (req, res) => {
  const { generatePDF } = await import('./pdf-generator.js');
  const pdf = await generatePDF(req.body);
  res.send(pdf);
});
\`\`\`

## Interop in Node.js

\`\`\`javascript
// ESM can import CJS:
import cjsModule from './legacy.cjs';

// CJS cannot require() ESM synchronously  -  use dynamic import:
const { helper } = await import('./esm-module.js');
\`\`\``,
    },
    {
      id: 'js-patterns',
      title: 'Performance Patterns: Debounce, Throttle, Memoize & Memory',
      content: `## Debounce

Delays execution until after a period of inactivity. The timer resets on each call:

\`\`\`javascript
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Fires only after the user stops typing for 300ms
const onSearch = debounce((query) => searchAPI(query), 300);
input.addEventListener('input', e => onSearch(e.target.value));
\`\`\`

Use debounce for: search-as-you-type, resize handlers, form validation on input.

## Throttle

Limits how often a function can fire  -  at most once per interval:

\`\`\`javascript
function throttle(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      return fn.apply(this, args);
    }
  };
}

// Fires at most once every 100ms during scroll
window.addEventListener('scroll', throttle(updatePosition, 100));
\`\`\`

Use throttle for: scroll/mouse-move handlers, rate-limiting API calls, animation frames.

**Key difference**: Debounce waits for calm; throttle ensures periodic execution.

## Memoization

Cache the result of a function based on its arguments:

\`\`\`javascript
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  // imagine complex computation
  return n * n;
});
expensiveCalc(10);  // computed
expensiveCalc(10);  // returned from cache
\`\`\`

For recursive functions, the cache must be visible to the recursive calls (pass it in or use closure).

## Observer / Pub-Sub Pattern

Decouple event producers from consumers:

\`\`\`javascript
class EventEmitter {
  #listeners = new Map();

  on(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(fn);
    return () => this.off(event, fn);  // unsubscribe function
  }

  off(event, fn) {
    this.#listeners.get(event)?.delete(fn);
  }

  emit(event, ...args) {
    this.#listeners.get(event)?.forEach(fn => fn(...args));
  }
}

const emitter = new EventEmitter();
const unsub = emitter.on('login', user => log(user));
emitter.emit('login', { id: 1 });
unsub();  // clean up
\`\`\`

## Memory Leaks

Common sources of memory leaks:

**Forgotten timers and intervals:**
\`\`\`javascript
const id = setInterval(() => processData(), 1000);
// must call clearInterval(id) when done
\`\`\`

**Event listeners not removed:**
\`\`\`javascript
element.addEventListener('click', handler);
// must call removeEventListener('click', handler) when element is destroyed
\`\`\`

**Closures holding large objects:**
\`\`\`javascript
function setup() {
  const bigData = loadHugeDataset();
  return function() {
    // only uses one field but holds entire bigData in scope
    return bigData.summary;
  };
  // Fix: extract what you need
  const summary = bigData.summary;
  return () => summary;  // bigData can be GC'd
}
\`\`\`

**WeakMap/WeakSet for object-keyed caches**  -  as shown earlier, they prevent this class of leak automatically.`,
    },
    {
      id: 'js-string-methods',
      title: 'String Methods: Complete Reference',
      content: `## Strings Are Immutable

Every string method returns a **new string**  -  the original is never modified.

\`\`\`javascript
const s = 'hello';
s.toUpperCase();  // 'HELLO'
console.log(s);   // 'hello'  -  unchanged
\`\`\`

## Searching

\`\`\`javascript
const str = 'Hello, World!';

str.indexOf('o');           // 4  (first match, -1 if not found)
str.lastIndexOf('o');       // 8  (last match)
str.includes('World');      // true
str.startsWith('Hello');    // true
str.endsWith('!');          // true
str.search(/world/i);       // 7  (regex, returns index or -1)
\`\`\`

## Extracting Substrings

\`\`\`javascript
const str = 'Hello, World!';

str.slice(7, 12);       // 'World'  (start inclusive, end exclusive)
str.slice(-6);          // 'orld!'  (negative = from end)
str.substring(7, 12);   // 'World'  (swaps args if start > end; no negatives)
str.at(0);              // 'H'  (ES2022, supports negative: str.at(-1) = '!')
str[0];                 // 'H'  (read-only access)
str.charAt(0);          // 'H'
str.charCodeAt(0);      // 72  (UTF-16 code unit)
str.codePointAt(0);     // 72  (full Unicode code point, handles emoji)
\`\`\`

Prefer \`slice\` over \`substring\`  -  it handles negatives and is more predictable.

## Transforming

\`\`\`javascript
'hello'.toUpperCase();              // 'HELLO'
'HELLO'.toLowerCase();              // 'hello'
'  hello  '.trim();                 // 'hello'
'  hello  '.trimStart();            // 'hello  '
'  hello  '.trimEnd();              // '  hello'
'abc'.repeat(3);                    // 'abcabcabc'
'5'.padStart(4, '0');               // '0005'  (useful for IDs)
'5'.padEnd(4, '-');                 // '5---'
'Hello'.replace('l', 'r');         // 'Herlo'  (first match only)
'Hello'.replaceAll('l', 'r');      // 'Herro'  (all matches, ES2021)
'Hello'.replace(/l/g, 'r');        // 'Herro'  (regex with g flag)
\`\`\`

## Splitting and Joining

\`\`\`javascript
'a,b,c'.split(',');           // ['a', 'b', 'c']
'hello'.split('');            // ['h', 'e', 'l', 'l', 'o']
'hello'.split('', 3);         // ['h', 'e', 'l']  (limit)
['a', 'b', 'c'].join('-');    // 'a-b-c'  (Array method, not String)
\`\`\`

## Pattern Matching

\`\`\`javascript
'hello123'.match(/\d+/);           // ['123'] with index info
'hello123world456'.match(/\d+/g);  // ['123', '456']  (all matches with g)
'cat bat'.matchAll(/[cb]at/g);     // iterator of all matches with groups

'hello world'.replace(/(\w+)\s(\w+)/, '$2 $1');  // 'world hello'
'hello'.replace(/(\w+)/, (match) => match.toUpperCase());  // 'HELLO'
\`\`\`

## Template Literals and String.raw

\`\`\`javascript
const name = 'Alice';
\`Hello, \${name}!\`  // 'Hello, Alice!'

// String.raw  -  raw string without processing escape sequences
String.raw\`Line1\nLine2\`  // 'Line1\\nLine2' (backslash-n literally)
// Useful for regex patterns and Windows paths
\`\`\`

## Unicode and Normalization

\`\`\`javascript
'café'.normalize('NFC');   // canonical composed form
'\\u{1F600}'.length;        // 2  -  emoji is two UTF-16 code units
[...'\\u{1F600}'].length;   // 1  -  spread uses code points
\`\`\`

## String.fromCharCode and fromCodePoint

\`\`\`javascript
String.fromCharCode(72, 101, 108, 108, 111);  // 'Hello'
String.fromCodePoint(128512);                  // '😀'
\`\`\``,
    },
    {
      id: 'js-regex',
      title: 'Regular Expressions: Patterns, Flags & Groups',
      content: `## Creating Regular Expressions

\`\`\`javascript
const re1 = /pattern/flags;          // literal  -  compiled at parse time
const re2 = new RegExp('pattern', 'flags');  // constructor  -  dynamic patterns

const dynamic = 'hello';
const re3 = new RegExp(\`^\${dynamic}\`, 'i');  // built from variable
\`\`\`

## Flags

| Flag | Meaning |
|------|---------|
| \`g\` | Global  -  find all matches, not just first |
| \`i\` | Case-insensitive |
| \`m\` | Multiline  -  \`^\`/\`$\` match start/end of each line |
| \`s\` | DotAll  -  \`.\` matches newlines too (ES2018) |
| \`u\` | Unicode mode  -  enables \`\\p{}\` properties, treats surrogates correctly |
| \`v\` | Unicode sets  -  superset of \`u\`, enables set operations in classes (ES2024) |
| \`d\` | Indices  -  adds \`indices\` property to matches (ES2022) |
| \`y\` | Sticky  -  match only at \`lastIndex\` position |

## Character Classes

\`\`\`javascript
/[abc]/      // any of a, b, c
/[^abc]/     // NOT a, b, or c
/[a-z]/      // a through z
/[a-zA-Z0-9]/ // alphanumeric
/./          // any char except newline (use /s flag to include newline)
/\\d/         // digit [0-9]
/\\D/         // non-digit
/\\w/         // word char [a-zA-Z0-9_]
/\\W/         // non-word
/\\s/         // whitespace (space, tab, newline, etc.)
/\\S/         // non-whitespace
/\\b/         // word boundary
/\\B/         // non-word boundary
\`\`\`

## Quantifiers

\`\`\`javascript
/a*/    // 0 or more
/a+/    // 1 or more
/a?/    // 0 or 1 (optional)
/a{3}/  // exactly 3
/a{2,4}/ // 2 to 4
/a{2,}/  // 2 or more
\`\`\`

**Greedy vs Lazy**: by default quantifiers are greedy (match as much as possible). Add \`?\` to make lazy:

\`\`\`javascript
'<b>bold</b>'.match(/<.+>/)[0];   // '<b>bold</b>'   -  greedy
'<b>bold</b>'.match(/<.+?>/)[0];  // '<b>'            -  lazy
\`\`\`

## Anchors

\`\`\`javascript
/^hello/    // 'hello' at start of string (or line with /m)
/world$/    // 'world' at end of string (or line with /m)
/^hello$/   // exactly 'hello'
/\\bword\\b/ // 'word' as whole word
\`\`\`

## Groups and Captures

\`\`\`javascript
// Capturing group  -  remembered for back-references and result
/([a-z]+)\\s([a-z]+)/

const m = 'hello world'.match(/([a-z]+)\\s([a-z]+)/);
m[0]  // 'hello world'  -  full match
m[1]  // 'hello'        -  group 1
m[2]  // 'world'        -  group 2

// Non-capturing group  -  groups without capturing
/(?:[a-z]+)\\s(?:[a-z]+)/

// Named capturing groups (ES2018)
const { groups } = '2024-01-15'.match(/(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/);
groups.year   // '2024'
groups.month  // '01'
groups.day    // '15'
\`\`\`

## Lookahead and Lookbehind

Assert what comes before/after without including it in the match:

\`\`\`javascript
// Positive lookahead: match X only if followed by Y
/\\d+(?= dollars)/   // matches '100' in '100 dollars' but not '100 euros'

// Negative lookahead
/\\d+(?! dollars)/   // matches number NOT followed by ' dollars'

// Positive lookbehind (ES2018)
/(?<=\\$)\\d+/        // matches '100' in '$100' but not '€100'

// Negative lookbehind
/(?<!\\$)\\d+/        // matches '100' NOT preceded by '$'
\`\`\`

## String Methods with RegExp

\`\`\`javascript
/\\d+/.test('abc123');                   // true
'abc123'.search(/\\d+/);                // 3 (index)
'hello world'.replace(/\\w+/g, s => s.toUpperCase()); // 'HELLO WORLD'
'one1two2three'.split(/\\d/);            // ['one', 'two', 'three']

// matchAll  -  iterate all matches with groups
const str = 'cat bat sat';
for (const match of str.matchAll(/([cbst])at/g)) {
  console.log(match[0], match[1]);  // 'cat','c'  'bat','b'  'sat','s'
}
\`\`\`

## Unicode Properties (with /u or /v flag)

\`\`\`javascript
/\\p{Letter}/u      // any Unicode letter
/\\p{Decimal_Number}/u  // any decimal digit in any script
/\\p{Emoji}/u       // emoji characters
/\\p{Script=Greek}/u // Greek script characters
\`\`\``,
    },
    {
      id: 'js-execution-context',
      title: 'Execution Context, Call Stack & Scope Chain',
      content: `## What Is an Execution Context?

An **execution context** is the environment in which JavaScript code is evaluated and executed. Every time a function is called, a new execution context is created for it.

There are three types:
- **Global Execution Context (GEC)**  -  created when the script starts; represents the global scope
- **Function Execution Context (FEC)**  -  created for each function call
- **Eval Execution Context**  -  for code run inside \`eval()\` (avoid in production)

## Phases of an Execution Context

Each context has two phases:

### Creation Phase
1. **Variable Environment** is set up  -  \`var\` declarations are hoisted and initialised to \`undefined\`; \`let\`/\`const\` go into the TDZ
2. **Scope chain** is established  -  references to outer environments
3. **\`this\`** binding is determined

### Execution Phase
Code runs line by line; variable assignments happen here.

\`\`\`javascript
// Simplified mental model of the GEC creation phase:
// Variable Environment: { greet: <function>, name: undefined }
// this: window / global

var name = 'Alice';   // assigned in execution phase
function greet() {
  // new FEC created here when called
  var msg = 'Hello';  // local to this FEC
  return msg + ' ' + name;  // accesses outer scope via scope chain
}
\`\`\`

## The Call Stack

The call stack (also called the execution stack) is a LIFO data structure that tracks the currently active execution contexts:

\`\`\`javascript
function c() { return 'c'; }
function b() { return c(); }
function a() { return b(); }
a();

// Stack frames (top = currently executing):
// c() ← executing
// b() ← waiting
// a() ← waiting
// global ← waiting
\`\`\`

When a function returns, its context is popped off the stack. The stack starts with the global context and ends when the script finishes.

**Stack overflow** occurs when the call stack exceeds its limit (usually ~10,000 frames in V8), typically from infinite recursion:

\`\`\`javascript
function infinite() { return infinite(); }
infinite();  // RangeError: Maximum call stack size exceeded
\`\`\`

## Lexical Environment vs Variable Environment

- **Variable Environment**: stores \`var\` bindings and function declarations
- **Lexical Environment**: stores \`let\`/\`const\`/\`class\` bindings

Modern engines treat these similarly, but the distinction explains why \`var\` ignores block scope while \`let\`/\`const\` do not.

## Scope Chain

The scope chain links each lexical environment to its **outer lexical environment**, forming a chain up to the global scope. This chain is determined at definition time (lexical/static scoping), not at call time:

\`\`\`javascript
const x = 'global';

function outer() {
  const x = 'outer';
  function inner() {
    // inner's scope chain: inner → outer → global
    console.log(x);  // 'outer'  -  found in outer before reaching global
  }
  inner();
}
outer();
\`\`\`

This is why closures work: the inner function's lexical environment keeps a reference to the outer function's environment even after it returns.

## Dynamic vs Lexical Scope

JavaScript uses **lexical (static) scope**  -  the scope of a variable is determined by where it is written in the source code, not where it is called from.

\`\`\`javascript
const x = 'global';
function getX() { return x; }

function outer() {
  const x = 'outer';
  return getX();  // returns 'global'  -  getX sees its definition scope, not caller's scope
}
outer();  // 'global'
\`\`\`

If JavaScript used dynamic scope, \`getX\` would return \`'outer'\`. It does not  -  always remember: scope is where you **write** the function.`,
    },
    {
      id: 'js-es2016-es2017',
      title: 'ES2016 (ES7) & ES2017 (ES8): New Features',
      content: `## ES2016 (ES7)  -  Two Key Additions

### Array.prototype.includes()

Replaces the \`indexOf\` pattern for checking existence. Key advantage: correctly handles \`NaN\`.

\`\`\`javascript
[1, 2, 3].includes(2);           // true
[1, 2, 3].includes(4);           // false
[1, NaN, 3].includes(NaN);       // true  ✓
[1, NaN, 3].indexOf(NaN);        // -1   ✗ (indexOf uses ===, NaN !== NaN)

// Optional start index
[1, 2, 3, 2].includes(2, 2);     // true  (search from index 2)
[1, 2, 3, 2].includes(2, 3);     // true  (found at index 3)
\`\`\`

### Exponentiation Operator (**)

\`\`\`javascript
2 ** 10       // 1024  (same as Math.pow(2, 10))
2 ** 0.5      // ~1.414 (square root)
(-2) ** 2     // 4
let x = 2;
x **= 3;      // x = 8  (assignment form)
\`\`\`

## ES2017 (ES8)  -  Major Features

### async/await

The most impactful ES2017 addition  -  already covered in depth in the async/await lesson.

### Object.entries() and Object.values()

\`\`\`javascript
const user = { name: 'Alice', age: 30, active: true };

Object.values(user);   // ['Alice', 30, true]
Object.entries(user);  // [['name','Alice'], ['age',30], ['active',true]]

// Common pattern: transform object values
const doubled = Object.fromEntries(
  Object.entries(scores).map(([k, v]) => [k, v * 2])
);

// Iterate
for (const [key, value] of Object.entries(config)) {
  console.log(\`\${key}: \${value}\`);
}
\`\`\`

### String Padding: padStart / padEnd

\`\`\`javascript
'42'.padStart(6);          // '    42'  (default fill: space)
'42'.padStart(6, '0');     // '000042'  (useful for IDs, timestamps)
'42'.padEnd(6, '.');       // '42....'
'hello'.padStart(3);       // 'hello'   (no truncation if already longer)

// Real use: format fixed-width columns
const rows = [['Alice', 95], ['Bob', 100]];
rows.forEach(([name, score]) => {
  console.log(name.padEnd(10) + score.toString().padStart(5));
});
// Alice          95
// Bob           100
\`\`\`

### Object.getOwnPropertyDescriptors()

Returns descriptors for ALL own properties  -  useful for exact object cloning including getters/setters:

\`\`\`javascript
const source = {
  get fullName() { return this.first + ' ' + this.last; },
  first: 'Alice',
  last: 'Smith',
};

// Object.assign loses getters (calls them, copies the value)
const wrongCopy = Object.assign({}, source);
// wrongCopy.fullName is 'Alice Smith' (a string), not a getter

// Correct: preserve getters
const correctCopy = Object.defineProperties({}, Object.getOwnPropertyDescriptors(source));
// correctCopy.fullName is still a live getter
\`\`\`

### Trailing Commas in Function Parameters

\`\`\`javascript
function fn(
  param1,
  param2,  // ← trailing comma now allowed (cleaner git diffs)
) {}

fn(
  arg1,
  arg2,  // ← also allowed in calls
);
\`\`\`

### Atomics and SharedArrayBuffer

For true multi-threaded JavaScript using \`Worker\`s:

\`\`\`javascript
// In main thread:
const sab = new SharedArrayBuffer(4);  // 4 bytes shared with workers
const arr = new Int32Array(sab);

// In worker thread  -  atomic operations prevent race conditions:
Atomics.add(arr, 0, 1);     // atomically increment
Atomics.load(arr, 0);       // atomically read
Atomics.store(arr, 0, 42);  // atomically write
Atomics.wait(arr, 0, 0);    // block until arr[0] !== 0
Atomics.notify(arr, 0, 1);  // wake 1 waiting thread
\`\`\``,
    },
    {
      id: 'js-es2018-es2019',
      title: 'ES2018 (ES9) & ES2019 (ES10): New Features',
      content: `## ES2018 (ES9)

### Promise.prototype.finally()

Runs a callback when the promise settles (either way)  -  without changing the value:

\`\`\`javascript
fetch('/api/data')
  .then(res => res.json())
  .catch(err => handleError(err))
  .finally(() => hideSpinner());  // always hides spinner

// finally does NOT receive a value and its return is ignored
// (unless it throws, which replaces the current rejection)
Promise.resolve(42)
  .finally(() => console.log('done'))  // logs 'done'
  .then(v => console.log(v));          // logs 42  -  value passes through
\`\`\`

### Object Rest and Spread

Object spread was ES2018 (array spread was ES2015):

\`\`\`javascript
// Object spread
const merged = { ...defaults, ...overrides };
const copy = { ...original };
const withExtras = { ...user, role: 'admin' };

// Object rest in destructuring
const { a, b, ...rest } = { a: 1, b: 2, c: 3, d: 4 };
// a = 1, b = 2, rest = { c: 3, d: 4 }

function omit({ password, ...safeUser }) {
  return safeUser;  // strip sensitive fields
}
\`\`\`

### Async Iteration (for await...of)

Iterate over async data sources  -  Promises, async generators, streams:

\`\`\`javascript
async function processStream(readableStream) {
  for await (const chunk of readableStream) {
    process(chunk);  // awaits each chunk before processing next
  }
}

// Works with async generators
async function* paginate(url) {
  let cursor = null;
  do {
    const { data, next } = await fetch(\`\${url}?cursor=\${cursor}\`).then(r => r.json());
    yield* data;
    cursor = next;
  } while (cursor);
}
\`\`\`

### RegExp Named Capture Groups

\`\`\`javascript
const re = /(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/;
const { groups } = '2024-01-15'.match(re);
groups.year   // '2024'
groups.month  // '01'
\`\`\`

### RegExp Lookbehind Assertions

\`\`\`javascript
/(?<=\\$)\\d+/.exec('$100');   // '100'  -  only after $
/(?<!\\$)\\d+/.exec('€100');   // '100'  -  only NOT after $
\`\`\`

### RegExp dotAll flag (s)

\`\`\`javascript
/hello.world/.test('hello\\nworld');   // false  -  . doesn't match newline
/hello.world/s.test('hello\\nworld');  // true  -  s flag makes . match anything
\`\`\`

---

## ES2019 (ES10)

### Array.prototype.flat() and flatMap()

\`\`\`javascript
[1, [2, 3], [4, [5, 6]]].flat();       // [1, 2, 3, 4, [5, 6]]  (one level)
[1, [2, 3], [4, [5, 6]]].flat(2);      // [1, 2, 3, 4, 5, 6]
[1, [2, [3]]].flat(Infinity);          // [1, 2, 3]

// flatMap = map + flat(1), more efficient
['hello world', 'foo bar'].flatMap(s => s.split(' '));
// ['hello', 'world', 'foo', 'bar']

// Filter + map in one pass (return empty array to "remove")
users.flatMap(u => u.active ? [u.name] : []);
\`\`\`

### Object.fromEntries()

The inverse of \`Object.entries()\`:

\`\`\`javascript
const entries = [['a', 1], ['b', 2]];
Object.fromEntries(entries);  // { a: 1, b: 2 }

// Transform object values cleanly:
const prices = { apple: 0.99, banana: 0.5 };
const discounted = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k, v * 0.9])
);
// { apple: 0.891, banana: 0.45 }

// Convert Map to plain object:
Object.fromEntries(new Map([['key', 'val']]));  // { key: 'val' }
\`\`\`

### Optional Catch Binding

The \`catch\` parameter is now optional when you don't need the error:

\`\`\`javascript
// Before ES2019
try { JSON.parse(str); } catch (e) { /* e unused */ }

// ES2019+
try { JSON.parse(str); } catch { return false; }
\`\`\`

### String.trimStart() and trimEnd()

\`\`\`javascript
'  hello  '.trimStart();  // 'hello  '
'  hello  '.trimEnd();    // '  hello'
// Aliases: trimLeft() / trimRight() (non-standard but widely supported)
\`\`\`

### Symbol.prototype.description

\`\`\`javascript
const sym = Symbol('my description');
sym.toString();   // 'Symbol(my description)'
sym.description;  // 'my description'  ← ES2019
\`\`\`

### Array.prototype.sort Stability Guaranteed

Before ES2019, \`.sort()\` was not guaranteed to be stable (equal elements might reorder). ES2019 requires a **stable sort**  -  equal elements preserve their original relative order. All modern engines already did this; now it is spec-required.`,
    },
    {
      id: 'js-es2020-es2021',
      title: 'ES2020 (ES11) & ES2021 (ES12): New Features',
      content: `## ES2020 (ES11)

### BigInt

For integers larger than \`Number.MAX_SAFE_INTEGER\` (2^53 − 1):

\`\`\`javascript
const big = 9007199254740993n;    // n suffix
const also = BigInt('9007199254740993');

big + 1n                    // 9007199254740994n
big * 2n                    // 18014398509481986n
typeof big                  // 'bigint'

// Cannot mix with regular numbers without explicit conversion
big + 1;                    // TypeError
Number(big) + 1;            // loses precision if very large
\`\`\`

Use cases: cryptography, financial calculations, database IDs (PostgreSQL BIGINT), blockchain.

### Optional Chaining (?.)

Safe property access  -  already covered but note it also works for:

\`\`\`javascript
obj?.prop               // property
obj?.[expr]             // computed property
arr?.[0]                // array index
fn?.()                  // function call  -  if fn is null/undefined, returns undefined
obj?.method?.()         // method call  -  safe even if method is absent
\`\`\`

### Nullish Coalescing (??)

Already covered; key distinction from \`||\`:

\`\`\`javascript
0 || 'default'     // 'default'   -  treats 0 as falsy
0 ?? 'default'     // 0           -  only null/undefined trigger fallback
'' ?? 'fallback'   // ''          -  empty string is not null/undefined
false ?? true      // false
\`\`\`

### Promise.allSettled()

\`\`\`javascript
const results = await Promise.allSettled([
  fetch('/api/users'),
  fetch('/api/missing'),
  fetch('/api/posts'),
]);

results.forEach(result => {
  if (result.status === 'fulfilled') console.log(result.value);
  else console.error(result.reason);
});
// Never rejects  -  you always get all results
\`\`\`

### globalThis

A universal reference to the global object across environments:

\`\`\`javascript
// Browser: window
// Node.js: global
// Web Worker: self
// All: globalThis  ← works everywhere
globalThis.setTimeout(() => {}, 0);
\`\`\`

### String.prototype.matchAll()

Returns an iterator of all regex matches including capturing groups:

\`\`\`javascript
const str = 'test1 test2 test3';
const matches = [...str.matchAll(/test(\\d)/g)];
matches[0][0]  // 'test1' (full match)
matches[0][1]  // '1' (group 1)
matches[1][1]  // '2'
// Requires the /g flag; returns iterator (use spread or for...of)
\`\`\`

### Dynamic import() and import.meta

\`\`\`javascript
// import.meta  -  module metadata in ESM
console.log(import.meta.url);  // file URL of current module
// In Node: file:///path/to/module.js
\`\`\`

---

## ES2021 (ES12)

### String.prototype.replaceAll()

\`\`\`javascript
'aabbcc'.replace('b', 'x');     // 'axbcc'   -  only first match
'aabbcc'.replaceAll('b', 'x');  // 'aaxxcc'  -  all matches
'aabbcc'.replace(/b/g, 'x');    // 'aaxxcc'  -  same with regex /g

// With a function
'hello world'.replaceAll(/\\w+/g, s => s.toUpperCase());  // 'HELLO WORLD'
\`\`\`

### Promise.any() and AggregateError

Resolves with the **first fulfilled** promise; rejects only if ALL reject:

\`\`\`javascript
const fastest = await Promise.any([
  fetch('https://mirror1.example.com/data'),
  fetch('https://mirror2.example.com/data'),
  fetch('https://mirror3.example.com/data'),
]);
// Returns whichever responds first successfully

// If all reject:
try {
  await Promise.any([Promise.reject('a'), Promise.reject('b')]);
} catch (e) {
  e instanceof AggregateError  // true
  e.errors                     // ['a', 'b']
}
\`\`\`

### Logical Assignment Operators

\`\`\`javascript
// ||= assign if falsy
x ||= 'default';   // x = x || 'default'

// &&= assign if truthy
x &&= x.trim();    // x = x && x.trim()  (safe transform)

// ??= assign if null/undefined
x ??= 'default';   // x = x ?? 'default'
\`\`\`

### Numeric Separators

\`\`\`javascript
const million = 1_000_000;
const hex = 0xFF_FF_FF;
const binary = 0b1111_0000;
const float = 3.141_592_653;
// Purely visual  -  ignored by the engine
\`\`\`

### WeakRef and FinalizationRegistry

\`\`\`javascript
// WeakRef  -  weak reference to an object (doesn't prevent GC)
let obj = { data: 'heavy' };
const ref = new WeakRef(obj);

// later:
const val = ref.deref();  // undefined if GC'd, otherwise the object
if (val) use(val);

// FinalizationRegistry  -  callback when an object is GC'd
const registry = new FinalizationRegistry((heldValue) => {
  console.log(\`\${heldValue} was collected\`);
});
registry.register(obj, 'my object');
// When obj is GC'd: 'my object was collected'
\`\`\``,
    },
    {
      id: 'js-es2022-es2024',
      title: 'ES2022–ES2024 (ES13–ES15): Latest Features',
      content: `## ES2022 (ES13)

### Array.prototype.at()

Negative indexing  -  cleaner than \`arr[arr.length - 1]\`:

\`\`\`javascript
const arr = [1, 2, 3, 4, 5];
arr.at(0);    // 1   (same as arr[0])
arr.at(-1);   // 5   (last element)
arr.at(-2);   // 4   (second-to-last)

'hello'.at(-1);  // 'o'
\`\`\`

### Object.hasOwn()

Safer replacement for \`Object.prototype.hasOwnProperty.call()\`:

\`\`\`javascript
const obj = { a: 1 };
obj.hasOwnProperty('a');        // true  -  but can be overridden if obj.hasOwnProperty = ...
Object.hasOwn(obj, 'a');        // true  -  safe, always uses the built-in

// Edge case where hasOwnProperty breaks:
const bare = Object.create(null);  // no prototype, no hasOwnProperty method
bare.x = 1;
// bare.hasOwnProperty('x')  // TypeError!
Object.hasOwn(bare, 'x');          // true  -  works correctly
\`\`\`

### Top-Level await (in ES Modules)

\`\`\`javascript
// config.js (ES module  -  .mjs or "type":"module" in package.json)
const config = await fetch('/config.json').then(r => r.json());
export { config };

// Module loading waits for this file's top-level await before importing it
\`\`\`

### Error.cause

Chain errors while preserving the original:

\`\`\`javascript
try {
  await db.query(sql);
} catch (err) {
  throw new Error('Failed to load users', { cause: err });
}

// Reading:
try { /* ... */ } catch (e) {
  console.error(e.message);  // 'Failed to load users'
  console.error(e.cause);    // original database error
}
\`\`\`

### Class Static Blocks

Run initialisation code for static class members:

\`\`\`javascript
class Config {
  static debug;
  static logLevel;

  static {
    // Runs once when class is defined
    Config.debug = process.env.NODE_ENV !== 'production';
    Config.logLevel = Config.debug ? 'verbose' : 'error';
  }
}
\`\`\`

### RegExp /d Flag (Indices)

\`\`\`javascript
const re = /(?<word>\\w+)/d;
const m = re.exec('hello world');
m.indices[0]         // [0, 5]  -  full match start/end
m.indices.groups.word // [0, 5]  -  named group start/end
\`\`\`

---

## ES2023 (ES14)

### Non-Mutating Array Methods

New methods that return a **new array** instead of mutating  -  safe for functional/immutable patterns:

\`\`\`javascript
const arr = [3, 1, 2];

arr.toSorted();                     // [1, 2, 3]  -  new array
arr.toSorted((a, b) => b - a);     // [3, 2, 1]
arr.toReversed();                   // [2, 1, 3]  -  new array
arr.toSpliced(1, 1, 9, 8);        // [3, 9, 8, 2]  -  new array
arr.with(0, 99);                   // [99, 1, 2]  -  replace at index

console.log(arr);  // [3, 1, 2]  -  still unchanged
\`\`\`

### Array.findLast() and findLastIndex()

\`\`\`javascript
[1, 2, 3, 4].findLast(n => n % 2 === 0);      // 4  (last even)
[1, 2, 3, 4].findLastIndex(n => n % 2 === 0); // 3  (index of 4)
// Compare: find/findIndex search from start
\`\`\`

---

## ES2024 (ES15)

### Promise.withResolvers()

Cleaner way to create a promise with externally accessible resolve/reject:

\`\`\`javascript
// Before:
let resolve, reject;
const promise = new Promise((res, rej) => { resolve = res; reject = rej; });

// ES2024:
const { promise, resolve, reject } = Promise.withResolvers();
// Use it later:
setTimeout(() => resolve('done'), 1000);
\`\`\`

### Object.groupBy() and Map.groupBy()

\`\`\`javascript
const products = [
  { name: 'apple', type: 'fruit' },
  { name: 'banana', type: 'fruit' },
  { name: 'carrot', type: 'vegetable' },
];

const byType = Object.groupBy(products, p => p.type);
// { fruit: [{name:'apple',...}, {name:'banana',...}], vegetable: [{...}] }

// Map.groupBy for non-string keys:
Map.groupBy(products, p => p.type);  // Map with keys 'fruit', 'vegetable'
\`\`\`

### Set Methods

\`\`\`javascript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

a.union(b);                // Set {1,2,3,4,5,6}
a.intersection(b);         // Set {3,4}
a.difference(b);           // Set {1,2}  (in a but not b)
a.symmetricDifference(b);  // Set {1,2,5,6}  (in either but not both)
a.isSubsetOf(b);           // false
a.isSupersetOf(new Set([1,2]));  // true
a.isDisjointFrom(b);       // false  (share 3,4)
\`\`\``,
    },
    {
      id: 'js-proxy-reflect',
      title: 'Proxy & Reflect: Intercepting Object Operations',
      content: `## What Is a Proxy?

A \`Proxy\` wraps an object and intercepts fundamental operations  -  property reads, writes, function calls  -  via **trap** functions defined in a handler object.

\`\`\`javascript
const target = { name: 'Alice', age: 30 };
const handler = {
  get(target, prop, receiver) {
    console.log(\`Reading: \${prop}\`);
    return Reflect.get(target, prop, receiver);  // forward to target
  },
  set(target, prop, value, receiver) {
    console.log(\`Writing: \${prop} = \${value}\`);
    return Reflect.set(target, prop, value, receiver);
  },
};

const proxy = new Proxy(target, handler);
proxy.name;         // logs 'Reading: name', returns 'Alice'
proxy.age = 31;     // logs 'Writing: age = 31'
\`\`\`

## Common Traps

| Trap | Triggered by |
|------|-------------|
| \`get(target, prop, receiver)\` | \`proxy.prop\` or \`proxy[prop]\` |
| \`set(target, prop, value, receiver)\` | \`proxy.prop = value\` |
| \`has(target, prop)\` | \`prop in proxy\` |
| \`deleteProperty(target, prop)\` | \`delete proxy.prop\` |
| \`apply(target, thisArg, args)\` | \`proxy()\`  -  target must be a function |
| \`construct(target, args)\` | \`new proxy()\` |
| \`ownKeys(target)\` | \`Object.keys(proxy)\`, \`for...in\` |
| \`getPrototypeOf(target)\` | \`Object.getPrototypeOf(proxy)\` |

## Practical Use Cases

### Input Validation

\`\`\`javascript
function createValidator(target, schema) {
  return new Proxy(target, {
    set(obj, prop, value) {
      if (schema[prop] && !schema[prop](value)) {
        throw new TypeError(\`Invalid value for \${prop}: \${value}\`);
      }
      obj[prop] = value;
      return true;
    },
  });
}

const user = createValidator({}, {
  age: v => typeof v === 'number' && v >= 0 && v <= 150,
});
user.age = 25;   // OK
user.age = -1;   // TypeError: Invalid value for age: -1
\`\`\`

### Reactive/Observable Objects

The basis of Vue 3's reactivity system:

\`\`\`javascript
function reactive(obj, onChange) {
  return new Proxy(obj, {
    set(target, prop, value) {
      const old = target[prop];
      target[prop] = value;
      if (old !== value) onChange(prop, value, old);
      return true;
    },
  });
}

const state = reactive({ count: 0 }, (prop, newVal) => {
  console.log(\`\${prop} changed to \${newVal}\`);
});
state.count++;  // logs: 'count changed to 1'
\`\`\`

### Auto-Mocking / Spy Objects

\`\`\`javascript
function createSpy() {
  const calls = [];
  return new Proxy(function() {}, {
    apply(target, thisArg, args) {
      calls.push(args);
      return undefined;
    },
    get(target, prop) {
      if (prop === 'calls') return calls;
      return createSpy();  // nested spy
    },
  });
}
\`\`\`

## Reflect API

\`Reflect\` provides the same operations as Proxy traps as standalone functions  -  the "default behaviour". Always use Reflect inside Proxy traps to correctly forward operations (handles edge cases with \`this\` and \`receiver\`):

\`\`\`javascript
Reflect.get(target, prop, receiver)      // obj.prop
Reflect.set(target, prop, value, receiver) // obj.prop = value; returns boolean
Reflect.has(target, prop)                // prop in obj
Reflect.deleteProperty(target, prop)     // delete obj.prop
Reflect.ownKeys(target)                  // Object.getOwnPropertyNames + Symbols
Reflect.apply(fn, thisArg, args)         // fn.apply(thisArg, args)
Reflect.construct(Cls, args)             // new Cls(...args)
\`\`\`

## Revocable Proxies

\`\`\`javascript
const { proxy, revoke } = Proxy.revocable(target, handler);
proxy.name;    // works
revoke();
proxy.name;    // TypeError  -  proxy is revoked
\`\`\`

Useful for capability-based security: grant access via proxy, revoke it when done.`,
    },
    {
      id: 'js-functional',
      title: 'Functional Programming: Pure Functions, Composition & Currying',
      content: `## Core Principles

Functional programming (FP) treats computation as the evaluation of mathematical functions and avoids changing state and mutable data.

**Key ideas:**
1. **Pure functions**  -  same input always gives same output, no side effects
2. **Immutability**  -  don't mutate data; return new values
3. **First-class functions**  -  functions as values
4. **Function composition**  -  build complex behaviour from simple functions
5. **Declarative style**  -  describe WHAT, not HOW

## Pure Functions

\`\`\`javascript
// PURE  -  no side effects, deterministic
function add(a, b) { return a + b; }
function formatUser(user) { return { ...user, fullName: user.first + ' ' + user.last }; }

// IMPURE  -  modifies external state
let total = 0;
function addToTotal(n) { total += n; }  // side effect!

// IMPURE  -  depends on external state
function getTime() { return new Date(); }  // different result each call
\`\`\`

## Immutability

\`\`\`javascript
// Mutable  -  modifies in place
function addItem(arr, item) { arr.push(item); return arr; }  // bad

// Immutable  -  returns new array
function addItem(arr, item) { return [...arr, item]; }  // good

// Immutable object update
function updateUser(user, changes) { return { ...user, ...changes }; }

// Nested immutable update
function setCity(user, city) {
  return { ...user, address: { ...user.address, city } };
}
\`\`\`

## Function Composition

Build a new function by chaining existing ones (output of one → input of next):

\`\`\`javascript
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const pipe    = (...fns) => x => fns.reduce((v, f) => f(v), x);
// compose: right-to-left; pipe: left-to-right (more readable)

const process = pipe(
  str => str.trim(),
  str => str.toLowerCase(),
  str => str.replace(/\\s+/g, '-'),
);
process('  Hello World  ');  // 'hello-world'
\`\`\`

## Currying

Transform a multi-argument function into a chain of single-argument functions:

\`\`\`javascript
// Manual curry
const multiply = a => b => a * b;
const double   = multiply(2);   // partially applied
const triple   = multiply(3);
double(5);  // 10
triple(5);  // 15

// Curry utility
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
}

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3)   // 6
add(1, 2)(3)   // 6
add(1)(2, 3)   // 6
\`\`\`

## Partial Application

Fix some arguments of a function, return a new function for the rest:

\`\`\`javascript
function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

const multiply = (a, b) => a * b;
const double = partial(multiply, 2);
double(5);   // 10
double(10);  // 20
\`\`\`

## Practical Patterns

**Point-free style**  -  define functions by composition rather than explicit arguments:

\`\`\`javascript
const getActiveNames = pipe(
  users => users.filter(u => u.active),
  users => users.map(u => u.name),
  names => names.sort(),
);
// vs imperative:
function getActiveNames(users) {
  return users.filter(u => u.active).map(u => u.name).sort();
}
\`\`\`

**Transducers**  -  compose transformations efficiently (avoids multiple array passes):

\`\`\`javascript
// Normal: creates intermediate arrays
data.filter(isValid).map(transform).reduce(combine, []);

// With transducers: single pass, no intermediate allocations
// (advanced  -  uses Ramda or custom implementation)
\`\`\`

## When to Use FP vs OOP

**FP shines for**: data transformation pipelines, stateless utilities, event handlers, configuration parsing, functional reactive programming (RxJS).

**OOP shines for**: modelling entities with state and behaviour (User, Order, Connection), complex lifecycle management, frameworks and UI components.

Most real JavaScript code combines both  -  use FP for data pipelines and pure utilities, OOP for stateful entities.`,
    },
    {
      id: 'js-design-patterns',
      title: 'JavaScript Design Patterns: Creational, Structural & Behavioral',
      content: `## Creational Patterns

### Singleton

Ensures only one instance of a class exists:

\`\`\`javascript
class Database {
  static #instance = null;
  #connection;

  constructor(url) {
    if (Database.#instance) return Database.#instance;
    this.#connection = connect(url);
    Database.#instance = this;
  }

  static getInstance(url) {
    return Database.#instance ?? new Database(url);
  }
}
// With ES modules, the module cache IS the singleton  -  just export an instance:
export const db = new Database(process.env.DB_URL);
\`\`\`

### Factory

Create objects without specifying their exact class:

\`\`\`javascript
class NotificationFactory {
  static create(type, options) {
    switch (type) {
      case 'email':   return new EmailNotification(options);
      case 'sms':     return new SmsNotification(options);
      case 'push':    return new PushNotification(options);
      default: throw new Error(\`Unknown type: \${type}\`);
    }
  }
}

const n = NotificationFactory.create('email', { to: 'user@example.com' });
\`\`\`

### Builder

Construct complex objects step by step:

\`\`\`javascript
class QueryBuilder {
  #table = '';
  #conditions = [];
  #limit = null;
  #orderBy = null;

  from(table) { this.#table = table; return this; }
  where(condition) { this.#conditions.push(condition); return this; }
  orderBy(col) { this.#orderBy = col; return this; }
  take(n) { this.#limit = n; return this; }

  build() {
    let q = \`SELECT * FROM \${this.#table}\`;
    if (this.#conditions.length) q += \` WHERE \${this.#conditions.join(' AND ')}\`;
    if (this.#orderBy) q += \` ORDER BY \${this.#orderBy}\`;
    if (this.#limit) q += \` LIMIT \${this.#limit}\`;
    return q;
  }
}

const query = new QueryBuilder()
  .from('users')
  .where('active = true')
  .where('age > 18')
  .orderBy('name')
  .take(10)
  .build();
\`\`\`

## Structural Patterns

### Decorator

Add behaviour to an object without modifying its class:

\`\`\`javascript
class Logger {
  log(msg) { console.log(msg); }
}

function withTimestamp(logger) {
  return {
    log(msg) { logger.log(\`[\${new Date().toISOString()}] \${msg}\`); },
  };
}
function withLevel(logger, level) {
  return {
    log(msg) { logger.log(\`[\${level.toUpperCase()}] \${msg}\`); },
  };
}

const logger = withLevel(withTimestamp(new Logger()), 'info');
logger.log('Server started');
// [2024-01-15T10:00:00.000Z] [INFO] Server started
\`\`\`

### Facade

Simplify a complex subsystem with a clean interface:

\`\`\`javascript
class PaymentFacade {
  constructor() {
    this.validator = new CardValidator();
    this.fraud = new FraudDetector();
    this.processor = new PaymentProcessor();
    this.notifier = new NotificationService();
  }

  async charge(card, amount, userId) {
    this.validator.validate(card);
    await this.fraud.check(userId, amount);
    const result = await this.processor.charge(card, amount);
    await this.notifier.sendReceipt(userId, result);
    return result;
  }
}
// Callers use one method instead of orchestrating 4 services
\`\`\`

## Behavioral Patterns

### Observer / Pub-Sub

\`\`\`javascript
class EventBus {
  #channels = new Map();

  subscribe(event, handler) {
    if (!this.#channels.has(event)) this.#channels.set(event, new Set());
    this.#channels.get(event).add(handler);
    return () => this.#channels.get(event)?.delete(handler);
  }

  publish(event, data) {
    this.#channels.get(event)?.forEach(h => h(data));
  }
}

const bus = new EventBus();
const unsub = bus.subscribe('user:created', user => sendWelcomeEmail(user));
bus.publish('user:created', { email: 'alice@example.com' });
unsub();  // clean up
\`\`\`

### Strategy

Swap algorithms at runtime:

\`\`\`javascript
const sorters = {
  bubble: arr => { /* ... */ },
  merge:  arr => { /* ... */ },
  quick:  arr => { /* ... */ },
};

class Sorter {
  constructor(strategy = 'quick') { this.strategy = strategy; }
  sort(data) { return sorters[this.strategy]([...data]); }
}
\`\`\`

### Command

Encapsulate actions as objects  -  enables undo, queuing, logging:

\`\`\`javascript
class CommandHistory {
  #history = [];

  execute(command) {
    command.execute();
    this.#history.push(command);
  }

  undo() {
    this.#history.pop()?.undo();
  }
}

const addItem = {
  execute() { cart.push(item); },
  undo()    { cart.pop(); },
};
\`\`\``,
    },
    {
      id: 'js-recursion',
      title: 'Recursion, Tree Traversal & Tail Calls',
      content: `## What Is Recursion?

A function that calls itself. Every recursive solution needs:
1. **Base case**  -  condition that stops recursion
2. **Recursive case**  -  function calls itself with a smaller/simpler input

\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;           // base case
  return n * factorial(n - 1);    // recursive case
}
factorial(5);  // 5 * 4 * 3 * 2 * 1 = 120
\`\`\`

## The Call Stack and Recursion

Each recursive call adds a frame to the call stack. Deep recursion can cause a **stack overflow**:

\`\`\`javascript
// Breaks at ~10,000 depth in Node.js
function sum(n) {
  if (n === 0) return 0;
  return n + sum(n - 1);
}
sum(100000);  // RangeError: Maximum call stack size exceeded
\`\`\`

## Tail Call Optimization (TCO)

A **tail call** is a function call as the last operation  -  the current frame can be replaced instead of stacked. ES2015 specified TCO, but only Safari implements it fully. In Node.js, use iteration for deep recursion.

\`\`\`javascript
// NOT tail-recursive  -  must keep frame to multiply after recursive call returns
function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);  // * happens after return
}

// Tail-recursive  -  accumulator carries state
function factorial(n, acc = 1) {
  return n <= 1 ? acc : factorial(n - 1, n * acc);  // call is the last operation
}
\`\`\`

## Memoized Recursion

Cache results to avoid redundant computation:

\`\`\`javascript
function memoize(fn) {
  const cache = new Map();
  return function memo(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fib = memoize(function(n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
});
fib(40);  // instant  -  without memoization: 2^40 calls
\`\`\`

## Tree Traversal

Recursion is natural for tree/graph structures:

\`\`\`javascript
// Depth-First traversal
function dfs(node, visit) {
  if (!node) return;
  visit(node);                        // pre-order (visit before children)
  node.children?.forEach(child => dfs(child, visit));
}

// Find in tree
function findNode(root, predicate) {
  if (!root) return null;
  if (predicate(root)) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
}

// Deep flatten
function flatten(arr) {
  return arr.reduce((acc, item) =>
    Array.isArray(item) ? [...acc, ...flatten(item)] : [...acc, item], []);
}

// Deep clone
function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepClone);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepClone(v)]));
}
\`\`\`

## Iterative vs Recursive

Prefer **iteration** when:
- Input depth is unbounded (risk of stack overflow)
- Performance is critical (function call overhead)
- The language/runtime does not support TCO

Prefer **recursion** when:
- The problem is naturally hierarchical (trees, graphs, nested structures)
- Clarity matters and depth is bounded
- Paired with memoization for DP problems

\`\`\`javascript
// Iterative DFS using an explicit stack
function dfsIterative(root, visit) {
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    visit(node);
    stack.push(...(node.children ?? []).reverse());  // reverse to maintain order
  }
}
\`\`\``,
    },
    {
      id: 'js-date-json',
      title: 'Date Object & JSON: Parsing, Serialisation & Gotchas',
      content: `## Creating Dates

\`\`\`javascript
new Date()                    // current moment
new Date('2024-01-15')        // from ISO string (UTC midnight)
new Date('2024-01-15T10:30:00Z')  // UTC explicit
new Date(2024, 0, 15)         // year, month (0-indexed!), day  -  LOCAL time
new Date(1705312200000)       // from Unix timestamp (milliseconds)

Date.now()                    // Unix timestamp ms  -  no object creation
\`\`\`

**Month is 0-indexed**: January = 0, December = 11. This is a famous footgun.

## Reading Dates

\`\`\`javascript
const d = new Date('2024-01-15T10:30:00Z');

d.getFullYear()       // 2024
d.getMonth()          // 0  (January!)
d.getDate()           // 15  (day of month)
d.getDay()            // 1  (day of week: 0=Sunday, 6=Saturday)
d.getHours()          // 10  (local) vs d.getUTCHours()
d.getMinutes()        // 30
d.getTime()           // Unix timestamp ms
d.toISOString()       // '2024-01-15T10:30:00.000Z'   -  always UTC
d.toLocaleDateString('en-GB')  // '15/01/2024'  (locale-aware)
d.toLocaleDateString('fr-FR')  // '15/01/2024'
\`\`\`

## Date Arithmetic

\`\`\`javascript
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextMonth = new Date(now);
nextMonth.setMonth(now.getMonth() + 1);  // mutates!

// Difference in days
const diffMs = date2 - date1;    // dates subtract to milliseconds
const diffDays = diffMs / (1000 * 60 * 60 * 24);
\`\`\`

For production date handling, use **Temporal** (Stage 3 proposal) or a library like **date-fns** or **Day.js**  -  native Date has many pitfalls.

## Intl.DateTimeFormat

\`\`\`javascript
new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date());  // 'January 15, 2024'

new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  .format(-1, 'day');   // 'yesterday'
\`\`\`

## JSON.stringify

\`\`\`javascript
JSON.stringify(value)               // compact
JSON.stringify(value, null, 2)      // pretty-print with 2-space indent

// Replacer function  -  control what's included
JSON.stringify(obj, (key, value) => {
  if (key === 'password') return undefined;  // exclude sensitive fields
  return value;
});

// Replacer array  -  whitelist keys
JSON.stringify(user, ['name', 'email']);

// toJSON method  -  custom serialisation
class Money {
  constructor(amount, currency) { this.amount = amount; this.currency = currency; }
  toJSON() { return \`\${this.amount} \${this.currency}\`; }
}
JSON.stringify(new Money(100, 'EUR'));  // '"100 EUR"'
\`\`\`

**What JSON.stringify silently drops or changes:**
- \`undefined\` values → omitted from objects, become \`null\` in arrays
- Functions → omitted
- Symbols → omitted
- \`NaN\` and \`Infinity\` → \`null\`
- \`Date\` objects → ISO string (loses the Date type  -  parsed as string)
- \`Map\`, \`Set\`, \`RegExp\` → \`{}\` (empty object  -  data lost!)
- Circular references → throws \`TypeError\`

## JSON.parse

\`\`\`javascript
JSON.parse('{"name":"Alice","age":30}');  // { name: 'Alice', age: 30 }

// Reviver  -  transform values while parsing
const data = JSON.parse(text, (key, value) => {
  if (key === 'date') return new Date(value);  // restore Date objects
  return value;
});
\`\`\`

## Safe JSON Handling

\`\`\`javascript
function safeParse(str, fallback = null) {
  try { return JSON.parse(str); }
  catch { return fallback; }
}

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  });
}
\`\`\``,
    },
    {
      id: 'js-memory-gc',
      title: 'Memory Management, Garbage Collection & Leak Prevention',
      content: `## Stack vs Heap

**Stack**  -  fixed-size, fast, automatically managed. Holds:
- Primitive values (number, boolean, string, etc.)
- References (pointers) to objects
- Function call frames (local variables, return address)

**Heap**  -  dynamic, large, managed by the GC. Holds:
- All objects, arrays, functions, closures

\`\`\`javascript
let x = 42;           // 42 is on the stack
let obj = { a: 1 };   // reference (pointer) on stack, { a: 1 } on heap
let copy = obj;       // copy of the reference  -  both point to same object on heap
\`\`\`

## Garbage Collection

JavaScript uses **automatic garbage collection**  -  you don't \`free()\` memory manually. The GC reclaims memory for objects that are no longer reachable.

### Mark-and-Sweep (V8's primary algorithm)

1. **Mark**  -  starting from "roots" (global variables, call stack, registers), recursively mark every object that can be reached
2. **Sweep**  -  collect all unmarked objects (unreachable = garbage)

\`\`\`javascript
let user = { name: 'Alice' };   // object on heap, reachable via 'user'
user = null;                     // reference dropped  -  object now unreachable
// GC will collect { name: 'Alice' } on next cycle
\`\`\`

### Generational GC

V8 divides the heap into **young generation** (most objects  -  short-lived) and **old generation** (survivors). Young-gen GC runs frequently and is fast; old-gen is slower but less frequent. Most objects die young (allocated, used briefly, collected).

## Common Memory Leaks

### 1. Global Variables

\`\`\`javascript
function leaked() {
  leakedVar = 'oops';  // no let/const/var  -  becomes global!
}
\`\`\`

Always use \`'use strict'\` or ES modules to catch accidental globals.

### 2. Forgotten Timers

\`\`\`javascript
// Leak: interval keeps running and holds closure reference
const interval = setInterval(() => {
  processData(heavyObject);  // heavyObject stays in memory
}, 1000);
// Fix:
clearInterval(interval);
\`\`\`

### 3. Unremoved Event Listeners

\`\`\`javascript
class Component {
  onEvent = () => this.update();  // reference to this

  mount() {
    emitter.on('data', this.onEvent);
  }
  unmount() {
    emitter.off('data', this.onEvent);  // MUST remove or the whole component leaks
  }
}
\`\`\`

### 4. Closures Retaining Large Scopes

\`\`\`javascript
function setup() {
  const bigBuffer = Buffer.alloc(10_000_000);  // 10 MB
  return () => bigBuffer.length;               // keeps entire buffer in memory

  // Fix: only keep what you need
  const size = bigBuffer.length;
  return () => size;  // bigBuffer can now be GC'd
}
\`\`\`

### 5. Out-of-Control Caches

\`\`\`javascript
const cache = new Map();  // grows forever
// Fix: bounded cache with LRU eviction, or use WeakMap for object keys
\`\`\`

## Memory-Efficient Patterns

\`\`\`javascript
// Use WeakMap for object-keyed caches
const cache = new WeakMap();
function getMetadata(obj) {
  if (!cache.has(obj)) cache.set(obj, computeMeta(obj));
  return cache.get(obj);
}
// When obj has no other references, the cache entry is GC'd automatically

// Process large data lazily with generators (never holds everything in memory)
async function* readLines(filePath) {
  const stream = fs.createReadStream(filePath);
  for await (const chunk of stream) {
    for (const line of chunk.toString().split('\\n')) {
      yield line;
    }
  }
}
\`\`\`

## Diagnosing Leaks in Node.js

\`\`\`javascript
// Monitor heap usage
const used = process.memoryUsage();
console.log(\`Heap: \${Math.round(used.heapUsed / 1024 / 1024)} MB\`);

// Force GC in --expose-gc mode (debugging only!)
if (global.gc) global.gc();
\`\`\`

Use Node.js \`--inspect\` + Chrome DevTools heap snapshots to find what's retaining memory, or use \`clinic heap\` from the Clinic.js suite.`,
    },
    {
      id: 'js-numbers-precision',
      title: 'Numbers, Math & Floating-Point Precision',
      content: `## The Number Type

JavaScript has a single \`number\` type: a 64-bit IEEE 754 double-precision float. There is no separate integer type  -  every number is a float under the hood.

\`\`\`javascript
typeof 42        // 'number'
typeof 42.5      // 'number'
typeof Infinity  // 'number'
typeof NaN       // 'number'
\`\`\`

## The Floating-Point Problem

Because numbers are binary floats, decimal fractions cannot always be represented exactly:

\`\`\`javascript
0.1 + 0.2            // 0.30000000000000004  ← not 0.3!
0.1 + 0.2 === 0.3    // false
0.3 - 0.2            // 0.09999999999999998
\`\`\`

This is **not a JavaScript bug**  -  it is how IEEE 754 works in every language (Java, Python, C all have it). The number 0.1 has no exact binary representation, just as 1/3 has no exact decimal representation.

**Comparing floats safely**  -  use an epsilon tolerance:

\`\`\`javascript
function almostEqual(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}
almostEqual(0.1 + 0.2, 0.3);  // true
\`\`\`

## Money: Never Use Floats

For financial calculations (critical in fintech), **never store money as floating-point dollars**. Use one of:

\`\`\`javascript
// Option 1: integer cents (most common)
const price = 1099;            // €10.99 stored as 1099 cents
const total = price * quantity; // exact integer math
const display = (total / 100).toFixed(2);  // '21.98'

// Option 2: BigInt for very large values (crypto wei, satoshis)
const wei = 1000000000000000000n;  // 1 ETH in wei

// Option 3: decimal library (decimal.js, big.js) for arbitrary precision
import Decimal from 'decimal.js';
new Decimal(0.1).plus(0.2).toString();  // '0.3' exactly
\`\`\`

## Special Numeric Values

\`\`\`javascript
Infinity            // result of 1 / 0
-Infinity           // result of -1 / 0
NaN                 // 'Not a Number'  -  result of invalid math (0/0, parseInt('x'))

Number.isNaN(NaN)        // true  (use this, not global isNaN)
Number.isFinite(42)      // true
Number.isInteger(42.0)   // true
Number.isSafeInteger(2 ** 53)  // false  -  beyond safe integer range
\`\`\`

\`NaN\` is the only value not equal to itself. Always check with \`Number.isNaN()\`, not \`=== NaN\` (which is always false). The global \`isNaN()\` coerces its argument (\`isNaN('foo')\` is \`true\`), so prefer \`Number.isNaN()\`.

## Number Limits

\`\`\`javascript
Number.MAX_SAFE_INTEGER   // 9007199254740991 (2^53 - 1)
Number.MIN_SAFE_INTEGER   // -9007199254740991
Number.MAX_VALUE          // ~1.8e308 (largest representable)
Number.EPSILON            // ~2.2e-16 (smallest difference between 1 and next float)

9007199254740991 + 1      // 9007199254740992  ✓
9007199254740991 + 2      // 9007199254740992  ✗ precision lost!
// Use BigInt beyond this range
\`\`\`

## Conversion and Parsing

\`\`\`javascript
Number('42')        // 42
Number('42px')      // NaN   -  strict
Number('')          // 0     -  empty string is 0 (gotcha!)
Number('  42  ')    // 42    -  trims whitespace
Number(null)        // 0
Number(undefined)   // NaN
Number(true)        // 1

parseInt('42px')    // 42    -  lenient, stops at non-digit
parseInt('0xFF')    // 255   -  auto-detects hex
parseInt('11', 2)   // 3     -  binary radix (ALWAYS specify radix!)
parseFloat('3.14m') // 3.14

(255).toString(16)  // 'ff'    -  to hex
(255).toString(2)   // '11111111'  -  to binary
\`\`\`

## Number Formatting

\`\`\`javascript
(3.14159).toFixed(2)        // '3.14'  (string!)
(1234.5).toPrecision(2)     // '1.2e+3'
(255).toString(16)          // 'ff'

// Intl.NumberFormat  -  locale-aware, currency, percent
new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR',
}).format(1234.56);  // '1.234,56 €'

new Intl.NumberFormat('en-US').format(1234567);  // '1,234,567'
\`\`\`

## Useful Math Methods

\`\`\`javascript
Math.round(4.5)     // 5    (round half up)
Math.floor(4.9)     // 4    (round down)
Math.ceil(4.1)      // 5    (round up)
Math.trunc(4.9)     // 4    (drop decimal  -  no rounding)
Math.trunc(-4.9)    // -4   (vs Math.floor(-4.9) = -5)
Math.abs(-5)        // 5
Math.sign(-3)       // -1   (-1, 0, or 1)
Math.max(1, 2, 3)   // 3
Math.min(...arr)    // smallest in array
Math.hypot(3, 4)    // 5    (sqrt of sum of squares)
Math.random()       // [0, 1)   -  NOT cryptographically secure!
\`\`\`

For secure randomness (tokens, IDs), use \`crypto.randomInt()\` / \`crypto.randomUUID()\` (Node) or \`crypto.getRandomValues()\` (browser)  -  never \`Math.random()\`.`,
    },
    {
      id: 'js-type-checking',
      title: 'Type Checking & Type Conversion in Depth',
      content: `## The typeof Operator

\`typeof\` returns a string describing the type. Reliable for primitives, limited for objects:

\`\`\`javascript
typeof 'hello'      // 'string'
typeof 42           // 'number'
typeof true         // 'boolean'
typeof undefined    // 'undefined'
typeof Symbol()     // 'symbol'
typeof 10n          // 'bigint'
typeof function(){} // 'function'  (functions are special)
typeof null         // 'object'    ← historical bug
typeof []           // 'object'    ← can't distinguish arrays
typeof {}           // 'object'
typeof new Date()   // 'object'    ← can't distinguish dates
\`\`\`

\`typeof\` is safe on undeclared variables (returns \`'undefined'\` instead of throwing)  -  useful for feature detection.

## The Reliable Type Check: Object.prototype.toString

To distinguish object subtypes (Array, Date, RegExp, etc.), use the toString tag:

\`\`\`javascript
const type = (v) => Object.prototype.toString.call(v).slice(8, -1);

type([])           // 'Array'
type({})           // 'Object'
type(null)         // 'Null'
type(undefined)    // 'Undefined'
type(new Date())   // 'Date'
type(/regex/)      // 'RegExp'
type(new Map())    // 'Map'
type(() => {})     // 'Function'
type(42)           // 'Number'
type('hi')         // 'String'
\`\`\`

This works because \`Object.prototype.toString\` reads the internal \`[[Class]]\`/\`Symbol.toStringTag\`.

## Checking Specific Types

\`\`\`javascript
Array.isArray([])           // true   ← THE way to check arrays
Array.isArray({})           // false

Number.isInteger(42)        // true
Number.isNaN(NaN)           // true
Number.isFinite(Infinity)   // false

value instanceof Date       // checks prototype chain
value instanceof Error
value instanceof MyClass

typeof value === 'function' // function check

value === null              // null check (typeof null is 'object'!)
value == null               // true for BOTH null and undefined
value === undefined         // undefined check
\`\`\`

## instanceof and Its Limits

\`instanceof\` checks the prototype chain. It can fail across different execution contexts (e.g. iframes, worker threads) because each has its own \`Array\`, \`Object\`, etc:

\`\`\`javascript
// In the same context:
[] instanceof Array     // true

// Array from another iframe/realm:
arrayFromIframe instanceof Array  // false! (different Array constructor)
Array.isArray(arrayFromIframe)    // true  (works across realms)
\`\`\`

This is why \`Array.isArray()\` exists  -  it works across realms.

## Truthy / Falsy Conversion

The 8 falsy values: \`false\`, \`0\`, \`-0\`, \`0n\`, \`''\`, \`null\`, \`undefined\`, \`NaN\`. Everything else is truthy  -  including \`[]\`, \`{}\`, \`'0'\`, \`'false'\`, and all functions.

\`\`\`javascript
Boolean([])         // true   ← empty array is truthy!
Boolean({})         // true   ← empty object is truthy!
Boolean('0')        // true   ← non-empty string
Boolean(' ')        // true   ← whitespace string
!!'hello'           // true   (double-NOT to coerce to boolean)
\`\`\`

## == vs === (Abstract vs Strict Equality)

\`===\` compares type and value with NO coercion. \`==\` applies coercion rules:

\`\`\`javascript
1 == '1'            // true   (string → number)
0 == false          // true   (boolean → number)
null == undefined   // true   (special case  -  only each other)
null == 0           // false  (null only equals undefined/null)
'' == 0             // true   (empty string → 0)
NaN == NaN          // false  (NaN never equals anything)
[] == ''            // true   ([] → '' → 0, '' → 0)
[] == 0             // true
[1] == 1            // true   ([1] → '1' → 1)
\`\`\`

**Rule: always use \`===\`** except one idiom: \`value == null\` to check for both \`null\` and \`undefined\` in one expression.

## Object.is  -  SameValue Equality

\`\`\`javascript
Object.is(NaN, NaN)      // true   ← unlike === !
Object.is(0, -0)         // false  ← unlike === !
Object.is(1, 1)          // true
// === gives: NaN === NaN is false, 0 === -0 is true
\`\`\`

\`Object.is\` is used internally by React for state comparison and \`Array.prototype.includes\` (SameValueZero, a slight variant where +0 and -0 are equal).`,
    },
    {
      id: 'js-bitwise',
      title: 'Bitwise Operators & Binary Manipulation',
      content: `## How Bitwise Works

Bitwise operators convert numbers to 32-bit signed integers, operate bit by bit, then convert back. Useful for flags, permissions, low-level protocols, and performance-critical code.

\`\`\`javascript
5  .toString(2)   // '101'
3  .toString(2)   // '011'
\`\`\`

## The Operators

\`\`\`javascript
5 & 3    // 1   AND  (101 & 011 = 001)   -  bit set in BOTH
5 | 3    // 7   OR   (101 | 011 = 111)   -  bit set in EITHER
5 ^ 3    // 6   XOR  (101 ^ 011 = 110)   -  bit set in ONE but not both
~5       // -6  NOT  (inverts all bits: ~n === -(n+1))
5 << 1   // 10  left shift  (multiply by 2^n)
5 >> 1   // 2   right shift (divide by 2^n, sign-preserving)
-5 >>> 1 // 2147483645  unsigned right shift (fills with 0)
\`\`\`

## Bit Flags (Permission Systems)

A classic, efficient way to store multiple boolean options in one integer:

\`\`\`javascript
const Permissions = {
  READ:    1 << 0,   // 0001 = 1
  WRITE:   1 << 1,   // 0010 = 2
  DELETE:  1 << 2,   // 0100 = 4
  ADMIN:   1 << 3,   // 1000 = 8
};

// Combine flags with OR
let userPerms = Permissions.READ | Permissions.WRITE;  // 0011 = 3

// Check a flag with AND
const canWrite = (userPerms & Permissions.WRITE) !== 0;  // true
const canDelete = (userPerms & Permissions.DELETE) !== 0; // false

// Add a flag with OR
userPerms |= Permissions.DELETE;  // now 0111 = 7

// Remove a flag with AND NOT
userPerms &= ~Permissions.WRITE;  // removes WRITE bit

// Toggle a flag with XOR
userPerms ^= Permissions.ADMIN;
\`\`\`

This is how Unix file permissions (chmod 755), Discord permissions, and many database flag columns work.

## Common Bitwise Tricks

\`\`\`javascript
// Check if even/odd
n & 1            // 1 if odd, 0 if even

// Swap without temp variable (XOR swap)
a ^= b; b ^= a; a ^= b;

// Fast multiply/divide by powers of 2
n << 3           // n * 8
n >> 2           // Math.floor(n / 4)

// Floor a positive float (faster than Math.floor for positives)
~~4.7            // 4   (double NOT truncates)
4.7 | 0          // 4
4.7 >> 0         // 4

// Check if power of 2
(n & (n - 1)) === 0   // true if n is a power of 2

// Convert hex color to RGB
const rgb = 0xFF5733;
const r = (rgb >> 16) & 0xFF;  // 255
const g = (rgb >> 8) & 0xFF;   // 87
const b = rgb & 0xFF;          // 51
\`\`\`

## Caveats

Bitwise operators only work on the lower 32 bits  -  numbers above 2^31 behave unexpectedly. For larger bit sets, use \`BigInt\` (which supports bitwise operators with arbitrary precision):

\`\`\`javascript
1n << 40n        // works with BigInt
1 << 40          // 256  -  WRONG, wraps around 32 bits
\`\`\`

In modern application code, bit flags are often replaced by \`Set\` or boolean object fields for readability  -  but bitwise remains essential for protocols, compression, hashing, and interview puzzles.`,
    },
    {
      id: 'js-strict-mode',
      title: 'Strict Mode & Common Language Pitfalls',
      content: `## Enabling Strict Mode

\`'use strict'\` opts into a restricted variant of JavaScript that catches common mistakes and disables error-prone features.

\`\`\`javascript
'use strict';           // at top of file  -  whole script/module
function fn() {
  'use strict';         // or per-function
}
\`\`\`

**ES modules and class bodies are always strict**  -  no directive needed. Most modern code is strict by default.

## What Strict Mode Changes

### 1. No Accidental Globals

\`\`\`javascript
'use strict';
function leak() {
  x = 10;   // ReferenceError  -  without strict, this creates a global
}
\`\`\`

### 2. Assignment Errors Throw

\`\`\`javascript
'use strict';
const frozen = Object.freeze({ a: 1 });
frozen.a = 2;      // TypeError (silent failure without strict)
undefined = 5;     // TypeError
NaN = 5;           // TypeError
\`\`\`

### 3. \`this\` Is undefined in Plain Calls

\`\`\`javascript
'use strict';
function fn() { return this; }
fn();    // undefined (not the global object)
\`\`\`

This prevents accidental global object mutation through unbound method calls.

### 4. Other Restrictions

- Duplicate parameter names throw: \`function(a, a) {}\` → SyntaxError
- \`delete\` on variables throws
- \`with\` statement is forbidden
- Octal literals like \`010\` are forbidden (use \`0o10\`)
- \`eval\` does not leak variables into the surrounding scope
- Reserved words (\`implements\`, \`interface\`, \`private\`) cannot be used as identifiers

## Common JavaScript Pitfalls

### Floating-Point Comparison

\`\`\`javascript
0.1 + 0.2 === 0.3   // false! Use an epsilon tolerance.
\`\`\`

### typeof null

\`\`\`javascript
typeof null === 'object'   // true  -  historical bug. Check value === null.
\`\`\`

### Array Holes and Sparse Arrays

\`\`\`javascript
const arr = [1, , 3];      // hole at index 1
arr.length                  // 3
arr[1]                      // undefined
arr.map(x => x * 2)         // [2, <hole>, 6]  -  skips holes!
\`\`\`

### NaN Is Not Equal to Itself

\`\`\`javascript
NaN === NaN          // false
[NaN].includes(NaN)  // true  (SameValueZero)
[NaN].indexOf(NaN)   // -1    (strict equality)
\`\`\`

### Mutating While Iterating

\`\`\`javascript
const arr = [1, 2, 3, 4];
arr.forEach((x, i) => { if (x === 2) arr.splice(i, 1); });
// Skips elements  -  never mutate an array during forEach
\`\`\`

### Reference vs Value

\`\`\`javascript
const a = { x: 1 };
const b = a;          // same reference
b.x = 2;
a.x;                  // 2  -  both point to the same object

function reset(obj) { obj = {}; }  // reassigns local param, no effect on caller
function clear(obj) { obj.x = 0; } // mutates the shared object
\`\`\`

### Default Parameter Evaluation

\`\`\`javascript
function append(item, arr = []) {  // fresh array each call (good)
  arr.push(item);
  return arr;
}
// vs the Python-style gotcha  -  JS evaluates defaults per call, so this is safe
\`\`\`

### Comparison Coercion

\`\`\`javascript
[] == ![]            // true!  ![] is false, [] == false → '' == 0 → 0 == 0
'' == 0              // true
'0' == 0             // true
'0' == ''            // false
null == 0            // false
\`\`\`

The lesson from all of these: **use \`===\`, use strict mode, treat objects as references, and never compare floats with \`===\`.**`,
    },
    {
      id: 'js-timers-scheduling',
      title: 'Timers, Scheduling & AbortController',
      content: `## setTimeout and setInterval

\`\`\`javascript
const id = setTimeout(() => console.log('once'), 1000);
clearTimeout(id);   // cancel before it fires

const intId = setInterval(() => poll(), 5000);
clearInterval(intId);  // stop repeating
\`\`\`

**setTimeout(fn, 0) is not really 0ms**  -  it queues a macrotask that runs after the current synchronous code AND all microtasks. The minimum delay is also clamped (~4ms for nested timers in browsers).

\`\`\`javascript
console.log('1');
setTimeout(() => console.log('3'), 0);
Promise.resolve().then(() => console.log('2'));  // microtask runs first
console.log('1.5');
// Output: 1, 1.5, 2, 3
\`\`\`

## queueMicrotask

Schedule a microtask directly  -  runs after current code, before any timer:

\`\`\`javascript
queueMicrotask(() => console.log('runs before any setTimeout'));
\`\`\`

Use it when you need to defer work to "after this synchronous block" but before the next macrotask  -  e.g. batching DOM updates or state notifications.

## setImmediate and process.nextTick (Node.js)

\`\`\`javascript
// process.nextTick  -  runs BEFORE the microtask queue, after current operation
process.nextTick(() => console.log('nextTick'));

// setImmediate  -  runs in the 'check' phase, after I/O callbacks
setImmediate(() => console.log('immediate'));

// Ordering:
console.log('sync');
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
// sync, nextTick, promise, then timeout/immediate (order varies)
\`\`\`

Overusing \`process.nextTick\` can starve the event loop (same risk as recursive microtasks).

## Debounce and Throttle with Timers

\`\`\`javascript
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}
\`\`\`

## A Promise-Based delay

\`\`\`javascript
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retry(fn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === attempts - 1) throw err;
      await delay(2 ** i * 1000);  // exponential backoff: 1s, 2s, 4s
    }
  }
}
\`\`\`

## AbortController: Cancelling Async Work

\`AbortController\` provides a standard way to cancel fetches, timers, and any abortable operation:

\`\`\`javascript
const controller = new AbortController();
const { signal } = controller;

// Pass the signal to fetch
fetch('/api/data', { signal })
  .then(res => res.json())
  .catch(err => {
    if (err.name === 'AbortError') console.log('Request cancelled');
  });

// Cancel it
controller.abort();
\`\`\`

**Timeout pattern with AbortSignal.timeout (modern):**

\`\`\`javascript
// Built-in timeout signal (Node 17.3+, modern browsers)
fetch('/api/slow', { signal: AbortSignal.timeout(5000) });

// Combine multiple signals (Node 20+)
const signal = AbortSignal.any([userSignal, AbortSignal.timeout(5000)]);
\`\`\`

**Custom abortable operation:**

\`\`\`javascript
function abortableTask(signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const id = setTimeout(resolve, 10000);
    signal.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
\`\`\`

AbortController is the standard cancellation primitive across \`fetch\`, Node streams, \`events.on\`, and database drivers  -  learn it well for backend work.`,
    },
    {
      id: 'js-concurrency-control',
      title: 'Concurrency Control: Promise Pools, Queues & Rate Limiting',
      content: `## Why Concurrency Control Matters

\`Promise.all\` runs everything at once. With 10,000 items, that means 10,000 simultaneous database connections or HTTP requests  -  overwhelming the server, hitting rate limits, or exhausting memory. Backend engineers need to **limit concurrency**.

## Sequential Processing

\`\`\`javascript
// One at a time  -  slow but safe
async function sequential(items, fn) {
  const results = [];
  for (const item of items) {
    results.push(await fn(item));
  }
  return results;
}
\`\`\`

## Batched Processing

Process in fixed-size chunks:

\`\`\`javascript
async function inBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

await inBatches(users, 10, sendEmail);  // 10 emails at a time
\`\`\`

## Concurrency Pool (Sliding Window)

A more efficient approach  -  always keep N tasks in flight, starting a new one as soon as one finishes:

\`\`\`javascript
async function pool(items, concurrency, fn) {
  const results = [];
  const executing = new Set();

  for (const [index, item] of items.entries()) {
    const promise = Promise.resolve(fn(item, index)).then(result => {
      executing.delete(promise);
      return result;
    });
    results.push(promise);
    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);  // wait for ANY to finish
    }
  }
  return Promise.all(results);
}

// Process 1000 URLs, max 5 concurrent requests
await pool(urls, 5, url => fetch(url).then(r => r.json()));
\`\`\`

## Async Queue with Worker Pool

\`\`\`javascript
class AsyncQueue {
  #queue = [];
  #active = 0;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  push(task) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ task, resolve, reject });
      this.#next();
    });
  }

  #next() {
    if (this.#active >= this.concurrency || this.#queue.length === 0) return;
    this.#active++;
    const { task, resolve, reject } = this.#queue.shift();
    Promise.resolve(task())
      .then(resolve, reject)
      .finally(() => {
        this.#active--;
        this.#next();  // start the next queued task
      });
  }
}

const queue = new AsyncQueue(3);  // max 3 concurrent
urls.forEach(url => queue.push(() => fetch(url)));
\`\`\`

## Rate Limiting (Token Bucket)

Limit operations per time window (e.g. API rate limits):

\`\`\`javascript
class RateLimiter {
  #tokens;
  #lastRefill = Date.now();

  constructor(maxTokens, refillPerSec) {
    this.maxTokens = maxTokens;
    this.refillPerSec = refillPerSec;
    this.#tokens = maxTokens;
  }

  async acquire() {
    this.#refill();
    while (this.#tokens < 1) {
      await new Promise(r => setTimeout(r, 100));
      this.#refill();
    }
    this.#tokens--;
  }

  #refill() {
    const now = Date.now();
    const elapsed = (now - this.#lastRefill) / 1000;
    this.#tokens = Math.min(this.maxTokens, this.#tokens + elapsed * this.refillPerSec);
    this.#lastRefill = now;
  }
}

const limiter = new RateLimiter(10, 5);  // 10 burst, 5/sec sustained
async function callApi(url) {
  await limiter.acquire();
  return fetch(url);
}
\`\`\`

## Timeout Wrapper

\`\`\`javascript
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(\`Timeout after \${ms}ms\`)), ms)
    ),
  ]);
}

await withTimeout(slowQuery(), 5000);  // rejects if query takes > 5s
\`\`\`

## Key Takeaways

- **Promise.all**  -  unbounded concurrency; only safe for small, known sets
- **Batching**  -  simple, but the whole batch waits for its slowest member
- **Pool / sliding window**  -  best throughput with bounded concurrency
- **Rate limiter**  -  respect external API quotas
- Always add **timeouts** to external calls so one hung request cannot stall the system

These patterns appear constantly in backend interviews  -  "how would you process a million records without overwhelming the database?" The answer is bounded concurrency.`,
    },
  ],
  questions: [
    // Variables and Types
    {
      id: 'js-q-const-mutate',
      category: 'javascript',
      subcategory: 'variables',
      difficulty: 'foundation',
      question: 'You declare `const arr = [1, 2, 3]`. Which operation throws?',
      options: [
        'arr.push(4)',
        'arr[0] = 99',
        'arr = [1, 2, 3, 4]',
        'arr.length = 0',
      ],
      correctIndex: 2,
      explanation:
        '`const` prevents rebinding the variable  -  `arr = ...` throws a TypeError. But the array itself is still mutable, so push, index assignment, and clearing via length all work fine.',
      interviewTip: 'const is about the binding, not the value. Use Object.freeze() for true immutability.',
    },
    {
      id: 'js-q-typeof-null',
      category: 'javascript',
      subcategory: 'types',
      difficulty: 'foundation',
      question: 'What does `typeof null` return?',
      options: ['null', 'undefined', 'object', 'boolean'],
      correctIndex: 2,
      explanation:
        '`typeof null` returns "object"  -  a historical bug from JavaScript\'s first implementation that cannot be fixed without breaking existing code. Check for null explicitly with `=== null`.',
    },
    {
      id: 'js-q-coercion',
      category: 'javascript',
      subcategory: 'coercion',
      difficulty: 'core',
      question: 'What does `[] == false` evaluate to?',
      options: ['true', 'false', 'TypeError', 'undefined'],
      correctIndex: 0,
      explanation:
        'Both sides coerce to 0: `[]` → `""` → `0`, and `false` → `0`. So `0 == 0` is `true`. This is exactly why `===` should always be preferred  -  it does no coercion.',
      interviewTip: 'Loose equality coercion chains are notoriously confusing. Always use ===.',
    },
    {
      id: 'js-q-nullish',
      category: 'javascript',
      subcategory: 'operators',
      difficulty: 'foundation',
      question: 'What is the value of `const x = 0 ?? "default"`?',
      options: ['"default"', '0', 'null', 'undefined'],
      correctIndex: 1,
      explanation:
        '`??` (nullish coalescing) only falls back for `null` or `undefined`. Since `0` is neither, `x` is `0`. With `||`, the result would be `"default"` because `||` treats `0` as falsy.',
    },
    // Operators
    {
      id: 'js-q-optional-chain',
      category: 'javascript',
      subcategory: 'operators',
      difficulty: 'foundation',
      question: 'What does `user?.address?.city` return if `user` is `null`?',
      options: ['TypeError', 'null', 'undefined', '""'],
      correctIndex: 2,
      explanation:
        'Optional chaining short-circuits and returns `undefined` when any part of the chain is `null` or `undefined`. Without `?.`, accessing `.address` on `null` would throw a TypeError.',
    },
    // Control Flow
    {
      id: 'js-q-switch-fall',
      category: 'javascript',
      subcategory: 'control-flow',
      difficulty: 'foundation',
      question: 'In a switch statement, what happens if you omit `break` at the end of a case?',
      options: [
        'A SyntaxError is thrown',
        'Only that case runs',
        'Execution falls through into the next case',
        'The switch exits to the default',
      ],
      correctIndex: 2,
      explanation:
        'Without `break`, execution falls through to the next case regardless of whether it matches. This is sometimes intentional (shared handling for multiple cases) but is a common source of bugs.',
    },
    {
      id: 'js-q-for-of-in',
      category: 'javascript',
      subcategory: 'control-flow',
      difficulty: 'foundation',
      question: 'What does `for...in` iterate over on an object?',
      options: [
        'The values of all own properties',
        'Enumerable property keys, including inherited ones',
        'Only non-enumerable properties',
        'The prototype chain',
      ],
      correctIndex: 1,
      explanation:
        '`for...in` iterates over all enumerable property keys, including those inherited through the prototype chain. Use `Object.hasOwn(obj, key)` to filter to own properties only, or prefer `Object.keys()` which only returns own enumerable keys.',
    },
    // Functions
    {
      id: 'js-q-arrow-this',
      category: 'javascript',
      subcategory: 'functions',
      difficulty: 'core',
      question: 'How does an arrow function determine the value of `this`?',
      options: [
        'From the object it is called on',
        'It is always undefined in strict mode',
        'It captures `this` lexically from where it was defined',
        'From the first argument passed',
      ],
      correctIndex: 2,
      explanation:
        'Arrow functions have no own `this`. They capture `this` from the enclosing lexical scope at the time of definition. This makes them ideal for callbacks inside class methods, and means `call/apply/bind` cannot change their `this`.',
    },
    {
      id: 'js-q-default-params',
      category: 'javascript',
      subcategory: 'functions',
      difficulty: 'foundation',
      question: 'You call `fn(undefined, "b")` where `fn` is declared as `function fn(a = "default", b)`. What is `a`?',
      options: ['"default"', 'undefined', 'null', '"b"'],
      correctIndex: 0,
      explanation:
        '`undefined` triggers the default parameter  -  passing `undefined` is equivalent to not passing the argument at all. `null`, `0`, `""`, and `false` do NOT trigger defaults; only `undefined` does.',
    },
    // Closures
    {
      id: 'js-q-closure-loop',
      category: 'javascript',
      subcategory: 'closures',
      difficulty: 'core',
      question: 'A `for` loop with `var i` schedules three `setTimeout`s that log `i`. What prints?',
      options: ['0, 1, 2', '3, 3, 3', '1, 2, 3', 'undefined three times'],
      correctIndex: 1,
      explanation:
        '`var` is function-scoped, so all three closures share one `i`. By the time the timers fire, the loop has finished and `i` is 3. Replace `var` with `let` to give each iteration its own block-scoped binding.',
      interviewTip: 'var shares one binding; let creates a fresh binding per iteration.',
    },
    {
      id: 'js-q-closure-factory',
      category: 'javascript',
      subcategory: 'closures',
      difficulty: 'core',
      question: 'After `makeCounter()` returns its counter object, why can the returned methods still read and modify the inner `count` variable?',
      options: [
        'count is a global variable',
        'The methods close over the outer scope where count lives, keeping it alive',
        'JavaScript copies all outer variables into each function',
        'count is stored on the prototype',
      ],
      correctIndex: 1,
      explanation:
        'Closures keep a live reference to variables in their enclosing scope. Even after `makeCounter` returns, the returned methods hold a reference to that scope, preventing `count` from being garbage-collected.',
    },
    // Hoisting
    {
      id: 'js-q-var-hoisting',
      category: 'javascript',
      subcategory: 'hoisting',
      difficulty: 'foundation',
      question: 'What does `console.log(x); var x = 5;` print?',
      options: ['5', 'ReferenceError', 'null', 'undefined'],
      correctIndex: 3,
      explanation:
        '`var` declarations are hoisted and initialised to `undefined` before any code runs. The assignment `x = 5` stays in place, so at the time of the log, `x` exists but is `undefined`.',
    },
    {
      id: 'js-q-tdz',
      category: 'javascript',
      subcategory: 'hoisting',
      difficulty: 'core',
      question: 'What happens when you access a `let` variable before its declaration line?',
      options: [
        'It returns undefined',
        'It throws a ReferenceError (Temporal Dead Zone)',
        'It returns null',
        'It silently creates a global',
      ],
      correctIndex: 1,
      explanation:
        '`let` and `const` are hoisted but placed in the Temporal Dead Zone. Any access before the declaration line throws a ReferenceError. The TDZ exists to catch use-before-declaration bugs loudly.',
    },
    {
      id: 'js-q-fn-hoisting',
      category: 'javascript',
      subcategory: 'hoisting',
      difficulty: 'foundation',
      question: 'Can you call a function declaration before its source line?',
      options: [
        'No  -  it throws ReferenceError',
        'Yes  -  function declarations are fully hoisted',
        'Only if declared with const',
        'Only in strict mode',
      ],
      correctIndex: 1,
      explanation:
        'Function declarations are hoisted entirely  -  both the name and body. You can call them anywhere in the same scope. Function expressions are NOT: the variable is hoisted as undefined, so calling it early throws a TypeError.',
    },
    // this
    {
      id: 'js-q-this-method',
      category: 'javascript',
      subcategory: 'this',
      difficulty: 'core',
      question: 'You extract a method: `const fn = obj.method; fn()`. What is `this` inside the call in strict mode?',
      options: ['obj', 'window/global', 'undefined', 'null'],
      correctIndex: 2,
      explanation:
        'When a method is called without a receiver (as a plain function), `this` is `undefined` in strict mode. The connection to `obj` is lost when the method is extracted. Use `bind`, an arrow wrapper, or call it as `obj.method()` to preserve the context.',
    },
    {
      id: 'js-q-bind',
      category: 'javascript',
      subcategory: 'this',
      difficulty: 'core',
      question: 'What does `fn.bind(ctx)` return?',
      options: [
        'The result of calling fn with ctx as this',
        'A new function permanently bound to ctx as this',
        'A Promise that resolves with fn\'s result',
        'fn with its prototype set to ctx',
      ],
      correctIndex: 1,
      explanation:
        '`bind` returns a **new function** with `this` permanently set to the provided context. It does not call the original function. Subsequent `call/apply/bind` cannot override the already-bound `this`.',
    },
    // Prototypes
    {
      id: 'js-q-prototype-chain',
      category: 'javascript',
      subcategory: 'prototypes',
      difficulty: 'core',
      question: 'When you access a property that does not exist on an object, what happens?',
      options: [
        'A TypeError is thrown immediately',
        'undefined is returned without further lookup',
        'JavaScript walks up the prototype chain',
        'JavaScript checks the global scope',
      ],
      correctIndex: 2,
      explanation:
        'JavaScript performs a prototype chain lookup. It checks the object, then its prototype, then that prototype\'s prototype, up to `Object.prototype`. Only if not found anywhere does it return `undefined`.',
    },
    {
      id: 'js-q-instanceof',
      category: 'javascript',
      subcategory: 'prototypes',
      difficulty: 'core',
      question: 'What does `instanceof` actually check?',
      options: [
        'Whether the object was created with `new`',
        'Whether the constructor\'s `.prototype` appears in the object\'s prototype chain',
        'Whether the object has the same properties as the constructor',
        'Whether `typeof obj === \'object\'`',
      ],
      correctIndex: 1,
      explanation:
        '`instanceof` walks the prototype chain checking if `Constructor.prototype` appears anywhere in it. This is why `dog instanceof Animal` is true even though `dog` was created with `new Dog`  -  Animal.prototype is in dog\'s chain.',
    },
    // Classes
    {
      id: 'js-q-class-sugar',
      category: 'javascript',
      subcategory: 'classes',
      difficulty: 'core',
      question: 'Where are methods defined inside a class body stored at runtime?',
      options: [
        'On each instance as own properties',
        'On the class\'s `.prototype` object, shared by all instances',
        'In a hidden closure',
        'In the global scope',
      ],
      correctIndex: 1,
      explanation:
        'Class syntax is syntactic sugar over prototypes. Methods go on `ClassName.prototype`, so they are shared  -  only one copy in memory regardless of how many instances exist. Properties assigned in the constructor are own properties on each instance.',
    },
    {
      id: 'js-q-private-fields',
      category: 'javascript',
      subcategory: 'classes',
      difficulty: 'core',
      question: 'What happens if you access a private field (`#field`) from outside the class?',
      options: [
        'undefined is returned',
        'A TypeError is thrown at runtime',
        'A SyntaxError is thrown at parse time',
        'null is returned',
      ],
      correctIndex: 2,
      explanation:
        'Private fields with `#` are enforced at the syntax level. Accessing `instance.#field` outside the class body is a SyntaxError  -  caught before the code even runs. This is stronger than the old convention of `_private`.',
    },
    // Error handling
    {
      id: 'js-q-finally',
      category: 'javascript',
      subcategory: 'error-handling',
      difficulty: 'foundation',
      question: 'When does a `finally` block run?',
      options: [
        'Only when no error is thrown',
        'Only when an error is caught',
        'Always  -  whether the try block succeeds, throws, or returns',
        'Only if explicitly called',
      ],
      correctIndex: 2,
      explanation:
        '`finally` always executes after the `try` and optional `catch`  -  even if the `try` block returns, or the `catch` block throws. It is the right place for cleanup like closing connections or releasing locks.',
    },
    {
      id: 'js-q-rethrow',
      category: 'javascript',
      subcategory: 'error-handling',
      difficulty: 'core',
      question: 'In a catch block, you only know how to handle `NotFoundError`. What should you do with other error types?',
      options: [
        'Silently ignore them',
        'Convert them to NotFoundError',
        'Re-throw them so they propagate to callers',
        'Log them and return null',
      ],
      correctIndex: 2,
      explanation:
        'Only catch errors you know how to handle. Re-throwing unknown errors (`throw error`) allows them to bubble up to a caller or global handler that may handle them correctly. Swallowing unknown errors hides bugs.',
    },
    // Event loop
    {
      id: 'js-q-eventloop',
      category: 'javascript',
      subcategory: 'event-loop',
      difficulty: 'core',
      question: 'A resolved Promise `.then` callback and a `setTimeout(fn, 0)` are scheduled in the same tick. Which runs first?',
      options: [
        'The setTimeout callback',
        'The promise callback',
        'Whichever was written first in the code',
        'They run at the same time',
      ],
      correctIndex: 1,
      explanation:
        'Promise callbacks are microtasks. After the current synchronous code finishes, the entire microtask queue is drained before the next macrotask (setTimeout) is processed. So the promise callback always runs first.',
      interviewTip: 'Microtasks (promises) beat macrotasks (timers) every single tick.',
    },
    {
      id: 'js-q-microtask-starvation',
      category: 'javascript',
      subcategory: 'event-loop',
      difficulty: 'expert',
      question: 'If microtasks keep scheduling new microtasks in a loop, what happens to macrotasks like `setTimeout`?',
      options: [
        'They run interleaved with microtasks',
        'They are cancelled',
        'They starve  -  the microtask queue never empties so macrotasks never run',
        'They run in a separate thread',
      ],
      correctIndex: 2,
      explanation:
        'The event loop drains the entire microtask queue before each macrotask. If microtasks perpetually enqueue more microtasks, the queue never empties and macrotasks (timers, I/O callbacks) are deferred indefinitely  -  a real production bug.',
    },
    // Promises
    {
      id: 'js-q-promise-all',
      category: 'javascript',
      subcategory: 'promises',
      difficulty: 'core',
      question: 'What does `Promise.all` do if one of the input promises rejects?',
      options: [
        'It waits for all to settle then reports failures',
        'It ignores the rejection and resolves with the rest',
        'It immediately rejects with that error',
        'It retries the rejected promise',
      ],
      correctIndex: 2,
      explanation:
        '`Promise.all` uses fail-fast semantics: the first rejection immediately rejects the whole result. Use `Promise.allSettled` when you want all results regardless of individual failures.',
      interviewTip: 'Promise.all = fail fast. Promise.allSettled = wait for all. Know both combinators.',
    },
    {
      id: 'js-q-promise-states',
      category: 'javascript',
      subcategory: 'promises',
      difficulty: 'foundation',
      question: 'Once a Promise is fulfilled, can it later become rejected?',
      options: [
        'Yes, if .catch() is called on it',
        'No  -  Promise state transitions are one-way: pending → fulfilled or pending → rejected',
        'Yes, after a timeout',
        'Only if created with new Promise()',
      ],
      correctIndex: 1,
      explanation:
        'A Promise\'s state is immutable once settled. Once fulfilled or rejected, it stays that way forever. Subsequent `.then`/`.catch` calls on the same promise always receive the same settled value.',
    },
    // async/await
    {
      id: 'js-q-async-return',
      category: 'javascript',
      subcategory: 'async-await',
      difficulty: 'foundation',
      question: 'What does an `async` function always return?',
      options: ['The raw value you return', 'A Promise', 'undefined', 'A generator object'],
      correctIndex: 1,
      explanation:
        'An `async` function always returns a Promise. If you `return 42`, the caller gets `Promise.resolve(42)`. If the function throws, the caller gets a rejected Promise. This makes async functions composable with `.then()` chains.',
    },
    {
      id: 'js-q-parallel-await',
      category: 'javascript',
      subcategory: 'async-await',
      difficulty: 'core',
      question: 'You write `const a = await fetchA(); const b = await fetchB();`. How do these execute?',
      options: [
        'In parallel  -  both fetches run at the same time',
        'Sequentially  -  fetchB starts only after fetchA completes',
        'In a worker thread',
        'fetchB is skipped if fetchA throws',
      ],
      correctIndex: 1,
      explanation:
        'Each `await` pauses the function until the awaited Promise settles. So `fetchB` does not start until `fetchA` finishes. For parallel execution, start both promises before awaiting: `const [a, b] = await Promise.all([fetchA(), fetchB()])`.',
    },
    // ES6+ features
    {
      id: 'js-q-destructuring',
      category: 'javascript',
      subcategory: 'es6',
      difficulty: 'foundation',
      question: 'What is the value of `b` after `const { a, b = 10 } = { a: 1 }`?',
      options: ['undefined', '10', '1', 'null'],
      correctIndex: 1,
      explanation:
        'Object destructuring supports default values that apply when the property is `undefined` (missing or explicitly set to `undefined`). Since `b` is not in the source object, it is `undefined` and the default `10` is used.',
    },
    {
      id: 'js-q-spread-rest',
      category: 'javascript',
      subcategory: 'es6',
      difficulty: 'foundation',
      question: 'What is the difference between spread (`...`) and rest parameters?',
      options: [
        'They are identical in every context',
        'Spread expands an iterable into positions; rest collects multiple arguments into an array',
        'Rest expands; spread collects',
        'Spread only works on objects; rest only works on arrays',
      ],
      correctIndex: 1,
      explanation:
        'Same syntax, opposite data flow: spread fans out (array → individual items in a call/literal), rest gathers (multiple arguments → single array parameter). Context determines which it is.',
    },
    // Array methods
    {
      id: 'js-q-reduce',
      category: 'javascript',
      subcategory: 'array-methods',
      difficulty: 'core',
      question: 'What does `[1, 2, 3, 4].reduce((acc, n) => acc + n, 0)` return?',
      options: ['[1, 2, 3, 4]', '10', '24', '0'],
      correctIndex: 1,
      explanation:
        '`reduce` accumulates a single value. Starting with `acc = 0`, it adds each element: 0+1=1, 1+2=3, 3+3=6, 6+4=10. The second argument to reduce (0) is the initial accumulator value.',
    },
    {
      id: 'js-q-sort-numbers',
      category: 'javascript',
      subcategory: 'array-methods',
      difficulty: 'core',
      question: 'What does `[10, 9, 2, 1].sort()` return?',
      options: ['[1, 2, 9, 10]', '[10, 9, 2, 1]', '[1, 10, 2, 9]', '[2, 1, 9, 10]'],
      correctIndex: 2,
      explanation:
        'The default `sort()` converts elements to strings and compares lexicographically  -  so "10" comes before "2". For numeric sort, provide a comparator: `.sort((a, b) => a - b)` for ascending.',
    },
    {
      id: 'js-q-map-filter',
      category: 'javascript',
      subcategory: 'array-methods',
      difficulty: 'foundation',
      question: 'Which array method creates a new array by keeping only elements that pass a test?',
      options: ['map', 'find', 'filter', 'reduce'],
      correctIndex: 2,
      explanation:
        '`filter` returns a new array containing only elements for which the callback returns truthy. `map` transforms all elements. `find` returns the first matching element (not an array). `reduce` folds to a single value.',
    },
    // Object methods
    {
      id: 'js-q-object-freeze',
      category: 'javascript',
      subcategory: 'object-methods',
      difficulty: 'core',
      question: '`Object.freeze(obj)` is called. A nested object `obj.nested.value` is then modified. What happens?',
      options: [
        'TypeError  -  freeze prevents all modifications',
        'The nested modification succeeds  -  freeze is shallow',
        'ReferenceError',
        'The modification is silently ignored at the top level only',
      ],
      correctIndex: 1,
      explanation:
        '`Object.freeze` is **shallow**  -  it freezes the top-level properties of the object but not nested objects. `obj.nested` is a reference, and while you cannot reassign that reference, the object it points to is not frozen.',
    },
    // Map/Set
    {
      id: 'js-q-map-vs-object',
      category: 'javascript',
      subcategory: 'map-set',
      difficulty: 'core',
      question: 'Which is a key advantage of Map over a plain object as a key-value store?',
      options: [
        'Map has better JSON serialization',
        'Map keys can be any type including objects and functions',
        'Objects cannot store strings as keys',
        'Map is faster for string keys',
      ],
      correctIndex: 1,
      explanation:
        'Plain object keys must be strings or Symbols (other types are coerced to strings). Map accepts any value as a key  -  objects, functions, numbers  -  and preserves their identity. Map also has a built-in `size` property and maintains insertion order.',
    },
    {
      id: 'js-q-set-dedup',
      category: 'javascript',
      subcategory: 'map-set',
      difficulty: 'foundation',
      question: 'What is the quickest way to remove duplicates from an array of primitives?',
      options: [
        'arr.filter((v, i) => arr.indexOf(v) === i)',
        '[...new Set(arr)]',
        'arr.reduce((a, b) => a.includes(b) ? a : [...a, b], [])',
        'Array.from(new Map(arr.map(v => [v, v])).values())',
      ],
      correctIndex: 1,
      explanation:
        '`new Set(arr)` creates a Set of unique values (duplicates silently dropped), and spreading it back into `[...]` gives a deduplicated array. It\'s idiomatic, O(n) average, and a one-liner.',
    },
    // Generators
    {
      id: 'js-q-generator-call',
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
        'Calling a generator function does not run any of the function body  -  it returns a generator/iterator object. The body only runs when you call `.next()`, which runs until the next `yield` and pauses there.',
    },
    // Modules
    {
      id: 'js-q-esm-cjs',
      category: 'javascript',
      subcategory: 'modules',
      difficulty: 'core',
      question: 'What is a key difference between ES module `import` and CommonJS `require`?',
      options: [
        'ESM only works in browsers; CJS only in Node.js',
        'ESM imports are static and resolved at parse time; require is dynamic and runs at runtime',
        'CJS supports named exports; ESM does not',
        'They are functionally identical',
      ],
      correctIndex: 1,
      explanation:
        'ESM imports are hoisted and resolved statically before code runs  -  enabling tree-shaking and circular dependency detection at build time. CommonJS `require` is synchronous and runs at runtime, allowing conditional and dynamic loading.',
    },
    {
      id: 'js-q-dynamic-import',
      category: 'javascript',
      subcategory: 'modules',
      difficulty: 'core',
      question: 'What does `import()` (dynamic import) return?',
      options: [
        'The module\'s default export directly',
        'A Promise that resolves to the module namespace object',
        'A synchronous module reference',
        'undefined until the module loads',
      ],
      correctIndex: 1,
      explanation:
        'Dynamic `import()` is an async operation that returns a Promise resolving to the module namespace object (containing all exports). Use `const { default: Cls } = await import(...)` or `const mod = await import(...)` then access `mod.namedExport`.',
    },
    // Patterns
    {
      id: 'js-q-debounce-vs-throttle',
      category: 'javascript',
      subcategory: 'patterns',
      difficulty: 'core',
      question: 'You have a search input that makes API calls. You want to call the API only after the user stops typing for 300ms. Which technique?',
      options: [
        'Throttle  -  fires at most once per 300ms',
        'Debounce  -  delays until 300ms of inactivity',
        'Memoize  -  caches the last result',
        'setInterval with 300ms delay',
      ],
      correctIndex: 1,
      explanation:
        'Debounce waits for a pause in activity before firing. Each new keystroke resets the timer, so the API is called only after 300ms with no new input. Throttle would still fire periodically while the user is typing.',
    },
    {
      id: 'js-q-memory-leak',
      category: 'javascript',
      subcategory: 'patterns',
      difficulty: 'expert',
      question: 'Which pattern causes a memory leak in a long-running Node.js server?',
      options: [
        'Using const instead of let',
        'An event listener added to an emitter but never removed, keeping the handler and its closure in memory',
        'Using async/await instead of promises',
        'Returning objects from functions',
      ],
      correctIndex: 1,
      explanation:
        'Event listeners hold strong references to their handler functions and any variables in their closures. If listeners are added repeatedly (e.g. per request) but never removed with `removeListener/off`, the handlers accumulate and are never garbage-collected.',
    },
    {
      id: 'js-q-weakmap-use',
      category: 'javascript',
      subcategory: 'map-set',
      difficulty: 'expert',
      question: 'Why is WeakMap preferred over Map for caching values associated with DOM elements or objects?',
      options: [
        'WeakMap is faster than Map',
        'WeakMap allows string keys',
        'WeakMap holds keys weakly  -  when the key object is GC\'d, the entry is automatically removed, preventing memory leaks',
        'WeakMap is iterable while Map is not',
      ],
      correctIndex: 2,
      explanation:
        'With a regular Map, the cache entry keeps the key (DOM element/object) alive even after all other references are gone. WeakMap holds its keys weakly, so once the key object has no other references, it can be garbage-collected and the entry is cleaned up automatically.',
    },
    // String Methods
    {
      id: 'js-q-slice-negative',
      category: 'javascript',
      subcategory: 'string-methods',
      difficulty: 'foundation',
      question: 'What does `"hello".slice(-3)` return?',
      options: ['"hel"', '"llo"', '"ello"', 'TypeError'],
      correctIndex: 1,
      explanation:
        '`slice` supports negative indices counting from the end. `-3` means start at index `length - 3 = 2`, so it returns the last 3 characters: `"llo"`.',
    },
    {
      id: 'js-q-includes-nan',
      category: 'javascript',
      subcategory: 'string-methods',
      difficulty: 'core',
      question: 'Why should you prefer `Array.prototype.includes(NaN)` over `indexOf(NaN)`?',
      options: [
        'includes is faster',
        'includes uses SameValueZero equality which treats NaN === NaN, while indexOf uses === where NaN !== NaN',
        'indexOf throws on NaN',
        'They behave identically for all values',
      ],
      correctIndex: 1,
      explanation:
        '`indexOf` uses strict equality (`===`) where `NaN !== NaN`, so it always returns -1 for NaN. `includes` uses SameValueZero which correctly identifies NaN. This was a key motivation for adding `includes` in ES2016.',
    },
    {
      id: 'js-q-replaceall',
      category: 'javascript',
      subcategory: 'string-methods',
      difficulty: 'foundation',
      question: 'What does `"aabbcc".replace("b", "x")` return?',
      options: ['"aaxxcc"', '"axbcc"', '"aaxxcc"', '"aaxbcc"'],
      correctIndex: 1,
      explanation:
        '`replace` with a string pattern only replaces the **first** occurrence. To replace all occurrences use `replaceAll("b", "x")` (ES2021) or a regex with the `g` flag: `replace(/b/g, "x")`.',
    },
    // Regex
    {
      id: 'js-q-regex-greedy',
      category: 'javascript',
      subcategory: 'regex',
      difficulty: 'core',
      question: 'The pattern `/<.+>/` applied to `"<b>bold</b>"` matches what?',
      options: ['"<b>"', '"bold"', '"<b>bold</b>"', '"<b>bold</b></b>"'],
      correctIndex: 2,
      explanation:
        'Quantifiers are **greedy** by default  -  they match as much as possible. `<.+>` matches from the first `<` to the last `>`, consuming `<b>bold</b>`. Use `<.+?>` (lazy) to match only `<b>`.',
    },
    {
      id: 'js-q-regex-groups',
      category: 'javascript',
      subcategory: 'regex',
      difficulty: 'core',
      question: 'What is the purpose of `(?:...)` in a regular expression?',
      options: [
        'Named capture group',
        'Lookahead assertion',
        'Non-capturing group  -  groups without storing the match',
        'Negative lookahead',
      ],
      correctIndex: 2,
      explanation:
        '`(?:...)` is a non-capturing group. It groups expressions for quantifiers or alternation but does not create a numbered capture group in the match result. Use it when you need grouping but not the overhead of capture.',
    },
    {
      id: 'js-q-regex-lookahead',
      category: 'javascript',
      subcategory: 'regex',
      difficulty: 'expert',
      question: 'The regex `/\\d+(?= dollars)/` is applied to "100 dollars". What does it match?',
      options: ['"100 dollars"', '"dollars"', '"100"', 'No match'],
      correctIndex: 2,
      explanation:
        '`(?= dollars)` is a **positive lookahead**  -  it asserts that the match must be followed by " dollars" but does not include it in the match. So `\\d+` matches "100" and the lookahead confirms " dollars" follows without consuming it.',
    },
    // Execution Context
    {
      id: 'js-q-call-stack',
      category: 'javascript',
      subcategory: 'execution-context',
      difficulty: 'core',
      question: 'What error occurs when the call stack exceeds its maximum depth?',
      options: ['StackError', 'MemoryError', 'RangeError: Maximum call stack size exceeded', 'RecursionError'],
      correctIndex: 2,
      explanation:
        'Infinite or excessively deep recursion causes the call stack to overflow. JavaScript throws a `RangeError` with the message "Maximum call stack size exceeded". The limit is typically ~10,000 frames in V8.',
    },
    {
      id: 'js-q-lexical-scope',
      category: 'javascript',
      subcategory: 'execution-context',
      difficulty: 'core',
      question: 'JavaScript uses lexical (static) scope. What does this mean?',
      options: [
        'Variables are resolved based on where the function is called',
        'Variables are resolved based on where the function is defined in the source code',
        'Every function creates its own global scope',
        'Scope is determined at runtime, not at parse time',
      ],
      correctIndex: 1,
      explanation:
        'Lexical scope means a function\'s scope chain is determined by where it is **written**, not where it is **called**. A function always sees the variables in the scope where it was defined, regardless of how or where it is invoked.',
    },
    // ES2016/2017
    {
      id: 'js-q-exponent',
      category: 'javascript',
      subcategory: 'es2016',
      difficulty: 'foundation',
      question: 'What does `2 ** 10` evaluate to?',
      options: ['20', '1024', '210', '12'],
      correctIndex: 1,
      explanation:
        '`**` is the exponentiation operator (ES2016). `2 ** 10` is 2 to the power of 10 = 1024. It is equivalent to `Math.pow(2, 10)`.',
    },
    {
      id: 'js-q-padstart',
      category: 'javascript',
      subcategory: 'es2017',
      difficulty: 'foundation',
      question: 'What does `"7".padStart(3, "0")` return?',
      options: ['"7"', '"007"', '"700"', '"0007"'],
      correctIndex: 1,
      explanation:
        '`padStart(targetLength, padString)` pads the start of the string until it reaches the target length. `"7"` padded to length 3 with `"0"` becomes `"007"`. Useful for formatting IDs, times, and fixed-width columns.',
    },
    // ES2018/2019
    {
      id: 'js-q-finally-value',
      category: 'javascript',
      subcategory: 'es2018',
      difficulty: 'core',
      question: '`Promise.resolve(42).finally(() => 99).then(v => console.log(v))`  -  what logs?',
      options: ['99', '42', 'undefined', 'TypeError'],
      correctIndex: 1,
      explanation:
        '`finally` does not change the promise\'s resolved value  -  its return value is ignored. The `42` passes through to the next `.then`. Only if `finally` throws does it change the outcome (replacing the current value/rejection with the thrown error).',
    },
    {
      id: 'js-q-object-rest',
      category: 'javascript',
      subcategory: 'es2018',
      difficulty: 'foundation',
      question: 'Given `const { a, ...rest } = { a: 1, b: 2, c: 3 }`, what is `rest`?',
      options: ['{ a: 1 }', '{ b: 2, c: 3 }', '[2, 3]', '{ b: 2 }'],
      correctIndex: 1,
      explanation:
        'Object rest syntax collects all remaining **own enumerable** properties not explicitly destructured. Since `a` is taken, `rest` gets `{ b: 2, c: 3 }`. Rest must be the last item in a destructuring pattern.',
    },
    {
      id: 'js-q-flat',
      category: 'javascript',
      subcategory: 'es2019',
      difficulty: 'foundation',
      question: 'What does `[1, [2, [3]]].flat()` return?',
      options: ['[1, 2, 3]', '[1, 2, [3]]', '[1, [2, 3]]', '[[1, 2, 3]]'],
      correctIndex: 1,
      explanation:
        '`flat()` with no argument defaults to depth 1  -  it flattens one level. `[1, [2, [3]]]` becomes `[1, 2, [3]]`. Use `flat(2)` to get `[1, 2, 3]`, or `flat(Infinity)` for arbitrary depth.',
    },
    {
      id: 'js-q-optional-catch',
      category: 'javascript',
      subcategory: 'es2019',
      difficulty: 'foundation',
      question: 'Which is valid ES2019+ syntax?',
      options: [
        'try { } catch { }',
        'try { } catch() { }',
        'try { } finally catch { }',
        'try { } catch(e = null) { }',
      ],
      correctIndex: 0,
      explanation:
        'ES2019 made the catch binding parameter optional. You can write `catch { }` without naming the error variable when you don\'t need it. Previously `catch (e) { }` was always required.',
    },
    // ES2020/2021
    {
      id: 'js-q-bigint',
      category: 'javascript',
      subcategory: 'es2020',
      difficulty: 'core',
      question: 'What happens when you try to add a BigInt and a regular Number: `1n + 1`?',
      options: ['2n', '2', 'TypeError', 'NaN'],
      correctIndex: 2,
      explanation:
        'You cannot mix BigInt and Number in arithmetic operations  -  JavaScript throws a `TypeError`. You must explicitly convert: `1n + BigInt(1)` or `Number(1n) + 1`. This prevents accidental precision loss.',
    },
    {
      id: 'js-q-promise-any',
      category: 'javascript',
      subcategory: 'es2021',
      difficulty: 'core',
      question: '`Promise.any([p1, p2, p3])`  -  when does it reject?',
      options: [
        'When the first promise rejects',
        'When any promise rejects',
        'Only when ALL promises reject',
        'It never rejects',
      ],
      correctIndex: 2,
      explanation:
        '`Promise.any` resolves with the **first fulfilled** promise. It only rejects if **all** input promises reject, and in that case it rejects with an `AggregateError` containing all rejection reasons. It is the opposite of `Promise.all`.',
    },
    {
      id: 'js-q-numeric-sep',
      category: 'javascript',
      subcategory: 'es2021',
      difficulty: 'foundation',
      question: 'What is the value of `const n = 1_000_000`?',
      options: ['1', '1000', '1000000', 'SyntaxError'],
      correctIndex: 2,
      explanation:
        'Numeric separators (`_`) are purely visual aids introduced in ES2021. They are ignored by the engine  -  `1_000_000` is exactly `1000000`. They can be placed anywhere in a numeric literal for readability.',
    },
    // ES2022-2024
    {
      id: 'js-q-at-method',
      category: 'javascript',
      subcategory: 'es2022',
      difficulty: 'foundation',
      question: 'What does `[10, 20, 30].at(-1)` return?',
      options: ['10', '20', '30', 'undefined'],
      correctIndex: 2,
      explanation:
        '`Array.prototype.at()` (ES2022) supports negative indices. `-1` refers to the last element, `-2` to second-to-last, etc. This is cleaner than `arr[arr.length - 1]`. It also works on strings.',
    },
    {
      id: 'js-q-error-cause',
      category: 'javascript',
      subcategory: 'es2022',
      difficulty: 'core',
      question: 'What is `Error.cause` used for?',
      options: [
        'Setting the error message',
        'Chaining errors  -  preserving the original error that caused a higher-level error',
        'Categorising errors by type',
        'Suppressing error stack traces',
      ],
      correctIndex: 1,
      explanation:
        '`new Error("High-level message", { cause: originalError })` lets you wrap errors while preserving the original. The `cause` property holds the original error, enabling full error chain inspection for debugging.',
    },
    {
      id: 'js-q-toreversed',
      category: 'javascript',
      subcategory: 'es2023',
      difficulty: 'core',
      question: 'What is the key difference between `arr.reverse()` and `arr.toReversed()`?',
      options: [
        'toReversed is faster',
        'reverse() mutates the original array; toReversed() returns a new reversed array',
        'toReversed only works on sorted arrays',
        'They are identical',
      ],
      correctIndex: 1,
      explanation:
        '`reverse()` mutates in place and returns the same array. `toReversed()` (ES2023) returns a **new** reversed array, leaving the original unchanged. Same pattern applies to `toSorted()`, `toSpliced()`, and `with()`.',
    },
    {
      id: 'js-q-group-by',
      category: 'javascript',
      subcategory: 'es2024',
      difficulty: 'core',
      question: 'What does `Object.groupBy([1,2,3,4], n => n % 2 === 0 ? "even" : "odd")` return?',
      options: [
        '{ even: 2, odd: 2 }',
        '{ even: [2, 4], odd: [1, 3] }',
        '[[1,3], [2,4]]',
        'Map { "even" => [2,4], "odd" => [1,3] }',
      ],
      correctIndex: 1,
      explanation:
        '`Object.groupBy` (ES2024) groups array elements by a key returned from the callback function. Each key maps to an array of all elements that returned that key. Use `Map.groupBy` when you need non-string keys.',
    },
    // Proxy & Reflect
    {
      id: 'js-q-proxy-trap',
      category: 'javascript',
      subcategory: 'proxy-reflect',
      difficulty: 'expert',
      question: 'Which Proxy trap intercepts `prop in proxy` operations?',
      options: ['get', 'has', 'includes', 'ownKeys'],
      correctIndex: 1,
      explanation:
        'The `has` trap intercepts the `in` operator. The `get` trap intercepts property reads. `ownKeys` intercepts `Object.keys()` and `for...in`. There is no `includes` trap.',
    },
    {
      id: 'js-q-reflect-use',
      category: 'javascript',
      subcategory: 'proxy-reflect',
      difficulty: 'expert',
      question: 'Why should you use `Reflect.get(target, prop, receiver)` inside a Proxy `get` trap instead of just `target[prop]`?',
      options: [
        'Reflect.get is faster',
        'Reflect.get correctly passes the receiver so getters on the target work with the right `this`',
        'target[prop] would trigger the proxy recursively',
        'Reflect.get prevents TypeError',
      ],
      correctIndex: 1,
      explanation:
        'When an object has a getter, `target[prop]` calls the getter with `this = target`, not the proxy. `Reflect.get(target, prop, receiver)` passes the `receiver` (the proxy itself) as `this`, making inherited getters work correctly in proxied objects.',
    },
    // Functional Programming
    {
      id: 'js-q-pure-function',
      category: 'javascript',
      subcategory: 'functional',
      difficulty: 'core',
      question: 'Which of these is a pure function?',
      options: [
        'function rand() { return Math.random(); }',
        'function log(x) { console.log(x); return x; }',
        'function add(a, b) { return a + b; }',
        'let count = 0; function inc() { return ++count; }',
      ],
      correctIndex: 2,
      explanation:
        'A pure function always returns the same output for the same input and has no side effects. `add(a, b)` is deterministic and only depends on its arguments. `rand()` is non-deterministic, `log()` has a side effect (console output), and `inc()` reads/writes external state.',
    },
    {
      id: 'js-q-compose-vs-pipe',
      category: 'javascript',
      subcategory: 'functional',
      difficulty: 'core',
      question: 'In functional programming, `compose(f, g)(x)` vs `pipe(f, g)(x)`  -  what is the difference?',
      options: [
        'compose and pipe are identical',
        'compose applies functions right-to-left (g then f); pipe applies left-to-right (f then g)',
        'compose applies functions left-to-right; pipe applies right-to-left',
        'compose runs functions in parallel; pipe runs them sequentially',
      ],
      correctIndex: 1,
      explanation:
        '`compose(f, g)(x)` = `f(g(x))`  -  right to left (mathematical notation). `pipe(f, g)(x)` = `g(f(x))`  -  left to right (data flows in reading order). Pipe is often more readable in JavaScript code.',
    },
    // Design Patterns
    {
      id: 'js-q-singleton-esm',
      category: 'javascript',
      subcategory: 'design-patterns',
      difficulty: 'core',
      question: 'What is the idiomatic way to implement a Singleton in ES modules?',
      options: [
        'Use a static class with a getInstance() method',
        'Export an instance directly  -  the module cache ensures it is created once',
        'Use Object.freeze on the constructor',
        'Use a global variable',
      ],
      correctIndex: 1,
      explanation:
        'ES modules are cached after first load  -  `import` the same module twice and you get the same module object. Simply `export const db = new Database()` creates the instance once. The module cache IS the singleton pattern.',
    },
    {
      id: 'js-q-observer-pattern',
      category: 'javascript',
      subcategory: 'design-patterns',
      difficulty: 'core',
      question: 'The Observer pattern and Pub/Sub pattern are related. What is the key distinction?',
      options: [
        'They are identical',
        'Observer: subscribers know the publisher directly; Pub/Sub: an event bus decouples publishers from subscribers',
        'Observer is for async events; Pub/Sub is synchronous',
        'Pub/Sub requires a database; Observer does not',
      ],
      correctIndex: 1,
      explanation:
        'In classic Observer, subjects hold references to observers (tight coupling). In Pub/Sub, an event bus sits between them  -  publishers emit to the bus, subscribers listen from the bus. Neither knows about the other, enabling looser coupling.',
    },
    // Recursion
    {
      id: 'js-q-base-case',
      category: 'javascript',
      subcategory: 'recursion',
      difficulty: 'foundation',
      question: 'What happens if a recursive function has no base case?',
      options: [
        'It returns undefined',
        'It runs once then stops',
        'It calls itself until the call stack overflows with a RangeError',
        'It throws a SyntaxError',
      ],
      correctIndex: 2,
      explanation:
        'Without a base case, recursion never stops. Each call adds a frame to the call stack until it exceeds the maximum depth (~10,000 in V8), causing a `RangeError: Maximum call stack size exceeded`.',
    },
    {
      id: 'js-q-tail-call',
      category: 'javascript',
      subcategory: 'recursion',
      difficulty: 'expert',
      question: 'Which recursive function is tail-recursive?',
      options: [
        'function f(n) { return n <= 1 ? 1 : n * f(n-1); }',
        'function f(n, acc = 1) { return n <= 1 ? acc : f(n-1, n * acc); }',
        'function f(n) { return f(n-1) + f(n-2); }',
        'function f(n) { return [n, ...f(n-1)]; }',
      ],
      correctIndex: 1,
      explanation:
        'A tail call is the very last operation before returning. In option B, the recursive call `f(n-1, n * acc)` IS the last operation  -  nothing happens after it returns. In option A, the result is multiplied by `n` after the call returns, so it is NOT tail-recursive.',
    },
    // Date & JSON
    {
      id: 'js-q-date-month',
      category: 'javascript',
      subcategory: 'date-json',
      difficulty: 'foundation',
      question: 'What does `new Date(2024, 0, 15).getMonth()` return?',
      options: ['1', '0', '15', 'January'],
      correctIndex: 1,
      explanation:
        'JavaScript months are **0-indexed**: January = 0, February = 1, ..., December = 11. This is a famous footgun. `new Date(2024, 0, 15)` creates January 15, 2024, and `getMonth()` returns `0`.',
      interviewTip: 'Always remember: JS months are 0-indexed. If you see a date bug, check this first.',
    },
    {
      id: 'js-q-json-loses',
      category: 'javascript',
      subcategory: 'date-json',
      difficulty: 'core',
      question: 'Which value is SILENTLY DROPPED when you `JSON.stringify({ fn: () => {}, name: "Alice" })`?',
      options: ['"Alice"', 'The fn property', 'Nothing is dropped', 'The entire object'],
      correctIndex: 1,
      explanation:
        '`JSON.stringify` silently omits properties with `undefined`, function, or Symbol values. The `fn` key disappears from the output entirely. Other values dropped/changed: `undefined` in arrays becomes `null`, `NaN`/`Infinity` become `null`, `Date` becomes an ISO string.',
    },
    // Memory & GC
    {
      id: 'js-q-gc-algorithm',
      category: 'javascript',
      subcategory: 'memory',
      difficulty: 'expert',
      question: 'What is the main advantage of mark-and-sweep over reference counting for garbage collection?',
      options: [
        'Mark-and-sweep is always faster',
        'Mark-and-sweep correctly handles circular references; reference counting leaks them',
        'Mark-and-sweep uses less memory',
        'Reference counting cannot track objects',
      ],
      correctIndex: 1,
      explanation:
        'Reference counting leaks memory when objects reference each other (A → B, B → A) even if nothing outside the cycle references them  -  the counts never reach zero. Mark-and-sweep starts from GC roots and marks all **reachable** objects, so cycles that have no outside references are correctly collected.',
    },
    {
      id: 'js-q-stack-heap',
      category: 'javascript',
      subcategory: 'memory',
      difficulty: 'core',
      question: 'When you write `let obj = { a: 1 }`, what is stored on the stack vs the heap?',
      options: [
        'The entire object { a: 1 } is on the stack',
        'Everything is on the heap',
        'A reference (pointer) to the object is on the stack; the object { a: 1 } lives on the heap',
        'The key "a" is on the stack; the value 1 is on the heap',
      ],
      correctIndex: 2,
      explanation:
        'Primitives and references live on the stack; objects live on the heap. `obj` is a variable holding a reference (memory address) on the stack. The actual `{ a: 1 }` object is allocated on the heap. This is why two variables can reference the same object.',
    },
    // Numbers & Precision
    {
      id: 'js-q-float-precision',
      category: 'javascript',
      subcategory: 'numbers',
      difficulty: 'core',
      question: 'Why does `0.1 + 0.2 === 0.3` evaluate to `false`?',
      options: [
        'It is a bug specific to JavaScript',
        'JavaScript rounds all decimals down',
        '0.1 and 0.2 cannot be represented exactly in IEEE 754 binary floating-point, so their sum is slightly off',
        '=== does not work with decimals',
      ],
      correctIndex: 2,
      explanation:
        'Numbers are 64-bit IEEE 754 floats. Decimals like 0.1 have no exact binary representation, so `0.1 + 0.2` yields `0.30000000000000004`. This affects every language using IEEE 754. Compare with an epsilon tolerance, and use integer cents or a decimal library for money.',
      interviewTip: 'For fintech: never store money as floats. Use integer cents or a decimal library.',
    },
    {
      id: 'js-q-money-storage',
      category: 'javascript',
      subcategory: 'numbers',
      difficulty: 'core',
      question: 'What is the recommended way to store monetary values in a fintech backend?',
      options: [
        'As floating-point dollars (e.g. 10.99)',
        'As integer minor units / cents (e.g. 1099), BigInt, or a decimal library',
        'As strings only',
        'As Number with toFixed(2) applied',
      ],
      correctIndex: 1,
      explanation:
        'Floating-point cannot represent decimal money exactly, leading to rounding errors that accumulate. Store money as integer cents (1099 = €10.99) for exact integer arithmetic, use BigInt for very large values like crypto wei, or use a decimal library (decimal.js) for arbitrary precision.',
    },
    {
      id: 'js-q-number-isnan',
      category: 'javascript',
      subcategory: 'numbers',
      difficulty: 'core',
      question: 'Why prefer `Number.isNaN(x)` over the global `isNaN(x)`?',
      options: [
        'Number.isNaN is faster',
        'The global isNaN coerces its argument first, so isNaN("foo") is true; Number.isNaN does not coerce',
        'They are identical',
        'Number.isNaN works on strings only',
      ],
      correctIndex: 1,
      explanation:
        'Global `isNaN` coerces to number first: `isNaN("foo")` is `true` because `Number("foo")` is `NaN`. `Number.isNaN` only returns true for the actual `NaN` value without coercion, making it the safe choice.',
    },
    {
      id: 'js-q-parseint-radix',
      category: 'javascript',
      subcategory: 'numbers',
      difficulty: 'foundation',
      question: 'What does `parseInt("11", 2)` return?',
      options: ['11', '2', '3', 'NaN'],
      correctIndex: 2,
      explanation:
        'The second argument is the radix (base). `parseInt("11", 2)` parses "11" as binary: 1×2 + 1 = 3. Always specify the radix to avoid surprises  -  without it, strings starting with "0x" are treated as hex.',
    },
    // Type Checking
    {
      id: 'js-q-array-isarray',
      category: 'javascript',
      subcategory: 'type-checking',
      difficulty: 'core',
      question: 'What is the correct way to check if a value is an array?',
      options: [
        'typeof value === "array"',
        'value instanceof Object',
        'Array.isArray(value)',
        'value.length !== undefined',
      ],
      correctIndex: 2,
      explanation:
        '`typeof []` returns "object", not "array". `Array.isArray()` is the reliable check and works even across different execution contexts (iframes, worker realms) where `instanceof Array` would fail because each realm has its own Array constructor.',
    },
    {
      id: 'js-q-tostring-tag',
      category: 'javascript',
      subcategory: 'type-checking',
      difficulty: 'expert',
      question: 'What does `Object.prototype.toString.call(new Date())` return?',
      options: ['"[object Object]"', '"[object Date]"', '"Date"', '"object"'],
      correctIndex: 1,
      explanation:
        'This technique reads the internal type tag, returning "[object Date]" for dates, "[object Array]" for arrays, "[object Null]" for null, etc. Slicing out the tag (`.slice(8, -1)`) gives a reliable type string that distinguishes object subtypes  -  something typeof cannot do.',
    },
    {
      id: 'js-q-object-is',
      category: 'javascript',
      subcategory: 'type-checking',
      difficulty: 'expert',
      question: 'How does `Object.is(NaN, NaN)` differ from `NaN === NaN`?',
      options: [
        'They both return false',
        'Object.is(NaN, NaN) is true, while NaN === NaN is false',
        'They both return true',
        'Object.is throws on NaN',
      ],
      correctIndex: 1,
      explanation:
        '`Object.is` uses SameValue equality: `Object.is(NaN, NaN)` is `true` and `Object.is(0, -0)` is `false`. Strict equality does the opposite: `NaN === NaN` is `false` and `0 === -0` is `true`. React uses Object.is-style comparison for state.',
    },
    {
      id: 'js-q-loose-null',
      category: 'javascript',
      subcategory: 'type-checking',
      difficulty: 'core',
      question: 'What is the one accepted use of loose equality (`==`)?',
      options: [
        'Comparing numbers and strings',
        'Checking `value == null` to match both null and undefined in one expression',
        'Comparing arrays',
        'There is never a good use',
      ],
      correctIndex: 1,
      explanation:
        '`value == null` is `true` for both `null` and `undefined` (and nothing else), making it a concise null-ish check. This is the one widely-accepted `==` idiom. For everything else, use `===` to avoid coercion surprises.',
    },
    // Bitwise
    {
      id: 'js-q-bitwise-flags',
      category: 'javascript',
      subcategory: 'bitwise',
      difficulty: 'core',
      question: 'Given `let perms = READ | WRITE` (where READ=1, WRITE=2), how do you check if WRITE is set?',
      options: [
        '(perms | WRITE) !== 0',
        '(perms & WRITE) !== 0',
        'perms === WRITE',
        'perms ^ WRITE',
      ],
      correctIndex: 1,
      explanation:
        'Use AND (`&`) to test a flag: `(perms & WRITE) !== 0` is true only if the WRITE bit is set. OR (`|`) is used to combine/add flags, XOR (`^`) toggles, and AND NOT (`& ~`) removes. This is how Unix permissions and many flag systems work.',
    },
    {
      id: 'js-q-bitwise-power2',
      category: 'javascript',
      subcategory: 'bitwise',
      difficulty: 'expert',
      question: 'What does the expression `(n & (n - 1)) === 0` test for (assuming n > 0)?',
      options: [
        'Whether n is even',
        'Whether n is negative',
        'Whether n is a power of 2',
        'Whether n is prime',
      ],
      correctIndex: 2,
      explanation:
        'A power of 2 has exactly one bit set (e.g. 8 = 1000). Subtracting 1 flips that bit and sets all lower bits (7 = 0111). ANDing them gives 0 only for powers of 2. A classic bit-manipulation trick.',
    },
    // Strict Mode
    {
      id: 'js-q-strict-globals',
      category: 'javascript',
      subcategory: 'strict-mode',
      difficulty: 'core',
      question: 'In strict mode, what happens when you assign to an undeclared variable: `x = 10`?',
      options: [
        'It creates a global variable',
        'It throws a ReferenceError',
        'It is silently ignored',
        'It creates a local variable',
      ],
      correctIndex: 1,
      explanation:
        'Strict mode throws a ReferenceError for assignment to undeclared variables, catching a common bug. Without strict mode, `x = 10` would silently create a global variable, often leading to hard-to-trace issues. ES modules and class bodies are always strict.',
    },
    {
      id: 'js-q-strict-this',
      category: 'javascript',
      subcategory: 'strict-mode',
      difficulty: 'core',
      question: 'In strict mode, what is `this` inside a plain function call `fn()`?',
      options: ['The global object', 'undefined', 'An empty object', 'The function itself'],
      correctIndex: 1,
      explanation:
        'In strict mode, `this` is `undefined` in a plain function call (not the global object as in sloppy mode). This prevents accidental modification of the global object through unbound method calls and surfaces bugs where `this` was expected to be an object.',
    },
    // Timers
    {
      id: 'js-q-settimeout-zero',
      category: 'javascript',
      subcategory: 'timers',
      difficulty: 'core',
      question: 'A `setTimeout(fn, 0)` and a `queueMicrotask(fn)` are both scheduled in the same synchronous block. Which runs first?',
      options: [
        'The setTimeout callback',
        'The queueMicrotask callback',
        'Whichever was scheduled first',
        'They run simultaneously',
      ],
      correctIndex: 1,
      explanation:
        'Microtasks (queueMicrotask, promise callbacks) run after the current synchronous code but before any macrotask (including setTimeout with 0 delay). The entire microtask queue drains before the next macrotask, so queueMicrotask always wins.',
    },
    {
      id: 'js-q-abortcontroller',
      category: 'javascript',
      subcategory: 'timers',
      difficulty: 'core',
      question: 'What is AbortController used for?',
      options: [
        'Pausing the event loop',
        'Cancelling async operations like fetch by signalling abort through an AbortSignal',
        'Aborting the entire Node process',
        'Catching unhandled rejections',
      ],
      correctIndex: 1,
      explanation:
        'AbortController provides a standard cancellation mechanism. You pass its `signal` to abortable operations (fetch, streams, timers), then call `controller.abort()` to cancel them. The operation rejects with an AbortError. `AbortSignal.timeout(ms)` creates an auto-aborting signal.',
    },
    // Concurrency
    {
      id: 'js-q-promise-all-concurrency',
      category: 'javascript',
      subcategory: 'concurrency',
      difficulty: 'core',
      question: 'You need to fetch 10,000 URLs without overwhelming the server. Why is `Promise.all(urls.map(fetch))` a bad choice?',
      options: [
        'Promise.all is deprecated',
        'It fires all 10,000 requests simultaneously, exhausting connections and hitting rate limits',
        'fetch cannot be used with map',
        'It runs them sequentially, which is too slow',
      ],
      correctIndex: 1,
      explanation:
        '`Promise.all` provides unbounded concurrency  -  all 10,000 requests start at once, overwhelming the server, hitting rate limits, and exhausting memory/sockets. Use a concurrency pool (sliding window) or batching to keep a bounded number of requests in flight.',
      interviewTip: '"Process a million records without overwhelming the DB" → bounded concurrency pool.',
    },
    {
      id: 'js-q-concurrency-pool',
      category: 'javascript',
      subcategory: 'concurrency',
      difficulty: 'expert',
      question: 'In a sliding-window concurrency pool, which Promise combinator do you await to start the next task as soon as ANY in-flight task finishes?',
      options: ['Promise.all', 'Promise.race', 'Promise.allSettled', 'Promise.any'],
      correctIndex: 1,
      explanation:
        '`Promise.race` settles as soon as the first of the in-flight promises settles, so awaiting it lets the pool start a new task the moment a slot frees up. This maintains exactly N concurrent tasks  -  better throughput than fixed batches, where the whole batch waits for its slowest member.',
    },
    {
      id: 'js-q-timeout-wrapper',
      category: 'javascript',
      subcategory: 'concurrency',
      difficulty: 'core',
      question: 'How do you add a timeout to a promise that has no built-in timeout?',
      options: [
        'Use setTimeout inside the promise',
        'Promise.race([promise, rejectAfterMs])  -  whichever settles first wins',
        'await the promise twice',
        'Wrap it in Promise.all with a delay',
      ],
      correctIndex: 1,
      explanation:
        '`Promise.race([work, timeout])` where `timeout` is a promise that rejects after N ms. Whichever settles first wins: if the work finishes in time you get its result, otherwise the timeout rejection fires. Always add timeouts to external calls so one hung request cannot stall the system.',
    },
  ],
};
