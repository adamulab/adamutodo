# Arc — Daily Focus

A calm, focused daily planner, rebuilt from the ground up on top of your original TaskFlow codebase. Arc is centered on **today**: what's on your plate, what's overdue, and what's coming up this week — organized around Focus Areas instead of flat todo lists.

## What changed from TaskFlow

- **New information architecture.** Three views instead of an open-ended list of lists:
  - **Today** — the home screen. A sunrise-arc progress indicator, an overdue callout, and today's tasks grouped into Morning / Afternoon / Evening / Anytime.
  - **Week** — a 7-day planner grid for looking ahead and dropping tasks onto specific days.
  - **Focus Areas** — projects/goals (replacing "lists") that tasks can optionally belong to, each with its own notes and progress.
- **Firebase is now fully optional.** The app runs immediately with zero configuration, storing everything in `localStorage`. If you add Firebase credentials (see below), sign-in and cross-device sync switch on automatically — the UI adapts either way (see `src/firebase.js`).
- **New visual identity.** A warm "twilight → dawn" palette (deep indigo ink, coral/amber accent, teal/gold/rose for focus areas), paired display/body/mono type (Fraunces + Plus Jakarta Sans + JetBrains Mono), and a signature sunrise-arc progress component. Full light/dark mode, tuned for contrast in both.
- **Simplified data model.** One flat `tasks` array with `date`, `timeBlock`, `priority`, and an optional `areaId`, instead of nested per-list `todos`/`archivedTodos`. This is what makes the Today/Week views possible.
- **Dropped for this rebuild:** ads/AdSense, the multi-list sidebar, todo recurrence, and the archive drawer. Recurrence and archive are natural follow-ups if you want them back — the data model has room for both.

## Getting started

```bash
npm install
npm run dev
```

The app works immediately — no `.env` needed. Everything is saved to `localStorage` on your device.

### Optional: cloud sync

Copy `.env.example` to `.env` and fill in your Firebase project's web config to enable Google sign-in + cross-device sync:

```bash
cp .env.example .env
```

Without a `.env`, the sign-in button in the account menu simply explains that sync isn't configured — nothing breaks.

## Project structure

```
src/
  App.jsx                 — view routing + top-level state
  firebase.js              — guarded Firebase setup (no-ops without a config)
  context/                 — Theme, Auth, Toast providers
  hooks/useFocusData.js    — local-first data layer (areas + tasks), optional Firestore sync
  components/
    TodayView, WeekView, FocusAreasView, FocusAreaDetail  — the three main screens
    TaskComposer, AreaComposer                            — create/edit modals
    ProgressArc                                           — signature sunrise progress indicator
    Sidebar, MobileChrome                                 — desktop / mobile navigation
  utils/date.js, areaColors.js, id.js
```

## Notes for going further

- **PWA icons** in `public/` are still the old TaskFlow icon files (so the app installs and works as a PWA out of the box) — swap in new artwork when you have it, and update `vite.config.js` / `site.webmanifest` if you rename the files.
- **Tests**: the previous test suite targeted the old list-based data model and has been removed rather than left broken. `vitest`/testing-library aren't wired into `package.json` yet — add them back if you want coverage on `useFocusData`.
- **Drag-and-drop reordering** isn't implemented yet (tasks reorder by edit-and-save for now). `reorderWithin` exists in `useFocusData.js` as a hook for wiring up `@dnd-kit` or similar later.
