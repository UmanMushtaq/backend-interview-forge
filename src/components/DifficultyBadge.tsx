const COLORS: Record<string, string> = {
  foundation: 'bg-success/15 text-success border-success/30',
  core: 'bg-warning/15 text-warning border-warning/30',
  expert: 'bg-danger/15 text-danger border-danger/30',
  easy: 'bg-success/15 text-success border-success/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  hard: 'bg-danger/15 text-danger border-danger/30',
  mid: 'bg-success/15 text-success border-success/30',
  senior: 'bg-warning/15 text-warning border-warning/30',
  lead: 'bg-danger/15 text-danger border-danger/30',
};

export function DifficultyBadge({ level }: { level: string }) {
  const cls = COLORS[level] ?? 'bg-surface-2 text-muted border-border';
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {level}
    </span>
  );
}
