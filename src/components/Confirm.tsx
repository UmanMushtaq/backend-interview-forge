import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * A button that requires an explicit "are you sure?" confirmation before
 * firing its action. Used for revealing solutions and destructive actions.
 */
export function ConfirmButton({
  children,
  onConfirm,
  confirmLabel = 'Confirm',
  question = 'Are you sure?',
  className = '',
}: {
  children: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  question?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-sm text-muted">{question}</span>
        <button
          type="button"
          className="rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          onClick={() => {
            setArmed(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text"
          onClick={() => setArmed(false)}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button type="button" className={className} onClick={() => setArmed(true)}>
      {children}
    </button>
  );
}
