import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Layers } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { COURSES } from '../data/courseConfig';
import { moduleById } from '../data/learn';
import { generateFlashcards, getApiKeys } from '../lib/gemini';
import { FlashcardDeck } from '../components/FlashcardDeck';

interface Card {
  front: string;
  back: string;
  example: string;
}

type Phase = 'setup' | 'loading' | 'session' | 'error';

export function Flashcards() {
  const state = useProgressState();
  const hasApiKey = getApiKeys(state.settings).length > 0;

  const [courseId, setCourseId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [phase, setPhase] = useState<Phase>('setup');
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState('');

  const chapters = courseId ? (moduleById[courseId]?.lessons ?? []) : [];

  function handleCourseChange(id: string) {
    setCourseId(id);
    setChapterId('');
  }

  async function generate() {
    const course = COURSES.find((c) => c.id === courseId);
    const chapter = chapters.find((l) => l.id === chapterId);
    if (!course || !chapter) return;

    setPhase('loading');
    setError('');
    try {
      const result = await generateFlashcards(state.settings, course.title, chapter.title, chapter.content);
      setCards(result);
      setPhase('session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards.');
      setPhase('error');
    }
  }

  function reset() {
    setPhase('setup');
    setCards([]);
    setError('');
  }

  if (!hasApiKey) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock flashcards.
        </div>
      </div>
    );
  }

  if (phase === 'session') {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Flashcards</h1>
        </div>
        <FlashcardDeck cards={cards} onComplete={reset} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
        <p className="mt-2 text-sm text-muted">
          6 AI-generated flashcards per chapter. Good for a 5-minute session when you cannot commit to a
          full read.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Course</label>
          <select
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
          >
            <option value="">Select a course...</option>
            {COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Chapter</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            disabled={!courseId}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a chapter...</option>
            {chapters.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>

        {phase === 'error' && <p className="text-sm text-danger">{error}</p>}

        <button
          onClick={generate}
          disabled={!courseId || !chapterId || phase === 'loading'}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {phase === 'loading' ? 'Generating flashcards...' : 'Generate flashcards'}
        </button>
      </div>
    </div>
  );
}
