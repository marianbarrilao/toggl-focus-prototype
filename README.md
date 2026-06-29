# Toggl Focus — Week View Prototype

A UI/UX prototype of a redesigned weekly calendar/timer view for **Toggl Focus**, built to match the real product's layout and explore three trust-building ideas: reliable project filtering, a clear live-vs-retroactive-vs-planned visual language, and honest treatment of untracked time.

This is a **frontend-only prototype** — no backend, no auth, no real data persistence. Everything lives in local React state and resets on page reload.

## Live demo

**[View the live prototype →](https://marian-buenro.github.io/toggl-focus-prototype/)**

(If the link 404s right after this repo was created, GitHub Pages can take a minute or two to finish its first deploy — refresh shortly after.)

## Run it locally

No build step, no `npm install`, no server required.

1. Download or clone this repo.
2. Open `index.html` directly in any modern browser (double-click it, or `open index.html` on macOS).

That's it. React, Babel, and Tailwind are all loaded from public CDNs inside the HTML file, so it runs as a single static page.

```bash
git clone https://github.com/marian-buenro/toggl-focus-prototype.git
cd toggl-focus-prototype
open index.html   # macOS — or just double-click the file
```

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
  - Diagonal-hatched cells = **outside working hours** (not clickable — you're just not working then).
- **Drag interactions** on any logged/planned entry: drag the body to move it, drag the bottom edge to resize its duration — both snap to 5-minute increments.
- **One unified modal** for logging, planning, and editing entries — single editable duration field (slider + type-to-edit text, no separate "manual" tab), an editable start time, and recurring-task autocomplete suggestions.
- **Reports** — per-project breakdown, a by-day bar chart, a project filter, "Export as PDF" (via the browser's print dialog), and a demo "Email report" flow.
- **Working week navigation** — previous/next week, "Today", all functional. A fixed mock "now" (Jun 30, 2026, noon) is baked in so the past/future/unavailable states are all visible without needing to interact first.
- **Non-functional UI is marked, not hidden** — controls that exist in the real product but aren't wired up here (search input, `@ Task`, `# Tags`, `$`, the play/start-timer button, alternate view icons) are visually dimmed with a tooltip explaining they're inert in this prototype, instead of silently doing nothing.

## Tech

- React 18 (UMD build, no bundler)
- Babel Standalone (in-browser JSX transform)
- Tailwind CSS (CDN build)
- All in one self-contained `index.html` — no `package.json`, no build tooling

## Files

| File | Description |
|---|---|
| `index.html` | The main prototype — week view, the focus of this project. |
| `early-exploration-daily-view.html` | An earlier single-day calendar concept explored before settling on the week view. Kept for reference; superseded by `index.html`. |

## Known limitations (by design)

- No backend — refreshing the page resets all data to the seeded mock state.
- "Send email" in Reports is a UI demo only; no email is actually sent.
- Desktop-only layout; not responsive for mobile.
- Only the 5-day week view is implemented (the "5 Days" selector in the date nav opens but doesn't switch to other ranges).
