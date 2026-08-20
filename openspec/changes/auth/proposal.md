## Why

Right now every backend endpoint beyond the health check is unauthenticated, and the frontend has no gate in front of the app. Tandem's MVP requires the whole app (API and web) to sit behind a single shared password (per [docs/backend.md](../../../docs/backend.md) §5 and [docs/frontend.md](../../../docs/frontend.md) §2) before any domain features (form types, forms, responses) can be built safely on top of it.

## What Changes

- Add `POST /api/v1/auth/login`: accepts a password, compares it against the `APP_PASSWORD` env var, and returns a signed JWT session token (`@nestjs/jwt`, secret from `APP_JWT_SECRET`) on success or `401` on mismatch.
- Add a global NestJS `AuthGuard` that requires a valid `Authorization: Bearer <token>` header on every route except `POST /api/v1/auth/login`, rejecting missing/invalid/expired tokens with `401`.
- Add backend env vars `APP_PASSWORD` and `APP_JWT_SECRET` (documented in `backend/.env.example`).
- Add a frontend password screen (`features/auth/`) shown before any other screen when there is no valid session: submits the password to the login endpoint, stores the returned token, and redirects into the app on success, showing an inline error on failure.
- Add a frontend API client integration that attaches the stored token as `Authorization: Bearer <token>` on every request, and clears the stored token and returns to the password screen when a request comes back `401`.

## Capabilities

### New Capabilities
- `auth`: Shared-password login (backend endpoint + JWT issuance + global guard) and the frontend session gate (password screen, token storage, request authorization, 401 handling) that together protect the whole app.

### Modified Capabilities
(none — `project-scaffold` has no auth-related requirements today)

## Impact

- Backend: new `AuthModule` (`backend/src/modules/auth/`) with controller, service, `AuthGuard`, DTOs; `app.module.ts` wires the guard globally (`APP_GUARD`); `main.ts`/Swagger config marks the login route as public in the OpenAPI doc; new env vars in `backend/.env.example` and CI/Docker config.
- Frontend: `frontend/src/features/auth/` gets the password screen, a session store (token persistence), and a route guard in `app/router.tsx`; `frontend/src/api/client.ts` gets a request interceptor for the `Authorization` header and a 401 handler.
- No database schema changes — the shared password is env-config only, not a stored entity.
