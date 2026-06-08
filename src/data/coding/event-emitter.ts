import type { CodingProblem } from '../../types';

export const eventEmitter: CodingProblem[] = [
  {
    id: 'emitter-basic-001',
    title: 'EventEmitter: on / emit / off',
    difficulty: 'easy',
    category: 'event-emitter',
    description:
      'Implement an EventEmitter. on(event, handler) subscribes, emit(event, ...args) calls every handler for that event with the args, and off(event, handler) unsubscribes a specific handler.',
    starterCode: `export class EventEmitter {
  on(event: string, handler: (...args: any[]) => void): void {
    // TODO
  }
  off(event: string, handler: (...args: any[]) => void): void {
    // TODO
  }
  emit(event: string, ...args: any[]): void {
    // TODO
  }
}
`,
    solution: `export class EventEmitter {
  private handlers = new Map<string, Array<(...args: any[]) => void>>();
  on(event: string, handler: (...args: any[]) => void): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }
  off(event: string, handler: (...args: any[]) => void): void {
    const list = this.handlers.get(event);
    if (!list) return;
    this.handlers.set(event, list.filter((h) => h !== handler));
  }
  emit(event: string, ...args: any[]): void {
    const list = this.handlers.get(event);
    if (!list) return;
    for (const h of [...list]) h(...args);
  }
}
`,
    testCases: [
      {
        name: 'emit calls subscribers; off removes one',
        input: "const e = new EventEmitter(); let sum = 0; const h = (n) => { sum += n; }; e.on('add', h); e.emit('add', 5); e.emit('add', 3); e.off('add', h); e.emit('add', 100); return sum;",
        expectedOutput: 8,
      },
      {
        name: 'supports multiple handlers',
        input: "const e = new EventEmitter(); let a = 0, b = 0; e.on('x', () => { a += 1; }); e.on('x', () => { b += 2; }); e.emit('x'); return [a, b];",
        expectedOutput: [1, 2],
      },
    ],
    hints: ['Map each event name to an array of handlers.', 'off should filter by handler identity; emit should iterate a copy in case handlers unsubscribe.'],
    interviewContext:
      'The observer pattern underpins Node EventEmitter, NestJS event bus, and DOM events. Edge cases (copying the list before emit) separate seniors from juniors.',
  },
  {
    id: 'emitter-advanced-001',
    title: 'EventBus: once and wildcards',
    difficulty: 'medium',
    category: 'event-emitter',
    description:
      'Implement an EventBus with on(pattern, handler), once(pattern, handler) which fires at most once, and emit(event, ...args). A pattern ending in .* matches any event with that prefix, e.g. on("user.*") matches "user.created".',
    starterCode: `export class EventBus {\n  on(pattern: string, fn: (...args: any[]) => void): void {\n    // TODO\n  }\n  once(pattern: string, fn: (...args: any[]) => void): void {\n    // TODO\n  }\n  emit(event: string, ...args: any[]): void {\n    // TODO\n  }\n}\n`,
    solution: `export class EventBus {\n  private handlers: Array<{ pattern: string; fn: (...a: any[]) => void; once: boolean }> = [];\n  on(pattern: string, fn: (...a: any[]) => void): void {\n    this.handlers.push({ pattern, fn, once: false });\n  }\n  once(pattern: string, fn: (...a: any[]) => void): void {\n    this.handlers.push({ pattern, fn, once: true });\n  }\n  private matches(pattern: string, event: string): boolean {\n    if (pattern === event) return true;\n    if (pattern.endsWith('.*')) return event.startsWith(pattern.slice(0, -1));\n    return false;\n  }\n  emit(event: string, ...args: any[]): void {\n    const matched = this.handlers.filter((h) => this.matches(h.pattern, event));\n    this.handlers = this.handlers.filter((h) => !(h.once && this.matches(h.pattern, event)));\n    for (const h of matched) h.fn(...args);\n  }\n}\n`,
    testCases: [
      {
        name: 'wildcard matches by prefix',
        input: "const b = new EventBus(); let n = 0; b.on('user.*', () => { n++; }); b.emit('user.created'); b.emit('user.deleted'); b.emit('order.created'); return n;",
        expectedOutput: 2,
      },
      {
        name: 'once fires at most once',
        input: "const b = new EventBus(); let n = 0; b.once('ping', () => { n++; }); b.emit('ping'); b.emit('ping'); return n;",
        expectedOutput: 1,
      },
    ],
    hints: [
      'Store handlers with their pattern and a once flag.',
      'For wildcards, strip the trailing star and test startsWith; remove once-handlers after they match.',
    ],
    interviewContext:
      'Wildcard subscriptions and once semantics are exactly what NestJS event emitters and message buses provide for domain events.',
  },
];
