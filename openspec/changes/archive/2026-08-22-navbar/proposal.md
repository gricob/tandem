## Why

Right now the only way to move between sections is the two buttons on the home page (`/`); once inside Form templates, Forms, or an edit/fill/response screen, there is no way back except the browser's back button, no indication of which section you're in, and no way to log out short of clearing storage manually. As more sections get added post-MVP this will only get worse, so a persistent navbar is needed now while the app still has just two sections.

## What Changes

- Add a persistent navbar/app shell rendered above every authenticated route (Form templates, Forms, and their sub-routes), replacing the current per-page, no-navigation layout.
- Navbar shows the "Tandem" brand/home link plus links to "Form templates" and "Forms", with the current section visually highlighted as active.
- Navbar includes a "Log out" action that clears the stored session token and returns to the password screen.
- Simplify the home page (`/`) since primary navigation moves to the persistent navbar; it keeps a short welcome message.

## Capabilities

### New Capabilities
- `navigation`: persistent app-wide navbar giving access to all top-level sections and showing which one is active.

### Modified Capabilities
- `auth`: add a manual logout action (in addition to the existing automatic clear-on-401 behavior).

## Impact

- Frontend only (`frontend/src/app/router.tsx`, `frontend/src/app/index-page.tsx`).
- New shell/layout component wrapping routed pages (e.g. `frontend/src/features/navigation/`), using Mantine's `AppShell` and TanStack Router's active-link support.
- Uses existing `clearSessionToken` from `frontend/src/features/auth/session-store.ts` for logout; no backend changes.
