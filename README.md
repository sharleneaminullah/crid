# CRID (Career Reentry Intelligence Dashboard)

A lot of professionals taking a career break struggle to prove they still have what it takes for "Senior" or "Lead" roles. CRID is a tool built to help them map their skill gaps against a target job, generate a project-based learning roadmap, and give them a verifiable "readiness certificate" they can show to recruiters.

![alt text](<Landing Page - CRID.png>)

## What it does

![alt text](<Analyzer - CRID.png>)

- **Skill Gap Analysis:** You input your target role and experience, and the AI compares it against market expectations.
- **Learning Roadmap:** Based on your gaps, the AI generates 5 specific "build-it" projects to fill those gaps.
- **Progress Tracker:** As you check off subtasks, your overall readiness score updates in real-time with a trend line.
- **AI Coach:** A streaming chat interface that actually knows your current score and skill gaps, so it can give context-aware advice.
- **PDF Certificate:** Export a summary of your skills, score trend, and completed projects.

## Tech Stack

It's a pretty standard modern React/TypeScript stack:

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui (Radix)
- **State & Data:** Zustand, TanStack Query, Dexie.js (IndexedDB)
- **Forms:** React Hook Form + Zod
- **AI Backend:** Vercel AI SDK (Groq by default, swappable to OpenAI/Gemini)
- **Hosting:** Express (local dev) + Vercel Serverless (production)

## Running it locally

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/sharleneaminullah/crid.git
cd crid
npm install
```
