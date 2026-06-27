# Backend Interview Forge

A personal learning platform I built to prepare myself for senior backend engineering interviews at European fintech companies. It covers everything I need to know, the way I want to learn it.

**Live:** https://umanmushtaq.github.io/backend-interview-forge/

![Platform screenshot](./screenshot.png)
*(Add a screenshot of the platform here)*

---

## What it is

I am a Senior NestJS engineer based in Paris, actively interviewing at companies like Qonto, Alan, Swan, and Doctolib. I found that generic interview prep resources either lacked depth or were not specific to the stack I use daily. So I built my own.

Backend Interview Forge is a study platform that lives entirely in the browser. There is no backend, no database, no account. Everything runs locally, including AI features powered by your own Gemini API key that you paste into Settings. Nothing leaves your machine except the requests you make directly to Google.

---

## Courses

The platform has 13 courses, each with multiple chapters written in a dense, practical style similar to AlgoMaster. The topics are JavaScript, TypeScript, Node.js, NestJS, PostgreSQL, Redis, RabbitMQ, Kafka, System Design, Testing, Microservices, DSA Patterns, and a NexusPay Deep Dive.

The NexusPay course covers the event-driven fintech platform I built as my flagship project, the one I discuss in every interview. It goes deep into the Saga pattern, distributed locks, KYC flows, Kafka streaming, and microservice boundaries.

---

## AI features

After each chapter, Gemini generates five quiz questions based specifically on what you just read. Every retry produces different questions, so you can drill the same chapter multiple times without seeing the same questions twice.

The Interview Simulator lets you pick a topic, difficulty level, and number of questions. Gemini acts as the interviewer, asks realistic backend questions, scores each of your answers from 0 to 10, and tells you exactly what you got right and what was missing. It also shows you a model answer from the perspective of a senior engineer.

The NexusPay Mock Interview mode is something I built specifically for my own job search. Gemini plays a senior engineer from a company like Qonto and asks hard, specific questions about the NexusPay architecture. Not generic backend theory. Questions about why I chose SET NX EX 30 for distributed locks, how the transfer Saga handles a failed credit after a successful debit, how data flows between services that each own their own PostgreSQL database. You can focus the session on a specific area like the KYC Flow, Redis Usage, or gRPC and GraphQL Evolution. At the end you get a readiness score that tells you honestly whether you are ready to walk into a fintech interview.

---

## Other features

Global search across every lesson in every course opens with Cmd+K. You can bookmark any chapter to revisit later. Progress tracking includes per-course completion, a study streak, a daily goal that resets each day, a weak spots panel, and a study heatmap. The platform works on mobile and supports dark and light mode.

---

## Tech stack

The platform is built with React 19, Vite, TypeScript, Tailwind CSS, and React Router, deployed as a static site on GitHub Pages.

---

## Local development

```bash
git clone https://github.com/umanmushtaq/backend-interview-forge.git
cd backend-interview-forge
npm install
npm run dev
```

Open http://localhost:5173 in your browser. To use AI features, go to Settings and paste your Gemini API key. You can get one for free at https://aistudio.google.com.

---

## Why I built this

I could not find a resource that covered my exact stack with the depth I needed, so I decided to build one. What started as a small quiz app turned into something I actually use every day to prepare for interviews. Writing the course content forced me to understand topics well enough to explain them, which turned out to be the best way to study them.

If you are preparing for similar roles and find it useful, that is great. But I built it for myself first.

Uman Mushtaq, Paris
