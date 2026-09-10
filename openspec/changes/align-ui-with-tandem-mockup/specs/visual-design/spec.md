## ADDED Requirements

### Requirement: Application renders with a shared dark theme by default
The frontend SHALL render every authenticated and unauthenticated screen
using a shared dark color scheme (dark surfaces, light text, a single accent
color for primary actions and active states) by default, sourced from one
central theme definition rather than per-page styling.

#### Scenario: Login screen uses the dark theme
- **WHEN** an unauthenticated user loads the app
- **THEN** the login screen renders with the dark background and accent-
  colored primary action button defined by the shared theme

#### Scenario: Authenticated screens use the dark theme
- **WHEN** an authenticated user navigates between sections (Work, Form
  templates, Forms, Invite users)
- **THEN** every screen renders using the same dark surfaces, text colors,
  and accent color, with no page falling back to the Mantine default light
  theme

### Requirement: Shared component styling is applied consistently
The frontend SHALL apply one shared visual treatment (corner radius, spacing,
border/surface color), defined by the shared theme, to interactive elements
that recur across screens — primary/secondary buttons, text inputs, cards/
panels, tables, and user avatars showing initials — rather than letting each
screen define its own.

#### Scenario: Buttons look consistent across screens
- **WHEN** a user views primary action buttons on different screens (e.g.,
  "Log in", "New workstream", "Send invite")
- **THEN** they share the same corner radius, accent color, and sizing

#### Scenario: A user's initials avatar looks consistent across screens
- **WHEN** a signed-in user's identity is shown in more than one place (e.g.,
  the toolbar user menu)
- **THEN** the initials avatar uses the same shape, sizing, and color-
  derivation rule everywhere it appears
