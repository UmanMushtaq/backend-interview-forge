export interface CompanyProfile {
  id: string;
  name: string;
  logo?: string;
  stack: string[];
  why: string;
  process: Array<{ stage: string; description: string; duration?: string }>;
  focusAreas: string[];
  recentQuestions: string[];
  notes: string;
}

export const COMPANIES: CompanyProfile[] = [
  {
    id: 'qonto',
    name: 'Qonto',
    stack: ['NestJS', 'TypeScript', 'PostgreSQL', 'Kafka'],
    why: 'Exact stack match. Fintech. English working language. Very selective process, 4-5 rounds.',
    process: [
      { stage: 'CV screening', description: 'ATS scan plus recruiter review. Keywords matter: NestJS, TypeScript, microservices, Kafka, PostgreSQL.' },
      { stage: 'Recruiter call', description: 'Background, English level, motivation, permit situation.', duration: '30 min' },
      { stage: 'Technical screening', description: 'Live coding or take-home. 1-2 medium algorithm questions or a small practical task.', duration: '45-60 min' },
      { stage: 'Technical interview', description: 'Architecture discussion plus live coding. Expect a system design question and code review.', duration: '60-90 min' },
      { stage: 'Technical assessment', description: 'Take-home project. Build a small API with specific requirements, assessed on code quality, structure, tests, README.', duration: '3-5 hours' },
      { stage: 'Final interview', description: 'Culture fit, team fit, salary negotiation. Salary discussion is direct and early in France.' },
    ],
    focusAreas: ['NestJS architecture', 'Kafka event streaming', 'PostgreSQL schema design', 'System design at scale'],
    recentQuestions: [
      'Walk me through how you would design an event-driven ledger system',
      'How do you handle idempotency in a payment processing API',
      'Explain how you would scale a NestJS service to handle 10x traffic',
    ],
    notes: 'Qonto is the closest stack match on your CV. NexusPay maps almost directly onto what they ask. Lead with the Kafka and Saga pattern work.',
  },
  {
    id: 'alan',
    name: 'Alan',
    stack: ['TypeScript', 'PostgreSQL', 'event-driven'],
    why: 'Health insurance fintech, strong engineering culture. Very rigorous technical bar.',
    process: [
      { stage: 'CV screening', description: 'Strong emphasis on engineering culture fit and writing ability.' },
      { stage: 'Recruiter call', description: 'Motivation and culture alignment.', duration: '30 min' },
      { stage: 'Technical screening', description: 'Pair programming session, often on a real-ish problem.', duration: '60 min' },
      { stage: 'Technical interview', description: 'System design plus deep dive into a past project.', duration: '90 min' },
      { stage: 'Final interview', description: 'Values and culture fit, very rigorous.' },
    ],
    focusAreas: ['Event-driven architecture', 'Code quality and testing', 'Writing and communication'],
    recentQuestions: [
      'Tell me about a time you had to make a difficult architectural trade-off',
      'How would you design a system for processing insurance claims asynchronously',
      'Walk me through your testing strategy for a critical financial flow',
    ],
    notes: 'Alan cares deeply about written communication and reasoning, not just code. Be ready to explain your NexusPay decisions clearly and concisely.',
  },
  {
    id: 'swan',
    name: 'Swan',
    stack: ['NestJS', 'TypeScript', 'GraphQL'],
    why: 'Banking-as-a-service, strong backend team. GraphQL is directly relevant since it is in NexusPay Phase 5.',
    process: [
      { stage: 'CV screening', description: 'Looks for BaaS or payments experience specifically.' },
      { stage: 'Recruiter call', description: 'Background and motivation.', duration: '30 min' },
      { stage: 'Technical screening', description: 'Live coding focused on API design.', duration: '60 min' },
      { stage: 'Technical interview', description: 'GraphQL schema design and NestJS architecture deep dive.', duration: '90 min' },
      { stage: 'Final interview', description: 'Team fit and salary discussion.' },
    ],
    focusAreas: ['GraphQL schema design', 'Banking domain modeling', 'NestJS resolvers and DataLoader'],
    recentQuestions: [
      'How would you design a GraphQL schema for a multi-tenant banking platform',
      'Explain the N plus 1 problem and how DataLoader solves it',
      'How do you handle authorization at the field level in GraphQL',
    ],
    notes: 'Your NexusPay Phase 5 GraphQL work is directly relevant here. Make sure you can talk through your resolver design and DataLoader usage in detail.',
  },
  {
    id: 'alma',
    name: 'Alma',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL'],
    why: 'B2B payments, buy now pay later. Payments experience from your background applies directly.',
    process: [
      { stage: 'CV screening', description: 'Payments and fintech experience weighted heavily.' },
      { stage: 'Recruiter call', description: 'Background and motivation.', duration: '30 min' },
      { stage: 'Technical screening', description: 'Take-home or live coding on a payments-adjacent problem.', duration: '60 min' },
      { stage: 'Technical interview', description: 'Architecture and trade-off discussion.', duration: '60-90 min' },
      { stage: 'Final interview', description: 'Team and culture fit.' },
    ],
    focusAreas: ['Payment flows', 'Database transaction integrity', 'API design'],
    recentQuestions: [
      'How would you ensure a payment is never processed twice',
      'Walk me through your approach to handling partial refunds',
      'How do you design for eventual consistency across services',
    ],
    notes: 'Your double-spend prevention work in NexusPay is exactly what Alma will probe. Know your Redis lock pattern cold.',
  },
  {
    id: 'pennylane',
    name: 'Pennylane',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL'],
    why: 'Accounting SaaS fintech. Good mid to senior opportunities.',
    process: [
      { stage: 'CV screening', description: 'General backend strength, fintech is a plus.' },
      { stage: 'Recruiter call', description: 'Background and motivation.', duration: '30 min' },
      { stage: 'Technical screening', description: 'Live coding, algorithm and practical mix.', duration: '60 min' },
      { stage: 'Technical interview', description: 'System design and past project deep dive.', duration: '60-90 min' },
      { stage: 'Final interview', description: 'Team fit.' },
    ],
    focusAreas: ['Database design', 'API design', 'Testing practices'],
    recentQuestions: [
      'How would you design a database schema for double-entry bookkeeping',
      'How do you approach testing financial calculations',
    ],
    notes: 'Less stack-specific than Qonto or Swan. Focus on general backend strength and clear communication.',
  },
  {
    id: 'doctolib',
    name: 'Doctolib',
    stack: ['Node.js', 'TypeScript', 'microservices'],
    why: 'Not fintech but strong engineering, English-first. Very large scale, good process.',
    process: [
      { stage: 'CV screening', description: 'Strong general engineering signal.' },
      { stage: 'Recruiter call', description: 'Background and motivation.', duration: '30 min' },
      { stage: 'Technical screening', description: 'Algorithm-focused live coding.', duration: '45-60 min' },
      { stage: 'Technical interview', description: 'System design at large scale, plus past project discussion.', duration: '90 min' },
      { stage: 'Final interview', description: 'Team and culture fit.' },
    ],
    focusAreas: ['System design at scale', 'Microservices patterns', 'Algorithm proficiency'],
    recentQuestions: [
      'How would you design a system to handle millions of appointment bookings with no double-booking',
      'How would you scale a notification system that serves millions of users',
    ],
    notes: 'Doctolib operates at a much larger scale than NexusPay. Be ready to extrapolate your architecture decisions to 100x the scale.',
  },
];

export const companyById: Record<string, CompanyProfile> = Object.fromEntries(
  COMPANIES.map((c) => [c.id, c]),
);
