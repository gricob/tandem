## Context

Routes are currently registered directly on `rootRoute` in `frontend/src/app/router.tsx` with no shared layout — each page component (`IndexPage`, `FormTemplatesListPage`, `FormEditPage`, etc.) renders its own top-level `Container`. Navigation between "Form templates" and "Forms" only exists as two buttons on `IndexPage`; there is no persistent way to switch sections, no active-section indicator, and no logout action anywhere in the UI (the token can only be cleared automatically on a `401`, per the `auth` spec). `SessionGate` (`frontend/src/features/auth/session-gate.tsx`) already wraps the whole `RouterProvider` and shows the password screen when there's no token, so any navbar we add only ever renders once the user is authenticated.

## Goals / Non-Goals

**Goals:**
- One persistent navbar visible on every route, showing the app brand, links to the top-level sections ("Form templates", "Forms"), which one is currently active, and a logout action.
- Keep the change frontend-only and additive to routing: wrap the existing route tree in a shared layout without altering any existing route's path or component logic.

**Non-Goals:**
- No new sections/routes beyond the two that exist today.
- No responsive/collapsible mobile nav (product NFRs target desktop/laptop, degrading gracefully but not optimizing for small screens).
- No user identity/avatar — there are no user accounts in the MVP, only a shared session.

## Decisions

- **Mantine `AppShell` with a `header` slot, not a side `navbar` slot.** With only two top-level sections, a horizontal header bar is enough and matches "navbar" as commonly understood; a side nav would waste horizontal space that form-editing screens need. Alternative considered: `AppShell` `navbar` (sidebar) — rejected for now given the small number of sections, revisit if sections grow.
- **Shared layout via a `RootLayout` component set as `rootRoute`'s `component`**, rendering `<AppShell><AppShell.Header>...<Outlet /></AppShell>`, rather than wrapping each leaf route individually. This is the standard TanStack Router pattern (root route component + `<Outlet />`) and guarantees every current and future route gets the navbar for free without editing each route definition.
- **Active-link styling via TanStack Router's `Link` `activeProps`/`activeOptions`**, not manual `location.pathname` checks — the router already tracks the matched route tree, so this stays correct as routes gain params (e.g. `/form-templates/$formTemplateId` should still highlight "Form templates").
- **Logout calls the existing `clearSessionToken()`** from `frontend/src/features/auth/session-store.ts` directly; `SessionGate` already subscribes to token changes and will swap back to the password screen, so the navbar needs no navigation call of its own after logout.
- **New `frontend/src/features/navigation/` feature folder** (`app-navbar.tsx` + `root-layout.tsx`) to keep the shell colocated with its own concerns, consistent with how `auth`, `forms`, `form-templates`, `form-responses` are each their own feature folder.
- **`IndexPage` keeps only a short welcome message**; its two navigation buttons are removed since the navbar now provides that path, avoiding two competing ways to navigate to the same places.

## Risks / Trade-offs

- [Wrapping `rootRoute` changes where `Outlet` renders] → Low risk: TanStack Router's root-component-with-`Outlet` pattern is the documented approach and doesn't require touching any child route definition.
- [Two nav mechanisms briefly coexisting during implementation if `IndexPage` isn't updated in the same change] → Mitigate by landing the navbar and the `IndexPage` simplification together (same change, sequenced in tasks).
