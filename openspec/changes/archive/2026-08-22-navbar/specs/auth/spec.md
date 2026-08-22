## ADDED Requirements

### Requirement: User can manually log out
The frontend SHALL provide a logout action, reachable from the navbar, that clears the stored session token and returns the user to the password screen. This is in addition to the existing automatic clearing of the token on a `401` response.

#### Scenario: Logging out clears the session and shows the password screen
- **WHEN** an authenticated user triggers the logout action from the navbar
- **THEN** the frontend clears the stored session token and shows the password screen

#### Scenario: Logged-out session cannot access authenticated routes
- **WHEN** a user has logged out and attempts to view a previously accessible route
- **THEN** the password screen is shown instead of that route's content
