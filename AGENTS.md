# AGENTS.md

This file defines the default rules for AI agents working in this repository.

## Project Snapshot

- App: Da Big Bren Bingo
- Frontend: React + Vite in `client/`
- Backend: Express + PostgreSQL in `server/`
- Deployment: Vercel frontend with `/api/*` proxy to Railway backend
- Auth: Discord OAuth for creators only; viewers are anonymous
- Viewer state: board identity and drawings are local-only, browser-scoped behavior

## Core Product Rules

- Do not add viewer accounts, viewer sessions, or server-side viewer state unless explicitly requested.
- Keep the current model: creators authenticate with Discord, viewers do not.
- Preserve deterministic board generation. The same board ID + visitor ID + board update timestamp must produce the same layout.
- Preserve local drawing persistence per board and visitor. Do not move drawing state to the server unless explicitly requested.
- Do not expose the full item pool to anonymous viewers. Owner-only edit data must stay owner-only.

## Collaboration Style

- Treat the user as a collaborator, not a ticket vending machine.
- It is good to propose alternatives, challenge weak ideas, and point out tradeoffs when they matter.
- Do not be contrarian for sport. Push back when there is a concrete product, technical, or maintenance reason.
- When the user asks for a feature, consider whether there is a simpler or safer way to achieve the same outcome.
- Surface risks early: auth, proxying, validation drift, performance regressions, and misleading UX are worth calling out.
- If the user wants brainstorming or tradeoff analysis, do that explicitly before coding. Otherwise, once the direction is clear, execute.

## Git Workflow

- Do not work directly on `main` unless the user explicitly asks for it.
- Default flow for non-trivial work:
  - create a feature branch from `main`
  - make focused commits in logical chunks
  - keep diffs reviewable
  - open a pull request for user review instead of pushing straight to production
- Prefer multiple small commits over one giant checkpoint commit when the work naturally breaks into steps.
- If a task is too small to justify a branch, call that out explicitly instead of silently defaulting to `main`.
- Before opening a PR, summarize what changed, what was verified, and what remains risky or unverified.

## Architecture Constraints

- Keep the Vercel to Railway same-origin proxy model intact.
- Frontend auth links should continue to use relative `/api/...` routes, not hardcoded backend URLs.
- Preserve the production cookie setup that depends on Express `trust proxy` and same-origin requests.
- Do not remove or weaken ownership checks on board update/delete routes.
- Prefer fixing behavior in the existing split architecture instead of collapsing frontend and backend into one app.

## Validation And Data Rules

- Board items are normalized by trimming and dropping blank entries before validation and save.
- Board item limits:
  - Minimum `24` items when free space is enabled
  - Minimum `25` items when free space is disabled
  - Maximum `500` items
  - Maximum `255` characters per item
- Board titles must be non-empty and at most `255` characters.
- Keep client and server validation rules aligned. If one changes, update the other in the same task.

## Frontend Guidelines

- Preserve the existing retro neon / old-web visual direction unless the task explicitly asks for a redesign.
- Avoid generic component-library styling or flattening the visual personality of the app.
- Keep the play experience lightweight. Do not add expensive per-cell rendering or unnecessary state churn.
- Be careful with render-time side effects. Avoid reading/writing storage during render when an effect or lazy initializer is more appropriate.
- If moving hooks or shared state helpers, keep React lint rules green.

## Backend Guidelines

- Use parameterized SQL only.
- Keep route behavior explicit and simple; this app does not need heavy abstraction.
- Prefer small helper functions for shared validation over duplicated route logic.
- Do not silently weaken auth, session, or validation behavior for convenience.
- If a change affects public API behavior, update docs in the same pass.

## Testing And Verification

- For client-only changes, run:
  - `cd client && npm run lint`
  - `cd client && npm run build`
- For backend or full-stack changes, verify the relevant API paths locally if practical.
- Local backend requires PostgreSQL from `.env`. Docker-backed local Postgres is acceptable.
- Prefer targeted smoke tests over broad refactors without validation.
- Prefer behavior-focused tests over coverage-focused tests.
- Good tests in this repo protect product rules and regressions:
  - board validation rules
  - deterministic shuffling behavior
  - owner-only edit/delete behavior
  - anonymous viewer data boundaries
  - local drawing persistence semantics
- Do not add low-value tests that only mirror implementation details or inflate coverage numbers.
- When adding a bug fix, prefer a test that reproduces the bug if a test harness exists or can be added cheaply.
- If there is no suitable automated test harness yet, say that explicitly and validate with the narrowest meaningful manual or API-level check.

## Deployment Notes

- Production is the real environment that matters, but avoid shipping obviously unverified changes when local checks are available.
- Railway environment variables are security-critical. Do not assume fallback values are safe in production.
- If auth, cookies, redirects, proxying, or env vars change, call that out explicitly in the final response.

## Documentation Rules

- Keep `README.md` and `docs/ARCHITECTURE.md` aligned with actual behavior.
- If product copy changes user expectations, update the About page too.
- Do not leave docs describing behavior that code no longer implements.

## Change Style

- Prefer minimal, surgical edits.
- Do not reformat unrelated files.
- Do not introduce new dependencies unless they solve a real problem.
- Do not replace working bespoke code with framework-heavy abstractions without a strong reason.
- If you find unrelated issues, mention them separately instead of folding them into the same change by default.

## High-Risk Areas

- `server/index.js`: session, cookies, proxy behavior
- `server/routes/auth.js`: Discord OAuth flow and redirects
- `server/routes/boards.js`: ownership, validation, data exposure
- `server/lib/shuffle.js`: deterministic grid generation
- `client/src/pages/BoardPlay.jsx`: viewer experience and overlay behavior
- `client/src/components/DrawingCanvas.jsx` and `client/src/hooks/useDrawingState.js`: local drawing persistence and performance
- `client/vercel.json`: production routing and API proxy behavior

## Good Final Responses

- State what changed.
- State what was verified.
- State any remaining risk or unverified area.
- Keep it concise.