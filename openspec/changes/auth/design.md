## Context

The backend currently has no auth: every route (aside from the health check) is open. The domain modules (`FormTypesModule`, `FormsModule`, etc.) haven't been built yet, so this is the right point to put the shared-password gate in place before any of them ship unprotected. The frontend already has an empty `features/auth/` folder scaffolded but no router guard or API client interceptor wired up yet. The overall approach (shared password, JWT, global guard) is already decided in [docs/backend.md](../../../docs/backend.md) §5 and [docs/frontend.md](../../../docs/frontend.md) §2/§4 — this design covers the remaining implementation choices.

## Goals / Non-Goals

**Goals:**
- Protect every current and future backend route behind a single shared password, with `POST /api/v1/auth/login` as the only public route.
- Give the frontend a session gate: no screen is reachable, and no API call is made, without a valid token.
- Keep the mechanism as simple as the MVP calls for — one password, one token shape, no user records, no refresh flow.

**Non-Goals:**
- Per-user accounts, roles, or permissions (explicitly out of scope for the MVP per docs/prd.md §12).
- Password rotation/management UI, rate limiting, or brute-force protection beyond what's noted as a risk below.
- Short-lived/refreshable tokens — a single shared secret has no per-user session to expire independently.

## Decisions

- **Token verification strategy: `AuthGuard` using `@nestjs/jwt`'s `JwtService.verifyAsync`, not Passport.** The app has exactly one "credential" (the shared password) and one token type, so a Passport strategy module adds indirection without benefit. A plain `CanActivate` guard reading `Authorization: Bearer <token>`, verifying it with `JwtService`, and throwing `UnauthorizedException` on failure is the whole implementation.
- **Global registration via `APP_GUARD` provider in `AuthModule`, not `app.useGlobalGuards()` in `main.ts`.** Registering through the Nest DI container (`{ provide: APP_GUARD, useClass: AuthGuard }`) keeps `AuthGuard` injectable (it needs `JwtService`) and keeps all auth wiring inside `AuthModule` rather than spread into `main.ts`.
- **Marking the login route public: a `@Public()` decorator + metadata check in the guard, not a path-string allowlist.** A decorator on `AuthController.login` (`@SetMetadata('isPublic', true)`, exposed as `@Public()`) that `AuthGuard` checks via `Reflector` is the idiomatic Nest pattern and survives route renames/prefix changes better than hardcoding `'/api/v1/auth/login'` in the guard.
- **Token payload: no claims beyond `iat`/`exp` (e.g. `{ sub: 'shared' }`).** There's no user identity to encode — the token only proves "this caller supplied the correct password." An empty/placeholder payload avoids implying a user model that doesn't exist.
- **No token expiration (or a long one, e.g. 30 days) — matches docs/backend.md §5 explicitly noting "no distingue usuarios, por lo que no necesita expiración corta."** A short-lived token would need a refresh flow, which is unwarranted complexity for a single shared credential; sessions naturally end by clearing the stored token (logout, or a `401` response wiping it client-side).
- **Frontend token storage: `localStorage`, read synchronously at app boot to decide the initial route.** Given there's no per-user session, `localStorage` (survives tab close, no cross-tab sync issues that matter here) is simpler than a state-management library or cookie-based approach requiring backend cookie handling. The router checks for a stored token before rendering any route; absent/invalid, it renders the password screen instead of the requested route.
- **Frontend 401 handling centralized in `api/client.ts`'s fetch wrapper, not per-hook.** Every TanStack Query hook goes through the same generated client; intercepting `401` responses once (clear stored token, redirect to password screen) avoids repeating that logic in every feature hook and guarantees a stale/invalid token can't strand the user on a broken screen.

## Risks / Trade-offs

- [Shared password + JWT with no short expiry means a leaked token grants indefinite access] → Mitigation: this matches the accepted MVP threat model (docs/prd.md §12 explicitly defers real auth); `APP_JWT_SECRET` rotation invalidates all outstanding tokens as a manual escape hatch.
- [No rate limiting on `POST /api/v1/auth/login` allows password brute-forcing] → Mitigation: out of scope for this change; flagged as a follow-up if the app becomes internet-exposed rather than internal-only.
- [`localStorage` token is readable by any script on the page (XSS exposure)] → Mitigation: acceptable for an internal tool with no user data more sensitive than form responses already reachable by anyone with the password; revisit if real auth is added later.

## Migration Plan

- Additive change: no existing protected routes exist yet, so there's no breaking transition for current consumers. Deploying requires setting `APP_PASSWORD` and `APP_JWT_SECRET` in each environment (added to `backend/.env.example`; CI/deploy config must supply real values).
- Rollback: revert the change — since no other feature depends on auth yet, removing the guard and login route has no cascading effect.
