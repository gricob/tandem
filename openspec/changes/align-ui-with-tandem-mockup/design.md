## Context

The frontend (React 19 + Vite + Mantine 8 + TanStack Router/Query) currently
renders every screen with Mantine's untouched default (light) theme
(`frontend/src/app/theme.ts` is `createTheme({})`), and a single persistent
navbar (`AppNavbar`) that lists plain text-button links for every top-level
route (Form templates, Forms, Workstreams, and — admin-only — Invite users),
plus a separate "Log out" button. Each feature page (`workstreams-list-page`,
`workstream-detail-page`, `deliverable-edit-page`, etc.) is a full-page route
built from generic Mantine primitives (`Container`, `Table`, `Stack`) with no
shared visual language beyond the default theme.

A design mockup (`Tandem.html`, referenced as "the attached file") was
supplied as the target look and navigation. It is a static/demo bundle (fake
in-memory data, a one-click "login", a role-switcher, drag-and-drop board,
Gantt-style roadmap, blocking banners, comments, notifications, and an
admin area for requirement/work-item type configuration). None of that
backing data model exists in Tandem's actual backend (see
`openspec/specs/{workstreams,deliverables,auth,forms,form-templates}/spec.md`):
there is no status, priority, due-date, assignee, work item, comment,
notification, or requirement-type entity. Per the change request, only the
mockup's design language and navigation *structure* are adopted; screens and
data that don't exist are not fabricated.

## Goals / Non-Goals

**Goals:**
- Establish one shared dark visual design system (color scheme, accent color,
  surfaces, typography, radii, avatar/pill/button patterns) driven by the
  Mantine theme, so every real screen looks like it belongs to the same
  product as the mockup.
- Replace the current plain-link navbar with the mockup's toolbar pattern:
  brand mark, a segmented switcher over the sections that actually exist, and
  a user menu (avatar initials, name, role, log out).
- Adopt the mockup's master-detail interaction pattern for the one area of
  the app where the real data genuinely supports it — workstreams and their
  deliverables (including user stories and acceptance criteria) — replacing
  three separate full-page routes with one persistent three-panel view.
- Retire the standalone Forms feature (list/create/edit ad-hoc forms and
  their dedicated fill-in/view-response screens) — it has no mockup
  counterpart and was explicitly called out as droppable — while preserving
  the shared form-field-rendering, conditional-visibility, and
  save-a-response infrastructure that `deliverables` (user stories,
  acceptance criteria) already depends on.
- Restyle every other remaining screen (login, home, form templates, invite
  users) with the new design tokens without changing their behavior or
  information architecture.

**Non-Goals:**
- No new backend capability, entity, or field (no status, priority, dates,
  assignees, reviewers, work items, comments, notifications, requirement
  types, or a users list/table). The mockup's Board, Roadmap, and multi-tab
  Admin (users/req-types/wi-types) screens are not built.
- No backend change to `forms` or `form-responses`: their full CRUD
  endpoints stay exactly as specified and remain in active use under the
  hood by `deliverables`. Only the frontend screens that exposed arbitrary
  ad-hoc form management directly to end users are removed.
- No change to `form-templates`'s behavior beyond visual restyling.
- No new role model, permission, or backend enforcement beyond the existing
  `admin`/`member` split already implemented. The Admin section's visibility
  reuses that existing check; Form templates does not gain a backend
  `RequireAdmin` guard as part of this change (see Decision 2).
- Not pixel-identical to the mockup — it's a demo bundle with placeholder
  copy, fake avatars, and Spanish UI copy; we reuse its layout and styling
  patterns, not its literal content.

## Decisions

### 1. Theme: Mantine dark color scheme + design tokens, not a CSS rewrite
Set `defaultColorScheme="dark"` on `MantineProvider` and extend
`frontend/src/app/theme.ts` with: a custom `primaryColor` matching the
mockup's accent (`#0A84FF`), Mantine's built-in `dark` color shades tuned
toward the mockup's near-black surfaces (`#0c0c0f`/`#1c1c1e`/`#2c2c2e`), a
shared `radius` scale (mockup uses ~9-16px), and `defaultRadius`/`Card`,
`Button`, `TextInput`, `Table` component-level style overrides so existing
Mantine primitives (already used everywhere) pick up the new look with no
per-page rewrites.
- **Alternative considered**: hand-rolled CSS (as the mockup's raw inline
  styles do). Rejected — the app already standardized on Mantine; fighting it
  with custom CSS would duplicate component logic (buttons, inputs, modals)
  that Mantine already provides and the rest of the app depends on.
- **Alternative considered**: light theme with mockup's card/spacing patterns
  only. Rejected — the dark theme is the single most visible, deliberate
  choice in the mockup and the one most requested.

### 2. Navigation shell: segmented toolbar + user menu, sections trimmed to reality
Rebuild `AppNavbar` as: brand mark/name (link to `/`) · a Mantine
`SegmentedControl`-style button group with one entry per implemented
top-level section · a user menu (`Menu` + `Avatar` showing initials) with the
user's name/role and "Log out" inside it (dropping the standalone Log out
button). The menu trigger itself renders unconditionally — with placeholder
avatar/label content ("?" / "Account") when `currentUser` from
`useCurrentUser()` hasn't resolved yet — rather than being gated on
`currentUser` being loaded, since the old standalone Log out button had no
such dependency and losing it would regress "always able to log out" to
"able to log out only once the profile fetch succeeds" (caught in review —
see Risks). Sections, driven by what exists today (after retiring Forms —
see Decision 4):
- **Work** → `/work` (workstreams + deliverables, see Decision 5)
- **Admin** → shown only when `currentUser.role === 'admin'` (same condition
  gating "Invite users" today), grouping two destinations behind an admin
  sub-navigation (sidebar or tab strip, mirroring the mockup's Admin shell):
  - **Formularios** → `/form-templates` (the mockup's "Formularios" tab maps
    directly onto the existing Form templates feature — reusable field sets
    — per product direction)
  - **Invite users** → `/invites`

The mockup's other Admin tabs (Users list, requirement types, work-item
types) are dropped: there is no users-list endpoint, requirement-type, or
work-item entity behind them. Board/Roadmap are dropped for the same reason
(no board/roadmap data model).

Moving Form templates under admin-only "Admin" changes who can *navigate* to
it, but not who *can* reach it: `/form-templates` and its detail route stay
open to any authenticated user at the backend and router level (no
`RequireAdmin`-style guard exists there today, unlike `/invites`, which the
backend already enforces via `RequireAdmin`). This is called out as an
accepted, deliberate gap — see Risks — rather than silently added backend
enforcement, which would be a role/permission change beyond this proposal's
scope.
- **Alternative considered** (superseded): keep "Form templates" as its own
  always-visible toolbar entry and "Invite users" as the only admin-gated
  one, with no "Admin" grouping. This was the original plan, reasoning that
  an admin shell around a single destination was unwarranted scaffolding.
  Superseded by explicit product direction: Form templates is to be treated
  as an admin capability (mapped to the mockup's "Formularios" tab) and
  grouped with Invite users under one admin-only "Admin" section.

### 3. Admin section shell: sub-navigation over existing routes, no new route
The "Admin" toolbar entry itself is not a route — clicking it navigates to
its first destination, `/form-templates`. When the active path is under
`/form-templates` or `/invites`, an admin sub-navigation (a left sidebar
tab list, mirroring the mockup's Admin shell) renders alongside the page
content, listing "Formularios" and "Invite users" and highlighting whichever
is active; clicking an entry navigates to its existing route. No new
`/admin` route or combined admin layout component with its own URL segment
is introduced — this keeps `/form-templates` and `/invites` as the sources
of truth for those screens and avoids restructuring their existing routing.
- **Alternative considered**: a single `/admin` route with client-side tab
  state (as the mockup does, via `adminTab` in local state) rendering both
  screens' content inline. Rejected — `/form-templates` already has its own
  sub-route (`/form-templates/$formTemplateId`) and query hooks tied to the
  URL; collapsing it into a tab under `/admin` would mean either giving up
  deep-linking to a specific form template or reimplementing nested routing
  inside a tab, for no behavioral benefit over keeping the existing routes
  and adding a shared sidebar shell around them.

### 4. Retire the standalone Forms feature, keep shared form infrastructure
Delete the ad-hoc, browse-any-form feature and its routes entirely:
`frontend/src/features/forms/forms-list-page.tsx`,
`form-edit-page.tsx`, `components/create-form-modal.tsx`,
`components/confirm-delete-modal.tsx`, and the list/detail CRUD hooks in
`queries.ts` (`useForms`, `useForm`, `useCreateForm`, `useUpdateForm`,
`useDeleteForm`) and the corresponding functions in `api.ts` (`listForms`,
`getForm`, `createForm`, `updateForm`, `deleteForm`); delete
`frontend/src/features/form-responses/form-response-fill-page.tsx` and
`form-response-view-page.tsx`; remove the `/forms`, `/forms/$formId`,
`/forms/$formId/fill`, and `/forms/$formId/response` routes from
`router.tsx`; drop the "Forms" toolbar entry (Decision 2).

What is **not** deleted, because `deliverables` depends on it for filling in
user story and acceptance criterion fields (a `UserStory`/
`AcceptanceCriterion` is itself a `Form` per the `deliverables` spec):
`forms/api.ts`'s `Form`/`FormField` type exports, `forms/condition.ts`
(`resolveVisibility`/`ConditionNode`, also used by `form-templates`'
condition builder), and everything in `form-responses/` except the two
retired pages — `components/response-fields.tsx`, `queries.ts`
(`useFormResponse`/`useSaveFormResponse`), and `value-utils.ts`. These stay
exactly where they are; `deliverables/components/inline-fields.tsx` already
imports them directly (not through the retired pages) and needs no change.

Update the home page (`IndexPage`) copy, which currently pitches the
retiring feature ("Create configurable forms, share them, and review the
responses you receive."), and the e2e assertion on that copy
(`frontend/tests/e2e/auth.spec.ts`).
- **Alternative considered**: keep the standalone Forms feature but drop it
  from top-level navigation (reachable only by direct URL). Rejected per
  explicit instruction to drop it entirely, and because an unlinked,
  unmaintained screen left reachable by URL is worse than removing it
  outright.
- **Alternative considered**: delete all of `frontend/src/features/forms/`
  and `form-responses/` wholesale. Rejected — both directories mix
  standalone-feature code with generic domain code (`Form`/`FormField`
  types, `condition.ts`, `ResponseFields`) that `deliverables` and
  `form-templates` actively import; deleting them wholesale would break the
  Work section's user story/acceptance criterion editing.
- **BREAKING**: `/forms`, `/forms/$formId`, `/forms/$formId/fill`, and
  `/forms/$formId/response` stop resolving, with no replacement — this
  feature is fully retired, not moved.

### 5. Work section: collapse 3 routes into 1 master-detail view
Replace `/workstreams`, `/workstreams/$workstreamId`, and
`/deliverables/$deliverableId` with a single `/work` route rendering three
persistent panels, mirroring the mockup's Work tab:
1. **Workstreams panel** — the existing workstream list, as selectable rows
   instead of a table with navigation links.
2. **Deliverables panel** — the deliverables of the selected workstream (from
   `useWorkstream`), as selectable cards instead of a nested list.
3. **Detail panel** — the selected deliverable's editable name/description,
   its user stories, and each user story's acceptance criteria (existing
   `UserStoryList`/`CreateUserStoryModal` components adapted into the panel),
   or the workstream's own edit form when no deliverable is selected yet.

Selection state (`selectedWorkstreamId`, `selectedDeliverableId`) is kept in
the URL as search params on `/work` (e.g. `/work?ws=...&del=...`) so the view
stays deep-linkable and shareable, replacing the old path params. Panel
switches update search params via the router (no full navigation/remount),
matching the mockup's instant panel transitions.
- **Alternative considered**: keep the three routes and only restyle them.
  Rejected — the proposal explicitly asks to follow the mockup's
  *navigation*, and the master-detail browsing pattern (never leaving the
  "Work" context to see a deliverable) is the one clearly-implementable,
  data-backed navigation change the mockup defines; restyling alone would
  leave navigation unchanged, which the request calls out by name.
- **Alternative considered**: also fold in a requirement/acceptance-criterion
  detail slide-over panel (as the mockup does for its "requirement" concept).
  Kept minimal instead — user stories and acceptance criteria already have
  adequate inline editing UI (`UserStoryList`, inline field editors); adding
  a fourth sliding panel is presentational polish, not a navigation
  requirement, and can follow later if wanted.
- **BREAKING**: bookmarks to `/workstreams` or `/workstreams/$id` stop
  resolving. Given this is a pre-1.0 internal tool with no external consumers
  of frontend URLs, no redirect route is added; `tasks.md` calls out adding
  one as a fallback if that turns out to matter.

### 6. Everything else: restyle in place, no IA change
Login screen, home page, form templates, and invite users keep their current
routes, page structure, and behavior; they only pick up the new theme tokens
(dark surfaces, the shared card treatment, the mockup's centered-card login
pattern) via the theme change in Decision 1 and targeted component tweaks
(e.g., login screen wrapped in a bordered/elevated `Paper` on a dark gradient
background, matching the mockup's login card). The home page's copy changes
as part of Decision 4 (it referenced the retired Forms feature), which is a
content fix, not an IA change.

## Risks / Trade-offs

- [Risk] Gating the entire user menu (and therefore "Log out") on
  `currentUser` having loaded would regress a previously unconditional
  capability: the old standalone "Log out" button worked regardless of
  whether `/api/v1/users/me` had resolved. A slow or failing profile fetch
  would leave a signed-in user with no visible way to log out.
  → Mitigation: the menu trigger renders unconditionally with placeholder
  content until `currentUser` loads (see Decision 2); found and fixed via
  user report during real-app testing, with a regression test added
  (`app-navbar.test.tsx`, "still offers Log out when currentUser has not
  loaded yet").
- [Risk] Collapsing three routes into one stateful `/work` view is the
  largest single piece of this change and touches the most-used part of the
  app (workstreams/deliverables CRUD, drag-to-reorder deliverables/user
  stories/acceptance criteria). → Mitigation: keep all existing hooks
  (`useWorkstreams`, `useWorkstream`, `useAddDeliverable`, etc.) and child
  components (`DeliverableList`, `UserStoryList`, modals) unchanged; only the
  page shell and selection wiring change, so existing behavior/tests for
  create/edit/delete/reorder keep exercising the same query layer.
- [Risk] A global dark theme changes contrast/legibility across every screen
  at once. → Mitigation: rely on Mantine's built-in dark-mode color
  resolution for components (inputs, tables, alerts already adapt via
  Mantine's `dark` shades) rather than hand-picking colors per component;
  spot-check each restyled page for contrast (especially error `Alert`s and
  disabled states).
- [Risk] Dropping `/workstreams` breaks any saved links/browser history.
  → Mitigation: acceptable per proposal (marked **BREAKING**); can add a
  redirect from the old paths to `/work` cheaply later if needed.
- [Risk] Retiring Forms means deleting page components that import from the
  same files (`forms/api.ts`, `forms/condition.ts`,
  `form-responses/{queries,value-utils}.ts`,
  `form-responses/components/response-fields.tsx`) that `deliverables` and
  `form-templates` still need; an over-eager deletion could break the Work
  section. → Mitigation: Decision 4 enumerates exactly which files are
  deleted vs. kept; tasks.md verification includes exercising user
  story/acceptance criterion field editing after the deletion to confirm
  nothing shared broke.
- [Risk] Backend `forms`/`form-responses` endpoints remain fully open (no
  new restriction), so anyone with API access can still create/list/delete
  arbitrary standalone forms even though no UI surfaces that anymore.
  → Mitigation: accepted — no backend change is in scope here, and this
  matches today's actual access model (no restriction) rather than
  narrowing it as a side effect of a frontend-only change.
- [Trade-off] The mockup's admin area (Users/req-types/wi-types/Formularios
  tabs) is reduced to the two destinations that actually exist — Form
  templates and Invite users. This under-delivers on the mockup's visual
  ambition for Admin, but building scaffolding for non-existent tabs would
  be speculative UI with no data behind it — explicitly against the "ignore
  what isn't implemented" brief.
- [Risk] Hiding Form templates behind the admin-only "Admin" section in the
  toolbar, without adding backend or route-level enforcement, means a
  non-admin with a direct link to `/form-templates` can still use it — the
  UI implies it's admin-only when it isn't fully enforced as such.
  → Mitigation: accepted as explicitly out of scope (see Non-Goals); flagged
  here so it isn't mistaken for a security control. A future change can add
  a `RequireAdmin`-equivalent guard if product wants Form templates to be
  admin-only in practice, not just in navigation.

## Migration Plan

1. Land the theme changes (Decision 1) first — purely additive/visual, no
   route or behavior change, safe to ship alone.
2. Land the navbar/user-menu rebuild (Decision 2) — changes the shell but not
   individual page routes yet (Work still points at `/workstreams` briefly if
   sequenced this way, or ships together with step 3).
3. Land the Admin sub-navigation shell (Decision 3) together with step 2 —
   it's part of the same toolbar/shell rebuild.
4. Land the Forms retirement (Decision 4) together with the router change
   (remove `/forms*`) and the toolbar change (drop the "Forms" entry) so
   there's no intermediate state with a dead nav link; update the home page
   copy in the same pass.
5. Land the `/work` consolidation (Decision 5) together with the router
   change (remove `/workstreams*` and `/deliverables/$id`, add `/work`) so
   there's no intermediate state with dead links.
6. Restyle the remaining screens (Decision 6) incrementally; each is
   independent and low-risk.

No data migration, feature flag, or backend deploy coordination is needed —
this is a frontend-only change. Rollback is a plain revert of the frontend
commit(s); no persisted state depends on the new routes.

## Open Questions

- Should `/workstreams` and `/workstreams/$workstreamId` redirect to `/work`
  (with the workstream pre-selected) instead of breaking outright? Leaning
  towards yes as a cheap follow-up, but not blocking this change per the
  proposal's explicit **BREAKING** note.
- Should the user menu's role label use the exact backend role value
  (`admin`/`member`) or a friendlier label ("Administrator"/"Member")? Mockup
  uses friendly role labels (e.g. "Product Owner"); real roles are just
  `admin`/`member`, so a simple capitalized label is assumed unless product
  wants copy specified.
- Should `/form-templates` and `/form-templates/$formTemplateId` gain a
  frontend `admin`-only guard (mirroring `invite-users-page.tsx`'s existing
  "Admins only" fallback) now that they're presented as an Admin capability,
  or is nav-only gating intentional for this change? Left as nav-only for
  now (see Risks); flagged for product to confirm.
