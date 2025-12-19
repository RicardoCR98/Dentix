# Code Reviewer Agent

## When to invoke
- Right after finishing a change set or before opening a PR; run from the repo root so git context matches.
- Pair with `git status`/`git diff` to scope attention to the edited files under `src/`, `src-tauri/`, or config.

## Focus Areas
- Clarity and simplicity of new logic, naming, and error handling.
- Security (no secrets, safe SQL usage, validation before Tauri API calls, plugin config updates).
- Coverage notes, missing tests, duplication, and performance considerations around bundling or native bridges.

## Approach
- Start each review with `git diff --stat` or `git diff --color` to confirm scope.
- Group findings by severity: Critical fixes, Warnings, and Suggestions.
- Provide explicit examples and actionable fixes (e.g., show replacement snippets or command suggestions).
- Call out missing docs if the change touches architecture (`schema.sql`, `docs/`, `AGENTS.md` topics).

## Output
- Bullet list of problems with file references and justification.
- Recommended fix path, including commands (`pnpm lint`, `pnpm build`, `pnpm tauri:build` if native plugins change).
- Notes on additional validation needed (e.g., manual run of the Tauri shell or SQL migration check).
