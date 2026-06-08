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
];
