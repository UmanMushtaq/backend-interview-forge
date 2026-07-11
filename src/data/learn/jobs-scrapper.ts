import type { LearnModule } from '../../types';

export const jobsScrapper: LearnModule = {
  id: 'jobs-scrapper',
  title: 'jobsScrapper Deep Dive',
  blurb:
    'Own your second project. A production NestJS service running on Render that scrapes 18 job boards, scores jobs with AI, and sends results to Telegram.',
  lessons: [
    {
      id: 'jobs-scrapper-intro',
      title: 'What jobsScrapper is and what it proves',
      content: `
Most side projects are built to be shown once and forgotten. jobsScrapper was built to be used every single day. It is a personal job search automation tool, and the fact that it actually runs in production, unattended, solving a real problem, is what makes it worth talking about in an interview.

**jobsScrapper** is a NestJS service deployed on Render as a web service. It wakes up every 3 hours, scrapes 18 job boards across Europe, scores each job against a candidate profile, enriches the strongest matches with Gemini AI, and sends the results directly to a Telegram chat. No manual step is required anywhere in that chain.

This is deliberately not a toy project. It handles real pagination across job board APIs that all paginate differently. It handles real rate limits from external providers who will block you if you scrape too aggressively. It handles real API failures, because 18 external services means something is down at any given moment. It handles real deduplication across restarts, because a service that redeploys every time you push code cannot afford to forget what it already sent yesterday.

What this proves in an interview is not "I can write a scraper." Plenty of candidates can write a scraper that runs once on their laptop. What this proves is that you can design, deploy, and operate an unattended production service: something that keeps running correctly on a free hosting tier, recovers from partial failures, and respects the constraints of third-party APIs without babysitting it.

In an interview, introduce jobsScrapper in under 20 seconds: "I built a NestJS service that runs on a schedule, scrapes 18 job boards, filters and scores each job, enriches the best matches with Gemini AI, and delivers results to Telegram. It has been running in production for me daily. I can walk through the scheduling, the deduplication, the AI pipeline, or the deployment, wherever you want to go."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-monolith',
      title: 'The architecture: one NestJS service doing many jobs',
      content: `
NexusPay splits its concerns across 7 microservices, each with its own database, talking to each other over RabbitMQ and Kafka. jobsScrapper does the opposite. It is deliberately one NestJS application, one process, one deployment. This is not a shortcut. It is the correct architecture for this specific problem, and being able to explain why is exactly what separates an engineer who follows patterns from one who understands them.

A **monolith** here means every piece of jobsScrapper - the scheduler, the 18 scraper adapters, the filtering pipeline, the Gemini enrichment, the Redis deduplication, the Telegram bot, and the web dashboard - runs inside a single NestJS process. There is no service boundary to cross, no network hop between components, no separate deployment pipeline per feature.

The reasoning starts with the nature of the workload. Every scraper adapter makes HTTP calls to an external job board API and waits for a response. This is an **I/O bound** workload, not a CPU bound one. The service spends almost all of its time waiting on the network, not computing. Microservices earn their complexity when different parts of a system need to scale independently - for example, a payment processor handling thousands of transfers per second alongside a notification service handling a fraction of that load. jobsScrapper has no such asymmetry. All 18 adapters run the same kind of work, at the same modest scale, on the same schedule.

The second reason is who runs this system. NexusPay is designed as if a team of engineers owns different services independently. jobsScrapper is operated by one person. Splitting it into services would mean maintaining separate repositories or a monorepo, separate deployments, and a message broker to coordinate them, all to solve a coordination problem that does not exist here. A single deployable artifact is simpler to reason about, simpler to monitor (one set of logs, one process to restart), and simpler to debug when something breaks at 3am.

\`\`\`
jobsScrapper (single NestJS process)
├── ScheduleModule       - @Cron trigger every 3 hours
├── ScraperModule        - 18 adapter classes, one JobSource interface
├── FilterModule         - scoring gate, exclusions, salary/location rules
├── EnrichmentModule     - Gemini API calls with key rotation
├── DeduplicationModule  - Redis sorted sets
├── TelegramModule       - bot commands and message delivery
└── DashboardModule      - web UI for monitoring, served from the same process
\`\`\`

This is the broader lesson: **architecture choices are always contextual, not universal.** Microservices are not automatically "better" than a monolith, and a monolith is not automatically "simpler is best" dogma. The right answer depends on the workload's shape, the team size, the scaling requirements, and the operational budget. For an I/O bound automation tool run by a single developer on a free hosting tier, a monolith is the more sophisticated choice, not the naive one.

In an interview, when asked why jobsScrapper is a monolith while NexusPay is microservices, say: "The workload is I/O bound HTTP calls to external APIs, not CPU bound processing, so there is no component that needs to scale independently of the others. It's a single-developer tool, so the coordination overhead of separate services and a message broker would add complexity without adding value. NexusPay splits into services because it models distinct business domains with different scaling needs and failure isolation requirements. Architecture should match the problem, not a template."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-scheduling',
      title: 'The scheduling system: how a job runs every 3 hours',
      content: `
A scraper that only runs when you manually trigger it is not automation, it is a script. The entire value of jobsScrapper comes from the fact that it wakes up on its own, on a fixed schedule, without anyone remembering to run it.

NestJS provides this through the **@nestjs/schedule** package, which wraps the well-known \`cron\` library in decorators that integrate with Nest's dependency injection. The core piece is the \`@Cron\` decorator:

\`\`\`typescript
// src/scraper/scraper.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScraperOrchestratorService } from './scraper-orchestrator.service';

@Injectable()
export class ScraperScheduler {
  private readonly logger = new Logger(ScraperScheduler.name);
  private isRunning = false;

  constructor(private readonly orchestrator: ScraperOrchestratorService) {}

  @Cron('0 */3 * * *') // every 3 hours, on the hour
  async handleScheduledScan(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Previous scan still running, skipping this trigger');
      return;
    }

    this.isRunning = true;
    try {
      await this.orchestrator.runFullScan();
    } catch (error) {
      this.logger.error('Scheduled scan failed', error);
    } finally {
      this.isRunning = false;
    }
  }
}
\`\`\`

The \`isRunning\` flag is the detail most people miss. NestJS's scheduler fires \`@Cron\` on the wall clock regardless of whether the previous invocation finished. If a scan of 18 job boards takes longer than 3 hours - which can happen if several boards are slow or rate limiting kicks in - the next scheduled trigger would start a second scan on top of the first, doubling the load on every external API and doubling Redis writes. The flag makes each scan effectively single-flight: if one is still in progress when the next cron tick fires, that tick is skipped entirely and the next opportunity is 3 hours later.

The second piece worth understanding is that jobsScrapper is a **web service**, not a background worker, even though its main job is a background task. It starts an HTTP server on boot, and that server exposes a \`/health\` endpoint:

\`\`\`typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; uptime: number } {
    return { status: 'ok', uptime: process.uptime() };
  }
}
\`\`\`

Render, the hosting platform, pings this endpoint periodically to confirm the service is alive. Render's free tier spins down web services after a period of inactivity and spins background workers down even more aggressively, so running jobsScrapper as a web service with a real healthcheck is what keeps the cron scheduler alive between scans. The scheduler and the HTTP server run inside the same NestJS process, sharing the same event loop: the web server handles the occasional healthcheck ping and dashboard request, while the cron job runs its 3-hourly scan, and NestJS's async, non-blocking nature means neither blocks the other for meaningful periods.

A natural interview follow-up is to compare this to a dedicated scheduler like **Bull** (a Redis-backed job queue for Node.js) or a cloud function triggered by a cron rule. Bull is the right tool when you need job persistence across restarts, retries with backoff, job priorities, or many different job types competing for a limited pool of workers. jobsScrapper has exactly one recurring job type, running on one predictable schedule, with no need for a job to be re-queued if the process is mid-restart, since the next cron tick will simply run it again 3 hours later. A cloud function (like AWS Lambda on a schedule) is the right tool when you want to pay only for execution time and have no other reason to keep a server running. jobsScrapper already needs a running server for the Telegram webhook and the dashboard, so paying for that server and reusing it for the cron job is the simpler choice than spinning up a separate serverless deployment.

In an interview, say: "@nestjs/schedule gives me a @Cron decorator running every 3 hours inside the same process that serves the health endpoint. I guard against overlapping runs with an isRunning flag, because a slow scan could otherwise still be executing when the next cron tick fires. I chose this over Bull because I have exactly one recurring job with no need for persistence or retries beyond 'try again in 3 hours,' and I chose a web service over a background worker specifically because Render needs a healthcheck endpoint to keep it alive on the free tier."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-adapter-pattern',
      title: 'Scraping 18 job boards: the adapter pattern in practice',
      content: `
Eighteen job boards means eighteen different APIs, eighteen different pagination styles, and eighteen different response shapes. One board returns paginated JSON with a \`nextPageToken\`. Another uses offset and limit query parameters. A third returns everything in one call but rate limits you to one request per second. If you write this as one giant function with a switch statement per board, every new board you add makes that function bigger and every existing board risks breaking when you touch it.

The fix is the **adapter pattern**. Each job board gets its own class that implements a common interface. The orchestrator that runs the scan does not know or care how any individual board's API works. It only knows that every adapter exposes a \`fetchJobs()\` method that returns a normalized list of jobs.

\`\`\`typescript
// src/scraper/sources/job-source.interface.ts
export interface RawJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  postedAt: string;
}

export interface JobSource {
  readonly name: string;
  fetchJobs(): Promise<RawJob[]>;
}
\`\`\`

Here is what two genuinely different adapters look like. One board paginates with a token:

\`\`\`typescript
// src/scraper/sources/greenhouse.adapter.ts
@Injectable()
export class GreenhouseAdapter implements JobSource {
  readonly name = 'greenhouse';

  async fetchJobs(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.httpClient.get('/v1/boards/jobs', {
        params: { page_token: pageToken, per_page: 100 },
      });
      jobs.push(...response.data.jobs.map(this.normalize));
      pageToken = response.data.next_page_token;
    } while (pageToken);

    return jobs;
  }

  private normalize(raw: GreenhouseJobDto): RawJob {
    return {
      externalId: String(raw.id),
      title: raw.title,
      company: raw.company_name,
      location: raw.location?.name ?? 'Remote',
      url: raw.absolute_url,
      description: raw.content,
      postedAt: raw.updated_at,
    };
  }
}
\`\`\`

Another board paginates with a simple offset and has no page token at all:

\`\`\`typescript
// src/scraper/sources/lever.adapter.ts
@Injectable()
export class LeverAdapter implements JobSource {
  readonly name = 'lever';

  async fetchJobs(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await this.httpClient.get('/v0/postings', {
        params: { offset, limit },
      });
      const batch: LeverPostingDto[] = response.data;
      if (batch.length === 0) break;

      jobs.push(...batch.map(this.normalize));
      offset += limit;
    }

    return jobs;
  }

  private normalize(raw: LeverPostingDto): RawJob {
    return {
      externalId: raw.id,
      title: raw.text,
      company: raw.categories.team,
      location: raw.categories.location,
      url: raw.hostedUrl,
      description: raw.descriptionPlain,
      postedAt: new Date(raw.createdAt).toISOString(),
    };
  }
}
\`\`\`

The orchestrator has no idea that one adapter uses page tokens while the other uses offsets. It just calls \`fetchJobs()\` on every registered source and merges the results:

\`\`\`typescript
// src/scraper/scraper-orchestrator.service.ts
@Injectable()
export class ScraperOrchestratorService {
  constructor(@Inject('JOB_SOURCES') private readonly sources: JobSource[]) {}

  async runFullScan(): Promise<RawJob[]> {
    const results = await Promise.allSettled(
      this.sources.map((source) => source.fetchJobs()),
    );

    const jobs: RawJob[] = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        jobs.push(...result.value);
      } else {
        this.logger.error(\`Adapter \${this.sources[i].name} failed\`, result.reason);
      }
    });

    return jobs;
  }
}
\`\`\`

Adding a nineteenth job board means writing one new class that implements \`JobSource\` and registering it in the \`JOB_SOURCES\` provider array. Nothing about the orchestrator, the filtering pipeline, or any existing adapter needs to change. This is the **Open/Closed Principle** in practice: the system is open to extension (new adapters) but closed to modification (existing code stays untouched).

The \`Promise.allSettled\` in the orchestrator is doing real work too. If it used \`Promise.all\` instead, a single failing adapter would reject the entire scan and jobsScrapper would return zero jobs for that run, even though 17 other boards succeeded. \`allSettled\` lets every adapter run to completion independently, so one board's outage costs you that board's jobs for this cycle, not the entire scan.

In an interview, say: "Each job board is an adapter implementing a common JobSource interface with one method, fetchJobs. The orchestrator calls every adapter through Promise.allSettled and merges the results, so one board failing does not take down the scan. Adding a new board is adding one new class, never touching existing adapters. That's the Open/Closed Principle solving a real problem I had: 18 completely different pagination styles behind one uniform contract."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-redis-dedup',
      title: 'Deduplication with Redis: never send the same job twice',
      content: `
A scan runs every 3 hours. Job boards do not remove postings between scans. Without deduplication, jobsScrapper would send you the same 200 jobs, forever, every 3 hours, until you muted the bot out of frustration. Deduplication is not an optimization here, it is the difference between a usable tool and spam.

The service uses **Upstash Redis** for this, and the choice of Upstash specifically (rather than a self-hosted Redis) matters. Upstash is a serverless Redis offering accessed over a REST API rather than the native Redis wire protocol. Render's free tier does not support sidecar containers, so there is no straightforward way to run a Redis instance alongside the NestJS service on the same box. Upstash solves this by being reachable over plain HTTPS from anywhere, including a stateless web service that only has outbound HTTP access.

The data structure that makes deduplication with automatic expiry practical is the **sorted set**. A sorted set stores members with an associated numeric score, and Redis keeps them ordered by that score. jobsScrapper uses the job's timestamp as the score:

\`\`\`typescript
// src/dedup/dedup.service.ts
@Injectable()
export class DedupService {
  private readonly SEEN_TTL_MS = 48 * 60 * 60 * 1000;   // 48 hours
  private readonly SENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days
  private readonly APPLIED_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

  constructor(private readonly redis: Redis) {}

  async markSeen(jobId: string): Promise<void> {
    const now = Date.now();
    await this.redis.zadd('jobs:seen', { score: now, member: jobId });
    // Sweep entries older than the TTL on every write - cheap and keeps the set bounded
    await this.redis.zremrangebyscore('jobs:seen', 0, now - this.SEEN_TTL_MS);
  }

  async hasBeenSeen(jobId: string): Promise<boolean> {
    const score = await this.redis.zscore('jobs:seen', jobId);
    return score !== null;
  }

  async markSent(jobId: string): Promise<void> {
    await this.redis.zadd('jobs:sent', { score: Date.now(), member: jobId });
  }
}
\`\`\`

Because the score is a timestamp, expiring old entries is a single \`ZREMRANGEBYSCORE\` call: remove every member whose score falls below "now minus the TTL." There is no separate expiry job, no per-key \`EXPIRE\` command to manage individually, and no risk of the set growing forever, since every write also sweeps out anything past its TTL.

The three TTLs are deliberately different because they answer different questions. **Seen** (48 hours) answers "have I already shown this job in a recent scan?" - short, because the point is just to avoid re-processing the same posting across back-to-back runs. **Sent** (30 days) answers "have I already delivered this to Telegram?" - long enough that a job reposted a week later is still recognized as a repeat. **Applied** (180 days) answers "did I already apply to this role, or explicitly dismiss it?" - long enough to survive a job being taken down and reposted months later under a new URL.

That last case is why deduplication goes one level deeper than just the job ID. If you applied to a company for a "Backend Engineer" role and that exact posting is later reposted with a brand new URL (a very common practice on job boards), a naive ID-based check sees a new ID and lets it through. jobsScrapper also tracks a company-plus-normalized-role key:

\`\`\`typescript
async hasAppliedOrDismissed(company: string, roleTitle: string): Promise<boolean> {
  const key = \`\${company.toLowerCase()}::\${this.normalizeTitle(roleTitle)}\`;
  const score = await this.redis.zscore('jobs:applied-or-dismissed', key);
  return score !== null;
}
\`\`\`

Every job is checked against \`jobs:seen\` before it enters the filtering pipeline at all, which saves the cost of scoring and potentially calling Gemini on something you already processed. It is then checked against the applied-or-dismissed set before delivery, which catches the repost case that a pure ID check would miss.

The natural interview question is why a sorted set instead of a plain key-value store with individual \`EXPIRE\` commands on each key. Both would technically work, but the sorted set gives you a **range query for free**: "give me everything older than X" is one command, \`ZREMRANGEBYSCORE\`, rather than iterating every key to check its own expiry individually. The score being a timestamp turns time-based cleanup into a native Redis operation instead of application logic you would otherwise have to write and run on your own schedule.

In an interview, say: "I use Redis sorted sets with the job's timestamp as the score, which turns TTL cleanup into a single ZREMRANGEBYSCORE call instead of tracking individual expirations. Seen jobs expire after 48 hours, sent jobs after 30 days, applied jobs after 180 days, because those answer different questions with different acceptable staleness windows. I also deduplicate on company plus normalized role, not just job ID, because boards repost the same listing under a new URL and an ID-only check would let that slip through. I chose Upstash specifically because Render's free tier can't run a sidecar Redis container, and Upstash exposes Redis over plain HTTPS."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-filtering-pipeline',
      title: 'The filtering pipeline: from thousands of jobs to tens of matches',
      content: `
Eighteen job boards scanned every 3 hours produce a lot of noise. Most postings are not backend roles, not the right seniority, not the right tech stack, or not in a location that works. If every single one of those jobs went straight to Gemini for AI enrichment, the daily API quota would be gone in the first scan and most of it would be spent scoring jobs that were never going to be a match anyway.

The fix is a **mandatory scoring gate** that runs before any AI call. A job needs to score at least 42 points across three signals to even be considered:

\`\`\`typescript
// src/filter/scoring.service.ts
interface ScoreBreakdown {
  hasNodeSignal: boolean;   // Node.js, NestJS, or Express.js mentioned -> +24
  hasTsSignal: boolean;     // TypeScript or JavaScript mentioned -> +18
  hasRoleSignal: boolean;   // backend, API, or microservice in the title/description -> +18
  total: number;
}

const MIN_SCORE = 42;

function scoreJob(description: string, title: string): ScoreBreakdown {
  const text = \`\${title} \${description}\`.toLowerCase();

  const hasNodeSignal = /\\b(node\\.?js|nestjs|express\\.?js)\\b/.test(text);
  const hasTsSignal = /\\b(typescript|javascript)\\b/.test(text);
  const hasRoleSignal = /\\b(backend|back-end|api|microservice)\\b/.test(text);

  const total =
    (hasNodeSignal ? 24 : 0) +
    (hasTsSignal ? 18 : 0) +
    (hasRoleSignal ? 18 : 0);

  return { hasNodeSignal, hasTsSignal, hasRoleSignal, total };
}
\`\`\`

The specific weights are not arbitrary. Node.js, NestJS, or Express.js being mentioned is the strongest possible signal that this is genuinely a Node backend role, so it carries the most points, 24. TypeScript or JavaScript alone is weaker, because plenty of full-stack .NET or Java shops mention TypeScript purely because their frontend is React, so it only carries 18. The role-type signal, backend, API, or microservice appearing in the text, adds another 18.

Look closely at what 42 as the threshold actually filters out. A posting that mentions TypeScript and describes itself as a full-stack role but never mentions Node.js scores 18 (TypeScript) plus 18 (role signal, if "API" appears somewhere) at most, 36 points, below the 42 threshold. That is exactly the .NET-or-Java-backend-with-a-TypeScript-React-frontend pattern the threshold is designed to catch. It "smells" like a match on a naive keyword search but is not one, because the actual backend work is in C# or Java, not the Node ecosystem a Node.js developer is targeting.

Passing the scoring gate is necessary but not sufficient. A separate set of **hard filters** runs afterward, and these are rejections, not scores - a job either passes or it does not, with no partial credit:

\`\`\`typescript
// src/filter/hard-filters.service.ts
const TITLE_EXCLUSIONS = /\\b(intern|senior|staff|lead|principal)\\b/i;
const ROLE_EXCLUSIONS = /\\b(frontend|front-end|machine learning|ml engineer|devops|sre)\\b/i;

function passesHardFilters(job: ScoredJob, profile: CandidateProfile): boolean {
  if (TITLE_EXCLUSIONS.test(job.title)) return false;
  if (ROLE_EXCLUSIONS.test(job.title) || ROLE_EXCLUSIONS.test(job.description)) return false;
  if (job.salaryMax !== undefined && job.salaryMax < profile.minSalary) return false;
  if (!profile.allowedLocations.some((loc) => job.location.includes(loc))) return false;
  return true;
}
\`\`\`

The distinction between scoring and hard filtering is worth being precise about in an interview, because it is a common point of confusion. **Scoring ranks** how strong a candidate signal is: a job can score 42 or 90, and both pass, but 90 is a better match. **Hard filters reject outright**: seniority, role type, salary floor, and location are yes-or-no gates where there is no meaningful partial match. A "Senior Backend Engineer" role is not "60 percent a match", it is simply the wrong seniority level, so it is excluded rather than scored down.

Only jobs that clear both the scoring gate and the hard filters ever reach Gemini. By the time the AI enrichment step runs, the job is already a credible, on-profile match. This ordering (cheap deterministic filtering first, expensive AI calls last) is what keeps API quota available for jobs actually worth spending it on, and it is a pattern that generalizes well beyond job scraping: always run your cheapest, most deterministic checks before your most expensive, least deterministic ones.

In an interview, say: "There's a two-stage filter before any job reaches the AI. First, a scoring gate: Node.js signals, TypeScript signals, and role-type signals each add points, and a job needs 42 out of a possible 60 to pass. That threshold specifically rejects the pattern of TypeScript-mentioned-but-no-Node.js, which is usually a .NET or Java shop with a React frontend. Second, hard filters for seniority, role type, salary floor, and location, which are rejections, not scores, because those are yes-or-no gates, not degrees of match. Only jobs that clear both stages reach Gemini, which keeps the AI quota for jobs that are already credible matches."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-gemini-enrichment',
      title: 'Gemini AI enrichment: one call per job, eight outputs',
      content: `
Once a job clears the filtering pipeline, it deserves a closer look than regex patterns can give it. That closer look is one call to the Gemini API, and the design constraint that shaped everything about this step is simple to state and hard to satisfy: get everything useful out of a single API call, because API quota is limited and every extra call per job multiplies the cost of running 18 boards every 3 hours.

A single, carefully engineered prompt produces eight distinct outputs from one Gemini call:

\`\`\`typescript
// src/enrichment/enrichment.types.ts
interface JobEnrichment {
  relevanceScore: number;       // 0-100, drop if below 55
  fraudScore: number;           // 0-100, drop if 72 or above
  companyQualityScore: number;  // 0-100, signal only, no hard cutoff
  visaCompatible: boolean;      // does the posting support APS/skilled-worker visa sponsorship
  atsKeywordGaps: string[];     // up to 8 keywords missing from the CV, with where to add them
  coverLetter: string;          // 3 paragraphs, 140-175 words
  hiringManagerEmail: string | null;
  salaryEstimate: { min: number; max: number; currency: string } | null;
}
\`\`\`

Two of these outputs act as additional drop gates, layered on top of the earlier scoring and hard filters. A **relevance score** below 55 means Gemini itself, reading the full posting with actual language understanding rather than regex, does not think this is a strong match, and the job is dropped even though it passed the mechanical filters. A **fraud score** at 72 or above flags a posting with characteristics common to scam listings (vague company details, unrealistic salary promises, requests for payment or personal banking information early in the process) and the job is dropped regardless of how well it otherwise matches.

The **ATS keyword gap analysis** is the output that turns this from a filter into a genuinely useful tool. Rather than just telling you a job matches, it tells you up to 8 specific keywords from the posting that are missing from your CV, and where in the CV they would fit naturally, so you can update your CV for that specific application before an Applicant Tracking System filters you out for a missing keyword. The **cover letter** is generated to a strict format, 3 paragraphs and 140 to 175 words, and is instructed to reference specific real projects (this is where mentioning NexusPay or jobsScrapper by name in the prompt context pays off) rather than generic filler language.

The prompt itself is the real intellectual work here, more than any of the surrounding NestJS code. It has to instruct Gemini to return all eight fields in one structured response, handle the case where some fields genuinely do not apply (not every posting lists a hiring manager email or a salary range), and be strict enough about output format that the response can be parsed reliably:

\`\`\`typescript
// src/enrichment/gemini-prompt.builder.ts
function buildEnrichmentPrompt(job: FilteredJob, profile: CandidateProfile): string {
  return \`You are screening one job posting for a backend engineering candidate.

Job title: \${job.title}
Company: \${job.company}
Description: \${job.description}

Candidate profile: \${profile.summary}
Candidate CV keywords: \${profile.cvKeywords.join(', ')}

Return ONLY valid JSON matching this exact shape, no markdown fences:
{
  "relevanceScore": <0-100>,
  "fraudScore": <0-100>,
  "companyQualityScore": <0-100>,
  "visaCompatible": <boolean>,
  "atsKeywordGaps": [{ "keyword": "...", "whereToAdd": "..." }],
  "coverLetter": "<3 paragraphs, 140-175 words, reference specific candidate projects>",
  "hiringManagerEmail": "<email or null>",
  "salaryEstimate": { "min": <number>, "max": <number>, "currency": "..." } | null
}\`;
}
\`\`\`

Malformed JSON from the model is not a hypothetical edge case, it happens regularly enough that the parsing step has to expect it. The response is stripped of markdown code fences (models frequently wrap JSON in \`\`\`json blocks even when told not to), parsed defensively, and if parsing still fails, the job falls back to being sent without AI enrichment rather than being silently dropped:

\`\`\`typescript
// src/enrichment/enrichment.service.ts
async enrichJob(job: FilteredJob, profile: CandidateProfile): Promise<JobEnrichment | null> {
  const prompt = buildEnrichmentPrompt(job, profile);
  const raw = await this.geminiClient.generateContent(prompt);

  try {
    const cleaned = raw.replace(/^\`\`\`[a-z]*\\n?/i, '').replace(/\`\`\`$/m, '').trim();
    return JSON.parse(cleaned) as JobEnrichment;
  } catch {
    this.logger.warn(\`Gemini returned unparseable JSON for job \${job.externalId}\`);
    return null;
  }
}
\`\`\`

In an interview, say: "Each job that passes filtering gets exactly one Gemini call that returns eight fields: a relevance score and fraud score that act as additional drop gates beyond my mechanical filters, a company quality signal, visa compatibility, up to 8 ATS keyword gaps with where to add them, a tailored cover letter, hiring manager email if present, and a salary estimate. Getting all eight from one call, instead of eight separate calls, is what makes running this across hundreds of jobs per scan affordable on a free-tier quota. The prompt engineering, getting reliable structured output for eight different fields in one shot, was the actual hard part. I also parse defensively, since models occasionally wrap JSON in markdown fences or return slightly malformed output, and a job falls back to no-enrichment rather than being dropped if parsing fails."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-key-rotation',
      title: 'Key rotation and quota management',
      content: `
The free tier of the Gemini API gives 1,500 requests per day per API key. That sounds generous until you do the arithmetic for this specific system: 18 job boards, scanned every 3 hours, means 8 scans a day, and even a modest few dozen enriched jobs per scan adds up to hundreds of Gemini calls daily. One key gets exhausted well before the day is over, and once it is, every subsequent job in that day would get nothing.

The fix is to spread the load across multiple independent quota buckets. Google grants a separate 1,500-request daily quota **per API key**, and keys from different Google accounts are fully independent of each other. jobsScrapper supports up to 10 keys, each pulled from a different account, and rotates between them automatically:

\`\`\`typescript
// src/enrichment/gemini-key-rotation.service.ts
@Injectable()
export class GeminiKeyRotationService {
  private readonly keys: string[];
  private readonly blacklistedUntilReset = new Set<string>();
  private currentIndex = 0;

  constructor(config: ConfigService) {
    this.keys = config
      .get<string>('GEMINI_KEYS', '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  getActiveKey(): string | null {
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[idx];
      if (!this.blacklistedUntilReset.has(key)) {
        this.currentIndex = idx;
        return key;
      }
    }
    return null; // every key is exhausted for this run
  }

  blacklistKey(key: string): void {
    this.blacklistedUntilReset.add(key);
    this.logger.warn(\`Key \${this.mask(key)} hit quota, blacklisted until next reset\`);
  }

  private mask(key: string): string {
    return key.slice(0, 6) + '...';
  }
}
\`\`\`

When a request comes back with a 429 status (Google's quota-exceeded response), the calling code blacklists that specific key for the rest of the current process run and immediately retries with the next available key, rather than surfacing the failure up to the job pipeline:

\`\`\`typescript
async callGeminiWithRotation(prompt: string): Promise<string> {
  for (let attempt = 0; attempt < this.keyRotation.keyCount; attempt++) {
    const key = this.keyRotation.getActiveKey();
    if (!key) break; // all keys exhausted

    try {
      return await this.callGeminiApi(key, prompt);
    } catch (error) {
      if (this.isQuotaError(error)) {
        this.keyRotation.blacklistKey(key);
        continue; // try the next key
      }
      throw error; // a real error, not a quota issue - do not retry with a different key
    }
  }

  return null; // every key exhausted, caller falls back
}
\`\`\`

Google resets Gemini's free-tier quota at **midnight Pacific time**, not at a fixed number of hours after first use, which is a detail that matters for correctness. The blacklist is scoped to the current process run rather than persisted, which works because Render's free tier restarts the process periodically anyway and because the reset is tied to a specific wall-clock time rather than an elapsed duration - tracking it as "blacklisted until the process restarts or midnight Pacific passes, whichever comes first" is simpler than persisting exact reset timestamps per key across restarts, and it degrades safely: worst case, a key that was actually usable again gets skipped for a bit longer than strictly necessary, never the opposite.

The most important design decision here is not the rotation logic itself, but what happens when rotation is not enough. If all 10 keys are exhausted in the same scan, jobsScrapper does not crash and does not drop the remaining jobs. It falls back to a **static cover letter template** and skips only the AI-specific fields (relevance score, fraud score, ATS gaps), sending the job through with whatever mechanical filtering already qualified it:

\`\`\`typescript
async enrichOrFallback(job: FilteredJob, profile: CandidateProfile): Promise<JobEnrichment> {
  const aiResult = await this.tryGeminiEnrichment(job, profile);
  if (aiResult) return aiResult;

  return {
    relevanceScore: null,
    fraudScore: null,
    companyQualityScore: null,
    visaCompatible: null,
    atsKeywordGaps: [],
    coverLetter: this.fallbackTemplate(job, profile),
    hiringManagerEmail: null,
    salaryEstimate: null,
  };
}
\`\`\`

This same multi-key rotation pattern, cycling through keys, blacklisting on 429, tracking the shared reset window, is reused later in the backend-interview-forge platform's own Gemini integration, because the underlying problem, a single free-tier API key not being enough for real usage, is exactly the same one.

In an interview, say: "The free Gemini tier gives 1,500 requests per day per key, and 18 boards scanned every 3 hours needs more than that. I support up to 10 keys from separate Google accounts, each with its own independent quota, and rotate to the next key whenever one returns a 429. If every key is exhausted, the system doesn't fail, it falls back to a static cover letter template and skips the AI-specific fields, so jobs still get delivered with whatever mechanical filtering already qualified them. That's the general principle I'd apply to any third-party dependency: design for graceful degradation, not just the happy path."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-telegram',
      title: 'Telegram as the notification layer',
      content: `
Every job matching tool eventually faces the same question: how does the user actually see the results? The conventional answer is a web dashboard, and jobsScrapper does have one, but it is not where day-to-day usage happens. That happens entirely inside Telegram, and the reasoning behind that choice is worth explaining clearly, because it is a genuinely good engineering trade-off, not a shortcut.

A **Telegram bot** is a program that sends and receives messages through Telegram's Bot API, using a token issued when you register the bot with Telegram's BotFather. Once jobsScrapper has a matching job with its Gemini enrichment attached, it formats everything into a single message and pushes it directly to a configured chat:

\`\`\`typescript
// src/telegram/telegram-notifier.service.ts
@Injectable()
export class TelegramNotifierService {
  constructor(private readonly bot: TelegramBotClient, private readonly config: ConfigService) {}

  async sendJobMatch(job: EnrichedJob): Promise<void> {
    const text = this.formatMessage(job);
    const chatId = this.config.getOrThrow('TELEGRAM_CHAT_ID');

    await this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Applied', callback_data: \`applied:\${job.externalId}\` },
          { text: '❌ Reject', callback_data: \`reject:\${job.externalId}\` },
        ]],
      },
    });
  }

  private formatMessage(job: EnrichedJob): string {
    return [
      \`*\${job.title}* at *\${job.company}*\`,
      \`📍 \${job.location}\`,
      \`Score: \${job.scoreBreakdown.total}/60 | Relevance: \${job.enrichment.relevanceScore}/100\`,
      \`Visa: \${job.enrichment.visaCompatible ? '✅ compatible' : '⚠️ check manually'}\`,
      job.enrichment.salaryEstimate
        ? \`Salary: \${job.enrichment.salaryEstimate.min}-\${job.enrichment.salaryEstimate.max} \${job.enrichment.salaryEstimate.currency}\`
        : null,
      \`ATS gaps: \${job.enrichment.atsKeywordGaps.map((g) => g.keyword).join(', ') || 'none'}\`,
      \`\\n📝 Cover letter:\\n\${job.enrichment.coverLetter}\`,
      \`\\n🔗 \${job.url}\`,
    ].filter(Boolean).join('\\n');
  }
}
\`\`\`

The two **inline keyboard buttons**, Applied and Reject, are what turn this from a one-way notification into an interactive tool. Telegram delivers button taps back to the bot as a callback query, which a webhook handler in jobsScrapper receives and uses to update the job's state in Redis, the same deduplication store covered earlier, without the user ever leaving the chat:

\`\`\`typescript
@Post('telegram/webhook')
async handleCallback(@Body() update: TelegramUpdate): Promise<void> {
  const callback = update.callback_query;
  if (!callback) return;

  const [action, jobId] = callback.data.split(':');
  if (action === 'applied') {
    await this.dedupService.markApplied(jobId);
  } else if (action === 'reject') {
    await this.dedupService.markDismissed(jobId);
  }

  await this.bot.answerCallbackQuery(callback.id, { text: 'Updated' });
}
\`\`\`

This whole pattern, a bot as the primary interface rather than a web frontend, is worth naming precisely: it is a **bot-based UI**. Building it out took a fraction of the time a web dashboard with authentication, a job list view, and interactive state controls would have taken, because Telegram already provides the rendering, the notifications, the mobile app, and the message history for free. It works on a phone automatically, with no responsive design work, no separate mobile app, because Telegram's own client handles that. And it needs **zero authentication code**, because the chat ID itself is the access control: only whoever is a member of that specific Telegram chat receives or can interact with these messages.

The web dashboard at \`/\` still exists, and it is not redundant. It is there for monitoring (scan history, error logs, quota usage per Gemini key) and for bulk operations (mass-dismissing a batch of jobs, adjusting the candidate profile) that do not fit naturally into a chat interface. But the actual daily loop, seeing a new match and deciding to apply or reject, happens entirely in Telegram.

In an interview, say: "I chose a Telegram bot as the primary interface instead of building a web frontend for day-to-day use. Telegram gives you push notifications, a mobile client, message history, and interactive buttons for free, and the chat ID itself is the authentication, so there's zero auth code to write. Building and maintaining a web UI with the same interactivity would have taken far longer for a tool only I use. I'd choose a web UI over a bot when the tool needs to serve multiple users with different permissions, needs rich visual data like charts or tables, or needs to be discoverable by people who don't already have a specific chat set up. For a personal automation tool, a bot won on every axis that mattered."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-deployment',
      title: 'Deployment on Render with Upstash Redis',
      content: `
Every architectural decision covered so far, the monolith, the scheduling model, the Redis choice, has been shaped by one constraint sitting underneath all of them: this service runs on Render's **free tier**. Understanding that constraint, and how the deployment was designed around it rather than in spite of it, is what makes the operational side of jobsScrapper worth discussing in an interview.

Render offers a few different service types, and the choice between them is not cosmetic. A **background worker** on Render's free tier is spun down aggressively after periods of inactivity, and there is no way to ping a background worker to keep it alive, since it does not expose an HTTP endpoint. A **web service**, by contrast, can be kept alive by an external or Render-native healthcheck that periodically hits an HTTP endpoint. jobsScrapper is deployed as a web service specifically so that the \`/health\` endpoint covered in the scheduling lesson gives it a reason to stay running between the 3-hourly scans, even though its actual job is a background task, not serving traffic.

\`\`\`yaml
# render.yaml
services:
  - type: web
    name: jobs-scrapper
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: node dist/main.js
    healthCheckPath: /health
    envVars:
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: GEMINI_KEYS
        sync: false
      - key: UPSTASH_REDIS_REST_URL
        sync: false
      - key: UPSTASH_REDIS_REST_TOKEN
        sync: false
\`\`\`

**Upstash Redis** solves a specific gap in what Render's free tier offers. A normal Redis deployment needs either its own managed database service or a sidecar container running alongside your application in the same environment, and Render's free web services do not support attaching sidecar containers. Upstash instead exposes Redis over a REST API rather than the native Redis TCP protocol, which means any environment that can make an HTTPS request can use it, no persistent TCP connection, no VPC networking, no sidecar required. It happens to also have a usable free tier, which matters for a project designed to cost nothing to operate.

Secrets, the Telegram bot token, the Gemini API keys, the Upstash REST credentials, are configured directly in Render's dashboard as environment variables, marked \`sync: false\` in the render.yaml above so they are never committed to source control and must be set manually per environment. NestJS's \`ConfigModule\` reads them from \`process.env\` at boot, the same pattern used throughout NexusPay.

The last piece is **auto-deploy from the main branch**. Render is configured to watch the repository and redeploy automatically whenever main is pushed to. This closes the loop on the entire development cycle: pushing a code change is the deployment, there is no separate manual deploy step, no build artifact to upload by hand. For a single-developer project, this removes an entire category of operational friction, at the cost of having no staging environment or deploy approval gate, which is an acceptable trade-off when you are both the only developer and the only person affected if a deploy goes wrong.

The honest trade-offs of the free tier are worth naming directly rather than glossing over. Free web services on Render can still experience cold starts or brief downtime around redeploys, there is no guaranteed uptime SLA, and resource limits (CPU, memory) are modest compared to a paid instance. None of these are disqualifying for a personal tool checking job boards every 3 hours, but they would be real concerns for a service with paying users or strict availability requirements, at which point the trade-off calculus would flip toward a paid tier or a different provider entirely.

In an interview, say: "It's deployed on Render's free tier as a web service, not a background worker, specifically because a web service can be kept alive with a healthcheck endpoint while free-tier background workers get spun down with no way to ping them back awake. Redis is Upstash rather than self-hosted, because Render's free tier doesn't support sidecar containers, and Upstash exposes Redis over REST so it works from any HTTP-capable environment. Auto-deploy from main means pushing code is the whole deployment pipeline. The trade-offs are real, no uptime SLA, occasional cold starts, but they're acceptable for a personal tool and I'd revisit every one of those decisions the moment this needed to serve other people or guarantee availability."
      `.trim(),
    },
    {
      id: 'jobs-scrapper-interview-qa',
      title: 'The questions interviewers will ask about jobsScrapper',
      content: `
By the time an interviewer has heard the two-sentence summary of jobsScrapper, a small set of questions comes up almost every time. Having a precise, confident answer ready for each one, rather than reconstructing the reasoning on the spot, is the difference between sounding like you built this and sounding like you are describing something you read about.

**"Walk me through the architecture."**
One NestJS service running as a single process on Render. A scheduled task, using @nestjs/schedule's @Cron decorator, fires every 3 hours. It runs 18 adapter classes implementing a common JobSource interface, each scraping a different job board. Results pass through a scoring gate and hard filters before anything expensive happens, then qualifying jobs get one Gemini API call each for AI enrichment. Redis, hosted on Upstash, tracks which jobs have already been seen, sent, applied to, or dismissed, with sorted sets giving automatic TTL-based expiry. Matches are delivered to Telegram with inline buttons for updating job state. A lightweight web dashboard exists for monitoring and bulk operations, but daily usage happens entirely in Telegram.

**"Why a monolith and not microservices?"**
Single developer, I/O bound workload calling external HTTP APIs, no component that needs to scale independently of the others. Microservices earn their complexity when different parts of a system have genuinely different scaling or team-ownership needs. None of that applies here, so a monolith is simpler to deploy, monitor, and debug, and simplicity is the correct choice at this scale, not a compromise.

**"How do you handle API failures from job boards?"**
Every adapter call happens inside a try/catch, orchestrated through \`Promise.allSettled\` rather than \`Promise.all\`. A failed adapter logs the error and contributes an empty result for that scan. One board being down costs you that board's jobs for this cycle, it does not fail the entire scan or block the other 17 adapters from completing.

**"What happens when Gemini quota is exhausted?"**
Key rotation across up to 10 keys from separate Google accounts, each with its own 1,500-request daily quota. A 429 response blacklists that key for the current run and the next key is tried immediately. If every key is exhausted, the system does not drop the job, it falls back to a static cover letter template and skips only the AI-specific fields, so jobs are still delivered with whatever mechanical filtering already qualified them.

**"How do you prevent sending the same job twice?"**
Redis sorted sets keyed by job ID, with the timestamp as the score, which turns TTL cleanup into a single \`ZREMRANGEBYSCORE\` call. Different TTLs for different questions: seen jobs expire in 48 hours, sent jobs in 30 days, applied jobs in 180 days. Deduplication also runs on company plus normalized role, not just job ID, to catch the common case of a board reposting the same listing under a new URL.

**"How would you scale this if it needed to handle 10x more jobs?"**
The honest answer starts with what would actually break first: probably the single-process scan taking too long for the 3-hour window, and Gemini quota running out even faster relative to volume. The fix is to extract each job board adapter into its own worker process, so a slow board does not extend the wall-clock time of the whole scan, and introduce a proper job queue like Bull or BullMQ to distribute and retry individual scraping and enrichment tasks rather than running everything sequentially inside one cron tick. Redis keys would need partitioning by source to avoid one enormous set becoming a bottleneck. This is exactly the point at which the monolith-versus-microservices trade-off would flip: at 10x the volume, independent scaling per job board stops being a nice-to-have and starts being necessary.

In an interview, treat each of these as a starting point, not a script to recite verbatim. The goal is to sound like someone who made these decisions and can defend them under a follow-up question, not someone who memorized a paragraph.
      `.trim(),
    },
  ],
};
