# Copilot / AI agent instructions — Mathematics Robo Tutor

Short, actionable guidance to make coding assistants immediately productive in this repository.

1. Big picture
- This is a Next.js 14 "app/"-directory project that serves a client UI at `app/page.tsx` and a server API at `app/api/generate-questions/route.ts`.
- The UI is a single-page client React component (`app/page.tsx` - it starts with `"use client"`) that POSTs `{ topic, grade }` to `/api/generate-questions` to get 10 MCQs.
- The API route runs on the Edge runtime (`export const runtime = "edge"`) and uses Google Generative AI via `@ai-sdk/google` + `ai.generateObject` to build questions. If keys fail, the route falls back to an `offlineBank` inside `route.ts`.

2. Files to inspect / edit for common changes
- Frontend UI and topics: `app/page.tsx` — contains grade/topic lists, UI state, and `fetch('/api/generate-questions')` usage.
- Server generation logic and schema: `app/api/generate-questions/route.ts` — contains `buildPrompt`, `responseSchema` (zod), `generateObject` usage, offline fallback, and the topic/grade definitions used by the server.
- App layout and global styles: `app/layout.tsx`, `app/globals.css`.
- Dev scripts and dependencies: `package.json` (use `npm run dev`, `npm run build`, `npm start`, `npm run lint`).

3. Patterns & conventions specific to this codebase
- Topic & grade canonical lists live in both `app/page.tsx` and `route.ts`. If you add or rename a topic/grade, update BOTH files to keep client and server enums in sync.
- Server-side schema validation uses `zod` in `route.ts`. The API strictly expects the JSON shape specified by `responseSchema`. Keep any changes to output shape aligned with the zod schema.
- The API runs on the Edge runtime. Avoid Node-only APIs or packages that are incompatible with Edge functions in `route.ts` (e.g., filesystem, certain native modules).
- Environment keys: the route reads `process.env.GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY_2`, and `GOOGLE_GENERATIVE_AI_API_KEY_ALT`. Keys are tried in sequence; missing keys fall back to `offlineBank` (local static questions).

4. Development / debugging tips
- Start dev server: `npm run dev` (Next's dev server). Check terminal logs for server-side errors and browser console for client-side fetch errors.
- Local env: create `.env.local` with `GOOGLE_GENERATIVE_AI_API_KEY=...` on your machine for API usage. For Windows PowerShell you can also set: `$env:GOOGLE_GENERATIVE_AI_API_KEY='value'` for a session.
- If the API returns `{ source: "offline" }` or questions from `offlineBank`, inspect `app/api/generate-questions/route.ts` for fallback logic and sample question format.
- To reproduce validation errors locally, call the API using `curl` or a small script: `curl -X POST http://localhost:3000/api/generate-questions -H "Content-Type: application/json" -d '{"topic":"g2-numbers-1000","grade":"2"}'`.

5. AI-generation specifics to preserve
- `buildPrompt` in `route.ts` contains the exact prompt template the API sends to Gemini. If you refactor prompt text make minimal, well-tested changes — the frontend expects 10 questions with ids `q1`..`q10` by default and an array `questions` in the JSON response.
- `generateObject` is called with `schema` and `schemaName`; the server parses and validates the LLM output using the same `zod` schema — keep these aligned.

6. Quick examples
- Client -> server request body (from `app/page.tsx`):
  - { "topic": "g2-numbers-1000", "grade": "2" }
- Server expected response shape (zod `responseSchema` in `route.ts`):
  - { "questions": [ { "id": "q1", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "type": "g2-numbers-1000", "explanation": "..." }, ... ] }

7. When modifying topics, prompts, or schemas
- Update `gradeTopics` and `topicList` in `app/api/generate-questions/route.ts` first, then mirror the human-facing `gradeTopics` in `app/page.tsx` so the client shows the new options.
- Update `topicEnum` and `requestSchema` (zod) together when adding new topic strings.

8. Tests and linting
- There are no unit tests included; run `npm run lint` to surface style issues. If you add tests, place them in a `__tests__` or `tests` folder and prefer small, focused tests around `buildPrompt` and schema parsing.

9. Safety & edge cases
- The API sanitizes LLM output with `zod`. If the LLM returns unexpected shapes, the route catches errors and serves `offlineBank` to maintain UX continuity.

If anything here is unclear or you'd like me to include extra examples (e.g., exact edit snippet to add a new topic + schema change), tell me which part to expand and I will iterate. 
