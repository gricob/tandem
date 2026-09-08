## Why

Tandem's only access control today is a single shared `APP_PASSWORD`: every session is anonymous (`sub: 'shared'` in the JWT), and nothing in the domain can attribute a Form, Deliverable, Workstream, or User Story to the person who created it. The PRD (`docs/prd.md` §12) explicitly deferred real accounts but requires the domain/API to leave room for them. As the product grows into a team-facing planning tool (Workstreams, Deliverables, User Stories), anonymous artifacts are becoming a real gap. This change replaces the shared password with individual accounts, gated by admin-issued invitations, so future work (ownership, assignment, per-resource permissions) has real identities to attach to.

## What Changes

- **BREAKING**: Remove the shared-password login (`APP_PASSWORD`, `POST /api/v1/auth/login` with a bare password). All existing sessions are invalidated; the password entry screen is replaced.
- Add a `User` model (id, email, name, passwordHash, role) with `role` limited to `admin | member`.
- Add `POST /api/v1/auth/login` (new shape): accepts `email` + `password`, looks up the `User`, verifies the password hash, and issues a JWT with `sub: user.id`.
- Add a bootstrap step (seed script / startup check) that creates exactly one `User` with `role: admin` from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars, if no user exists yet.
- Add an `Invite` model (id, email, token, role, createdByUserId, expiresAt, usedAt) and `POST /api/v1/invites`, restricted to authenticated users with `role: admin`, who may set the invite's `role` to `admin` or `member`.
- Add `POST /api/v1/auth/register`: accepts an invite token, email, password, and name; validates the invite (exists, unexpired, unused, email matches); creates the `User` with the invite's role; marks the invite used.
- `AuthGuard` now attaches the authenticated user's id (from JWT `sub`) to the request; endpoints that need the current user's role (e.g. invite creation) look it up fresh from the database on each request rather than trusting a JWT claim.
- Frontend: replace the shared password screen with a login screen (email + password) and a registration screen reachable via an invite link/token; navbar logout behavior is unchanged.

## Capabilities

### New Capabilities
- `users`: User accounts — the `User` model, roles (`admin`/`member`), invite-gated registration, and admin bootstrap.
- `invites`: Admin-issued invitations that gate registration — creation (admin-only, choice of role), validation, and single-use consumption.

### Modified Capabilities
- `auth`: Login moves from a shared app-wide password to per-user email+password credentials; session tokens now identify an individual user (`sub: user.id`) instead of `sub: 'shared'`; the frontend's password screen is replaced by a login screen.

## Impact

- **Backend**: new `users` and `invites` modules (controller/service/DTOs) following the existing Controller → Service → Prisma pattern; `auth` module's `AuthService.login` and `AuthController` change shape; `AuthGuard` extended to attach `request.userId`; new Prisma models `User` and `Invite` + migration; new bootstrap script; new env vars `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` replacing `APP_PASSWORD`; new dependency for password hashing (e.g. `bcrypt`).
- **Frontend**: `features/auth` gains a login screen (replacing `password-screen.tsx`) and a registration screen; session storage mechanics (`session-store.ts`, `use-session-token.ts`) are unchanged in shape (still a bearer token), only how it's obtained changes.
- **Out of scope**: general roles/permissions on other resources (no `createdBy`/`assignee` fields added to Deliverable/Workstream/etc. in this change), password reset via email (no email/SMTP infra exists), OAuth/SSO, and token expiry/revocation beyond the fresh-role-lookup mitigation for admin checks.
