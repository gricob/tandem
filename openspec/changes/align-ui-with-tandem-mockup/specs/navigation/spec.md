## MODIFIED Requirements

### Requirement: Persistent navbar on every authenticated route
The frontend SHALL render a persistent toolbar above the content of every
route reachable once the user is authenticated, showing the app brand/home
link, a segmented section switcher with one entry per implemented top-level
section ("Work", and — only for users whose role is `admin` — an "Admin"
section), and a user menu identifying the signed-in user.

#### Scenario: Toolbar is visible on the home page
- **WHEN** an authenticated user is on `/`
- **THEN** the toolbar is rendered with a "Work" section entry

#### Scenario: Toolbar is visible on a nested route
- **WHEN** an authenticated user is on a nested route such as
  `/work?ws=...&del=...`
- **THEN** the toolbar is still rendered with the same section entries

#### Scenario: Admin entry is admin-only
- **WHEN** the signed-in user's role is `admin`
- **THEN** the toolbar's section switcher includes an "Admin" entry

#### Scenario: Admin entry is hidden for non-admins
- **WHEN** the signed-in user's role is not `admin`
- **THEN** the toolbar's section switcher does not include an "Admin" entry,
  and the toolbar renders no way to reach "Form templates" or "Invite users"

### Requirement: Navbar highlights the active section
The toolbar's section switcher SHALL visually mark the entry corresponding to
the currently active section, including when the current route is a nested
path under that section.

#### Scenario: Work section is active
- **WHEN** an authenticated user is on `/work`
- **THEN** the "Work" section entry is shown as active and no other section
  entry is

#### Scenario: Admin section is active
- **WHEN** an authenticated admin is on `/form-templates`,
  `/form-templates/$formTemplateId`, or `/invites`
- **THEN** the "Admin" section entry is shown as active and no other section
  entry is

#### Scenario: No section is active on the home page
- **WHEN** an authenticated user is on `/`
- **THEN** no section entry in the switcher is shown as active

## ADDED Requirements

### Requirement: User menu groups account info and log out
The toolbar SHALL show the signed-in user's identity (initials avatar, name,
and role) as a single menu trigger; the "Log out" action SHALL be reachable
only from within that menu, not as a separate always-visible button. The menu
trigger and its "Log out" action SHALL be available as soon as a session
exists, independent of whether the signed-in user's profile (name, role) has
finished loading — a slow or failed profile fetch SHALL NOT leave the user
unable to log out.

#### Scenario: User menu shows identity
- **WHEN** an authenticated user opens the user menu in the toolbar
- **THEN** the menu displays the signed-in user's name and role

#### Scenario: Logging out from the user menu
- **WHEN** an authenticated user opens the user menu and selects "Log out"
- **THEN** the session is cleared and the user is returned to the login
  screen

#### Scenario: Logging out before the user's profile has loaded
- **WHEN** a session exists but the signed-in user's profile has not yet
  loaded (or fails to load)
- **THEN** the toolbar still shows a user menu trigger, and opening it and
  selecting "Log out" still clears the session and returns to the login
  screen

### Requirement: Admin section groups Form templates and Invite users
The "Admin" section SHALL group two destinations behind an admin-only
sub-navigation, reachable only when the signed-in user's role is `admin`:
"Formularios" (the Form templates feature) and "Invite users". Selecting the
"Admin" entry in the toolbar SHALL navigate to "Formularios" by default. The
admin sub-navigation SHALL remain visible and highlight the active
destination while browsing either one.

#### Scenario: Opening the Admin section defaults to Formularios
- **WHEN** an admin selects "Admin" in the toolbar
- **THEN** the app navigates to the Form templates screen and the admin
  sub-navigation highlights "Formularios"

#### Scenario: Switching between Admin destinations
- **WHEN** an admin viewing the Form templates screen selects "Invite users"
  in the admin sub-navigation
- **THEN** the app navigates to the Invite users screen and the admin
  sub-navigation highlights "Invite users" instead of "Formularios"

#### Scenario: Admin sub-navigation is not reachable by non-admins
- **WHEN** a signed-in user whose role is not `admin` is on any route
- **THEN** no toolbar or in-page control is shown that navigates to
  "Formularios" or "Invite users"

### Requirement: Work section uses master-detail navigation
The "Work" section SHALL be reachable at a single route (`/work`) presenting
three panels — workstreams, the selected workstream's deliverables, and the
selected deliverable's detail — so that selecting a workstream or a
deliverable updates the relevant panel(s) without a full page navigation.
The current selection SHALL be reflected in the URL so the view remains
shareable/deep-linkable.

#### Scenario: Selecting a workstream updates the deliverables panel
- **WHEN** an authenticated user on `/work` selects a workstream from the
  workstreams panel
- **THEN** the deliverables panel updates to show that workstream's
  deliverables without a full page navigation, and the URL reflects the
  selected workstream

#### Scenario: Selecting a deliverable updates the detail panel
- **WHEN** an authenticated user on `/work` selects a deliverable from the
  deliverables panel
- **THEN** the detail panel updates to show that deliverable's fields, user
  stories, and acceptance criteria without a full page navigation, and the
  URL reflects the selected deliverable

#### Scenario: Deep-linking to a selected workstream and deliverable
- **WHEN** an authenticated user opens `/work` with a workstream and
  deliverable identified in the URL
- **THEN** the workstreams, deliverables, and detail panels render with that
  workstream and deliverable pre-selected
