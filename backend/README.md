# Tandem backend

NestJS 11 + Prisma 7 API. See the [repo root README](../README.md) for full setup instructions.

## Scripts

- `pnpm start:dev` - start the app in watch mode
- `pnpm build` - compile to `dist/`
- `pnpm start:prod` - run the compiled app (`dist/main.js`)
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run `tsc --noEmit`
- `pnpm test` - run unit tests (Jest)
- `pnpm test:e2e` - run end-to-end tests (Jest + Supertest)
- `pnpm prisma:generate` - regenerate the Prisma client
- `pnpm prisma:migrate` - create/apply a Prisma migration against the local database

Once running, the app serves:

- `GET /api/v1/health` - health check
- `GET /api-docs` - Swagger UI
- `GET /api-json` - OpenAPI document (consumed by the frontend's `generate:api` script)
