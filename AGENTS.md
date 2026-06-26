# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vite React 18 + TypeScript EdTech demo backed by hosted Supabase. App bootstrap and routing live in `src/index.tsx` and `src/App.tsx`. Role screens are in `src/pages/AlumnoView.tsx`, `src/pages/padre/`, and `src/pages/instructor/`. Reusable UI and feature components live in `src/components/shared`, `src/components/alumno`, and `src/components/ui`; shared client logic and pure helpers live in `src/lib`.

Supabase assets live under `supabase/`: versioned SQL migrations in `supabase/migrations` and Edge Functions in `supabase/functions`. The generated `src/_designSystem/` bundle should not be edited directly; import through wrappers in `src/components/ui`.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Vite dev server.
- `npm run typecheck` runs strict TypeScript checks.
- `npm test` runs Vitest unit tests.
- `npm run lint` runs ESLint.
- `npm run build` creates the production bundle in `dist/`.
- `npx supabase db reset --local` validates migrations against the local Supabase stack.

Run commands from the repository root.

## Coding Style & Naming Conventions

Use TypeScript, two-space indentation, semicolons, single quotes, and ES modules. Component files use PascalCase (`MasteryBar.tsx`), hooks use a `use` prefix (`usePadreData.ts`), and helpers use camelCase. Keep route directories lowercase. Prefer Tailwind utilities and existing design-system wrappers over one-off CSS.

Frontend code must never import service-role credentials or administrative Supabase secrets. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are browser-safe.

## Testing Guidelines

Place tests beside modules as `*.test.ts` or `*.test.tsx`. Current tests cover role routing, mastery thresholds, and `0..1` to percentage conversion. Before handing off changes, run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.

## Supabase & Security Guidelines

Use migrations for schema changes; do not make ad hoc dashboard edits without backfilling a migration. Sensitive writes must stay in Edge Functions, with RLS enabled on exposed tables. Parent/instructor dashboards must remain aggregate/read-only and must not expose rubrics, expected answers, emails, or free-text responses.

## Commit & Pull Request Guidelines

Use concise Conventional Commit-style subjects such as `feat: add adaptive feedback flow` or `fix: harden response ingestion`. Pull requests should include behavior summary, validation commands, linked issues, and screenshots for UI changes.
