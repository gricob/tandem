## ADDED Requirements

### Requirement: User accounts have a unique email and a role
The backend SHALL model a `User` with a globally unique `email`, a `name`, a `passwordHash`, and a `role` of either `admin` or `member`. Attempting to create a user with an email already in use SHALL fail without creating a row.

#### Scenario: Two users cannot share an email
- **WHEN** registration or bootstrap would create a user whose email already belongs to an existing user
- **THEN** the user is not created and the operation fails

### Requirement: Passwords are never stored in plain text
The backend SHALL store only a salted hash of a user's password, never the plain-text value, and SHALL verify login attempts by hashing the submitted password and comparing it to the stored hash.

#### Scenario: Stored credential is a hash
- **WHEN** a user account is created (via bootstrap or registration)
- **THEN** the stored record contains a password hash and not the plain-text password

### Requirement: Bootstrap creates exactly one admin user when none exist
On backend startup, the backend SHALL check whether any `User` exists. If none exists, it SHALL create exactly one `User` with `role: admin` using the `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` environment variables. If at least one user already exists, no bootstrap user SHALL be created.

#### Scenario: Empty database gets a bootstrap admin
- **WHEN** the backend starts and the `users` table is empty
- **THEN** exactly one `User` is created with `role: admin`, using the email, password, and name from the `SEED_ADMIN_*` environment variables

#### Scenario: Existing users prevent re-bootstrapping
- **WHEN** the backend starts and at least one `User` already exists
- **THEN** no new user is created from the `SEED_ADMIN_*` environment variables

### Requirement: Registering with a valid invite creates a user
The backend SHALL expose `POST /api/v1/auth/register`, unauthenticated, accepting an invite token, email, password, and name. It SHALL create a `User` with the role recorded on the invite only if the invite exists, is unexpired, is unused, and its recorded email matches the submitted email; otherwise it SHALL reject the request without creating a user. On success it SHALL mark the invite consumed and SHALL respond with a signed JWT session token identifying the new user, equivalent to a successful login.

#### Scenario: Valid invite creates an account and logs the user in
- **WHEN** a client calls `POST /api/v1/auth/register` with a token matching an existing, unexpired, unused invite, an email matching that invite, and a password and name
- **THEN** a `User` is created with the invite's role, the invite is marked used, and the response is `200 OK` (or `201 Created`) with a signed JWT session token

#### Scenario: Unknown or already-used token is rejected
- **WHEN** a client calls `POST /api/v1/auth/register` with a token that does not match any invite, or matches an invite that has already been used
- **THEN** the response is an error and no user is created

#### Scenario: Expired invite is rejected
- **WHEN** a client calls `POST /api/v1/auth/register` with a token matching an invite whose `expiresAt` has passed
- **THEN** the response is an error and no user is created

#### Scenario: Email not matching the invite is rejected
- **WHEN** a client calls `POST /api/v1/auth/register` with a token matching a valid invite but an email different from the one recorded on that invite
- **THEN** the response is an error and no user is created
