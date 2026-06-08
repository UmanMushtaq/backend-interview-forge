import type { HeatCell } from '../lib/scoring';

const LEVEL_BG = [
  'bg-surface-2',
  'bg-success/30',
  'bg-success/50',
  'bg-success/70',
  'bg-success',
];

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export function Heatmap({ cells }: { cells: HeatCell[] }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {chunk(cells, 7).map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((c) => (
              <div
                key={c.date}
                title={`${c.date}: ${c.count} answered`}
                className={`h-3 w-3 rounded-sm ${LEVEL_BG[c.level]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted">
        <span>Less</span>
        {LEVEL_BG.map((bg, i) => (
          <span key={i} className={`h-3 w-3 rounded-sm ${bg}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
