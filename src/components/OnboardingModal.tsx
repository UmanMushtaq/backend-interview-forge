import { BookOpen, Code2, Network, Database, MessageSquare, X } from 'lucide-react';
import { updateSettings } from '../lib/storage';

const ITEMS = [
  { icon: BookOpen, title: 'Quizzes', text: 'Spaced-repetition multiple choice across NestJS, Redis, Kafka, RabbitMQ, Postgres and design.' },
  { icon: Code2, title: 'Coding', text: 'Implement DI containers, sagas, rate limiters and more — tests run in your browser.' },
  { icon: Network, title: 'System design', text: 'Timed prompts with model answers and self-scoring across five dimensions.' },
  { icon: Database, title: 'SQL', text: 'Write queries against a fintech schema, then compare to the model answer.' },
  { icon: MessageSquare, title: 'Interview Q&A', text: 'Rehearse spoken answers and rate your confidence.' },
];

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const finish = () => {
    updateSettings({ onboarded: true });
    onClose();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={finish}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Welcome to Backend Interview Forge</h2>
            <p className="mt-1 text-sm text-muted">
              Everything runs locally in your browser — your progress is saved to this device.
            </p>
          </div>
          <button onClick={finish} className="rounded-md p-1 text-muted hover:text-text" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {ITEMS.map((it) => (
            <li key={it.title} className="flex gap-3">
              <span className="mt-0.5 rounded-md bg-surface-2 p-1.5">
                <it.icon className="h-4 w-4 text-primary" />
              </span>
              <div>
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-muted">{it.text}</div>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={finish}
          className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Start studying
        </button>
      </div>
    </div>
  );
}
