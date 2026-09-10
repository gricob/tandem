## Why

Every screen in the frontend currently renders with Mantine's default light
theme and a plain text-link navbar, styled ad hoc page by page. A high-fidelity
design mockup (`Tandem.html`, a dark-themed, glass-toolbar UI with a segmented
work/board/roadmap/admin navigation) has been provided as the intended look
and feel for the product, but it also depicts screens, entities, and workflows
(work items, kanban board, roadmap/Gantt, technical analysis, comments,
notifications, requirement types, blocking, status/priority pills, a
user-management table) that do not exist in the backend or frontend today.
We need the app's visual design and navigation to adopt the mockup's design
language everywhere it maps to something real, without inventing screens or
data the product doesn't have yet.

## What Changes

- Introduce a shared dark visual design system (Mantine theme: dark default
  color scheme, accent color, typography scale, surface/border tokens, radii)
  applied consistently across every remaining screen (login, home,
  workstreams, deliverables, form templates, invite users).
- Redesign the persistent top navigation from plain text links + a standalone
  "Log out" button into the mockup's toolbar pattern: brand mark, a segmented
  section switcher for the sections that actually exist, and a user menu
  (avatar initials, name, role) containing "Log out".
- Reduce the navigation's top-level sections to what is actually implemented
  and kept: **Work** (workstreams and deliverables) and — admin-only — an
  **Admin** section grouping **Form templates** (the equivalent of the
  mockup's "Formularios") and **Invite users**, shown only when
  `currentUser.role` is `admin`. Drop any notion of Board, Roadmap, or the
  mockup's other Admin tabs (Users, requirement types, work-item types) —
  those back mockup screens with no implemented data model.
- **Retire the standalone Forms feature entirely**: the ad-hoc "browse,
  create, edit, and delete forms" screens (`/forms`, `/forms/$formId`) and
  their dedicated fill-in/view-response screens (`/forms/$formId/fill`,
  `/forms/$formId/response`) are removed from the frontend, along with their
  navigation entry — it has no counterpart in the mockup and isn't needed.
  The underlying form-field rendering, conditional-visibility, and
  save-a-response machinery those screens were built on is **not** deleted:
  it's what already powers filling in a deliverable's user stories and
  acceptance criteria (which are themselves `Form`s under the hood), so it
  stays in place, just with no more standalone entry point.
- Rework the Work section from three separate full-page routes (workstreams
  list → workstream detail → deliverable edit) into the mockup's master-detail
  layout: a workstreams sidebar, a deliverable list for the selected
  workstream, and a detail panel for the selected deliverable (its fields,
  user stories, and each user story's acceptance criteria), navigable without
  full-page transitions between panels, while keeping every existing create/
  edit/delete/reorder capability intact.
- Restyle list and edit screens for form templates and invite users with the
  mockup's card, button, input, and table treatments, without changing what
  those screens do.
- **BREAKING**: Existing frontend routes `/workstreams` and
  `/workstreams/$workstreamId` are replaced by a single `/work` route with
  in-page selection state; direct links to the old routes no longer resolve.
- **BREAKING**: Existing frontend routes `/forms`, `/forms/$formId`,
  `/forms/$formId/fill`, and `/forms/$formId/response` are removed with no
  replacement; direct links to them no longer resolve.

## Capabilities

### New Capabilities
- `visual-design`: The shared dark theme and visual design tokens/patterns
  (color scheme, surfaces, typography, avatars, buttons) applied across the
  frontend.

### Modified Capabilities
- `navigation`: Replaces the current link-list navbar with a segmented
  toolbar + user menu, redefines the set of top-level sections to match what
  is implemented, and adds the Work section's master-detail navigation
  behavior.
- `forms`: Removes the frontend requirements for a standalone forms list/
  search/create/delete screen and a standalone form-edit screen; the backend
  `Form` CRUD requirements are unchanged.
- `form-responses`: Removes the frontend requirements for a dedicated
  fill-in screen and a dedicated view screen reachable for any form by id;
  the backend save/view-response requirements are unchanged, and the
  underlying field-rendering/response UI remains in use embedded in the
  `deliverables` capability's user story and acceptance criterion editing.

## Impact

- Affected code: `frontend/src/app/theme.ts`, `frontend/src/app/providers.tsx`,
  `frontend/src/features/navigation/*`, `frontend/src/features/auth/login-screen.tsx`,
  `frontend/src/app/index-page.tsx`, `frontend/src/features/workstreams/*`,
  `frontend/src/features/deliverables/*`, `frontend/src/app/router.tsx`,
  the styling of `frontend/src/features/{form-templates,invites}/*`, and
  deletions within `frontend/src/features/forms/*` and
  `frontend/src/features/form-responses/*` (see `design.md` for exactly
  which files are removed vs. kept as shared infrastructure).
- No backend or API changes; no new domain data (status, priority, dates,
  assignees, work items, comments, notifications are explicitly out of scope
  since they aren't implemented). The backend `forms`/`form-responses`
  modules and their full CRUD endpoints are untouched — they remain in use
  under the hood by user stories and acceptance criteria, and remain
  reachable directly via the API even though the frontend no longer exposes
  a standalone-forms UI.
- Existing bookmarks/links to `/workstreams`, `/workstreams/$workstreamId`,
  `/forms`, `/forms/$formId`, `/forms/$formId/fill`, and
  `/forms/$formId/response` break and must be accepted as a breaking change.
- Form templates moves from an always-visible toolbar entry to one reachable
  only via the admin-only "Admin" section; this is a navigation-visibility
  change only — the backend endpoints and the routes (`/form-templates`,
  `/form-templates/$formTemplateId`) keep no role restriction, so a
  non-admin who already has a direct link can still open them.
- The home page (`IndexPage`) currently pitches the Forms feature being
  retired ("Create configurable forms, share them, and review the responses
  you receive.") and must be updated, along with the e2e test asserting that
  copy.
