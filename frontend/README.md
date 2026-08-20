# Tandem frontend

React 19 + Vite 7 SPA. See the [repo root README](../README.md) for full setup instructions.

## Scripts

- `pnpm dev` - start the Vite dev server
- `pnpm build` - typecheck and build a static production bundle
- `pnpm preview` - serve the production build locally
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run `tsc -b` with no emit
- `pnpm test` - run unit/component tests (Vitest + React Testing Library)
- `pnpm test:e2e` - run end-to-end tests (Playwright, against a built app)
- `pnpm generate:api` - regenerate `src/api/schema.d.ts` from the backend's OpenAPI document (requires the backend running locally)
