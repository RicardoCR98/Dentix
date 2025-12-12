# Repository Guidelines

## Project Structure & Modules
- `src/` — React + TypeScript app (routing, views, Zustand stores, UI components).
- `src-tauri/` — Tauri (Rust) desktop shell and plugins config.
- `public/` — static assets served by Vite.
- `dist/` — production build output.
- `docs/` and root `*.md` — design/implementation notes.
- `schema.sql` and `schema.puml` — app data model (used with Tauri SQL plugin).

## Build, Test, and Development
- Install: `pnpm install` (pnpm is expected; see `pnpm-lock.yaml`).
- Web dev server: `pnpm dev` (Vite at localhost with HMR).
- Desktop dev (Tauri): `pnpm tauri:dev` (spawns Vite + Tauri shell).
- Build web: `pnpm build` (outputs to `dist/`).
- Build desktop: `pnpm tauri:build` (platform binaries under `src-tauri/target`).
- Lint: `pnpm lint` (ESLint 9, React hooks, TypeScript rules).

## Coding Style & Naming
- TypeScript strictness per `tsconfig*.json`; prefer explicit types on public APIs.
- React 19 with hooks; co-locate state with features; global state via `zustand/*`.
- Tailwind v4 utility-first; use small, composable class lists and `clsx`.
- Components: `PascalCase.tsx`; hooks: `useThing.ts`; utilities: `camelCase.ts`.
- Avoid default exports for shared modules; prefer named exports.
- Run `pnpm lint` before pushing; fix warnings unless intentionally justified.

## Testing Guidelines
- No formal test runner is configured yet. For contributions that add risky logic, include lightweight tests (suggested: Vitest + React Testing Library) or add story-style examples in `docs/` demonstrating behavior and edge cases.
- Follow file co-location: `src/feature/File.test.ts` when adding tests.

## Commit & Pull Requests
- Commits: concise, imperative subject; scope where helpful. Examples: `feat: add patient search`, `fix(sql): escape identifiers`, `chore: bump tauri cli`.
- PRs must include: purpose, summary of changes, screenshots/GIFs for UI, and any migration notes (DB/schema changes in `schema.sql`). Link issues when applicable.
- Keep PRs focused and under ~400 lines of diff when possible.

## Security & Configuration
- Desktop data persists via Tauri SQL plugin; validate inputs and avoid raw SQL string concatenation.
- Do not commit secrets. Prefer OS keychains or `.env` ignored by Git if needed.
- When introducing native permissions, document rationale in `src-tauri/tauri.conf.json`.

