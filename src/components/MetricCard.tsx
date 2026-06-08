import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'text-primary',
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
