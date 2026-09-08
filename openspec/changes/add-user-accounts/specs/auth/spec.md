## MODIFIED Requirements

### Requirement: Email and password login issues a session token
The backend SHALL expose `POST /api/v1/auth/login`, unauthenticated, that accepts an `email` and `password`. If a `User` exists with that email and the password matches its stored password hash, it SHALL return a JWT session token, signed with `APP_JWT_SECRET`, whose subject identifies that user. If no user matches the email, or the password does not match, it SHALL respond `401 Unauthorized` without issuing a token.

#### Scenario: Correct credentials return a token
- **WHEN** a client calls `POST /api/v1/auth/login` with the email and password of an existing user
- **THEN** the response is `200 OK` with a JSON body containing a signed JWT session token identifying that user

#### Scenario: Incorrect password is rejected
- **WHEN** a client calls `POST /api/v1/auth/login` with an email that matches an existing user but a password that does not match their stored hash
- **THEN** the response is `401 Unauthorized` and no token is returned

#### Scenario: Unknown email is rejected
- **WHEN** a client calls `POST /api/v1/auth/login` with an email that does not match any existing user
- **THEN** the response is `401 Unauthorized` and no token is returned

### Requirement: All API routes except login and registration require a valid session token, and expose the authenticated user
The backend SHALL enforce, via a global guard, that every route other than `POST /api/v1/auth/login` and `POST /api/v1/auth/register` requires a request header `Authorization: Bearer <token>` where `<token>` is a JWT signed with `APP_JWT_SECRET` and not expired. Requests missing the header, or presenting a token that fails verification, SHALL receive `401 Unauthorized` before any route handler logic runs. For a request that passes this check, the guard SHALL make the authenticated user's id available to the route handler (e.g. for authorization checks such as admin-only endpoints).

#### Scenario: Request with a valid token is allowed through
- **WHEN** a client calls any protected route with `Authorization: Bearer <token>` set to a token previously issued by login or registration and not expired
- **THEN** the request reaches the route handler and is processed normally, with the authenticated user's id available to it

#### Scenario: Request with no token is rejected
- **WHEN** a client calls any protected route without an `Authorization` header
- **THEN** the response is `401 Unauthorized` and the route handler does not run

#### Scenario: Request with an invalid or expired token is rejected
- **WHEN** a client calls any protected route with `Authorization: Bearer <token>` set to a malformed token, a token signed with a different secret, or an expired token
- **THEN** the response is `401 Unauthorized` and the route handler does not run

## REMOVED Requirements

### Requirement: Frontend gates the app behind a password screen
**Reason**: The single shared `APP_PASSWORD` is replaced by individual accounts; there is no longer one app-wide password to gate entry with.
**Migration**: See the new "Frontend gates the app behind a login screen" requirement.

## ADDED Requirements

### Requirement: Frontend gates the app behind a login screen
The frontend SHALL show a login screen (email and password fields) before rendering any other screen whenever there is no stored, previously-issued session token. Submitting credentials that the backend accepts SHALL store the returned token and reveal the rest of the app; submitting credentials the backend rejects SHALL show an inline error and keep the user on the login screen.

#### Scenario: First visit with no stored session shows the login screen
- **WHEN** a user opens the app in a browser with no session token stored
- **THEN** the login screen is rendered and no other screen or authenticated API call occurs

#### Scenario: Correct credentials unlock the app
- **WHEN** a user on the login screen submits an email and password that the login endpoint accepts
- **THEN** the frontend stores the returned session token and navigates to the app's main screen

#### Scenario: Incorrect credentials show an error and block entry
- **WHEN** a user on the login screen submits an email and password that the login endpoint rejects
- **THEN** the login screen shows an inline error message and the app's other screens remain inaccessible

#### Scenario: Returning visit with a stored session skips the login screen
- **WHEN** a user opens the app in a browser that has a previously stored, still-valid session token
- **THEN** the app's main screen is rendered directly without showing the login screen

### Requirement: Frontend provides a registration screen for invited users
The frontend SHALL provide a registration screen, reachable via a link containing an invite token, where an invited person sets their name and password to create their account. On successful registration, the frontend SHALL store the returned session token and navigate to the app's main screen, the same way a successful login does. On a rejected registration (invalid, expired, used, or mismatched invite), the frontend SHALL show an inline error and keep the user on the registration screen.

#### Scenario: Completing registration with a valid invite logs the user in
- **WHEN** an invited person opens the registration screen with a valid invite token and submits a name and password
- **THEN** the frontend stores the returned session token and navigates to the app's main screen

#### Scenario: Registering with an invalid or expired invite shows an error
- **WHEN** a person opens the registration screen with a token the backend rejects (unknown, expired, or already used) and submits the form
- **THEN** the registration screen shows an inline error message and no session token is stored
