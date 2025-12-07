# Repository Guidelines

## Project Structure & Module Organization
- Runtime code is organized as a Next.js app: keep route-level screens under `app/`, and reusable UI/gameplay pieces under `components/`.
- Shared utilities (math helpers, physics hooks, data loaders) belong in `lib/`, and scene assets (models, textures, audio) live in `public/` with logical subfolders such as `public/models` and `public/textures`.
- Styling follows Next.js defaults with CSS Modules or Tailwind; keep global tokens in `styles/` if added, and avoid coupling styling to 3D logic.
- Build artifacts land in `.next/`, and dependencies in `node_modules/`; neither should be committed.

## Build, Test, and Development Commands
- `npm install` (or `pnpm install` / `yarn install`): install dependencies; use Node 18+ for parity with Next.js.
- `npm run dev`: start the local dev server with hot reload.
- `npm run lint`: run ESLint (catches TS/JS and React issues). Fix lint errors before committing.
- `npm run build`: create an optimized production build; run this before a release or large PR to catch type and bundle issues early.

## Coding Style & Naming Conventions
- TypeScript-first; keep files as `.tsx`/`.ts`. Prefer explicit types on public APIs and props, and narrow types for game state.
- Use 2-space indentation, single quotes in TS/JS, and trailing commas per Prettier defaults. Let linters/formatters fix whitespace rather than manual tweaks.
- Components: PascalCase (`PlayerController.tsx`); hooks/utilities: camelCase (`useInputState.ts`); constants: SCREAMING_SNAKE_CASE.
- Keep side effects isolated; prefer pure helpers in `lib/` and controlled React state/refs for scene objects.

## Testing Guidelines
- There is no established suite yet; add tests when touching input handling, physics, or rendering logic. Favor React Testing Library for UI, and lightweight unit tests for math/helpers.
- Co-locate tests in `__tests__/` near the code or as `*.test.ts[x]`. Aim for meaningful coverage on new code paths rather than a percentage target.
- Validate critical flows (loading assets, movement controls, collisions) manually in `npm run dev` until an automated harness is added.

## Commit & Pull Request Guidelines
- Use concise, imperative commit titles (`Add jump cooldown`, `Fix tree chop hitbox`); group related changes rather than large mixed commits.
- PRs should describe the change, rationale, and testing done; link issues when available. Include screenshots or short clips for visual changes or gameplay tweaks.
- Keep diffs focused: avoid reformatting unrelated files and ensure `npm run lint`/`npm run build` pass before requesting review.

## Security & Configuration Tips
- Do not commit secrets; use environment variables via `.env.local` and document required keys in the PR description.
- Pin external asset sources and third-party URLs; prefer local copies in `public/` for determinism and offline builds.
