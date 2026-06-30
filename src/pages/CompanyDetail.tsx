import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lightbulb,
  ListChecks,
  MessageSquare,
  ChevronLeft,
  BrainCircuit,
} from 'lucide-react';
import { companyById } from '../data/companies';

export function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const company = companyId ? companyById[companyId] : undefined;

  if (!company) {
    return (
      <div className="py-20 text-center text-muted">
        <p className="text-lg font-medium">Company not found.</p>
        <Link to="/companies" className="mt-3 inline-block text-sm text-primary hover:underline">
          ← Back to companies
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Back */}
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition"
      >
        <ChevronLeft className="h-4 w-4" />
        All companies
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{company.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {company.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary"
            >
              {tech}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted leading-relaxed">{company.why}</p>
      </div>

      {/* Interview process */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <ListChecks className="h-4 w-4" />
          Interview process
        </h2>
        <div className="relative space-y-0">
          {company.process.map((step, i) => (
            <div key={i} className="flex gap-4">
              {/* Timeline spine */}
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                {i < company.process.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: '1.5rem' }} />
                )}
              </div>
              {/* Content */}
              <div className={`pb-6 ${i === company.process.length - 1 ? 'pb-0' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{step.stage}</span>
                  {step.duration && (
                    <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                      <Clock className="h-3 w-3" />
                      {step.duration}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Focus areas */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <CheckCircle2 className="h-4 w-4" />
          What they focus on
        </h2>
        <ul className="space-y-2">
          {company.focusAreas.map((area) => (
            <li key={area} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {area}
            </li>
          ))}
        </ul>
      </section>

      {/* Recent question patterns */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <MessageSquare className="h-4 w-4" />
          Question patterns
        </h2>
        <ul className="space-y-2">
          {company.recentQuestions.map((q) => (
            <li
              key={q}
              className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted leading-relaxed"
            >
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>
      </section>

      {/* Notes callout */}
      <section className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
          <Lightbulb className="h-4 w-4" />
          Prep notes
        </div>
        <p className="text-sm text-muted leading-relaxed">{company.notes}</p>
      </section>

      {/* CTA */}
      <Link
        to="/interview-simulator"
        state={{ topic: company.focusAreas[0] }}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 w-fit"
      >
        <BrainCircuit className="h-4 w-4" />
        Mock interview for {company.name}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
