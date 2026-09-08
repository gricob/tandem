## Context

Today, access control is a single shared secret: `POST /api/v1/auth/login` compares a submitted password to the `APP_PASSWORD` env var and, on match, signs a JWT `{ sub: 'shared' }` with no expiry (`JwtModule.register({ secret: process.env.APP_JWT_SECRET })` — no `signOptions.expiresIn`). A global `AuthGuard` (`APP_GUARD`) verifies that token on every route except ones marked `@Public()`. There is no `User` table, no password storage, and no email-sending capability anywhere in the codebase.

This design replaces that with per-user email+password accounts, registration gated by admin-issued invites, and a minimal `admin | member` role used only to decide who may issue invites. It deliberately keeps the existing `AuthGuard`/`@Public()`/JWT-bearer-token shape rather than introducing sessions, refresh tokens, or an authorization framework — those are bigger changes than this one needs.

## Goals / Non-Goals

**Goals:**
- Replace the shared password with individually identifiable accounts (`sub: user.id` in the JWT).
- Gate registration behind admin-issued, single-use, expiring invites.
- Support exactly one bootstrap path to get the first admin into an empty database.
- Keep the blast radius inside `auth`, a new `users` module, and a new `invites` module — no changes to Deliverable/Workstream/UserStory/Form schemas.

**Non-Goals:**
- General resource-level permissions (who can edit a Workstream, etc.) — `role` here only gates invite creation.
- Password reset via email — no mail infra exists; out of scope until that infra is built.
- OAuth/SSO.
- Token expiry, refresh tokens, or a full revocation system — the fresh-role-lookup decision below closes the one gap that matters for this change (admin demotion), not the general case (e.g. revoking a departed member's still-valid token).

## Decisions

### User identity and password storage
- `User.email` is the natural unique identifier (unique constraint), used for login. `User.id` stays a ULID, consistent with every other model in the schema.
- Password hashing: `bcrypt` (via the `bcrypt` npm package). It's the de facto standard for Node/Nest, needs no additional infrastructure, and its cost factor gives a straightforward future upgrade path. Argon2 was considered but offers no concrete benefit here and is a less common dependency in this stack.
- `role` is a Prisma enum (`admin`, `member`), mirroring the existing `FormFieldType` enum pattern already in the schema, rather than a boolean `isAdmin` — an enum reads better at call sites (`role === Role.admin`) and leaves room to add a value later without a migration that changes column type.

### Invite model and token handling
- `Invite.token` is a high-entropy random string (e.g. 32 bytes, base64url), generated server-side and returned once in the create-invite response — it is the only place the raw token is ever visible (mirrors how `APP_JWT_SECRET`-signed tokens are opaque bearer values today). It is stored hashed (same `bcrypt`, or a plain SHA-256 digest since it's not a low-entropy secret like a password) so a database read alone can't be replayed as a valid invite.
- `Invite.email` locks the invite to one address; `POST /auth/register` rejects a token/email mismatch. This prevents a leaked invite link from being usable by an arbitrary person.
- `Invite.expiresAt` — a fixed, reasonably short window (e.g. 7 days) set at creation time. Exact duration is an open question below, not architecturally significant.
- Consumption is atomic: `POST /auth/register` looks up the invite by token, checks `usedAt IS NULL AND expiresAt > now() AND email = :email`, creates the `User`, and sets `usedAt` in the same transaction, so a race between two registration attempts on the same invite can't create two users.

### Bootstrap admin
- On backend startup (or via an explicit `pnpm --filter backend seed` script run during deploy — implementation detail for tasks.md to settle), check `SELECT count(*) FROM users`. If zero, create one `User` with `role: admin` from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` env vars. This never runs again once any user exists, so it's safe to leave configured permanently (mirrors `APP_PASSWORD` being an always-set env var today).
- No `Invite` row is created for this path — it bypasses the invite flow entirely because, by definition, no admin exists yet to issue one.

### Authorization check for invite creation: fresh lookup, not a JWT claim
- `AuthGuard` decodes the token and attaches `request.userId = payload.sub` (previously the payload was never used beyond verifying the signature).
- `POST /api/v1/invites` loads the `User` row for `request.userId` and checks `role === admin` at request time, rather than embedding `role` in the JWT and trusting it.
- Rationale: embedding role in the token means a demoted admin keeps admin-only access until their token is re-issued (i.e., indefinitely, since tokens don't expire). A per-request DB lookup is one extra indexed query on a low-traffic endpoint and closes that gap immediately. This does **not** solve revocation in general (a departed member's token still authenticates them for everything else) — that's called out as a known limitation, not fixed here.

### Removing the shared password cleanly
- `APP_PASSWORD` and the old `POST /api/v1/auth/login` (bare password) are deleted outright, not kept behind a flag — there's no requirement to run both schemes simultaneously, and maintaining two login paths would be pure complexity for a pre-launch internal tool.

## Risks / Trade-offs

- **[Risk]** All existing sessions become invalid the moment this ships (shared-password JWTs won't decode to a real user). → **Mitigation**: acceptable for an internal tool with no external users yet; communicate the cutover, and the bootstrap admin can immediately issue invites to restore access.
- **[Risk]** Non-expiring JWTs mean a compromised or departed-member token stays valid indefinitely, same as today but now scoped to an individual rather than the whole team. → **Mitigation**: none in this change; flagged as follow-up work (short-lived tokens + refresh, or a `tokenVersion` check) once it's a real operational need.
- **[Risk]** Invite token shown only once — if lost before the recipient uses it, an admin must issue a new one (no resend/reveal). → **Mitigation**: acceptable; re-issuing an invite is cheap and matches the "admin can invite" flow already being built.
- **[Trade-off]** Choosing invite-gated registration over open self-registration adds an `Invite` model and an admin-only endpoint instead of a single public register endpoint — more moving parts, but matches the explicit requirement that only admins bring new people in.

## Migration Plan

1. Add `User` and `Invite` models + Prisma migration (additive, no existing tables touched).
2. Ship the bootstrap check/script alongside the new `users`/`invites` modules.
3. Replace `AuthService.login` and `AuthController` (new request/response shape), update `AuthGuard` to attach `request.userId`.
4. Remove `APP_PASSWORD` from `.env.example` and env validation; add `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME`.
5. Frontend: replace `password-screen.tsx` with a login screen; add a registration screen behind an invite-token route; `session-store.ts`/`use-session-token.ts` need no shape changes.
6. Deploy: run the bootstrap step once against the target database before or on first boot after deploy, so an admin exists before anyone tries to log in.
- **Rollback**: since this is additive at the schema level (old tables untouched) and the old login path is deleted rather than modified in place, rolling back means redeploying the previous backend/frontend build; the new `users`/`invites` tables can remain unused in the database without conflict.

## Open Questions

- Exact invite expiry duration (proposed default: 7 days) — not architecturally significant, can be settled during implementation.
- Whether an admin can revoke/re-issue a not-yet-used invite before it expires — not required by the proposal, worth a quick product call before or during `tasks.md`.
- Whether `User.name` is required at registration or optional/editable later — proposal assumes required, collected at registration time.
