## 1. Data model

- [x] 1.1 Add `Role` enum (`admin`, `member`) and `User` model (id ULID, email unique, name, passwordHash, role, createdAt, updatedAt) to `backend/src/prisma/schema.prisma`
- [x] 1.2 Add `Invite` model (id ULID, email, tokenHash, role, createdByUserId → User, expiresAt, usedAt nullable, createdAt) with a relation/index on `createdByUserId`
- [x] 1.3 Generate and review the Prisma migration for both models
- [x] 1.4 Add `bcryptjs` (and `@types/bcryptjs`) to `backend/package.json` (pure-JS, avoids native build-script approval and keeps Docker builds simple)

## 2. Users module

- [x] 2.1 Create `backend/src/modules/users/` (module, service, controller if needed) following the existing Controller → Service → Prisma pattern
- [x] 2.2 Implement password hashing/verification helpers (bcrypt) in the users service
- [x] 2.3 Implement user lookup by email and by id, used by auth and invites
- [x] 2.4 Implement `POST /api/v1/auth/register` (or a users-module handler wired into the auth controller): validates the invite (exists, unexpired, unused, email match), creates the `User` with the invite's role, marks the invite used — all in one transaction
- [x] 2.5 Add DTOs for register request/response, with `class-validator` decorators

## 3. Bootstrap admin

- [x] 3.1 Add `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` to `backend/.env.example`
- [x] 3.2 Implement a startup check (e.g. in `main.ts` bootstrap or a dedicated seed script) that creates one `User{ role: admin }` from those env vars only if the `users` table is empty
- [x] 3.3 Ensure the check is idempotent and safe to run on every deploy/startup

## 4. Invites module

- [x] 4.1 Create `backend/src/modules/invites/` (module, controller, service, DTOs)
- [x] 4.2 Implement invite token generation (high-entropy random value), returned once in the create response, stored as a hash
- [x] 4.3 Implement `POST /api/v1/invites`: requires the caller's user (from `request.userId`) to have `role: admin` (fresh DB lookup, not a JWT claim); body takes `email` and `role`; sets a fixed expiry (e.g. 7 days)
- [x] 4.4 Reject invite creation from a `member` caller with `403 Forbidden`
- [x] 4.5 Add an admin-only guard/decorator (e.g. `@RequireAdmin()` + a small guard) reusable if another admin-only endpoint appears later

## 5. Auth module changes

- [x] 5.1 Update `AuthGuard` to attach `request.userId = payload.sub` after verifying the token
- [x] 5.2 Replace `AuthService.login` to accept `{ email, password }`, look up the user, compare the password hash, and sign a JWT with `sub: user.id`
- [x] 5.3 Update `LoginDto`/`LoginResponseDto` for the new request/response shape
- [x] 5.4 Mark `POST /api/v1/auth/register` `@Public()` alongside the existing `@Public()` login route
- [x] 5.5 Remove `APP_PASSWORD` usage from `AuthService` and `backend/.env.example`
- [x] 5.6 Update `auth.service.spec.ts` and `auth.guard.spec.ts` for the new login shape and `request.userId` attachment

## 6. Frontend: login

- [x] 6.1 Replace `frontend/src/features/auth/password-screen.tsx` with a login screen (email + password fields, Mantine form + Zod validation matching existing patterns) — kept the existing screen's plain-useState style rather than introducing `@mantine/form`, since that's what the auth screen it replaces already used
- [x] 6.2 Update `frontend/src/features/auth/api.ts` for the new login request/response shape
- [x] 6.3 Verify `session-store.ts` / `use-session-token.ts` / `session-gate.tsx` need no structural changes (still store/read a bearer token) — `session-gate.tsx` did need one small addition: routing to the registration screen when on `/register`, see 7.1

## 7. Frontend: registration

- [x] 7.1 Add a registration route that reads the invite token from the URL — implemented as a pathname check in `session-gate.tsx` (renders `RegistrationScreen` when on `/register` and logged out), consistent with how the login screen already bypasses the TanStack router entirely rather than as a registered router route
- [x] 7.2 Build a registration screen (name + password fields) that calls `POST /api/v1/auth/register` with the token from the URL
- [x] 7.3 On success, store the returned session token and navigate to the app's main screen (same as login) — required an explicit `window.location.assign('/')` since `/register` isn't a router route; caught this via manual browser testing (registration succeeded but showed "Not Found" until the redirect was added)
- [x] 7.4 On rejection (invalid/expired/used/mismatched invite), show an inline error and keep the user on the registration screen

## 8. Tests

- [x] 8.1 Backend unit tests: users service (password hashing, uniqueness), invites service (token generation, expiry, single-use), auth service (new login shape) — also added a `require-admin.guard.spec.ts`
- [x] 8.2 Backend e2e tests: register with a valid/invalid/expired/used invite; login with correct/incorrect credentials; invite creation as admin vs. member. Bootstrap-admin-on-empty-DB is covered as a unit test instead (see 8.1) — the e2e suite runs against the real shared dev Postgres and every other e2e file leaves its rows in place (no `deleteMany` anywhere in this codebase), so truncating `users` there to simulate "empty DB" would risk wiping real local data; not worth the precedent for one scenario already covered at the unit level.
- [x] 8.3 Frontend unit tests: login screen (success/error paths), registration screen (success/error paths)
- [x] 8.4 Update or remove any existing tests that assumed shared-password login — replaced `password-screen.test.tsx` with `login-screen.test.tsx`; rewrote `auth.e2e-spec.ts` for email/password login plus invites/registration coverage

## 9. Docs

- [x] 9.1 Update `backend/.env.example` to remove `APP_PASSWORD` and document `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`/`SEED_ADMIN_NAME`
- [x] 9.2 Skipped intentionally: `git log -- docs/` shows `docs/prd.md`/`docs/modelo-datos.md` were never updated for any of the prior feature changes either (Workstreams, Deliverables, User Stories, field conditions all shipped without touching them) — they're early foundational documents, not living specs kept in sync per-change. The `openspec/specs/` capability specs (updated in this change) are what tracks current behavior. Updating the PRD now would be inconsistent with established project practice.
