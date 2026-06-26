# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vite-powered React 18 and TypeScript application. Application bootstrapping and routing live in `src/index.tsx` and `src/App.tsx`. Role-specific screens are grouped under `src/pages/alumno`, `src/pages/padre`, and `src/pages/instructor`; reusable feature components live in `src/components/alumno` and `src/components/shared`. Keep low-level controls in `src/components/ui`, shared logic in `src/lib`, and fixture data in `src/data/mock.ts`.

Global styles are in `src/index.css`; Tailwind configuration is in `tailwind.config.js`. The hashed `src/_designSystem/` directory contains generated design-system output. Prefer importing its exports through `src/components/ui` and avoid hand-editing the generated bundle.

## Build, Test, and Development Commands

- `npm install` installs dependencies (the repository currently has no lockfile).
- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` creates the production bundle in `dist/` and catches TypeScript/build failures.
- `npm run lint` checks JavaScript and TypeScript with ESLint.
- `npm run preview` serves the built bundle for final local verification.

Run commands from the repository root.

## Coding Style & Naming Conventions

Use TypeScript for new application code, two-space indentation, semicolons, single quotes, and ES modules. Follow the strict compiler settings in `tsconfig.json`; do not leave unused imports or parameters. Name React components and their files in PascalCase (`MasteryBadge.tsx`), hooks with a `use` prefix (`usePadreData.ts`), and functions/variables in camelCase. Keep route directories lowercase. Compose styling with Tailwind utilities and reuse theme/design-system tokens rather than introducing one-off CSS values. ESLint is authoritative; no Prettier configuration is present.

## Testing Guidelines

No automated test framework or coverage threshold is configured yet. Before submitting changes, run `npm run lint` and `npm run build`, then manually exercise affected routes such as `/alumno`, `/padre`, and `/instructor`. If adding tests, use `*.test.ts` or `*.test.tsx` beside the module and add the chosen runner and script to `package.json` in the same change.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit-style subjects, for example `feat: add instructor and parent dashboard features`. Continue with prefixes such as `feat:`, `fix:`, `refactor:`, or `docs:` and keep each commit focused. Pull requests should explain behavior changes, list validation performed, link relevant issues, and include screenshots or recordings for UI changes. Call out changes to mock-data assumptions, routes, or generated design-system files.
