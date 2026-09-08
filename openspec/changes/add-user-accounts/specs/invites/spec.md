## ADDED Requirements

### Requirement: Only admins can create invitations
The backend SHALL expose `POST /api/v1/invites`, requiring a valid session token identifying a `User` with `role: admin`. The request body SHALL specify the target `email` and the `role` (`admin` or `member`) to grant on registration. A caller whose session identifies a `member` SHALL be rejected without creating an invite.

#### Scenario: Admin creates an invite
- **WHEN** a client calls `POST /api/v1/invites` with a valid session token for a user with `role: admin`, and a body specifying an email and a role
- **THEN** an `Invite` is created for that email and role, and the response includes the invite's one-time token

#### Scenario: Admin can invite another admin
- **WHEN** an admin calls `POST /api/v1/invites` with `role: admin` in the body
- **THEN** the created invite records `role: admin`, so registering with its token grants the new user `role: admin`

#### Scenario: Non-admin cannot create an invite
- **WHEN** a client calls `POST /api/v1/invites` with a valid session token for a user with `role: member`
- **THEN** the response is `403 Forbidden` and no invite is created

### Requirement: Invitations are single-use and expire
Each `Invite` SHALL record the email it was issued for, the role it will grant, the admin who created it, an expiration time, and whether it has been used. An invite SHALL only be usable to register an account once, and only before its expiration time.

#### Scenario: A used invite cannot be consumed again
- **WHEN** an invite has already been consumed by a successful registration
- **THEN** any subsequent attempt to register with that invite's token fails and no additional user is created

#### Scenario: An expired invite cannot be consumed
- **WHEN** an invite's expiration time has passed and it has not been used
- **THEN** any attempt to register with that invite's token fails and no user is created
