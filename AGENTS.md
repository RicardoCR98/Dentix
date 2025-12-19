# Repository Guidelines

## Project Structure & Module Organization
- `src/` — React + TypeScript app: `components/` (Radix/Tailwind UI), `pages/` (routes), `hooks/`, `stores/` (Zustand), `theme/` tokens, `assets/` static.
- `src-tauri/` — Tauri shell/config/plugins; update when desktop behavior or permissions change.
- `public/` — static assets for Vite; `docs/` + root `*.md` hold runbooks and context; `agents/` stores AI agent prompts/configs.
- `dist/` — output of `pnpm build`; avoid manual edits.

## Build, Test, and Development Commands
- Install deps: `pnpm install` (pnpm lock is authoritative).
- Web dev: `pnpm dev` (Vite + HMR). Production preview: `pnpm preview`.
- Desktop dev: `pnpm tauri:dev`; desktop build: `pnpm tauri:build`.
- Web build: `pnpm build` → `dist/`; lint: `pnpm lint` (ESLint 9 + React hooks + TS rules).

## Coding Style & Naming Conventions
- TypeScript + React 19 hooks; keep components small and pure. Prefer named exports.
- Files: components `PascalCase.tsx`; hooks `useThing.ts`; utilities `camelCase.ts`.
- Styling: Tailwind v4 utilities with `clsx`; use Radix primitives for inputs, dialogs, menus. Keep class lists concise; avoid inline styles.
- Indent with 2 spaces; favor ASCII identifiers/strings; run `pnpm lint` before pushing.

## Testing Guidelines
- No automated tests are configured yet. For new logic, prefer Vitest + React Testing Library with co-located specs `*.test.ts(x)`.
- For UI changes, include brief manual steps in PRs (e.g., create patient → edit procedures table → save) plus screenshots/GIFs of key states.

## Commit & Pull Request Guidelines
- Git history favors short imperative prefixes: `add: …`, `fix: …`, `update: …`. Follow that format; scope tags optional.
- PRs: include purpose, summary of changes, manual test notes, linked issues, and UI evidence for visual tweaks. Call out DB/Tauri config changes explicitly.
- Keep PRs focused; avoid mixing feature work with formatting-only churn.

## Security & Configuration Notes
- Desktop data persists through the Tauri SQL plugin; sanitize inputs and avoid raw SQL string concatenation.
- Do not commit secrets; use env vars or OS keychains. Document any new permissions in `src-tauri/tauri.conf.json`.
