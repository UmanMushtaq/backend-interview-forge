import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { allCodingProblems } from '../data/coding';
import { useProgressState } from '../hooks/useProgress';
import { DifficultyBadge } from '../components/DifficultyBadge';

const FilterPill = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
      active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted hover:text-text'
    }`}
  >
    {children}
  </button>
);

export function CodingList() {
  const state = useProgressState();
  const [cat, setCat] = useState('all');
  const [diff, setDiff] = useState('all');

  const categories = ['all', ...Array.from(new Set(allCodingProblems.map((p) => p.category)))];
  const difficulties = ['all', 'easy', 'medium', 'hard'];

  const problems = allCodingProblems.filter(
    (p) => (cat === 'all' || p.category === cat) && (diff === 'all' || p.difficulty === diff),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Coding challenges</h2>
        <p className="text-sm text-muted">Implement backend primitives; tests run in your browser.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <FilterPill key={c} active={cat === c} onClick={() => setCat(c)}>
            {c.replace(/-/g, ' ')}
          </FilterPill>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {difficulties.map((d) => (
          <FilterPill key={d} active={diff === d} onClick={() => setDiff(d)}>
            {d}
          </FilterPill>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((p) => {
          const solved = state.codingProgress[p.id]?.solved;
          return (
            <Link
              key={p.id}
              to={`/code/${p.id}`}
              className="rounded-xl border border-border bg-surface p-4 transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{p.title}</h3>
                {solved ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted" />
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <DifficultyBadge level={p.difficulty} />
                <span className="text-xs capitalize text-muted">{p.category.replace(/-/g, ' ')}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
