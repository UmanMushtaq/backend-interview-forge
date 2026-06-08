import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function Callout({
  children,
  title = 'Interview tip',
  icon: Icon = Lightbulb,
}: {
  children: ReactNode;
  title?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="text-sm text-text/90">{children}</div>
    </div>
  );
}
