import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { COMPANIES } from '../data/companies';

export function Companies() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Interview Prep</h1>
        <p className="mt-1 text-sm text-muted">
          What each company actually tests, their process, and how your NexusPay project maps to their stack.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((company) => (
          <Link
            key={company.id}
            to={`/companies/${company.id}`}
            className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-semibold">{company.name}</h2>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {company.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted"
                >
                  {tech}
                </span>
              ))}
            </div>

            <p className="flex-1 text-sm text-muted leading-relaxed line-clamp-2">{company.why}</p>

            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
              View prep
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
