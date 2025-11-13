# Repository Guidelines

## Project Structure & Module Organization
`src/module.ts` registers the Nuxt module entry point, while `src/runtime` holds runtime composables and server utilities that ship to consuming apps. Bundle artifacts live in `dist/` and are regenerated via the module builder; do not edit them manually. The demo application under `playground/` is the fastest way to validate changes, and `test/` hosts Vitest suites plus fixture Nuxt apps. Keep shared assets (icons, mocks) inside the relevant directory to avoid leaking into the published package.

## Build, Test, and Development Commands
- `npm run dev:prepare` – stub the module, generate types, and sync the playground for local hacking.
- `npm run dev` – start the playground Nuxt dev server with live reload.
- `npm run dev:build` – create a production build of the playground to sanity-check bundling.
- `npm run lint` / `npm run test` / `npm run test:watch` – run ESLint or Vitest once or in watch mode.
- `npm run test:types` – run `vue-tsc` type checks for the module and playground.
- `npm run prepack` / `npm run release` – build distributables and run the automated release pipeline.

## Coding Style & Naming Conventions
Follow the Nuxt ESLint preset (`eslint.config.mjs`) with 2-space indentation, single quotes, and semicolons auto-managed by the linter. Exported composables use `useX` naming, server handlers use `defineXHandler`, and configuration files stay in lowercase kebab case (e.g., `nuxt.config.ts`). Prefer TypeScript types over interfaces unless extending, and keep runtime utilities side-effect free so they tree-shake cleanly.

## Testing Guidelines
Vitest powers unit tests under `test/*.test.ts`; mirror the feature path inside `test/fixtures` when a fixture project is required. Name tests after the behavior under test (`feature-name.test.ts`) and keep expectations in Given/When/Then blocks. Run `npm run test:types` before releasing to ensure published d.ts files stay valid. Aim for coverage of new runtime APIs and add integration tests in the playground when logic spans multiple layers.

## Commit & Pull Request Guidelines
History is empty; start using Conventional Commits (`feat:`, `fix:`, `chore:`) so automated changelog and release tooling stay accurate. Each pull request should include: concise summary, screenshots or CLI output when UX changes, linked issue IDs, and notes on testing performed. Keep PRs focused (one feature or fix), ensure CI scripts run locally before pushing, and request review when the playground reproduces the desired behavior end to end.
