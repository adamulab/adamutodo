# Dawn — Plan Tomorrow Tonight

A calm daily planner built around the spec's central idea: **you plan tomorrow tonight**, then execute it, then reflect and let unfinished work carry itself forward. Local-first, fully working, zero external accounts required to start.

## Scope of this build

The source spec describes a large, multi-quarter product — native iOS/Android apps, calendar sync, SMS/WhatsApp reminders, weather and traffic APIs, a real AI assistant, a voice assistant, and a gamification backend. None of that is buildable as a genuine, working feature from this environment (it needs paid third-party API keys, app store builds, and backend infrastructure), so rather than fake it, here's exactly what's real and what's deferred:

### Built (fully working, no config needed)
- **Plan Tomorrow** — add tasks for tomorrow with category, priority, and time block; reorder within a block
- **Today** — execute today's plan, checkbox + a Pomodoro focus timer per task, completed sessions logged automatically
- **Sleep Planner** — rule-based bedtime suggestion (not AI) computed backward from tomorrow's earliest scheduled block, with an adjustable sleep-hours target
- **Daily Reflection** — mood, energy, an auto-computed productivity score, "what wasn't completed"
- **Smart Carry-Forward** — move all / move selected / discard unfinished tasks into tomorrow, run from the Reflect screen
- **Habits** — daily habit tracking, 7-day grid, streak counter
- **Notes & Shopping** — quick notes, categorized shopping checklist
- **Voice quick-add** — dictate a task title using the browser's native Speech Recognition API (Chrome/Edge/Safari); no API key, no backend, hidden automatically where unsupported
- **Insights** — weekly completion-rate chart, habit consistency, streaks, average productivity score, weekly focus minutes, and a one-click CSV export of every task
- **Light/dark mode**, optional Firebase sign-in + cross-device sync (same pattern as before: works fully offline without it)

### Deliberately deferred — needs infrastructure this environment doesn't have
| Feature | Why it's deferred | Where it plugs in |
|---|---|---|
| Google/Outlook/Apple Calendar sync | Needs OAuth app registration + calendar APIs | `src/hooks/usePlannerData.js` — tasks already have a `date`; an import step could map calendar events to tasks |
| Weather-aware planning | Needs an OpenWeather (or similar) API key | Could sit as a card in `TomorrowView.jsx`, next to `SleepPlanner` |
| Traffic/travel estimates | Needs Google Maps API key + billing | Same |
| SMS / WhatsApp / push reminders | Needs a messaging provider (Twilio, FCM) + a backend to schedule sends | The PWA install (`vite-plugin-pwa`) already gives you browser push as the cheapest first step |
| Real AI suggestions (task ordering, time estimates, conflict detection, natural-language planning) | Needs an LLM API key and a backend to call it safely (a key can't live in client code) | `usePlannerData.js`'s task shape is already flat and simple to feed to a model. The Sleep Planner and voice quick-add use plain rules/browser APIs instead — genuinely working today, just not "AI" |
| Native iOS/Android apps | Needs Xcode/Android Studio builds and app store accounts | This is a PWA today — installable, but not a native binary |
| Gamification (XP, badges, weekly challenges) | Needs a backend to prevent client-side tampering with scores | `reflections` already stores a daily score as a starting point |
| Cloud database (MongoDB) / JWT backend | This build uses Firestore (optional) instead, which needs no backend code to run | — |

If you want to tackle any of these next, the data model and file layout are built to make that additive rather than a rewrite.

## Getting started

```bash
npm install
npm run dev
```

Works immediately — everything saves to `localStorage`. Optional cloud sync: copy `.env.example` to `.env` and fill in a Firebase web config.

## Project structure

```
src/
  App.jsx                    — view routing + top-level state
  hooks/
    usePlannerData.js        — tasks, habits, notes, shopping, reflections, focus sessions (local-first, optional Firestore sync)
    useVoiceInput.js         — thin wrapper around the browser's native SpeechRecognition API
  components/
    TodayView, TomorrowView  — the core plan/execute loop
    SleepPlanner              — rule-based bedtime suggestion, shown in TomorrowView
    ReflectView                — mood/energy/score + smart carry-forward
    HabitsView                — streaks
    NotesShoppingView         — notes + shopping list, tabbed
    InsightsView               — weekly dashboard + CSV export
    FocusTimer                 — Pomodoro, logs completed sessions
    TaskComposer                — add/edit task modal, includes voice quick-add
  utils/date.js, categories.js, productivity.js, sleep.js, csv.js
```
