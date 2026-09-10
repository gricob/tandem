## 1. Shared dark theme

- [x] 1.1 Extend `frontend/src/app/theme.ts` with the mockup's palette: accent
      `primaryColor`, tuned `dark` shade scale for surfaces
      (`#0c0c0f`/`#1c1c1e`/`#2c2c2e`), `defaultRadius`, and typography scale.
- [x] 1.2 Add component-level style overrides in the theme for `Button`,
      `TextInput`/`PasswordInput`/`Textarea`, `Select`, `Card`/`Paper`,
      `Table`, `Modal`, and `Avatar` so they pick up the new tokens app-wide.
- [x] 1.3 Set `defaultColorScheme="dark"` on `MantineProvider` in
      `frontend/src/app/providers.tsx`.
- [x] 1.4 Spot-check contrast/legibility of existing `Alert` (error/success),
      disabled buttons, and table rows under the new dark theme; adjust
      overrides as needed. (Verified live in the browser: error `Alert`s
      — "Couldn't load workstreams", "Couldn't load deliverable" — and the
      Form templates `Table` both render with clear contrast against the
      dark surfaces with no per-component overrides needed.)

## 2. Navigation shell: toolbar + user menu

- [x] 2.1 Add a `currentUser`-derived helper (initials, display role label)
      reusable by the navbar and any future avatar usage.
- [x] 2.2 Rebuild `AppNavbar` (`frontend/src/features/navigation/app-navbar.tsx`)
      as: brand mark/name linking to `/`, a segmented section switcher with
      entries for Work and (admin-only) Admin, and a user menu (`Menu` +
      `Avatar` with initials) showing name/role.
- [x] 2.3 Move "Log out" into the user menu; remove the standalone Log out
      button. (Fixed post-review: the menu trigger must render even before
      `currentUser` has loaded — with placeholder avatar/label — so "Log
      out" stays reachable regardless of profile-fetch state, matching the
      old standalone button's behavior; added a regression test.)
- [x] 2.4 Update active-section highlighting to key off `/work` (new route)
      instead of `/workstreams`, and treat `/form-templates*` and `/invites`
      together as the "Admin" section for highlighting purposes.
- [x] 2.5 Build an admin sub-navigation (sidebar or tab strip) shown on
      `/form-templates*` and `/invites` routes with two entries —
      "Formularios" (→ `/form-templates`) and "Invite users" (→ `/invites`)
      — highlighting whichever is active; wire the toolbar's "Admin" entry
      to navigate to `/form-templates` by default.
- [x] 2.6 Update/replace `openspec/specs/navigation/spec.md`-covered behavior
      in code: verify toolbar renders on nested routes, hides the "Admin"
      entry (and all access to Formularios/Invite users) for non-admins, and
      the admin sub-navigation highlights correctly (per the updated
      navigation spec scenarios).

## 3. Retire the standalone Forms feature

- [x] 3.1 Delete `frontend/src/features/forms/forms-list-page.tsx`,
      `form-edit-page.tsx`, `components/create-form-modal.tsx`, and
      `components/confirm-delete-modal.tsx`.
- [x] 3.2 Delete `frontend/src/features/form-responses/form-response-fill-page.tsx`
      and `form-response-view-page.tsx`.
- [x] 3.3 In `frontend/src/features/forms/queries.ts` and `api.ts`, remove
      the now-unused list/detail CRUD hooks and functions (`useForms`,
      `useForm`, `useCreateForm`, `useUpdateForm`, `useDeleteForm`,
      `listForms`, `getForm`, `createForm`, `updateForm`, `deleteForm`) while
      keeping the `Form`/`FormField` type exports in `api.ts` and all of
      `condition.ts` — both are still imported by `form-templates` and by
      `form-responses`' `ResponseFields`/`value-utils`.
- [x] 3.4 Confirm `frontend/src/features/form-responses/components/response-fields.tsx`,
      `queries.ts` (`useFormResponse`/`useSaveFormResponse`), and
      `value-utils.ts` are left untouched — `deliverables/components/inline-fields.tsx`
      imports them directly and must keep working unchanged.
- [x] 3.5 Remove the `/forms`, `/forms/$formId`, `/forms/$formId/fill`, and
      `/forms/$formId/response` routes from `frontend/src/app/router.tsx`.
- [x] 3.6 Update `IndexPage` (`frontend/src/app/index-page.tsx`) copy, which
      currently pitches the retiring feature ("Create configurable forms,
      share them, and review the responses you receive.").
- [x] 3.7 Delete the now-obsolete tests: `frontend/tests/unit/forms-list-page.test.tsx`,
      `create-form-modal.test.tsx`, `forms-confirm-delete-modal.test.tsx`,
      `form-response-fill-page.test.tsx`, `form-response-view-page.test.tsx`,
      and any e2e specs exercising the retired screens (e.g.,
      `frontend/tests/e2e/forms.spec.ts`, `form-responses.spec.ts`); update
      `frontend/tests/e2e/auth.spec.ts`'s assertion on the old home page copy.
      Keep `condition.test.ts`, `response-fields.test.tsx`, and
      `form-responses-value-utils.test.ts` — they cover code that's staying.

## 4. Work section: `/work` master-detail route

- [x] 4.1 Add a `/work` route in `frontend/src/app/router.tsx` accepting
      `ws` and `del` search params for the selected workstream/deliverable;
      remove the `/workstreams`, `/workstreams/$workstreamId`, and
      `/deliverables/$deliverableId` routes.
- [x] 4.2 Build a `WorkPage` component composing three panels:
      workstreams list, deliverables list (for the selected workstream), and
      a detail panel (selected deliverable or the workstream's own edit form
      when no deliverable is selected).
- [x] 4.3 Wire panel selection to update the `ws`/`del` search params via the
      router (no full navigation), reusing `useWorkstreams`/`useWorkstream`
      for data.
- [x] 4.4 Adapt the deliverable detail panel to reuse existing components
      (`deliverable` name/description form, `UserStoryList`,
      `CreateUserStoryModal`, acceptance-criteria components, and
      `InlineFields`) inside the panel instead of a standalone page.
- [x] 4.5 Adapt workstream create/delete (`CreateWorkstreamModal`,
      `ConfirmDeleteModal`) and deliverable create
      (`CreateDeliverableModal`) flows to operate from within the panels,
      updating selection appropriately after create/delete (e.g., select the
      newly created workstream/deliverable; clear selection after delete).
- [x] 4.6 Restyle the three panels with the shared theme (panel surfaces,
      row/card selection states, spacing) per the mockup's Work view.
- [x] 4.7 Verify deep-linking: loading `/work?ws=...&del=...` pre-selects
      the right workstream and deliverable on first render.
- [x] 4.8 Update any internal links that pointed at `/workstreams*` or
      `/deliverables/$id` (e.g., from the home page, if any) to point at
      `/work` with the appropriate search params.

## 5. Restyle remaining screens

- [x] 5.1 Restyle `LoginScreen` as a centered card (`Paper`) on the dark
      background, matching the mockup's login card layout.
- [x] 5.2 Restyle `IndexPage` (home) with the shared theme (in addition to
      the copy change from task 3.6).
- [x] 5.3 Restyle `form-templates` list/edit pages
      (`form-templates-list-page.tsx`, `form-template-edit-page.tsx`) and
      their modals/field components with the shared card/table/button
      treatment. (No hardcoded light-mode colors found; these pages pick up
      the dark theme automatically via the shared Mantine component
      overrides from task group 1 — no per-page rewrite needed.)
- [x] 5.4 Restyle `invite-users-page.tsx` (form + generated invite-link
      panel). (Same as above — automatically themed, no hardcoded colors.)

## 6. Verification

- [x] 6.1 Update/add frontend unit and e2e tests
      (`frontend/tests/unit`, `frontend/tests/e2e`) covering: toolbar section
      switching and active-state highlighting, admin-only visibility of the
      "Admin" section (Formularios + Invite users) and its sub-navigation,
      user-menu log out, and `/work` panel selection/deep-linking —
      replacing any tests that targeted the removed `/workstreams*` routes.
      (Rewrote `app-navbar.test.tsx`, updated `deliverable-list.test.tsx`,
      added `work-page.test.tsx`, renamed/rewrote `workstreams.spec.ts` →
      `work.spec.ts`.)
- [x] 6.2 Verify that filling in a user story's or acceptance criterion's
      fields on `/work` still works end to end after the Forms retirement
      (task group 3) — this is the one remaining consumer of the shared
      form-field-rendering/response infrastructure. (Confirmed via
      `inline-fields.test.tsx` passing unchanged and a manual walkthrough in
      a real browser — see 6.5.)
- [x] 6.3 Verify `/forms`, `/forms/$formId`, `/forms/$formId/fill`, and
      `/forms/$formId/response` no longer resolve to anything in the app.
      (No such routes exist in `router.tsx`; production build succeeds with
      no dangling references.)
- [x] 6.4 Run `pnpm --filter frontend lint`, typecheck, and test suites;
      fix regressions. (All clean: 0 lint errors, 0 type errors, 94/94 unit
      tests passing across 22 files, production build succeeds.)
- [x] 6.5 Manually walk through each screen (login → work → admin
      [Formularios, Invite users], as both an admin and a member account) to
      confirm the dark theme, navigation, admin gating, and Work panels
      behave as specified. (Verified live in a browser via chrome-devtools:
      login card, Work master-detail panels incl. deep-linking and selecting
      a deliverable with its user stories/acceptance criteria, Admin sidebar
      with Formularios/Invite users, account menu with Log out, and that a
      member account sees no Admin entry. Caught and fixed two real bugs
      along the way: `AppShell.Main`'s header-offset padding being zeroed
      out — clipping all panel headers under the fixed toolbar — and a
      clipped "New deliverable" button; also fixed stale-cache bugs where
      editing/adding/removing a deliverable didn't refresh the sibling
      panels reading the same data from a different query key.)
- [x] 6.6 Run `openspec validate align-ui-with-tandem-mockup --strict` before
      archiving.
