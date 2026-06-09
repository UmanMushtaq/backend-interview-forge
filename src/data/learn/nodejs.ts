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
        'Node runs your JavaScript on one main thread but offloads I/O (file system, DNS, crypto) to the libuv thread pool and the OS, so thousands of connections can be in flight without one thread each. The danger is CPU-bound work on the main thread: a heavy synchronous loop blocks every request. For CPU work, use worker threads, a child process, or break the task into chunks. libuv defaults to a thread pool of four threads, configurable via UV_THREADPOOL_SIZE. Operations like fs.readFile, dns.lookup, and crypto.pbkdf2 use the pool; TCP networking uses the OS event mechanism (epoll/kqueue) directly and does not consume pool threads. This distinction is critical for capacity planning under load.',
    },
    {
      id: 'node-event-loop-phases',
      title: 'Event loop phases in depth',
      content:
        'The Node.js event loop has six phases: timers (setTimeout/setInterval callbacks), pending callbacks (deferred I/O errors), idle/prepare (internal), poll (retrieve new I/O events and run their callbacks), check (setImmediate callbacks), and close callbacks (e.g. socket.on("close")). The poll phase blocks to wait for I/O if the queue is empty and no timers are due. process.nextTick runs between every phase transition, before any I/O callbacks — it is processed after the current operation even before the microtask queue. setImmediate runs in the check phase, after I/O. In an interview, being able to order: sync -> nextTick -> microtasks (promises) -> timers/setImmediate (I/O-dependent ordering) demonstrates real runtime knowledge.',
    },
    {
      id: 'node-streams',
      title: 'Streams and backpressure',
      content:
        'Streams process data in chunks instead of loading everything into memory, which is essential for large files and proxies. Readable, Writable, Duplex, and Transform are the core types, and pipe (or the safer stream.pipeline) wires them together. Backpressure is the mechanism that pauses a fast producer when a slow consumer cannot keep up — respecting it prevents runaway memory usage. When writable.write() returns false, the readable should pause until the drain event fires. pipeline (from stream/promises) handles cleanup and error propagation automatically, making it preferable to manual pipe chains. Transform streams are ideal for on-the-fly compression, encryption, or CSV parsing in a memory-efficient pipeline.',
    },
    {
      id: 'node-modules-errors',
      title: 'Modules and error handling',
      content:
        'Node supports CommonJS (require/module.exports) and ES modules (import/export); pick one consistently and know that ESM is async-loaded. Always handle errors in async code: await inside try/catch, attach a catch to promises, and never swallow errors silently. An unhandled promise rejection can crash the process, so add a process-level handler for observability while still fixing the root cause. The domain module is deprecated; instead use async_hooks or zone-like libraries for tracking context across async boundaries. When building libraries, distinguish between operational errors (expected failures like "file not found") and programmer errors (bugs like passing null where an object is expected) — only catch operational errors; let programmer errors crash loudly.',
    },
    {
      id: 'node-cluster-workers',
      title: 'Cluster, worker_threads, and scaling',
      content:
        'A single Node process uses one CPU core. To use all cores, you can use the cluster module (spawns multiple processes sharing one TCP port — the master routes connections) or worker_threads (lighter threads sharing memory via SharedArrayBuffer and communicating via postMessage). Use cluster for I/O-heavy workloads where you want process isolation; use worker_threads for CPU-intensive tasks (e.g. image processing, ML inference) where sharing memory is beneficial. PM2 and container orchestration handle cluster management in production. The child_process module spawns fully separate processes useful for running external commands or isolating unstable code. Know the tradeoffs: processes have isolation and separate memory (safer crash boundary), threads are lighter but share a heap.',
    },
    {
      id: 'node-eventemitter-process',
      title: 'EventEmitter, process, and buffers',
      content:
        'EventEmitter is the backbone of Node\'s async model: streams, HTTP servers, and net sockets all extend it. You register listeners with .on(event, fn) and emit events with .emit(event, data). Memory leaks come from attaching listeners but never removing them — the default max is 10 listeners per event before a warning. The process object gives access to env variables (process.env), arguments (process.argv), exit codes (process.exit), and signal handling (process.on("SIGTERM", ...)). Buffers represent raw binary data (files, network packets) as fixed-size chunks of memory outside the V8 heap. Buffer.from and Buffer.alloc are the safe constructors; avoid the deprecated new Buffer() constructor, which can expose old memory in older Node versions.',
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
    {
      id: 'node-q-nexttick-vs-setimmediate',
      category: 'nodejs',
      subcategory: 'event-loop',
      difficulty: 'expert',
      question: 'Which runs first: a process.nextTick callback or a setImmediate callback?',
      options: [
        'setImmediate always runs first',
        'process.nextTick runs before any I/O or setImmediate callbacks',
        'They run at the same time',
        'Whichever is scheduled first in source code',
      ],
      correctIndex: 1,
      explanation:
        'process.nextTick callbacks are processed after the current operation and before the event loop continues to the next phase, making them run before setImmediate (check phase) and before I/O callbacks.',
      interviewTip: 'nextTick > microtasks (promises) > I/O > setImmediate in scheduling priority.',
    },
    {
      id: 'node-q-cluster-vs-worker',
      category: 'nodejs',
      subcategory: 'cluster',
      difficulty: 'expert',
      question: 'When should you use worker_threads instead of the cluster module?',
      options: [
        'For HTTP servers that need to handle many concurrent connections',
        'For CPU-intensive tasks that benefit from shared memory between threads',
        'When you need process-level isolation and separate crash boundaries',
        'worker_threads is deprecated; always use cluster',
      ],
      correctIndex: 1,
      explanation:
        'worker_threads run in the same process and can share memory via SharedArrayBuffer, making them efficient for CPU work like image processing. cluster spawns separate processes best for I/O-bound scaling where process isolation is valuable.',
    },
    {
      id: 'node-q-esm-cjs',
      category: 'nodejs',
      subcategory: 'modules',
      difficulty: 'core',
      question: 'What is a key practical difference between CommonJS require and ES module import in Node?',
      options: [
        'require is asynchronous; import is synchronous',
        'import is static and hoisted; require is dynamic and runs synchronously at the point of the call',
        'They are identical at runtime in Node',
        'ES modules cannot export functions',
      ],
      correctIndex: 1,
      explanation:
        'ESM imports are hoisted and resolved asynchronously before the module runs. CommonJS require is a synchronous function call at runtime, making dynamic require() inside conditions possible but complicating static analysis.',
    },
    {
      id: 'node-q-eventemitter-leak',
      category: 'nodejs',
      subcategory: 'eventemitter',
      difficulty: 'core',
      question: 'What causes the "MaxListenersExceededWarning" in Node?',
      options: [
        'An event is emitted more than 10 times',
        'More than the default maximum number of listeners are added to a single event on an EventEmitter',
        'The EventEmitter queue overflows',
        'process.env has too many variables',
      ],
      correctIndex: 1,
      explanation:
        'EventEmitter warns when more than 10 listeners (default) are attached to a single event, because it often indicates a leak — adding a new listener each request without ever removing it. Use emitter.setMaxListeners(n) to raise the limit intentionally.',
    },
    {
      id: 'node-q-buffer',
      category: 'nodejs',
      subcategory: 'buffers',
      difficulty: 'core',
      question: 'Why are Node.js Buffers allocated outside the V8 heap?',
      options: [
        'They are faster to create inside V8',
        'Binary data for I/O operations is managed by the OS and does not need garbage collection',
        'V8 does not support typed arrays',
        'Buffers are only for network use',
      ],
      correctIndex: 1,
      explanation:
        'Buffers represent raw binary data. Allocating them outside V8 avoids GC pressure and allows direct passing to OS-level I/O syscalls without extra copying. They are backed by ArrayBuffer under the hood.',
    },
    {
      id: 'node-q-pipeline-vs-pipe',
      category: 'nodejs',
      subcategory: 'streams',
      difficulty: 'core',
      question: 'Why is stream.pipeline() preferred over readable.pipe() for production use?',
      options: [
        'pipeline is faster',
        'pipeline automatically handles errors and cleanup across all streams in the chain',
        'pipe does not support Transform streams',
        'pipeline compresses data automatically',
      ],
      correctIndex: 1,
      explanation:
        'pipe does not destroy streams on error, which can leave open file handles. pipeline propagates errors and destroys all streams in the chain, preventing resource leaks.',
    },
    {
      id: 'node-q-env',
      category: 'nodejs',
      subcategory: 'process',
      difficulty: 'foundation',
      question: 'How do you access the NODE_ENV environment variable in a Node.js process?',
      options: [
        'global.NODE_ENV',
        'process.env.NODE_ENV',
        'env.NODE_ENV',
        'require("env").NODE_ENV',
      ],
      correctIndex: 1,
      explanation:
        'process.env is a plain object populated from the process\'s environment variables. It is the standard way to read configuration like NODE_ENV, database URLs, and API keys in Node applications.',
    },
    {
      id: 'node-q-event-loop-phases',
      category: 'nodejs',
      subcategory: 'event-loop',
      difficulty: 'expert',
      question: 'In the Node.js event loop, which phase processes setImmediate callbacks?',
      options: ['Timers phase', 'Poll phase', 'Check phase', 'Pending callbacks phase'],
      correctIndex: 2,
      explanation:
        'setImmediate runs in the check phase, immediately after the poll phase completes. setTimeout(fn, 0) runs in the timers phase, which comes before poll. In an I/O callback, setImmediate always runs before a setTimeout(fn, 0).',
    },
    {
      id: 'node-q-sigterm',
      category: 'nodejs',
      subcategory: 'process',
      difficulty: 'core',
      question: 'How does a Node.js application handle graceful shutdown on SIGTERM?',
      options: [
        'Node automatically drains all connections on SIGTERM',
        'By registering a process.on("SIGTERM", callback) handler that stops accepting connections and waits for in-flight requests',
        'By setting process.graceful = true',
        'SIGTERM cannot be caught in Node',
      ],
      correctIndex: 1,
      explanation:
        'SIGTERM is sent by container orchestrators (Kubernetes) or process managers during shutdown. You handle it with process.on("SIGTERM") to close servers, drain queues, and exit cleanly after in-flight work completes.',
      interviewTip: 'Graceful shutdown = stop accepting, finish in-flight work, then exit.',
    },
    {
      id: 'node-q-threadpool-size',
      category: 'nodejs',
      subcategory: 'libuv',
      difficulty: 'expert',
      question: 'The libuv thread pool default size is 4. What is the effect when more than 4 crypto operations run simultaneously?',
      options: [
        'Node spawns additional threads automatically beyond 4',
        'Extra requests queue and wait for a thread to become free, introducing latency',
        'The extra operations run on the main thread',
        'Node throws an error',
      ],
      correctIndex: 1,
      explanation:
        'The pool is fixed at UV_THREADPOOL_SIZE (default 4). Beyond that, operations queue. This is a real performance bottleneck for password hashing (bcrypt) under high concurrency — raising the pool size or using async alternatives helps.',
    },
  ],
};
