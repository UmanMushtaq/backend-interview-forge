import { Link } from 'react-router-dom';
import { useProgressState } from '../hooks/useProgress';
import { courseConfigById } from '../data/courseConfig';
import { courseProgress } from '../lib/courses';

interface RoadmapWeek {
  week: number;
  title: string;
  focus: string;
  courseIds: string[];
}

const WEEKS: RoadmapWeek[] = [
  {
    week: 1,
    title: 'JavaScript and TypeScript foundations',
    focus: 'The language fundamentals that every EU fintech interview tests before anything else.',
    courseIds: ['javascript', 'typescript'],
  },
  {
    week: 2,
    title: 'Node.js and NestJS deep dive',
    focus: 'The runtime and framework you will be writing in. Know these cold.',
    courseIds: ['nodejs', 'nestjs'],
  },
  {
    week: 3,
    title: 'Databases and caching',
    focus: 'PostgreSQL schema design, indexing, and Redis patterns come up in almost every senior backend interview.',
    courseIds: ['postgresql', 'redis'],
  },
  {
    week: 4,
    title: 'Messaging and event-driven architecture',
    focus: 'RabbitMQ, Kafka, and the Saga pattern are core to NexusPay and to fintech at scale.',
    courseIds: ['rabbitmq', 'kafka', 'microservices'],
  },
  {
    week: 5,
    title: 'System design and testing',
    focus: 'Senior roles are won or lost in the system design round. Testing shows production maturity.',
    courseIds: ['system-design', 'testing'],
  },
  {
    week: 6,
    title: 'DSA patterns and NexusPay',
    focus: 'Sharpen your algorithmic thinking and own your flagship project end to end.',
    courseIds: ['dsa', 'nexuspay'],
  },
];

type WeekStatus = 'complete' | 'in-progress' | 'not-started';

const STATUS_STYLES: Record<WeekStatus, string> = {
  complete: 'bg-success/15 text-success',
  'in-progress': 'bg-amber-400/15 text-amber-400',
  'not-started': 'bg-surface-2 text-muted',
};

const STATUS_LABELS: Record<WeekStatus, string> = {
  complete: 'Complete',
  'in-progress': 'In progress',
  'not-started': 'Not started',
};

export function Roadmap() {
  const state = useProgressState();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your 6-week interview roadmap</h1>
        <p className="mt-2 text-sm text-muted">
          Optimised for Senior NestJS roles at Qonto, Alan, and Swan. Each week has a clear focus and target
          courses.
        </p>
      </div>

      <div className="relative space-y-6 pl-8">
        <div className="absolute bottom-2 left-3 top-2 w-px bg-border" aria-hidden="true" />

        {WEEKS.map((wk) => {
          const progresses = wk.courseIds.map((id) => ({ id, prog: courseProgress(id, state) }));
          const status: WeekStatus = progresses.every((p) => p.prog.status === 'mastered')
            ? 'complete'
            : progresses.some((p) => p.prog.read > 0)
              ? 'in-progress'
              : 'not-started';

          return (
            <div key={wk.week} className="relative">
              <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-4 ring-bg">
                {wk.week}
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Week {wk.week}
                    </span>
                    <h2 className="mt-0.5 font-semibold">{wk.title}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{wk.focus}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {progresses.map(({ id, prog }) => {
                    const course = courseConfigById[id];
                    if (!course) return null;
                    const Icon = course.icon;
                    return (
                      <Link
                        key={id}
                        to={`/courses/${id}`}
                        className="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs transition hover:border-primary/40"
                      >
                        <Icon className={`h-3.5 w-3.5 ${course.color}`} />
                        <span className="font-medium">{course.title}</span>
                        <span className="tabular-nums text-muted">{prog.percent}%</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
