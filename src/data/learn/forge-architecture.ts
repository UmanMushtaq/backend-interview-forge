import type { LearnModule } from '../../types';

export const forgeArchitecture: LearnModule = {
  id: 'forge-architecture',
  title: 'Backend Forge Architecture',
  blurb:
    'Understand every technical decision behind the platform you are using right now. React, Vite, GitHub Pages, Gemini, Web Speech API.',
  lessons: [
    {
      id: 'forge-intro',
      title: 'What backend-interview-forge is and what it proves',
      content: `
There is a particular kind of confidence that comes from being asked "how does this work?" about the very tool you are using to answer the question, and being able to answer completely. That is exactly the position this platform puts you in, and it is worth understanding why deliberately.

**backend-interview-forge** is a personal learning platform built in React, TypeScript, Vite, and Tailwind CSS, deployed as static files to GitHub Pages. There is no backend server, no database, and no ongoing cost to run it. Every course, every quiz, every piece of progress tracking runs entirely inside your browser. State persists in \`localStorage\`. The AI features, quiz generation, interview scoring, this very course content's chat assistant, are powered by your own Gemini API key, which you provide once in Settings and which the platform stores locally on your device.

This design is not a limitation you settle for, it is a decision with real consequences that work in your favor. Because there is no server, there are no server costs, so the platform runs for free indefinitely. Because AI calls go through your own key, there are no platform-imposed rate limits, only Gemini's own quota. Because everything is static files, deployment is trivial and the site is effectively always available, served from a CDN rather than a single server that can go down.

What this proves, and what makes it worth discussing in an interview even though it has "no backend," is that you understand the full decision tree of when a backend is actually necessary and when it is not. Building a backend by default, out of habit, is not sophistication. Recognizing that a specific set of constraints (single-user data, no payments, no sensitive information, one AI provider the user authenticates themselves) means a backend adds cost and complexity without adding value, and then architecting accordingly, is the more advanced judgment call.

In an interview, introduce this platform in one sentence: "I built a fully client-side learning platform, React and TypeScript on Vite, deployed as static files to GitHub Pages, with no backend at all. Progress is stored in localStorage, and AI features run through the user's own Gemini API key called directly from the browser. I can walk through why no backend was the right call, how state management works without a database, or how the AI integration handles quota limits without a server in front of it."
      `.trim(),
    },
    {
      id: 'forge-no-backend-decision',
      title: 'Why no backend: the serverless-by-default decision',
      content: `
The default instinct when building any web application is to reach for a backend: an API server, a database, user authentication, the whole familiar stack. That instinct is right most of the time. It is worth being explicit about the specific reasoning that led to skipping it here, because "no backend" as a decision only holds up under scrutiny when you can name exactly which usual reasons for a backend do not apply.

Start with what a backend is typically responsible for, and check each one against this platform's actual requirements. **Sensitive data requiring server-side protection?** No. Quiz scores, course progress, and interview practice history belong entirely to the person using them and carry no risk if they live only on that person's own device. **Payments or billing?** None exist in this platform. **Multi-user coordination**, two people needing to see the same shared state, real-time collaboration, a leaderboard? Also none. Every user's data is theirs alone, with zero need to be visible to or coordinated with anyone else.

Once those three are ruled out, the remaining question is where the data actually needs to live, and the answer falls out naturally: **the browser's own storage**. \`localStorage\` gives every user their own private, persistent data store with zero setup, zero server, and zero ongoing cost. The one genuinely external dependency the platform has, calling the Gemini API for quiz generation and interview scoring, is handled by asking the user to supply their own API key rather than proxying the request through a server that would need to store that key securely on their behalf.

The payoff from this decision compounds across four dimensions at once. **Zero infrastructure cost**: there is no server to pay for, ever, regardless of how many people use the platform, because GitHub Pages serves static files for free. **Zero security surface**: there is no server to compromise, no server-side secrets to leak, no SQL injection surface, no session hijacking risk, because there is no session and no server-side code executing on anyone's behalf. **Zero deployment complexity**: shipping a change means pushing to \`main\` and letting a static build get served, not managing server provisioning, database migrations, or zero-downtime rollout strategies. **Zero meaningful downtime**: static files served from a CDN are close to always available, with none of the operational concerns (server crashes, database connection pool exhaustion, memory leaks over long uptimes) that a running backend process has to manage.

None of this means backends are unnecessary in general, and saying so plainly is part of demonstrating good judgment rather than dogma. The moment this platform needed to sync progress across a user's devices, support multiple people sharing data, or handle anything resembling payment or truly sensitive information, every one of these trade-offs would flip, and a backend would become the correct answer rather than an unnecessary one.

The general decision tree worth carrying into any project: ask whether the data is genuinely private to one user or needs to be shared or coordinated across users or devices; ask whether anything sensitive (payment details, PII beyond what the user already has locally, credentials for other systems) needs server-side custody; ask whether any third-party integration requires a secret that cannot safely live in a browser. If every answer comes back "no," a backend is optional complexity, not a requirement. If any answer comes back "yes," it stops being optional.

In an interview, say: "I ran through the standard reasons you'd add a backend, sensitive data, payments, multi-user coordination, and none applied here: every user's data is private to them and there's nothing to share or protect server-side. That let me put the data in localStorage and have the browser call Gemini directly with the user's own key, which means zero infrastructure cost, zero server attack surface, and deployment that's just pushing static files. The moment this needed cross-device sync or shared state between users, I'd add a backend without hesitation, because at that point the trade-off actually flips."
      `.trim(),
    },
    {
      id: 'forge-state-architecture',
      title: 'The state architecture: localStorage as the database',
      content: `
Once the decision is made to store everything in the browser rather than a server, the next question is how to structure that storage so it behaves like a real, predictable database rather than a scattered collection of ad hoc keys. The answer this platform uses is deliberately simple: **one JSON blob, one key**.

All progress data, quiz history, coding challenge attempts, design exercise self-scores, SQL practice records, interview session confidence ratings, module completion status, study time, bookmarks, settings including the Gemini API key, lives in a single object serialized to JSON and stored under one \`localStorage\` key, \`bif:state\`. There is no separate key per feature, no risk of one feature's data key colliding with another's, and reading the entire application's state back is one \`JSON.parse\` call on one string.

\`\`\`typescript
// src/lib/storage.ts
const STORAGE_KEY = 'bif:state';

export function getState(): ProgressState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultState();

  try {
    return { ...getDefaultState(), ...JSON.parse(raw) };
  } catch {
    return getDefaultState();
  }
}

export function setState(updater: (prev: ProgressState) => ProgressState): void {
  const next = updater(getState());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
\`\`\`

Merging the parsed data on top of \`getDefaultState()\` rather than trusting the stored JSON directly is a small but important detail. If a new field is added to \`ProgressState\` in a later version of the platform, a user with data saved from an older version will not have that field in their stored JSON. Spreading the default state first and the parsed state second guarantees every field the current code expects always exists, with the user's actual saved values overriding the defaults wherever they are present.

The shape of that state object is defined once, in TypeScript, and every part of the application that reads or writes progress data goes through the same types:

\`\`\`typescript
// src/types.ts (excerpt)
export interface ProgressState {
  quizProgress: Record<string, QuizProgressEntry>;
  codingProgress: Record<string, CodingProgressEntry>;
  designProgress: Record<string, DesignProgressEntry>;
  sqlProgress: Record<string, SqlProgressEntry>;
  interviewProgress: Record<string, InterviewProgressEntry>;
  moduleProgress: Record<string, ModuleProgress>;
  studyHistory: Record<string, StudyHistoryEntry>;
  settings: Settings;
}
\`\`\`

React components consume this through a small custom hook that reads on mount and exposes a setter that writes straight back to \`localStorage\` on every update:

\`\`\`typescript
// src/hooks/useProgressState.ts
export function useProgressState() {
  const [state, setLocalState] = useState<ProgressState>(getState);

  const update = useCallback((updater: (prev: ProgressState) => ProgressState) => {
    setState(updater);
    setLocalState(getState());
  }, []);

  return [state, update] as const;
}
\`\`\`

This is, in effect, a **single-writer, single-reader, zero-latency database**. There is no connection pool to manage because there is no connection. There is no query language because there is nothing to query beyond plain object property access. There is no schema migration system beyond writing careful TypeScript types and the merge-with-defaults pattern above, which handles the one migration concern that actually matters here: old data missing new fields.

The trade-offs are real and worth naming without hedging. Data is **device-specific**: progress recorded on a phone is entirely separate from progress on a laptop, with no sync between them, because there is no server for either device to sync through. Data can be **cleared by the browser**, whether the user clears their own storage, uses private browsing, or switches browsers entirely, and there is no backup beyond whatever the user's own device provides. For a personal study tool used by one person on, realistically, one primary device, these trade-offs are acceptable, and the simplicity gained in exchange (no auth, no API layer, no database to provision) is worth far more than the sync capability given up.

In an interview, say: "All application state lives in one JSON object in localStorage under a single key. A custom hook reads it on mount and writes back on every change. New fields merge on top of a default state object, so users with data from an older version of the app never hit a missing-field error. Compared to a real database, I give up cross-device sync and durability against the user clearing their browser, but I gain zero connection management, zero migrations beyond careful typing, and zero latency, which is the right trade for a single-user, single-device personal tool."
      `.trim(),
    },
    {
      id: 'forge-gemini-integration',
      title: 'The Gemini integration: client-side AI with key rotation',
      content: `
AI features, generating quiz questions, scoring interview answers, powering the chapter tutor chat, are the one part of this platform that genuinely needs an external service. The interesting engineering question is not "how do you call an AI API," it is "how do you call an AI API from a pure static site with no backend to hide a secret behind."

The conventional pattern is to keep API keys server-side: a client sends a request to your backend, your backend attaches the secret key and calls the AI provider, and the key never reaches the browser. That pattern requires a backend to exist, which this platform deliberately does not have. The alternative this platform uses instead is to ask the user for **their own Gemini API key**, store it in \`localStorage\` alongside the rest of their settings, and call the Gemini REST API directly from the browser using that key.

\`\`\`typescript
// src/lib/gemini.ts (simplified)
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function tryModel(apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await fetch(\`\${GEMINI_BASE_URL}/\${model}:generateContent?key=\${apiKey}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (!response.ok) throw new Error(\`Gemini error \${response.status}\`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
\`\`\`

This works because the security model is fundamentally different from a typical multi-tenant SaaS product. The key belongs to the user, is used only for calls that user themselves triggers, and never needs to be kept secret **from that same user**, since it is their own credential, obtained from their own Google account, spending their own quota. There is no other tenant whose data or budget this key could expose.

Because the free Gemini tier gives a limited number of requests per day per key, and a single key can be exhausted during a study session, the platform supports up to **3 keys with automatic rotation**:

\`\`\`typescript
export function getApiKeys(settings: GeminiKeySettings): string[] {
  return [settings.geminiApiKey, settings.geminiApiKey2, settings.geminiApiKey3]
    .filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
}

async function callGemini(apiKeys: string[], prompt: string): Promise<string> {
  for (const key of apiKeys) {
    for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']) {
      try {
        return await tryModel(key, model, prompt);
      } catch (err) {
        if (isQuotaError(err)) continue; // try the next model, then the next key
        throw err;
      }
    }
  }
  throw new Error('All Gemini keys and models are exhausted.');
}
\`\`\`

Within each key, multiple **model names** are tried in sequence, not because the models are interchangeable in quality, but because Google tracks quota independently per model, not just per key. A key that has exhausted its \`gemini-2.5-flash\` quota for the day may still have quota remaining on \`gemini-2.0-flash\`, so trying the next model before giving up on that key entirely extracts meaningfully more usable capacity out of the same free-tier key.

A small optimization sits on top of this rotation logic: a per-session cache remembers the last combination of key and model that actually worked, and tries that combination first on the next call rather than restarting the full rotation from scratch every time. Most calls in a session succeed on the first attempt using that cached combination, and the full fallback chain only runs again once that cached combination itself starts failing.

The honest security discussion here is worth having directly rather than avoided. Calling a third-party API directly from the browser means the API key is visible in the browser's network tab to anyone with access to that browser or device. This would be an unacceptable design for a shared, secret, or billable-to-someone-else API key. It is acceptable specifically because the key is the user's own, opted into by the user themselves, spending only that user's own quota, with no other party's budget or data exposed by its presence in that browser's requests.

In an interview, say: "AI calls go straight from the browser to the Gemini REST API using a key the user supplies themselves in Settings, stored in localStorage. There's no backend to proxy through, and there doesn't need to be, because the key is the user's own, so there's no shared secret being exposed to anyone but its owner. To handle quota limits, I support up to 3 keys with rotation, and within each key I try multiple model names in sequence, since Gemini tracks quota per model as well as per key. This would be the wrong pattern for a shared or billable API key with multiple users behind one key, but for a client-side tool where the user brings their own credential, it's the correct trade-off."
      `.trim(),
    },
    {
      id: 'forge-voice-interview',
      title: 'The Voice Interview: Web Speech API',
      content: `
Practicing for a technical interview by typing answers into a text box misses something important: real interviews are spoken. The Voice Interview feature closes that gap, and it does so entirely with capabilities already built into the browser, without a single external speech service or API call for the audio itself.

Two separate **Web Speech API** interfaces do the work. **Text-to-speech** is handled by \`window.speechSynthesis\`, a browser-native API that converts text into spoken audio using the operating system's own voice engine, at no cost and with no network request:

\`\`\`typescript
// src/hooks/useSpeechSynthesis.ts (simplified)
function speak(text: string, onEnd: () => void): void {
  window.speechSynthesis.cancel(); // stop any utterance already in progress

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}
\`\`\`

**Speech-to-text**, transcribing what the candidate says out loud in response, uses \`window.SpeechRecognition\`, or \`window.webkitSpeechRecognition\` for Chrome-family browsers that have not yet unprefixed the API:

\`\`\`typescript
// src/hooks/useSpeechRecognition.ts (simplified)
const SpeechRecognitionCtor =
  window.SpeechRecognition ?? window.webkitSpeechRecognition;

function useSpeechRecognition(onResult: (transcript: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      onResult(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop(); // critical: stop on unmount
      recognitionRef.current = null;
    };
  }, [onResult]);

  return recognitionRef;
}
\`\`\`

Both APIs are built into Chrome and Edge with no external dependency and no per-use cost, which is precisely what makes them the right fit for a feature in a platform with no backend and no budget for a paid speech service. The transcribed text produced by \`SpeechRecognition\` is then sent, as plain text, to Gemini for scoring against the interview question, reusing the exact same client-side AI integration covered in the previous lesson.

The part of this feature that is genuinely easy to get wrong is cleanup, and it deserves the same care as any resource that outlives a single function call. \`speechSynthesis.cancel()\` has to run before starting any new utterance, because without it, rapid interactions (skipping to the next question before the current one finishes speaking) queue utterances instead of replacing them, and the user hears overlapping or stacked speech. \`recognition.stop()\` has to run in the \`useEffect\` cleanup function specifically, so that navigating away from the voice interview page, or the component unmounting for any reason, actually releases the microphone rather than leaving recognition silently running in the background. React's re-render cycle also means the \`SpeechRecognition\` instance itself needs to live in a \`ref\`, not component state, since recreating it on every render would restart transcription mid-sentence and lose whatever the user had already said.

The natural interview follow-up is when you would choose a dedicated service like **AssemblyAI** or **AWS Transcribe** instead of these browser-native APIs. Those services win when you need transcription accuracy and language support beyond what a browser's built-in engine offers, when you need the recording itself preserved and processed server-side (for compliance, for asynchronous batch processing, for multiple listeners), or when you need consistent behavior across browsers that do not all implement \`SpeechRecognition\` identically or at all, notably Firefox and Safari have historically had limited or no support. Browser-native APIs win when the feature is genuinely ephemeral (the user speaks, gets immediate feedback, nothing needs to be stored or reprocessed later), when the target audience can be assumed to use Chrome-family browsers, and when adding a paid third-party dependency is not justified by the feature's scope.

In an interview, say: "Voice interview uses window.speechSynthesis for text-to-speech and window.SpeechRecognition for transcription, both built into Chrome and Edge with zero external service and zero cost. The transcript gets sent to Gemini for scoring, reusing the same client-side AI call as everything else in the platform. The tricky part is cleanup: canceling any in-progress utterance before starting a new one, and stopping recognition in the component's unmount effect so the microphone doesn't stay active after the user navigates away. I'd reach for a dedicated service like AssemblyAI instead if I needed cross-browser consistency, higher transcription accuracy, or needed to store and reprocess the audio later, none of which apply to a live, ephemeral practice session."
      `.trim(),
    },
    {
      id: 'forge-routing-deployment',
      title: 'Routing and deployment: React Router on GitHub Pages',
      content: `
GitHub Pages is built to serve static files: it takes a request for a path and looks for a matching file on disk. This works perfectly for the platform's assets, but it runs directly into a conflict with how React Router works, and understanding that conflict, and its fix, is a genuinely useful piece of knowledge for any single-page application deployed to any static host.

**React Router** implements client-side routing: when the user clicks a link inside the app, JavaScript intercepts the navigation, updates the URL using the browser's History API, and renders a different component, all without a new request to the server. This is fast and seamless, but it depends entirely on the JavaScript already being loaded and running. The problem appears the moment a user does not arrive at a route through a link click inside the app, but instead types a URL directly into the address bar, refreshes the page while on a nested route, or follows a bookmark straight to something like \`learning.umanmushtaq.com/courses/nestjs\`.

In that scenario, the very first request goes to GitHub Pages' static file server, not to the running React application, because the React application has not loaded yet, it is what the browser is about to request. GitHub Pages looks for a file at the path \`/courses/nestjs\`, finds nothing (because that "page" only exists as a route React Router renders client-side, there is no actual \`courses/nestjs.html\` file), and returns a **404**.

The fix exploits a specific feature of GitHub Pages: it serves a custom \`404.html\` file, if one exists, for any request that does not match a real file. The build step copies the exact same \`index.html\` that normally boots the application into \`404.html\`:

\`\`\`json
// package.json (excerpt)
{
  "scripts": {
    "build": "vite build && cp dist/index.html dist/404.html"
  }
}
\`\`\`

Now, a direct request to \`/courses/nestjs\` still gets a 404 status from GitHub Pages' file lookup, but the body of that 404 response is the full application shell, the same \`index.html\` that would normally load. The browser downloads and runs the React application exactly as if it had loaded normally, React Router initializes, reads the current URL from \`window.location\`, sees \`/courses/nestjs\`, and renders the matching route, all client-side, after the fact. The user experiences a correct page load with a brief extra round trip, not an actual broken link.

The second detail that has to match the deployment target exactly is the **base path** configured in \`vite.config.ts\`:

\`\`\`typescript
// vite.config.ts
export default defineConfig({
  base: '/', // custom domain serves from the root
  // base: '/backend-interview-forge/' would be needed for the default
  // GitHub Pages subdomain, e.g. umanmushtaq.github.io/backend-interview-forge/
  plugins: [react()],
});
\`\`\`

This setting controls the prefix Vite bakes into every asset URL in the built output, script tags, stylesheet links, image references. When the platform is served from a custom domain at the root, \`base\` must be \`/\`, because assets are requested from \`domain.com/assets/...\`. If it were instead served from the default GitHub Pages project subdomain, \`username.github.io/backend-interview-forge/\`, the base would need to be \`/backend-interview-forge/\` so every asset request includes that path prefix. Getting this wrong produces a page that loads an empty white screen, because every script and stylesheet request 404s against the wrong path, even though the HTML itself loaded successfully.

The general lesson generalizes beyond GitHub Pages specifically: **client-side routing and static file hosting are two different models of "what does a URL mean,"** and any time you deploy a single-page application to a host that was designed around the first model (file-per-path) rather than built with SPA support in mind, you need an explicit fallback that routes all unmatched paths back to the application shell. Some hosts call this a rewrite rule, some call it a fallback document, GitHub Pages happens to call it \`404.html\`, but the underlying problem and fix are the same everywhere.

In an interview, say: "React Router does client-side routing, but GitHub Pages serves static files by path, so a direct navigation or refresh on a nested route 404s before React ever loads. The fix is copying index.html to 404.html at build time, since GitHub Pages serves that file for any unmatched path, and its content boots the app, which then reads the URL and renders the right route client-side. Separately, the Vite base path has to exactly match the deployment path, root for a custom domain, the repo name as a prefix for the default GitHub Pages subdomain, or every asset request 404s and you get a blank page. It's the general problem of client-side routing versus server-side file lookup, and every static host needs some version of this same fallback."
      `.trim(),
    },
    {
      id: 'forge-content-architecture',
      title: 'The course content architecture: TypeScript as a CMS',
      content: `
Every course on this platform, including this very course explaining how the platform works, lives as plain TypeScript source files inside \`src/data/learn/\`. There is no content management system, no database table of lessons, no admin panel where an author logs in to edit copy. Content is code, quite literally, and that choice deserves the same scrutiny as any other architectural decision in this platform.

Each course file exports one object matching the \`LearnModule\` type: an \`id\`, a \`title\`, a short \`blurb\`, and a \`lessons\` array, where each lesson has its own \`id\`, \`title\`, and a \`content\` string written in Markdown:

\`\`\`typescript
// src/types.ts (excerpt)
export interface Lesson {
  id: string;
  title: string;
  content: string; // markdown
}

export interface LearnModule {
  id: string;
  title: string;
  blurb: string;
  lessons: Lesson[];
}
\`\`\`

\`\`\`typescript
// src/data/learn/index.ts (excerpt)
import { nestjs } from './nestjs';
import { redis } from './redis';
// ...

export const LEARN_MODULES: LearnModule[] = [nestjs, redis /* ... */];
\`\`\`

Adding a new course, or a new lesson inside an existing course, means writing a new TypeScript object (or extending an existing file's \`lessons\` array) and registering it in one central index file, then deploying that change through the exact same build-and-push pipeline as any other code change. There is no separate content pipeline, no content preview environment, no distinction in the deployment process between "code changed" and "content changed," because from the build's perspective, they are the same thing.

This gives up something real: content cannot be edited without writing TypeScript and running a deployment. A non-technical author, someone who wanted to fix a typo or add a new lesson without touching code, could not do so through this system, because there is no interface for them to use, only a text editor and a git workflow. For a platform with a single technical author who is also the sole developer, this limitation costs nothing, because that person was always going to be comfortable editing TypeScript files directly.

What is gained in exchange is worth being specific about, since "it's simpler" undersells it. Content is **version-controlled** by the same git history as the code, meaning every wording change, every added lesson, has a full history of who changed what and when, for free, through tooling already in place for the code itself. Content is **type-safe**: a course object missing a required field, or a lesson with the wrong shape, is a TypeScript compile error caught before deployment, not a runtime surprise discovered by a user. Content is **co-located** with the code that renders it, so a change to how lessons are displayed and a change to what a lesson says can be reviewed and reasoned about in the same place, rather than split across a codebase and a separate CMS with its own versioning and its own potential for drift between the two.

The natural interview question is when you would choose a **headless CMS**, a system like Contentful or Sanity that stores content separately from code and exposes it through an API, instead of this code-as-content approach. A headless CMS earns its complexity when content is authored by non-technical people who need an editing interface without touching code, when content changes need to ship independently of code deployments (a marketing team publishing a blog post should not need an engineer to run a build), when there are multiple content authors working concurrently and needing draft and review workflows, or when the same content needs to be served to multiple different frontends. None of those conditions hold for a single-author technical learning platform, which is exactly why code-as-content is the better fit here, not merely the easier one.

In an interview, say: "All course content is TypeScript objects, one file per course, each with an id, title, and an array of lessons written in Markdown, registered in one index file. There's no CMS and no admin panel, so adding content means editing TypeScript and deploying, same pipeline as any code change. That gives me version control, type safety, and co-location with the rendering code for free, at the cost of needing a code deployment for any content change. I'd reach for a headless CMS the moment there were non-technical authors, or content needed to ship independently of code, or multiple authors needed draft and review workflows. None of that applies to a single-author platform, so the simpler code-based approach is the correct choice, not a shortcut."
      `.trim(),
    },
    {
      id: 'forge-interview-qa',
      title: 'The interview questions interviewers will ask about this platform',
      content: `
This platform is an unusual kind of project to bring into an interview, because the interviewer can, in principle, open it in a browser and use it live while you talk. That makes vague or half-remembered answers immediately obvious, and precise ones immediately credible. Here are the questions that come up most often, with the exact reasoning behind each answer.

**"Why React and not Next.js?"**
Next.js earns its complexity through server-side rendering, API routes, and SEO optimization for content that needs to rank in search engines or be crawled before JavaScript runs. This platform is a private, authenticated-by-nature (via the user's own Gemini key) personal tool with no public content that needs search indexing and no server-side logic to run at all, since everything client-side already covers every requirement. A plain client-side React SPA on Vite is the simpler, correctly-scoped choice, and adding Next.js would mean adopting a framework's server-rendering machinery for a project with nothing to render server-side.

**"Why GitHub Pages and not Vercel or Netlify?"**
GitHub Pages is free, requires no separate account or billing relationship, and integrates directly with the same GitHub repository already hosting the code, so there is no additional service to configure or monitor. Vercel and Netlify both offer real advantages, serverless functions, preview deployments per pull request, edge middleware, none of which this platform needs, since it has no server-side logic and no requirement for preview environments beyond what a local dev server already provides. Paying for capability the project does not use is the wrong trade here.

**"How do you handle state management without Redux?"**
The data is genuinely simple: one JSON blob in localStorage, read on mount, written on every update, exposed through one custom hook. Redux, or any comparable state management library, earns its complexity when state is shared across many deeply nested components with complex update logic, or when time-travel debugging and middleware (logging, undo/redo) provide real value. This platform's state shape is flat enough and its update patterns simple enough that plain React state plus a thin localStorage-backed hook covers every actual need without the additional dependency or boilerplate.

**"What happens if the user clears their browser storage?"**
All progress, quiz history, coding attempts, everything, is lost, with no server-side backup to recover it from. This is an accepted, explicit trade-off rather than an oversight: for a personal tool with no backend, there is nowhere else for that data to live. A user who cares about not losing progress could, in principle, export their localStorage manually, but the platform does not currently build that in, since the target use case, one person, one primary device, makes this an edge case rather than a common failure mode.

**"How would you add multi-device sync?"**
This is the point where the "no backend" decision would genuinely reverse. Sync across devices requires a shared source of truth that no single device owns, which means a real backend: a small Node.js or NestJS API, a simple authentication layer (even something minimal like email-and-password or a third-party OAuth provider), and a proper database, PostgreSQL being the natural choice given the rest of this platform's stack preferences. Every localStorage read and write in the current codebase would become an API call instead, and the client-side Gemini calls could either stay client-side (keeping the "user's own key" model) or move server-side if centralizing quota across devices became desirable.

**"Why not encrypt the Gemini API key in localStorage?"**
Encryption protects a secret from a party without the key needed to decrypt it. In a browser environment, any encryption key used to protect the Gemini API key would itself have to live somewhere the browser's own JavaScript can read it, which means it would be exactly as exposed as the Gemini key it was meant to protect. Encrypting a secret with a key that is stored right next to it does not add a real security boundary, it adds code complexity with no corresponding security gain. The actual security model here is not "hide the key from the browser," it is "the key belongs to the user running the browser, and no one else's data or budget is exposed by its presence," which is a different and already-satisfied property.

In an interview, treat every one of these as the start of a conversation, not the end of one. An interviewer who hears a precise, reasoned answer to "why not encrypt the API key" will often follow up with "when would you need to," and being ready to keep reasoning forward from there is what actually demonstrates architectural judgment, rather than a memorized talking point.
      `.trim(),
    },
  ],
};
