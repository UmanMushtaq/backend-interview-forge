import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';

interface Card {
  front: string;
  back: string;
  example: string;
}

interface Props {
  cards: Card[];
  onComplete: () => void;
}

export function FlashcardDeck({ cards: initialCards, onComplete }: Props) {
  const [queue, setQueue] = useState<Card[]>(initialCards);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [totalSeen, setTotalSeen] = useState(0);
  const total = initialCards.length;

  const current = queue[0];

  function handleFlip() {
    setFlipped((f) => !f);
  }

  function gotIt() {
    setKnownCount((c) => c + 1);
    setTotalSeen((c) => c + 1);
    setQueue((q) => q.slice(1));
    setFlipped(false);
  }

  function reviewAgain() {
    setTotalSeen((c) => c + 1);
    setQueue((q) => [...q.slice(1), q[0]]);
    setFlipped(false);
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <Check className="h-7 w-7 text-success" />
        </div>
        <div>
          <div className="text-2xl font-bold">
            {knownCount}/{total} known
          </div>
          <p className="mt-1 text-sm text-muted">Deck complete.</p>
        </div>
        <button
          onClick={onComplete}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Exit
        </button>
      </div>
    );
  }

  const cardNumber = Math.min(totalSeen + 1, total + (queue.length - 1));

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>
            Card {Math.min(cardNumber, total)} of {total}
          </span>
          <span>{knownCount} known</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(knownCount / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="[perspective:1200px]">
        <button
          onClick={handleFlip}
          className="relative h-72 w-full cursor-pointer rounded-2xl border border-border bg-surface text-left transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl p-8 [backface-visibility:hidden]">
            <p className="text-center text-2xl font-bold leading-snug">{current.front}</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col justify-center gap-4 overflow-y-auto rounded-2xl bg-surface-2 p-8 [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <p className="text-base leading-relaxed">{current.back}</p>
            <div className="rounded-lg bg-surface p-3 text-sm text-muted">
              <span className="font-semibold text-text">Example: </span>
              {current.example}
            </div>
          </div>
        </button>
      </div>

      {!flipped && <p className="text-center text-xs text-muted">Click the card to flip it</p>}

      {flipped && (
        <div className="flex justify-center gap-3">
          <button
            onClick={reviewAgain}
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition hover:text-text"
          >
            <RotateCcw className="h-4 w-4" /> Review again
          </button>
          <button
            onClick={gotIt}
            className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Check className="h-4 w-4" /> Got it
          </button>
        </div>
      )}
    </div>
  );
}
