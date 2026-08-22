## 1. Navbar component

- [x] 1.1 Create `frontend/src/features/navigation/app-navbar.tsx`: a Mantine `AppShell.Header` with the "Tandem" brand/home link, a "Form templates" link, a "Forms" link, and a "Log out" action.
- [x] 1.2 Use TanStack Router `Link` with `activeProps`/`activeOptions` (`{ exact: false }` where needed) so "Form templates" stays active under `/form-templates/$formTemplateId` and "Forms" stays active under `/forms/$formId`, `/forms/$formId/fill`, `/forms/$formId/response`, without either being active on `/`.
- [x] 1.3 Wire "Log out" to call `clearSessionToken()` from `frontend/src/features/auth/session-store.ts`.

## 2. Root layout wiring

- [x] 2.1 Create `frontend/src/features/navigation/root-layout.tsx` rendering `AppShell` with `AppNavbar` in the header slot and `<Outlet />` for the routed page content.
- [x] 2.2 In `frontend/src/app/router.tsx`, set `RootLayout` as the `component` of `rootRoute` so every existing route (`/`, `/form-templates`, `/form-templates/$formTemplateId`, `/forms`, `/forms/$formId`, `/forms/$formId/fill`, `/forms/$formId/response`) renders under the shared navbar without changing their paths or page components.

## 3. Home page cleanup

- [x] 3.1 Simplify `frontend/src/app/index-page.tsx` to a short welcome message, removing the "Form templates" / "Forms" buttons now covered by the navbar.

## 4. Tests

- [x] 4.1 Add `frontend/tests/unit/app-navbar.test.tsx` covering: navbar renders with both section links; each of "Form templates" and "Forms" is marked active on its own routes (including nested ones) and not on the other section or on `/`; clicking "Log out" clears the session token.
- [x] 4.2 Update `frontend/tests/unit/app.test.tsx` if it asserts on the previous `IndexPage` buttons or root route shape. (Not needed: it only asserts the "Tandem" title shown by `PasswordScreen`, unaffected by this change.)

## 5. Verification

- [x] 5.1 Run frontend lint, typecheck, and unit tests (`pnpm --filter frontend lint`, `pnpm --filter frontend typecheck`, `pnpm --filter frontend test`, adjusting script names to match `frontend/package.json`). All pass (49/49 tests).
- [x] 5.2 Manually click through `/`, `/form-templates`, `/forms`, and a nested route in the running app to confirm the navbar persists, active-state highlighting is correct, and logout returns to the password screen. (Not done: the shared chrome-devtools browser profile was locked by another concurrent session; covered instead by `app-navbar.test.tsx`'s route/active-state/logout assertions.)
