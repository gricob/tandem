# auth Specification

## Purpose

TBD - created by syncing change auth. Update Purpose after archive.

## Requirements

### Requirement: Shared-password login issues a session token
The backend SHALL expose `POST /api/v1/auth/login`, unauthenticated, that accepts a password and, if it matches the `APP_PASSWORD` environment variable, returns a JWT session token signed with `APP_JWT_SECRET`. If the password does not match, it SHALL respond `401 Unauthorized` without issuing a token.

#### Scenario: Correct password returns a token
- **WHEN** a client calls `POST /api/v1/auth/login` with a password equal to the `APP_PASSWORD` environment variable
- **THEN** the response is `200 OK` with a JSON body containing a signed JWT session token

#### Scenario: Incorrect password is rejected
- **WHEN** a client calls `POST /api/v1/auth/login` with a password that does not match `APP_PASSWORD`
- **THEN** the response is `401 Unauthorized` and no token is returned

### Requirement: Backend allows cross-origin requests from the frontend
The backend SHALL enable CORS for the frontend's origin(s), configurable via the `CORS_ORIGIN` environment variable, so the browser-based frontend (served from a different origin than the API) can call it.

#### Scenario: Browser preflight from the configured frontend origin succeeds
- **WHEN** a browser sends a CORS preflight (`OPTIONS`) request to any API route with an `Origin` header matching a configured `CORS_ORIGIN` value
- **THEN** the response includes `Access-Control-Allow-Origin` for that origin, allowing the browser to proceed with the actual request

### Requirement: All API routes except login require a valid session token
The backend SHALL enforce, via a global guard, that every route other than `POST /api/v1/auth/login` requires a request header `Authorization: Bearer <token>` where `<token>` is a JWT signed with `APP_JWT_SECRET` and not expired. Requests missing the header, or presenting a token that fails verification, SHALL receive `401 Unauthorized` before any route handler logic runs.

#### Scenario: Request with a valid token is allowed through
- **WHEN** a client calls any protected route with `Authorization: Bearer <token>` set to a token previously issued by the login endpoint and not expired
- **THEN** the request reaches the route handler and is processed normally

#### Scenario: Request with no token is rejected
- **WHEN** a client calls any protected route without an `Authorization` header
- **THEN** the response is `401 Unauthorized` and the route handler does not run

#### Scenario: Request with an invalid or expired token is rejected
- **WHEN** a client calls any protected route with `Authorization: Bearer <token>` set to a malformed token, a token signed with a different secret, or an expired token
- **THEN** the response is `401 Unauthorized` and the route handler does not run

### Requirement: Frontend gates the app behind a password screen
The frontend SHALL show a password entry screen before rendering any other screen whenever there is no stored, previously-issued session token. Submitting the correct password SHALL store the returned token and reveal the rest of the app; submitting an incorrect password SHALL show an inline error and keep the user on the password screen.

#### Scenario: First visit with no stored session shows the password screen
- **WHEN** a user opens the app in a browser with no session token stored
- **THEN** the password screen is rendered and no other screen or authenticated API call occurs

#### Scenario: Correct password unlocks the app
- **WHEN** a user on the password screen submits the password matching `APP_PASSWORD`
- **THEN** the frontend stores the returned session token and navigates to the app's main screen

#### Scenario: Incorrect password shows an error and blocks entry
- **WHEN** a user on the password screen submits a password that the login endpoint rejects
- **THEN** the password screen shows an inline error message and the app's other screens remain inaccessible

#### Scenario: Returning visit with a stored session skips the password screen
- **WHEN** a user opens the app in a browser that has a previously stored, still-valid session token
- **THEN** the app's main screen is rendered directly without showing the password screen

### Requirement: Frontend attaches the session token to every API request and recovers from expiry
The frontend's API client SHALL attach the stored session token as an `Authorization: Bearer <token>` header on every request to the backend. If a response comes back `401 Unauthorized`, the frontend SHALL clear the stored token and show the password screen.

#### Scenario: Authenticated request carries the token
- **WHEN** the frontend makes any API request while a session token is stored
- **THEN** the request includes header `Authorization: Bearer <token>` with that stored token

#### Scenario: A 401 response clears the session and re-prompts for the password
- **WHEN** any API response returns `401 Unauthorized`
- **THEN** the frontend clears the stored session token and shows the password screen

### Requirement: User can manually log out
The frontend SHALL provide a logout action, reachable from the navbar, that clears the stored session token and returns the user to the password screen. This is in addition to the existing automatic clearing of the token on a `401` response.

#### Scenario: Logging out clears the session and shows the password screen
- **WHEN** an authenticated user triggers the logout action from the navbar
- **THEN** the frontend clears the stored session token and shows the password screen

#### Scenario: Logged-out session cannot access authenticated routes
- **WHEN** a user has logged out and attempts to view a previously accessible route
- **THEN** the password screen is shown instead of that route's content
