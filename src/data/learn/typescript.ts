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
        'TypeScript is structurally typed: a value is assignable if it has the required shape, regardless of the declared name. Interfaces and type aliases both describe shapes; interfaces can be merged and extended, while type aliases can express unions, intersections, and mapped types. Prefer precise types over any, and reach for unknown when a value truly is unknown so the compiler forces you to narrow it.',
    },
    {
      id: 'ts-generics',
      title: 'Generics and utility types',
      content:
        'Generics let you write reusable code that preserves type information, like a Repository of T or a function that returns the same type it receives. Constraints (T extends ...) restrict what can be passed. Built-in utility types — Partial, Pick, Omit, Record, Readonly, ReturnType — cover most day-to-day transformations without hand-writing new interfaces.',
    },
    {
      id: 'ts-narrowing',
      title: 'Narrowing and discriminated unions',
      content:
        'The compiler narrows types through control flow: typeof checks, truthiness, the in operator, and custom type guards (functions returning x is Type). A discriminated union gives each variant a common literal tag (e.g. kind), so a switch on that tag lets TypeScript know exactly which fields exist in each branch — the safest way to model state machines and API responses.',
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
      question: 'What does the constraint in function f<T extends { id: string }>(x: T) guarantee?',
      options: [
        'T can be any type at all',
        'x is guaranteed to have a string id property while preserving its concrete type',
        'x is converted to a plain object',
        'T must be a primitive',
      ],
      correctIndex: 1,
      explanation:
        'The extends constraint requires T to have an id: string, so you can safely read x.id, while returning T keeps the caller’s exact type instead of widening it.',
    },
  ],
};
