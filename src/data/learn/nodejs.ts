import type { LearnModule } from '../../types';

export const nodejs: LearnModule = {
  id: 'nodejs',
  title: 'Node.js',
  blurb: 'The runtime: event loop phases, streams, and non-blocking I/O.',
  lessons: [
    {
      id: 'node-nonblocking',
      title: 'Non-blocking I/O and the libuv thread pool',
      content:
        'Node runs your JavaScript on one main thread but offloads I/O (file system, DNS, crypto) to the libuv thread pool and the OS, so thousands of connections can be in flight without one thread each. The danger is CPU-bound work on the main thread: a heavy synchronous loop blocks every request. For CPU work, use worker threads, a child process, or break the task into chunks.',
    },
    {
      id: 'node-streams',
      title: 'Streams and backpressure',
      content:
        'Streams process data in chunks instead of loading everything into memory, which is essential for large files and proxies. Readable, Writable, Duplex, and Transform are the core types, and pipe (or pipeline) wires them together. Backpressure is the mechanism that pauses a fast producer when a slow consumer cannot keep up — respecting it prevents runaway memory usage.',
    },
    {
      id: 'node-modules-errors',
      title: 'Modules and error handling',
      content:
        'Node supports CommonJS (require/module.exports) and ES modules (import/export); pick one consistently and know that ESM is async-loaded. Always handle errors in async code: await inside try/catch, attach a catch to promises, and never swallow errors silently. An unhandled promise rejection can crash the process, so add a process-level handler for observability while still fixing the root cause.',
    },
  ],
  questions: [
    {
      id: 'node-q-cpu',
      category: 'nodejs',
      subcategory: 'event-loop',
      difficulty: 'core',
      question: 'What is the main risk of running a CPU-heavy synchronous loop in a Node request handler?',
      options: [
        'It uses too much disk',
        'It blocks the single main thread, stalling all other requests',
        'It automatically spawns new threads',
        'Nothing — Node parallelizes it',
      ],
      correctIndex: 1,
      explanation:
        'JavaScript runs on one thread, so a long synchronous computation blocks the event loop and every concurrent request waits. Offload to worker threads or chunk the work.',
      interviewTip: 'Node is great at I/O concurrency, poor at CPU-bound work on the main thread.',
    },
    {
      id: 'node-q-threadpool',
      category: 'nodejs',
      subcategory: 'libuv',
      difficulty: 'expert',
      question: 'Which kind of work does libuv offload to its thread pool?',
      options: [
        'All JavaScript execution',
        'Certain I/O and CPU tasks like file system, DNS lookups, and crypto',
        'Only network sockets',
        'Garbage collection',
      ],
      correctIndex: 1,
      explanation:
        'libuv uses a small thread pool for operations that the OS cannot do asynchronously, such as fs, dns.lookup, and crypto. Network I/O typically uses the OS event mechanism directly.',
    },
    {
      id: 'node-q-backpressure',
      category: 'nodejs',
      subcategory: 'streams',
      difficulty: 'expert',
      question: 'What problem does stream backpressure solve?',
      options: [
        'It encrypts the stream',
        'It pauses a fast producer when a slow consumer cannot keep up, preventing memory blowup',
        'It compresses data',
        'It guarantees ordering',
      ],
      correctIndex: 1,
      explanation:
        'Backpressure signals the producer to slow down when the writable side buffers too much, so memory stays bounded. pipe and pipeline handle it for you.',
    },
    {
      id: 'node-q-streams-why',
      category: 'nodejs',
      subcategory: 'streams',
      difficulty: 'foundation',
      question: 'Why stream a 2GB file instead of reading it all at once?',
      options: [
        'Streaming is the only way to read files',
        'To avoid loading the whole file into memory; chunks keep memory usage low',
        'Streaming makes the file smaller',
        'It is required by TypeScript',
      ],
      correctIndex: 1,
      explanation:
        'Reading a huge file fully would spike memory and can crash the process. Streaming processes it chunk by chunk with constant memory.',
    },
    {
      id: 'node-q-rejection',
      category: 'nodejs',
      subcategory: 'errors',
      difficulty: 'core',
      question: 'What can an unhandled promise rejection do in modern Node?',
      options: [
        'Nothing, it is ignored',
        'It can terminate the process',
        'It restarts the event loop',
        'It converts the promise to sync',
      ],
      correctIndex: 1,
      explanation:
        'Unhandled rejections can crash the process by default. Always await within try/catch or attach a catch, and add a process listener for visibility.',
    },
  ],
};
