import type { ArchitectureModule } from '../../types';

export const foundations: ArchitectureModule = {
  id: 'foundations',
  title: 'Foundations',
  blurb: 'What interviews actually test, and the two levers you have when a single server stops being enough.',
  lessons: [
    {
      id: 'as-what-interviews-test',
      title: 'What system design interviews are actually testing',
      content:
        'You walk into a system design interview and the prompt is one sentence: "design a URL shortener." No function signature, no test cases, no obviously right answer. If your career so far has been solving well-defined coding problems, this format can feel like a trick question. It is not a trick. It is a completely different skill, and understanding what it actually measures is the first step to doing well at it.\n\nA system design interview is not testing whether you can draw boxes and arrows on a whiteboard. It is testing whether you can take an ambiguous, underspecified problem and turn it into a concrete plan, while explaining the trade-offs behind every decision out loud. The interviewer already knows how to design a URL shortener. What they do not know yet is how you think when nobody hands you the requirements up front.\n\nThis is why the strongest candidates spend the first few minutes asking questions instead of drawing anything. How many users, how many requests per second, is this read-heavy or write-heavy, does data need to be strongly consistent or is eventual consistency fine. A junior answer jumps straight to a diagram with a load balancer, five microservices, and a message queue because that is what "looks like" a real system. A senior answer starts with the smallest thing that could possibly work, and adds a piece of complexity only when a specific requirement demands it. Every extra box on the diagram should have a reason you can state in one sentence.\n\n**Trade-offs** are the actual currency of this interview. There is no configuration of a distributed system that is fast, perfectly consistent, and cheap to run all at the same time. Choosing a cache means accepting that some reads will occasionally be stale. Choosing strong consistency for a payment ledger means accepting that a write might have to wait on multiple replicas before it returns. An interviewer is listening for whether you notice you are making a trade-off and can defend it, not whether you avoided trade-offs altogether, because that is not possible.\n\nThe other thing being tested, quietly, is whether you can reason about a system you did not build from memory. In your day job you already know how your codebase works. In this interview you are handed a blank page and have to construct a mental model live, the same way you would need to on your first week at a new company reading an unfamiliar codebase for the first time. That is a real, transferable skill, and it is exactly why companies spend forty-five minutes on it.\n\nIn an interview, when you get an open-ended prompt, resist the urge to start drawing immediately. Say out loud: "before I start, let me confirm the scale: how many users, how many requests per second, and what happens if this data is a few seconds stale." That single habit, asking before designing, is the most reliable signal of senior-level thinking in the first two minutes of the interview, and it sets up everything you draw afterward to actually be justified by something real.',
      designChallenge: {
        prompt:
          'Before any specific pattern, warm up with the smallest system that could work. A user opens an app and checks their account balance. Design the simplest thing that could answer that request: something that receives it, and something that holds the real data.',
        gradingCriteria: [
          'The canvas has a client-like component that represents where the request starts',
          'The canvas has a service or server component that receives the request',
          'The canvas has a database or storage component holding the actual balance data',
          'The components are connected in order, showing the request flowing from client to service to database',
        ],
      },
    },
  ],
  plannedLessons: [
    'Vertical vs horizontal scaling',
    'Load balancers and load balancing algorithms',
    'Client-server vs peer-to-peer',
    "Latency vs throughput, and why you can't maximize both",
  ],
};
