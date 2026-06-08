# Backend Interview Forge

A free, self-hosted interview prep platform for backend engineers targeting EU senior roles. Quizzes, coding challenges, system design, SQL, and progress tracking — **zero cost, zero backend**. Everything runs in the browser and persists to `localStorage`.

> Full product spec: [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md)

## Features

- **Dashboard** — overall readiness, weak areas, a 90-day study heatmap, and per-category breakdown.
- **Quizzes** — multiple-choice questions across NestJS, PostgreSQL, Redis, RabbitMQ, Kafka, and System Design, with **Leitner spaced repetition** and a smart-review session for due questions.
- **Coding challenges** — implement DI containers, sagas, rate limiters, locks, caches, an event emitter, and algorithms in a **Monaco editor**; tests run in a sandboxed **Web Worker** (TypeScript transpiled in-browser).
- **System design arena** — timed prompts with section-by-section model answers and 5-dimension self-scoring.
- **SQL challenges** — write queries against a fintech schema, then compare with the model answer.
- **Interview Q&A** — rehearse spoken answers, see follow-ups, and rate your confidence.
- **Progress report** — readiness gauge, spaced-repetition status, coding stats, streaks, and JSON export/import.
- Dark/light theme, collapsible sidebar, keyboard shortcuts, and a first-visit onboarding tour.

## Tech stack

React 18 · Vite · TypeScript · Tailwind CSS · React Router · Monaco Editor · `localStorage`.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Deployment (GitHub Pages)

`vite.config.ts` sets `base` to `/backend-interview-forge/`, and `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.

One-time setup: in the repository, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**. After the next push, the app is live at:

```
https://umanmushtaq.github.io/backend-interview-forge/
```

## Adding content

All content lives in `src/data/` as typed TypeScript arrays — no code changes are needed to add questions or problems. For example, append new objects to `src/data/quizzes/redis.ts` following the existing shape.

---

Built by Uman Mushtaq — github.com/UmanMushtaq/backend-interview-forge
