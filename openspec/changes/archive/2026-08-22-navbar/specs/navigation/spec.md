## ADDED Requirements

### Requirement: Persistent navbar on every authenticated route
The frontend SHALL render a persistent navbar above the content of every route reachable once the user is past the password screen, showing the app brand/home link and a link to each top-level section ("Form templates", "Forms").

#### Scenario: Navbar is visible on the home page
- **WHEN** an authenticated user is on `/`
- **THEN** the navbar is rendered with links to "Form templates" and "Forms"

#### Scenario: Navbar is visible on a nested route
- **WHEN** an authenticated user is on a nested route such as `/forms/$formId/fill`
- **THEN** the navbar is still rendered with the same links

### Requirement: Navbar highlights the active section
The navbar SHALL visually mark the link corresponding to the currently active section, including when the current route is a nested path under that section.

#### Scenario: Form templates section is active
- **WHEN** an authenticated user is on `/form-templates` or `/form-templates/$formTemplateId`
- **THEN** the "Form templates" navbar link is shown as active and the "Forms" link is not

#### Scenario: Forms section is active
- **WHEN** an authenticated user is on `/forms`, `/forms/$formId`, `/forms/$formId/fill`, or `/forms/$formId/response`
- **THEN** the "Forms" navbar link is shown as active and the "Form templates" link is not

#### Scenario: No section is active on the home page
- **WHEN** an authenticated user is on `/`
- **THEN** neither the "Form templates" nor the "Forms" navbar link is shown as active

### Requirement: Navbar links navigate without a full page reload
Clicking a navbar link SHALL navigate to the corresponding route client-side using the app's router.

#### Scenario: Clicking a navbar link changes the route
- **WHEN** an authenticated user clicks the "Forms" link in the navbar while on `/form-templates`
- **THEN** the app navigates to `/forms` without a full browser page reload
