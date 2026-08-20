## 1. Backend: auth module scaffolding

- [x] 1.1 Add `APP_PASSWORD` and `APP_JWT_SECRET` to `backend/.env.example` (and local `.env`), and install `@nestjs/jwt`
- [x] 1.2 Create `backend/src/modules/auth/` with `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`
- [x] 1.3 Register `AuthModule` (with `JwtModule.register`, secret from `APP_JWT_SECRET`) in `app.module.ts`
- [x] 1.4 Load `backend/.env` at runtime (`import 'dotenv/config'` as the first line of `main.ts`, matching `prisma.config.ts`'s existing pattern) — without it, `APP_PASSWORD`/`APP_JWT_SECRET`/`CORS_ORIGIN` are `undefined` at runtime and login always fails, even with the correct password

## 2. Backend: login endpoint

- [x] 2.1 Add `LoginDto` (`class-validator`) with a required `password: string` field
- [x] 2.2 Implement `AuthService.login(password)`: compare against `APP_PASSWORD`, sign and return a JWT via `JwtService`, or throw `UnauthorizedException`
- [x] 2.3 Implement `AuthController`'s `POST /api/v1/auth/login` using `AuthService.login`, documented via `@nestjs/swagger` decorators
- [x] 2.4 Add a `@Public()` decorator (`SetMetadata`) and apply it to the login route

## 3. Backend: global guard

- [x] 3.1 Implement `AuthGuard` (`CanActivate`): skip routes marked `@Public()` (via `Reflector`), otherwise extract `Authorization: Bearer <token>`, verify with `JwtService.verifyAsync`, throw `UnauthorizedException` on missing/invalid/expired token
- [x] 3.2 Register `AuthGuard` globally via `{ provide: APP_GUARD, useClass: AuthGuard }` in `AuthModule`
- [x] 3.3 Verify the existing health check route still responds without a token (mark it `@Public()` if it should stay open) or confirm it's expected to now require auth per current scope — kept protected (docs/backend.md §5 names login as the sole public endpoint); updated `health.e2e-spec.ts` accordingly
- [x] 3.4 Enable CORS (`app.enableCors`) for the frontend origin, configurable via `CORS_ORIGIN` (defaults to the frontend's local dev server) — docs/backend.md §5 requires it; without it, the frontend's login request fails in the browser even though the endpoint itself works

## 4. Backend: tests

- [x] 4.1 Unit tests (Jest) for `AuthService.login`: correct password issues a token, incorrect password throws
- [x] 4.2 Unit tests (Jest) for `AuthGuard`: valid token passes, missing header rejected, invalid/expired token rejected, `@Public()` route bypasses the check
- [x] 4.3 E2e test (Supertest) covering the full flow: call a protected route without a token (`401`), log in, call the same route with the returned token (success)

## 5. Frontend: session storage and API client

- [x] 5.1 Implement a session token store in `frontend/src/features/auth/` (read/write/clear a token in `localStorage`)
- [x] 5.2 Update `frontend/src/api/client.ts` to attach `Authorization: Bearer <token>` from the store on every request
- [x] 5.3 Update `frontend/src/api/client.ts` to clear the stored token and signal a session-expired state on any `401` response — implemented as a subscribable store (`subscribeToSessionToken`) read via `useSyncExternalStore`, so clearing the token reactively re-renders the gate

## 6. Frontend: password screen and route gating

- [x] 6.1 Build the password screen component (Mantine, single password field, submit calls the login endpoint, inline error on `401`)
- [x] 6.2 On successful login, store the returned token and navigate into the app
- [x] 6.3 Wire a route guard in `frontend/src/app/router.tsx` (or root layout) that renders the password screen instead of the requested route when no valid token is stored, and reacts to the session-expired signal from 5.3 by returning to the password screen — implemented as `SessionGate` in `app/providers.tsx` wrapping `RouterProvider`

## 7. Frontend: tests

- [x] 7.1 Unit/component tests (Vitest + RTL) for the password screen: successful submit stores token and navigates, failed submit shows inline error
- [x] 7.2 Unit tests (Vitest) for the API client's `Authorization` header attachment and `401` handling
- [x] 7.3 E2e test (Playwright) covering: app loads to the password screen with no session, wrong password shows an error, correct password reaches the main screen, and reload with the stored token skips the password screen — `POST /api/v1/auth/login` mocked via `page.route` so the spec is self-contained (matches the existing frontend CI, which doesn't run the backend during frontend e2e)
