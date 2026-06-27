# Repository Notes

## Commands
- Install: `npm install`.
- Use npm from the repo root; `package-lock.json` is the only active lockfile. `src/package.json` is a Magic Patterns artifact, not a workspace package.
- Dev/build: `npm run dev`, `npm run build`, `npm run preview`.
- Normal verification for app changes: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
- Focused Vitest: `npm test -- src/lib/scale.test.ts` or any `src/**/*.test.ts` / `src/**/*.test.tsx` path.
- API docs source is `docs/openapi.yaml`; `docs/index.html` renders it with Scalar at `/docs/`. The Vite plugin in `vite.config.ts` serves it in dev and copies it to `dist/docs` on build.
- SQL migration validation: `npx supabase db reset --local` requires the local Supabase/Docker stack.
- `npm run test:e2e` exists, but this repo currently has no `playwright.config.*` or e2e specs; do not treat it as required coverage unless you add them.

## App Structure
- This is a single Vite React 18 app. Bootstrap is `src/index.tsx`; role routing and guards are in `src/App.tsx` with `AuthProvider`, `RequireRole`, and routes for `alumno`, `padre`, and `instructor`.
- The auth profile uses both `profiles.id` (Supabase auth user id) and `profiles.student_id` (student-domain id used by responses, mastery, parent links, and sections). Do not interchange them.
- Role dashboards load through RPCs: `get_student_dashboard`, `get_parent_dashboard`, and `get_instructor_analytics`; avoid duplicating dashboard joins in browser code.
- UI wrappers in `src/components/ui/*` re-export the generated Magic Patterns bundle under `src/_designSystem/**`; do not edit that generated directory directly.
- Tailwind uses CSS variable colors and `darkMode: 'selector'`; there is no Prettier config, so follow the existing 2-space, semicolon, single-quote style manually.

## Supabase And Security
- Browser Supabase config is limited to `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; `VITE_SUPABASE_URL` must be the project base URL, not `/rest/v1`.
- Service-role access belongs only in Edge Functions via `supabase/functions/_shared/supabase.ts`; never import service-role credentials into `src/`.
- Supabase Auth signup is disabled locally; registration flows through `register-account` and the `register_profile` RPC.
- Several Edge Functions have `verify_jwt = false` in `supabase/config.toml`; they still enforce auth in code with `requireUser(...)` or `requireInternal(...)`. Preserve that explicit check on new functions.
- Parent/instructor views must stay aggregate/read-only. Do not expose raw free-text responses, rubrics, expected answers, or student emails outside the student/instructor-owner contexts already modeled by RPCs/RLS.
- Schema and seed changes must be migrations. `supabase/seed.sql` is intentionally a pointer; demo reference data is versioned in `supabase/migrations/20260626151000_seed_demo.sql`, and runtime users are not seeded.

## Edge Functions And AI Flow
- Edge Functions live in `supabase/functions/*/index.ts`; shared helpers live in `supabase/functions/_shared`. `npm run typecheck` only includes `src` and `vite.config.ts`, so it does not typecheck Edge Functions.
- New user-facing functions should handle CORS with `_shared/http.ts` and return `{ error_code }` shaped errors like the existing functions.
- Student response ingestion is asynchronous: `ingest-response` inserts a response, then calls `orchestrate-feedback` with `x-internal-secret`; `orchestrate-feedback` finalizes via `finalize_response`.
- AI question generation is draft-only: `generate-questions` inserts `ai_draft_questions`; `review-draft-question` approves/rejects; `approve_draft_question` inserts into `questions` with `active = false` for manual activation.
- Use `_shared/llm.ts` for new configurable LLM calls. Existing feedback/re-explanation paths call DeepSeek directly; do not reroute them without checking behavior and env requirements.

## Tests
- Vitest runs in `jsdom` and loads `src/test/setup.ts` for jest-dom matchers.
- Unit tests live beside helpers in `src/lib/*.test.ts`. `src/lib/draftValidation.test.ts` imports the pure shared validator from `supabase/functions/_shared/draftValidation.ts`; keep that module browser/Vitest-safe.
