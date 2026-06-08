type Tone = 'primary' | 'success' | 'warning' | 'danger';

const TONE: Record<Tone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function ProgressBar({
  value,
  tone = 'primary',
  className = '',
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${TONE[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
