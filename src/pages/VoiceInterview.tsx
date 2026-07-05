import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  SkipForward,
} from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { generateInterviewQuestion, generateNexusPayQuestion, scoreVoiceAnswer, getApiKeys } from '../lib/gemini';

// ─── Web Speech API types (not universally present in TS DOM lib) ────────────

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en'))
  );
}

// ─── Shared config ─────────────────────────────────────────────────────────────

const TOPICS = [
  'NestJS',
  'Node.js',
  'TypeScript',
  'PostgreSQL',
  'Redis',
  'RabbitMQ',
  'Kafka',
  'System Design',
  'Microservices',
  'DSA',
  'NexusPay',
] as const;

const DIFFICULTIES = ['Mid', 'Senior', 'Lead'] as const;
const QUESTION_COUNTS = [3, 5] as const;

type Topic = (typeof TOPICS)[number];
type Difficulty = (typeof DIFFICULTIES)[number];
type QuestionCount = (typeof QUESTION_COUNTS)[number];

const LISTEN_SECONDS = 90;

interface VoiceResult {
  score: number;
  verdict: string;
  clarity: number;
  depth: number;
  whatWasGood: string[];
  whatWasMissing: string[];
  modelAnswer: string;
}

interface VoiceEntry {
  question: string;
  transcript: string;
  result: VoiceResult;
}

type Screen = 'setup' | 'session' | 'report';
type QuestionPhase = 'loading-question' | 'speaking-question' | 'listening' | 'processing' | 'showing-result';

function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const color =
    score >= 7
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : score >= 4
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-red-500/20 text-red-400 border-red-500/30';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold tabular-nums ${color} ${large ? 'h-16 w-16 text-2xl' : 'h-7 w-7 text-sm'}`}
    >
      {score}
    </span>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const barColor = score >= 7 ? 'bg-success' : score >= 4 ? 'bg-amber-400' : 'bg-danger';
  return (
    <div className="flex-1 text-center">
      <div className="mx-auto mb-2 h-16 w-3 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`w-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ height: `${(score / 10) * 100}%`, marginTop: `${100 - (score / 10) * 100}%` }}
        />
      </div>
      <div className="text-sm font-semibold tabular-nums">{score}/10</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({
  hasApiKey,
  supportsSpeech,
  onStart,
}: {
  hasApiKey: boolean;
  supportsSpeech: boolean;
  onStart: (topic: Topic, difficulty: Difficulty, count: QuestionCount) => void;
}) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Senior');
  const [count, setCount] = useState<QuestionCount>(3);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Voice Interview</h1>
        <p className="text-muted">
          The interviewer speaks the question out loud. You answer by speaking. Your answer is transcribed and
          scored by Gemini. This trains you to think and articulate under pressure, not just type.
        </p>
      </div>

      {!supportsSpeech && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Voice interviews require Chrome or Edge. Please open this page in Chrome.
        </div>
      )}

      {!hasApiKey && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock the voice interview.
        </div>
      )}

      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Topic</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                topic === t
                  ? t === 'NexusPay'
                    ? 'border-violet-400 bg-violet-400/15 text-violet-400'
                    : 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:border-primary/50 hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Difficulty</p>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full border px-5 py-1.5 text-sm font-medium transition ${
                difficulty === d
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:border-primary/50 hover:text-text'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Number of questions</p>
        <div className="flex gap-2">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`rounded-full border px-5 py-1.5 text-sm font-medium transition ${
                count === n
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:border-primary/50 hover:text-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!topic || !hasApiKey || !supportsSpeech}
        onClick={() => topic && onStart(topic, difficulty, count)}
        className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start voice interview
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Session screen ───────────────────────────────────────────────────────────

function SessionScreen({
  topic,
  difficulty,
  totalCount,
  settings,
  onComplete,
}: {
  topic: Topic;
  difficulty: Difficulty;
  totalCount: number;
  settings: { geminiApiKey?: string; geminiApiKey2?: string; geminiApiKey3?: string };
  onComplete: (entries: VoiceEntry[]) => void;
}) {
  const isNexusPay = topic === 'NexusPay';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<QuestionPhase>('loading-question');
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(LISTEN_SECONDS);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [scoreError, setScoreError] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [entries, setEntries] = useState<VoiceEntry[]>([]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const previousQuestionsRef = useRef<string[]>([]);
  const hasLoadedRef = useRef<number>(-1);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // Clean up speech synthesis / recognition on unmount or navigation away.
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopRecognition();
    };
  }, [stopRecognition]);

  const loadQuestion = useCallback(async () => {
    setPhase('loading-question');
    setQuestionError('');
    setFinalTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setResult(null);
    setScoreError('');
    setShowModelAnswer(false);
    try {
      if (isNexusPay) {
        const q = await generateNexusPayQuestion(settings, difficulty, previousQuestionsRef.current);
        setQuestion(q.question);
      } else {
        const q = await generateInterviewQuestion(settings, topic, difficulty, previousQuestionsRef.current);
        setQuestion(q.question);
      }
      setPhase('speaking-question');
    } catch (e) {
      setQuestionError(e instanceof Error ? e.message : 'Failed to load question.');
    }
  }, [settings, topic, difficulty, isNexusPay]);

  useEffect(() => {
    if (hasLoadedRef.current === currentIndex) return;
    hasLoadedRef.current = currentIndex;
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const startListening = useCallback(() => {
    setPhase('listening');
    setSecondsLeft(LISTEN_SECONDS);
    finalTranscriptRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0].transcript;
        if (res.isFinal) {
          finalTranscriptRef.current += `${transcript} `;
          setFinalTranscript(finalTranscriptRef.current);
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };
    recognition.onerror = () => {
      /* handled via onend / timer; surfaced only if nothing was transcribed */
    };
    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  // Speak the question aloud, then move to listening once done.
  useEffect(() => {
    if (phase !== 'speaking-question' || !question) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => startListening();
    window.speechSynthesis.speak(utterance);
    return () => {
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question]);

  const scoreAnswer = useCallback(
    async (transcript: string) => {
      setPhase('processing');
      setScoreError('');
      try {
        const r = await scoreVoiceAnswer(settings, question, topic, transcript, difficulty);
        setResult(r);
        previousQuestionsRef.current = [...previousQuestionsRef.current, question];
        setPhase('showing-result');
      } catch (e) {
        setScoreError(e instanceof Error ? e.message : 'Scoring failed. Try again.');
      }
    },
    [settings, question, topic, difficulty],
  );

  const finishListening = useCallback(() => {
    stopRecognition();
    const transcript = (finalTranscriptRef.current + interimTranscript).trim();
    setFinalTranscript(transcript);
    scoreAnswer(transcript);
  }, [stopRecognition, interimTranscript, scoreAnswer]);

  // Countdown timer while listening.
  useEffect(() => {
    if (phase !== 'listening') return;
    if (secondsLeft <= 0) {
      finishListening();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft, finishListening]);

  function retryScoring() {
    scoreAnswer(finalTranscript);
  }

  function skipReading() {
    window.speechSynthesis.cancel();
    startListening();
  }

  function handleNext() {
    if (!result) return;
    const newEntries = [...entries, { question, transcript: finalTranscript.trim(), result }];
    if (currentIndex + 1 >= totalCount) {
      onComplete(newEntries);
      return;
    }
    setEntries(newEntries);
    setCurrentIndex((i) => i + 1);
  }

  const progress = ((currentIndex + (phase === 'showing-result' ? 1 : 0)) / totalCount) * 100;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted">
            Question {currentIndex + 1} of {totalCount}
          </span>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
              isNexusPay ? 'bg-violet-400/10 text-violet-400' : 'bg-primary/10 text-primary'
            }`}
          >
            {topic}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {phase === 'loading-question' && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-6 text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Generating question…
        </div>
      )}

      {questionError && phase === 'loading-question' && (
        <div className="mt-3 text-sm text-red-400">
          {questionError}
          <button onClick={loadQuestion} className="ml-2 underline hover:opacity-80">
            Try again
          </button>
        </div>
      )}

      {phase === 'speaking-question' && (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <Volume2 className="h-6 w-6 animate-pulse text-primary" />
            </div>
          </div>
          <p className="text-xl font-medium leading-relaxed">{question}</p>
          <button
            onClick={skipReading}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-text"
          >
            <SkipForward className="h-3.5 w-3.5" /> Skip reading
          </button>
        </div>
      )}

      {phase === 'listening' && (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="mb-4 text-sm font-medium leading-relaxed text-muted">{question}</p>
          <div className="mb-3 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
              <Mic className="h-7 w-7 animate-pulse text-red-400" />
            </div>
          </div>
          <p className="text-sm font-semibold">Listening... speak your answer now</p>
          <p className="mt-1 tabular-nums text-xs text-muted">
            {mm}:{ss} remaining
          </p>

          {(finalTranscript || interimTranscript) && (
            <div className="mt-4 rounded-lg bg-surface-2 p-4 text-left text-sm leading-relaxed">
              <span className="text-text">{finalTranscript}</span>
              <span className="text-muted">{interimTranscript}</span>
            </div>
          )}

          <button
            onClick={finishListening}
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <MicOff className="h-4 w-4" /> Done speaking
          </button>
        </div>
      )}

      {phase === 'processing' && (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Scoring your answer…
          </div>
          {scoreError && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-red-400">{scoreError}</p>
              <button
                onClick={retryScoring}
                className="rounded-lg border border-border px-3 py-1.5 text-xs transition hover:text-text"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'showing-result' && result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-6">
            <p className="text-sm font-medium leading-relaxed">{question}</p>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">What you said</p>
            <p className="text-sm leading-relaxed text-text/90">{finalTranscript || '(no speech detected)'}</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="flex items-start gap-4">
              <ScoreBadge score={result.score} large />
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted">Score</p>
                <p className="font-medium">{result.verdict}</p>
              </div>
            </div>

            <div className="flex justify-center gap-8">
              <ScoreBar label="Clarity" score={result.clarity} />
              <ScoreBar label="Depth" score={result.depth} />
            </div>

            {result.whatWasGood.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> What was good
                </p>
                <ul className="space-y-1">
                  {result.whatWasGood.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.whatWasMissing.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> What was missing
                </p>
                <ul className="space-y-1">
                  {result.whatWasMissing.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <button
                onClick={() => setShowModelAnswer((s) => !s)}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-text transition"
              >
                {showModelAnswer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showModelAnswer ? 'Hide' : 'What a great answer sounds like'}
              </button>
              {showModelAnswer && (
                <div className="mt-3 rounded-lg border border-border bg-surface-2 p-4">
                  <p className="text-sm leading-relaxed text-muted">{result.modelAnswer}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                {currentIndex + 1 >= totalCount ? (
                  <>
                    See final report <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next question <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report screen ────────────────────────────────────────────────────────────

function ReportScreen({
  topic,
  difficulty,
  entries,
  onRetake,
  onChangeTopic,
}: {
  topic: Topic;
  difficulty: Difficulty;
  entries: VoiceEntry[];
  onRetake: () => void;
  onChangeTopic: () => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const avgScore =
    entries.length > 0 ? Math.round((entries.reduce((s, e) => s + e.result.score, 0) / entries.length) * 10) / 10 : 0;

  const label =
    avgScore >= 8 ? 'Strong performance' : avgScore >= 6 ? 'Good — a few gaps to address' : avgScore >= 4 ? 'Room to grow' : 'Keep practising';
  const labelColor =
    avgScore >= 8 ? 'text-emerald-400' : avgScore >= 6 ? 'text-primary' : avgScore >= 4 ? 'text-amber-400' : 'text-red-400';

  const allMissing = entries.flatMap((e) => e.result.whatWasMissing);
  const missingCounts = new Map<string, number>();
  for (const m of allMissing) {
    const key = m.trim().toLowerCase().slice(0, 60);
    missingCounts.set(key, (missingCounts.get(key) ?? 0) + 1);
  }
  const weakAreas = allMissing
    .filter((m, i) => {
      const key = m.trim().toLowerCase().slice(0, 60);
      const first = allMissing.findIndex((x) => x.trim().toLowerCase().slice(0, 60) === key);
      return first === i;
    })
    .sort(
      (a, b) =>
        (missingCounts.get(b.trim().toLowerCase().slice(0, 60)) ?? 0) -
        (missingCounts.get(a.trim().toLowerCase().slice(0, 60)) ?? 0),
    )
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-3xl font-bold">Interview complete</h1>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/10">
            <span className="text-4xl font-bold text-primary">{avgScore}</span>
          </div>
          <p className={`text-lg font-semibold ${labelColor}`}>{label}</p>
          <p className="text-sm text-muted">
            {topic} · {difficulty} · {entries.length} questions answered
          </p>
        </div>
      </div>

      {weakAreas.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Weakest areas to review
          </p>
          <ul className="space-y-1.5">
            {weakAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">Question breakdown</p>
        {entries.map((entry, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
            <button
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{entry.question}</span>
                <span className="text-xs text-muted">{entry.result.verdict}</span>
              </div>
              <ScoreBadge score={entry.result.score} />
              {expandedIndex === i ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
              )}
            </button>
            {expandedIndex === i && (
              <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">What you said</p>
                  <p className="text-xs text-muted">{entry.transcript || '(no speech detected)'}</p>
                </div>
                {entry.result.whatWasMissing.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">What was missing</p>
                    <ul className="space-y-1">
                      {entry.result.whatWasMissing.map((p, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onRetake}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" /> Practice again
        </button>
        <button
          onClick={onChangeTopic}
          className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text"
        >
          Change topic
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function VoiceInterview() {
  const { settings } = useProgressState();
  const hasApiKey = getApiKeys(settings).length > 0;
  const supportsSpeech = typeof window !== 'undefined' && getSpeechRecognitionCtor() !== null;

  const [screen, setScreen] = useState<Screen>('setup');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Senior');
  const [count, setCount] = useState<QuestionCount>(3);
  const [entries, setEntries] = useState<VoiceEntry[]>([]);
  const [sessionKey, setSessionKey] = useState(0);

  function handleStart(t: Topic, d: Difficulty, c: QuestionCount) {
    setTopic(t);
    setDifficulty(d);
    setCount(c);
    setEntries([]);
    setSessionKey((k) => k + 1);
    setScreen('session');
  }

  function handleComplete(e: VoiceEntry[]) {
    setEntries(e);
    setScreen('report');
  }

  function handleRetake() {
    setEntries([]);
    setSessionKey((k) => k + 1);
    setScreen('session');
  }

  function handleChangeTopic() {
    setScreen('setup');
  }

  return (
    <div>
      {screen === 'setup' && (
        <SetupScreen hasApiKey={hasApiKey} supportsSpeech={supportsSpeech} onStart={handleStart} />
      )}

      {screen === 'session' && topic && (
        <SessionScreen
          key={sessionKey}
          topic={topic}
          difficulty={difficulty}
          totalCount={count}
          settings={settings}
          onComplete={handleComplete}
        />
      )}

      {screen === 'report' && topic && (
        <ReportScreen
          topic={topic}
          difficulty={difficulty}
          entries={entries}
          onRetake={handleRetake}
          onChangeTopic={handleChangeTopic}
        />
      )}
    </div>
  );
}
