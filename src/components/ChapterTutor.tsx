import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Loader2, RefreshCw } from 'lucide-react';
import { askChapterTutor } from '../lib/gemini';

interface Props {
  apiKey: string;
  courseTitle: string;
  chapterTitle: string;
  chapterContent: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'Explain this differently',
  'Give me a real-world example',
  'How does this relate to NexusPay?',
  'What would an interviewer ask about this?',
];

export function ChapterTutor({ apiKey, courseTitle, chapterTitle, chapterContent }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, error]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setError('');
    setLastQuestion(question);
    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const answer = await askChapterTutor(apiKey, courseTitle, chapterTitle, chapterContent, question, history);
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach the AI tutor.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    send(input);
  }

  function retry() {
    setError('');
    send(lastQuestion);
  }

  if (!open) {
    return (
      <div className="mt-6">
        <button
          onClick={() => apiKey && setOpen(true)}
          title={apiKey ? undefined : 'Add Gemini API key in Settings'}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted transition hover:border-primary/40 hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!apiKey}
        >
          <MessageCircle className="h-4 w-4" />
          {apiKey ? 'Ask AI about this chapter' : 'Ask AI about this chapter (add API key in Settings)'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <MessageCircle className="h-4 w-4 text-primary" />
          AI Tutor
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-muted transition hover:text-text"
          aria-label="Close AI tutor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && !loading && !error && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Ask anything about this chapter, or try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-primary/40 hover:text-text"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-primary/15 text-text' : 'bg-surface-2 text-text/90'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
          </div>
        )}

        {error && (
          <div className="space-y-1.5">
            <p className="text-sm text-danger">{error}</p>
            <button
              onClick={retry}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="Ask anything about this chapter..."
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="flex shrink-0 items-center justify-center rounded-lg bg-primary p-2.5 text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
