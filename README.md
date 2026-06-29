# Toggl Focus — Week View Prototype

A UI/UX prototype of a redesigned weekly calendar/timer view for **Toggl Focus**, built to match the real product's layout and explore three trust-building ideas: reliable project filtering, a clear live-vs-retroactive-vs-planned visual language, and honest treatment of untracked time.

This is a **frontend-only prototype** — no backend, no auth, no real data persistence. Everything lives in local React state and resets on page reload.

## Live demo

**[View the live prototype →](https://marianbarrilao.github.io/toggl-focus-prototype/)**

(If the link 404s right after this repo was pushed, GitHub Pages can take a minute or two to finish its first deploy — refresh shortly after.)

## Run it locally

This is a real React app built with [Vite](https://vitejs.dev/) — it needs Node.js (18+) and a quick install.

```bash
git clone https://github.com/marianbarrilao/toggl-focus-prototype.git
cd toggl-focus-prototype
npm install
npm run dev      # starts a local dev server with hot reload
```

To view the production build locally instead of the dev server:

```bash
npm run build
npm run preview  # serves the built docs/ folder locally
```

> Don't open `docs/index.html` directly via `file://` — browsers block ES module imports from the local filesystem. Use `npm run dev` or `npm run preview`, or just visit the live link above.

## What's in the prototype

- **Real-product layout** — top bar, date navigation, "Logged" summary bar, and a 5-day (Mon–Fri) week grid, styled to match Toggl Focus's actual UI.
- **Project filtering that's actually trustworthy** — selecting a project fades out everything else (~200ms) and shows a live entry count; no stale entries linger.
- **Three distinct time states**, each with its own visual language:
  - **Live-tracked** — solid filled block.
  - **Retroactively logged** — light tinted fill + dashed border + pencil icon, with a "Logged manually · [time]" tooltip.
  - **Planned ahead** — same tinted/dashed treatment + calendar icon, for tasks scheduled in the future.
- **Untracked vs. open vs. unavailable, clearly differentiated**:
  - Amber dashed cells = **untracked** time in the past (click to log retroactively).
  - Plain "+" cells = **open** future slots (click to plan ahead).
  - Diagonal-hatched cells = **outside working hours** (not interactive — you're just not working then).
- **Drag interactions** on any logged/planned entry: drag the body to move it, drag the bottom edge to resize its duration — both snap to 5-minute increments. Each entry is also keyboard-focusable; pressing Enter/Space opens it for editing as a non-mouse alternative.
- **One unified modal** for logging, planning, and editing entries — single editable duration field (slider + type-to-edit text, no separate "manual" tab), an editable start time, and recurring-task autocomplete suggestions.
- **Reports** — per-project breakdown, a by-day bar chart, a project filter, "Export as PDF" (via the browser's print dialog), and a demo "Email report" flow.
- **Working week navigation** — previous/next week, "Today", all functional. A fixed mock "now" (Jun 30, 2026, noon) is baked in so the past/future/unavailable states are all visible without needing to interact first.
- **Non-functional UI is marked, not hidden** — controls that exist in the real product but aren't wired up here (search input, `@ Task`, `# Tags`, `$`, the play/start-timer button, alternate view icons) are visually dimmed with a tooltip explaining they're inert in this prototype, instead of silently doing nothing.

## Accessibility & SEO

- Semantic landmarks (`header`, `nav`, `main`, `footer`) and a meaningful page `<title>`/`<meta description>`/Open Graph tags for SEO and link previews.
- All icon-only buttons have `aria-label`s; decorative icons are `aria-hidden`.
- Time entries, untracked slots, and open slots are real `<button>`/keyboard-focusable elements with descriptive accessible names (e.g. "1h untracked from 9:00 AM to 10:00 AM. Click to log."), not just clickable `<div>`s.
- Both modals use `role="dialog"`/`aria-modal`, close on <kbd>Escape</kbd>, and auto-focus their first field.
- The "Logged" bar is a proper `role="progressbar"`; the by-day report chart has a text equivalent for screen readers.
- Known gap: dragging/resizing itself is mouse-only — the equivalent action (open the entry, edit duration/start time as text) is fully keyboard-reachable instead.

## Tech

- React 18 + Vite (real build pipeline — no CDN scripts, no in-browser Babel)
- Tailwind CSS, compiled at build time via PostCSS (not the CDN build)
- Styles live in their own file (`src/index.css`), separate from markup/JSX
- Plain JS state, no backend, no router (single screen)

## Project structure

```
index.html              Vite entry point + SEO/meta tags
src/
  main.jsx               Mounts <App />
  App.jsx                 Top bar, date nav, week grid, day columns, entries
  EntryForm.jsx            Log/plan/edit modal, duration & time fields
  ReportsModal.jsx         Reports modal (charts, project filter, PDF/email)
  icons.jsx                Shared icon components, Tooltip, useOutsideClick
  constants.js             Seed data, date/time helpers, gap computation
  index.css                Tailwind directives + custom CSS (keyframes, print styles)
legacy/
  early-exploration-daily-view.html   Earlier single-day concept, superseded by this week view
docs/                     Production build output, served by GitHub Pages
```

## Known limitations (by design)

- No backend — refreshing the page resets all data to the seeded mock state.
- "Send email" in Reports is a UI demo only; no email is actually sent.
- Desktop-only layout; not responsive for mobile.
- Only the 5-day week view is implemented (the "5 Days" selector in the date nav opens but doesn't switch to other ranges).
