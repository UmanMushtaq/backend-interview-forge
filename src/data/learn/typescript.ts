import type { LearnModule } from '../../types';

export const typescript: LearnModule = {
  id: 'typescript',
  title: 'TypeScript',
  blurb: 'Types, generics, and the compiler features that make large backends safe.',
  lessons: [
    {
      id: 'ts-structural',
      title: 'Structural typing and interfaces',
      content:
        'TypeScript is structurally typed: a value is assignable if it has the required shape, regardless of the declared name. Interfaces and type aliases both describe shapes; interfaces can be merged and extended, while type aliases can express unions, intersections, and mapped types. Prefer precise types over any, and reach for unknown when a value truly is unknown so the compiler forces you to narrow it. Declaration merging lets you extend an existing interface from a different file, which is useful for augmenting third-party types. In interviews, the structural vs nominal typing distinction often comes up  -  TypeScript is structural, meaning two classes with the same methods are interchangeable even if unrelated, which surprises developers coming from Java or C#.',
    },
    {
      id: 'ts-generics',
      title: 'Generics and utility types',
      content:
        'Generics let you write reusable code that preserves type information, like a Repository<T> or a function that returns the same type it receives. Constraints (T extends ...) restrict what can be passed. Built-in utility types  -  Partial, Pick, Omit, Record, Readonly, ReturnType, Parameters, Awaited  -  cover most day-to-day transformations without hand-writing new interfaces. Conditional types (T extends U ? X : Y) and infer let you express complex type logic, for example extracting the resolved type of a Promise. A common interview question is to implement a simplified version of Partial or Pick using mapped types and the keyof operator.',
    },
    {
      id: 'ts-narrowing',
      title: 'Narrowing and discriminated unions',
      content:
        'The compiler narrows types through control flow: typeof checks, truthiness, the in operator, instanceof, and custom type guards (functions returning "x is Type"). A discriminated union gives each variant a common literal tag (e.g. kind), so a switch on that tag lets TypeScript know exactly which fields exist in each branch  -  the safest way to model state machines and API responses. Exhaustiveness checking uses a never-typed default: if a new variant is added to the union but the switch is not updated, the compiler flags an error. This pattern is powerful for modelling complex domain logic safely.',
    },
    {
      id: 'ts-enums-unknown-never',
      title: 'Enums vs unions, unknown, any, and never',
      content:
        'String literal unions ("red" | "green" | "blue") are usually preferred over enums because they are simpler, have no runtime cost, and do not require a separate import. Const enums are erased at compile time but can cause issues with isolated module compilation. The any type disables all type checking, spreading unsafety everywhere it touches. The unknown type is the safe alternative: it accepts any value but you must narrow it before use. The never type represents values that can never exist  -  a function that always throws has return type never, and the unreachable default branch of an exhaustive switch has type never, which you can exploit for compile-time exhaustiveness checks.',
    },
    {
      id: 'ts-satisfies-keyof-typeof',
      title: 'satisfies, keyof, typeof, and declaration files',
      content:
        'The keyof operator produces a union of an object type\'s property names, useful for generic lookups. The typeof operator (in type position) extracts the TypeScript type of a value, so you can create a type from a const object without duplication. The satisfies keyword (TS 4.9) validates that a value matches a type while preserving the narrowest inferred type  -  unlike a type annotation, which widens. Declaration files (.d.ts) describe the types of plain JavaScript libraries; DefinitelyTyped (@types/*) provides community-maintained ones. Understanding module augmentation in .d.ts files, such as adding properties to Express Request, is a common backend TypeScript task.',
    },
    {
      id: 'ts-declaration-files',
      title: 'Declaration files and module augmentation',
      content:
        'Declaration files (.d.ts) contain only type information with no runtime code, telling TypeScript the shape of JavaScript libraries or global APIs. When you install a package like express and also install @types/express, the declaration file teaches TypeScript what req.body and res.json look like. Module augmentation lets you add properties to existing modules in a type-safe way  -  for example, adding a user property to Express\'s Request interface so every handler can access req.user without casting. Triple-slash references (reference types="node") import global type definitions. Writing your own .d.ts files for internal JavaScript modules is a migration strategy when converting a large codebase to TypeScript incrementally.',
    },
    {
      id: 'ts-conditional-infer',
      title: 'Conditional types and the infer keyword',
      content:
        'Conditional types (`T extends U ? X : Y`) let you write type-level logic  -  the foundation of many utility types in TypeScript\'s standard library. The `infer` keyword, used inside the extends clause of a conditional type, captures a type fragment for use in the result branch. The pattern `T extends Promise<infer R> ? R : T` extracts the resolved value type of a Promise: if T is `Promise<string>`, R is inferred as `string` and the whole expression evaluates to `string`. This is exactly how the built-in `Awaited<T>` utility type works.\n\nConditional types become very powerful when combined with mapped types and recursive definitions. The `DeepReadonly<T>` pattern applies Readonly recursively: `type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T`. Similarly, `FlattenArray<T>` can be expressed as `T extends Array<infer Item> ? Item : T`.\n\nA critical subtlety: conditional types distribute over union members when T is a bare type parameter. `type IsString<T> = T extends string ? true : false` applied to `string | number` yields `true | false`, not `false`. To prevent distribution, wrap T in a tuple: `type IsString<T> = [T] extends [string] ? true : false`. This distributing behaviour is useful for filtering union members: `type ExtractStrings<T> = T extends string ? T : never` applied to `string | number | boolean` yields `string`, because `never` is the identity element of unions.\n\nIn NestJS codebases, conditional types appear when building generic repository types, mapping DTO shapes to entity shapes, or typing the return of a service method that can return different shapes based on a flag parameter. Mastering infer also lets you write your own `ReturnType`, `Parameters`, and `ConstructorParameters` if needed.',
    },
    {
      id: 'ts-mapped-template',
      title: 'Mapped types and template literal types',
      content:
        'Mapped types systematically transform every property of an existing type, making them the building block for most utility types. The syntax `{ [K in keyof T]: Transform<T[K]> }` iterates over the keys of T and applies a transformation. You can add or remove modifiers: `{ readonly [K in keyof T]: T[K] }` adds readonly to every property, while `{ [K in keyof T]-?: T[K] }` removes the optional modifier (making everything required  -  exactly what `Required<T>` does). You can also remap keys with the `as` clause: `{ [K in keyof T as K extends string ? \`get${Capitalize<K>}\` : never]: () => T[K] }` creates getter method signatures from an object type.\n\nTemplate literal types (TS 4.1) extend string literal types with interpolation: `` type EventName<T extends string> = `on${Capitalize<T>}` `` transforms `"click"` into `"onClick"`. This is powerful for typing event systems, REST route patterns, and CSS property names. The built-in `Uppercase`, `Lowercase`, `Capitalize`, and `Uncapitalize` intrinsic types manipulate string casing at the type level.\n\nCombining mapped and template literal types unlocks very expressive APIs. A classic example is generating getter and setter method types from a configuration interface:\n\n```typescript\ntype Config = { host: string; port: number };\ntype Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };\n// Results in: { getHost: () => string; getPort: () => number }\n```\n\nIn backend codebases, mapped types appear in DTO transformation layers, in generic service interfaces, and when building type-safe query builders. Template literal types appear in routing frameworks, event typing, and any API that uses string-keyed registries. Together they reduce the surface area of runtime errors by enforcing naming conventions at compile time.',
    },
    {
      id: 'ts-decorators-metadata',
      title: 'TypeScript decorators and reflect-metadata',
      content:
        'Decorators are a TypeScript (and stage 3 JavaScript) feature that allow you to attach metadata and modify classes, methods, properties, and parameters at declaration time. NestJS relies on decorators extensively: `@Controller()`, `@Injectable()`, `@Get()`, `@Body()`, `@Param()` are all decorator calls that register metadata which the NestJS runtime reads at startup to wire the application together.\n\nThe `reflect-metadata` polyfill (imported once at the entry point with `import "reflect-metadata"`) extends the Reflect API with `Reflect.defineMetadata(key, value, target)` and `Reflect.getMetadata(key, target)`. TypeScript emits design-time type metadata when `emitDecoratorMetadata: true` is set in tsconfig.json. The emitted keys are `design:type` (the type constructor), `design:paramtypes` (constructor parameter types as an array), and `design:returntype`. NestJS\'s dependency injection system reads `design:paramtypes` from a class constructor to know which providers to inject without any explicit type annotation in the DI configuration.\n\nWriting a custom decorator is straightforward. A method decorator factory receives the target class prototype, the method name, and the property descriptor:\n\n```typescript\nfunction Log(target: object, key: string, descriptor: PropertyDescriptor) {\n  const original = descriptor.value;\n  descriptor.value = async function (...args: unknown[]) {\n    console.log(`Calling ${key} with`, args);\n    const result = await original.apply(this, args);\n    console.log(`${key} returned`, result);\n    return result;\n  };\n  return descriptor;\n}\n```\n\nA parameter decorator can store metadata for later use by a method decorator or the DI container: `Reflect.defineMetadata(\'custom:param\', paramIndex, target, propertyKey)`. When the method decorator reads this metadata with `Reflect.getMetadata`, it knows which parameter position to transform.\n\nThe important caveat for production: decorators are called at class definition time, not at instantiation time. Errors thrown inside a decorator crash the module loading phase, not the request phase  -  which makes decorator errors especially visible and easy to debug.',
    },
    {
      id: 'ts-typed-events',
      title: 'Type-safe event emitters',
      content:
        'Node\'s built-in EventEmitter is untyped: `emitter.on("userCreated", (data) => ...)` gives `data` the type `any`, which erases all safety. In a large codebase where events flow across multiple services or modules, this leads to silent mismatches between emitted payloads and consumer assumptions. Building a type-safe event emitter is a practical TypeScript exercise that also comes up in interviews.\n\nThe pattern uses a type-level map from event names to payload types, then uses mapped and conditional types to constrain the `on` and `emit` methods:\n\n```typescript\ntype EventMap = {\n  userCreated: { id: string; email: string };\n  orderShipped: { orderId: string; trackingNumber: string };\n};\n\nclass TypedEmitter<Events extends Record<string, unknown>> {\n  private emitter = new EventEmitter();\n\n  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): this {\n    this.emitter.on(event as string, listener);\n    return this;\n  }\n\n  emit<K extends keyof Events>(event: K, data: Events[K]): boolean {\n    return this.emitter.emit(event as string, data);\n  }\n\n  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): this {\n    this.emitter.off(event as string, listener);\n    return this;\n  }\n}\n\nconst bus = new TypedEmitter<EventMap>();\nbus.on("userCreated", (data) => console.log(data.email)); // data is fully typed\nbus.emit("orderShipped", { orderId: "123", trackingNumber: "ABC" }); // payload is checked\n```\n\nThe key insight is that `K extends keyof Events` binds the event name and payload type together in a single generic parameter, so TypeScript infers the correct payload type from the event name. Misspelling the event name or passing a wrong payload shape is a compile error, not a runtime surprise.\n\nIn NestJS, the `EventEmitter2` package and `@nestjs/event-emitter` module provide a similar pattern with wildcards and async listeners. For cross-process or cross-service events, the same typed EventMap pattern can be applied to RabbitMQ or Kafka message schemas using a shared types package, ensuring producers and consumers agree on the payload shape without runtime validation overhead.',
    },
    {
      id: 'ts-typed-fetch',
      title: 'Type-safe fetch wrappers with generics',
      content:
        'The built-in `fetch` API returns `Promise<Response>` with a body of `any`  -  you lose all type safety the moment you call `response.json()`. Wrapping fetch with a generic helper restores that safety and centralises concerns like base URL, auth headers, and error handling.\n\n```typescript\nasync function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {\n  const response = await fetch(`${process.env.API_BASE_URL}${path}`, {\n    ...init,\n    headers: {\n      \'Content-Type\': \'application/json\',\n      Authorization: `Bearer ${getToken()}`,\n      ...init?.headers,\n    },\n  });\n\n  if (!response.ok) {\n    const error = await response.json().catch(() => ({}));\n    throw new ApiError(response.status, error.message ?? response.statusText);\n  }\n\n  return response.json() as Promise<T>;\n}\n```\n\nCall it with explicit type parameters:\n\n```typescript\nconst order = await apiFetch<Order>(`/orders/${id}`);\nconst orders = await apiFetch<Order[]>(\'/orders?status=pending\');\n```\n\nTypeScript infers the return type from the generic parameter, so `order` is typed as `Order` and `orders` as `Order[]`. If the API contract changes, you update the type and TypeScript flags every call site that becomes invalid.\n\nFor more rigorous safety, combine this with **Zod** validation  -  the fetch wrapper receives a Zod schema and validates the response at runtime before returning:\n\n```typescript\nasync function apiFetch<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {\n  const response = await fetch(path, init);\n  if (!response.ok) throw new ApiError(response.status);\n  const data = await response.json();\n  return schema.parse(data); // throws ZodError if shape is wrong\n}\n\nconst order = await apiFetch(`/orders/${id}`, OrderSchema);\n```\n\nThis catches cases where the backend returns an unexpected shape  -  a renamed field, a missing property  -  at the boundary, rather than causing a `TypeError: Cannot read properties of undefined` deep inside your application logic.\n\nIn an interview, a type-safe fetch wrapper demonstrates that you understand the difference between compile-time and runtime type safety. TypeScript\'s types disappear at runtime  -  the only guarantee that the API actually returned what you declared is a runtime validation step like Zod.',
    },
    {
      id: 'ts-zod',
      title: 'Zod for runtime validation and schema inference',
      content:
        'TypeScript types are erased at runtime. Your application receives raw bytes from HTTP requests, database queries, and external APIs  -  all of type `unknown` at runtime, regardless of what TypeScript says at compile time. **Zod** is a TypeScript-first validation library that enforces shape at runtime and infers TypeScript types from schemas, so you define the shape once and get both runtime validation and compile-time types.\n\nDefine a schema and infer the type from it:\n\n```typescript\nimport { z } from \'zod\';\n\nconst CreateOrderSchema = z.object({\n  userId: z.string().uuid(),\n  items: z.array(z.object({\n    productId: z.string().uuid(),\n    quantity: z.number().int().positive(),\n  })).min(1),\n  shippingAddress: z.string().min(5).max(200),\n  currency: z.enum([\'EUR\', \'USD\', \'GBP\']),\n});\n\ntype CreateOrderDto = z.infer<typeof CreateOrderSchema>;\n```\n\n`z.infer<typeof schema>` extracts the TypeScript type, so you never write the type and the schema separately  -  they are always in sync.\n\nParse incoming data at the boundary:\n\n```typescript\napp.post(\'/orders\', async (req, res) => {\n  const result = CreateOrderSchema.safeParse(req.body);\n  if (!result.success) {\n    return res.status(400).json({ errors: result.error.flatten() });\n  }\n  const dto = result.data; // typed as CreateOrderDto\n  await ordersService.create(dto);\n});\n```\n\n`safeParse` returns a discriminated union  -  `{ success: true, data: T }` or `{ success: false, error: ZodError }`  -  without throwing. Use `safeParse` at HTTP boundaries so you can return a 400 response; use `parse` for internal invariants where a failure is a programming error.\n\nIn NestJS, integrate Zod with a custom `ZodValidationPipe`:\n\n```typescript\n@Post()\n@UsePipes(new ZodValidationPipe(CreateOrderSchema))\ncreate(@Body() dto: CreateOrderDto) { ... }\n```\n\nZod coercion (`z.coerce.number()`, `z.coerce.date()`) converts strings to numbers or Date objects before validation  -  useful for query parameters which arrive as strings in HTTP.\n\nIn an interview, Zod is the answer to "how do you ensure runtime type safety in a TypeScript application?" Show you understand that TypeScript alone is not sufficient at system boundaries.',
    },
    {
      id: 'ts-slow-types',
      title: 'Avoiding slow types and deep instantiation errors',
      content:
        'As TypeScript projects grow, some patterns cause the type checker to slow down dramatically or produce "Type instantiation is excessively deep" errors. Understanding the root causes lets you write types that remain fast at scale.\n\n**Large union types** slow down assignability checks. A union with 100 string literal members requires up to 100 checks for each assignment. Prefer a branded string type validated at runtime with Zod over a 100-member string union:\n\n```typescript\n// Slow on hot paths\ntype CountryCode = \'AT\' | \'BE\' | \'BG\' | /* ... 24 more */ | \'SE\';\n\n// Faster: brand for safety, validate at boundary\ntype CountryCode = string & { readonly _brand: \'CountryCode\' };\n```\n\n**Conditional types over complex generics** are evaluated lazily but can produce slow incremental checking when referenced thousands of times. If a conditional type is applied to each element of a large array type, the lazy evaluation adds up. Name intermediate types explicitly to cache the result:\n\n```typescript\n// Re-evaluated at each usage\ntype Foo = Bar extends Baz ? X : Y;\n\n// Cached\ntype CachedFoo = Bar extends Baz ? X : Y;\ntype UseFoo = CachedFoo; // refers to the cached version\n```\n\n**Object spread on large inferred types** creates a new merged type on each spread. In a deeply nested object this multiplies compilation work. Add explicit type annotations on intermediate values to stop re-inference.\n\n**tsconfig settings** for performance:\n- `"skipLibCheck": true` skips type-checking declaration files\n- `"isolatedModules": true` enables faster parallel builds (required for Vite)\n- `"incremental": true` caches results to disk for faster rebuilds\n\nDiagnose slow compilation with `tsc --diagnostics`  -  if "Instantiation count" exceeds 1 million, run `tsc --generateTrace trace/ && npx @typescript/analyze-trace trace/` to find the offending type.\n\nIn an interview, showing awareness of TypeScript performance signals experience with large codebases where compile time directly affects developer velocity.',
    },
  ],
  questions: [
    {
      id: 'ts-q-unknown',
      category: 'typescript',
      subcategory: 'types',
      difficulty: 'core',
      question: 'Why prefer unknown over any for a value of uncertain type?',
      options: [
        'unknown is faster at runtime',
        'unknown forces you to narrow before use, preserving type safety; any disables checking',
        'They are identical',
        'any cannot be used in function parameters',
      ],
      correctIndex: 1,
      explanation:
        'any opts out of type checking entirely and spreads unsafely. unknown accepts anything but lets you do nothing with it until you narrow it, so the compiler keeps protecting you.',
      interviewTip: 'unknown = safe any; reach for it at trust boundaries like JSON.parse.',
    },
    {
      id: 'ts-q-structural',
      category: 'typescript',
      subcategory: 'structural-typing',
      difficulty: 'core',
      question: 'TypeScript considers two types compatible when…',
      options: [
        'they have the same name',
        'they are declared in the same file',
        'their shapes (members) are compatible',
        'they both extend a common class',
      ],
      correctIndex: 2,
      explanation:
        'TypeScript uses structural typing: compatibility is based on the shape of the type, not its declared name, so any object with the required members fits.',
    },
    {
      id: 'ts-q-utility',
      category: 'typescript',
      subcategory: 'utility-types',
      difficulty: 'foundation',
      question: 'Which utility type makes every property of T optional?',
      options: ['Required<T>', 'Partial<T>', 'Readonly<T>', 'Pick<T, K>'],
      correctIndex: 1,
      explanation:
        'Partial<T> maps each property to optional. Required does the opposite, Readonly freezes properties, and Pick selects a subset of keys.',
    },
    {
      id: 'ts-q-discriminated',
      category: 'typescript',
      subcategory: 'discriminated-unions',
      difficulty: 'expert',
      question: 'What makes a discriminated union work for exhaustive checks?',
      options: [
        'Every variant shares a common literal-typed tag the compiler can switch on',
        'All variants must be classes',
        'The variants must have identical fields',
        'You must annotate every usage with any',
      ],
      correctIndex: 0,
      explanation:
        'A shared literal tag (e.g. kind: "a" | "b") lets the compiler narrow to the exact variant in each switch branch and flag missing cases with a never check.',
    },
    {
      id: 'ts-q-generics',
      category: 'typescript',
      subcategory: 'generics',
      difficulty: 'core',
      question: 'What does the constraint in "function f<T extends { id: string }>(x: T)" guarantee?',
      options: [
        'T can be any type at all',
        'x is guaranteed to have a string id property while preserving its concrete type',
        'x is converted to a plain object',
        'T must be a primitive',
      ],
      correctIndex: 1,
      explanation:
        'The extends constraint requires T to have an id: string, so you can safely read x.id, while returning T keeps the caller\'s exact type instead of widening it.',
    },
    {
      id: 'ts-q-never',
      category: 'typescript',
      subcategory: 'types',
      difficulty: 'expert',
      question: 'What is the never type useful for in a switch statement over a discriminated union?',
      options: [
        'It makes the switch run faster',
        'Assigning the value to a never variable in the default branch causes a compile error if a variant is unhandled',
        'It prevents runtime errors by throwing automatically',
        'never is only used for function return types',
      ],
      correctIndex: 1,
      explanation:
        'If all union variants are handled, the default branch is unreachable and TypeScript types the value as never. Assigning it to a never variable is a compile-time exhaustiveness check  -  add a variant and the compiler immediately reports an error.',
    },
    {
      id: 'ts-q-interface-vs-type',
      category: 'typescript',
      subcategory: 'structural-typing',
      difficulty: 'core',
      question: 'Which feature does an interface have that a type alias does not?',
      options: [
        'The ability to describe a union',
        'Declaration merging  -  multiple declarations with the same name are combined',
        'The ability to use generics',
        'The ability to be exported',
      ],
      correctIndex: 1,
      explanation:
        'Interface declarations with the same name in the same scope merge into one type. Type aliases are unique; re-declaring one is an error. This merging is important for augmenting third-party interfaces like Express Request.',
    },
    {
      id: 'ts-q-keyof',
      category: 'typescript',
      subcategory: 'utility-types',
      difficulty: 'core',
      question: 'What does keyof T produce?',
      options: [
        'An array of T\'s property names at runtime',
        'A union type of all property name strings of T',
        'A mapped type with optional properties',
        'The prototype of T',
      ],
      correctIndex: 1,
      explanation:
        'keyof T is a compile-time operator that produces a string (or symbol/number) union of all keys of type T. It is the foundation of many generic utilities like Pick and Record.',
    },
    {
      id: 'ts-q-typeof-satisfies',
      category: 'typescript',
      subcategory: 'utility-types',
      difficulty: 'expert',
      question: 'What advantage does "satisfies" (TS 4.9) have over a plain type annotation?',
      options: [
        'satisfies runs the type check at runtime',
        'satisfies validates the shape but keeps the narrowest inferred type; an annotation widens to the declared type',
        'satisfies is just an alias for "as"',
        'satisfies only works with string literals',
      ],
      correctIndex: 1,
      explanation:
        'With a type annotation, the variable is widened to the annotated type, losing literal information. satisfies checks conformance while preserving the inferred narrow type, giving you both safety and precision.',
    },
    {
      id: 'ts-q-type-guard',
      category: 'typescript',
      subcategory: 'narrowing',
      difficulty: 'core',
      question: 'A function with the return type "x is Dog" is called a…',
      options: ['Type assertion', 'User-defined type guard', 'Mapped type', 'Conditional type'],
      correctIndex: 1,
      explanation:
        'A user-defined type guard is a function that returns a boolean and has a type predicate (x is T) as its return type. When it returns true, TypeScript narrows x to T in the calling scope.',
    },
    {
      id: 'ts-q-enum-vs-union',
      category: 'typescript',
      subcategory: 'enums',
      difficulty: 'core',
      question: 'Why do many TypeScript codebases prefer string literal unions over enums?',
      options: [
        'Enums are not valid TypeScript',
        'String literal unions are simpler, have no runtime overhead, and do not need a separate import',
        'Enums cannot have string values',
        'String unions enable declaration merging',
      ],
      correctIndex: 1,
      explanation:
        'Enums compile to runtime objects and can behave unexpectedly (numeric enums are bidirectionally mapped). String literal unions are erased at compile time, are more readable in logs, and require no import  -  so they are the community-preferred choice.',
    },
    {
      id: 'ts-q-awaited',
      category: 'typescript',
      subcategory: 'utility-types',
      difficulty: 'expert',
      question: 'What does the Awaited<T> utility type do?',
      options: [
        'Wraps T in a Promise',
        'Recursively unwraps Promise layers to get the resolved value type',
        'Makes all properties of T optional',
        'Converts T to unknown',
      ],
      correctIndex: 1,
      explanation:
        'Awaited<Promise<Promise<string>>> resolves to string. It recursively unwraps Promise types, which is useful for inferring what async functions actually return after all awaits.',
    },
    {
      id: 'ts-q-readonly',
      category: 'typescript',
      subcategory: 'utility-types',
      difficulty: 'foundation',
      question: 'What does Readonly<T> do, and does it affect runtime behaviour?',
      options: [
        'It freezes the object at runtime using Object.freeze',
        'It marks all properties as non-optional at compile time only',
        'It marks all properties as readonly at compile time; runtime behaviour is unchanged',
        'It converts T to a primitive type',
      ],
      correctIndex: 2,
      explanation:
        'Readonly<T> is a compile-time constraint that prevents property reassignment in TypeScript code, but it emits no runtime code. The underlying JavaScript object can still be mutated if type assertions are used.',
    },
    {
      id: 'ts-q-declaration-merging',
      category: 'typescript',
      subcategory: 'declaration-files',
      difficulty: 'expert',
      question: 'How do you add a custom "user" property to Express\'s Request interface in a TypeScript project?',
      options: [
        'Edit node_modules/@types/express directly',
        'Use module augmentation: declare a new namespace block adding to the Express.Request interface in a .d.ts file',
        'Cast req to any in every handler',
        'Create a new class that extends Request',
      ],
      correctIndex: 1,
      explanation:
        'Module augmentation lets you add properties to existing third-party interfaces without editing node_modules. A .d.ts file with the same module path as the package, adding to its interface, is picked up by the compiler automatically.',
    },
    {
      id: 'ts-q-conditional-types',
      category: 'typescript',
      subcategory: 'generics',
      difficulty: 'expert',
      question: 'What does "T extends Promise<infer U> ? U : T" do?',
      options: [
        'Wraps T in a Promise if it is not already one',
        'Extracts the resolved type U if T is a Promise, otherwise returns T unchanged',
        'Checks if T is a class instance',
        'Creates a union of T and U',
      ],
      correctIndex: 1,
      explanation:
        'This is a conditional type with infer. If T is assignable to Promise<U>, TypeScript infers U as the wrapped type and returns it. Otherwise, T is returned. It is the manual version of what Awaited<T> does.',
    },
  ],
};
