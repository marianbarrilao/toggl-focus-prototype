# Toggl Focus — Week View Prototype

A UI/UX prototype of a redesigned weekly calendar/timer view for **Toggl Focus**, matching the real product's layout while exploring three trust-building ideas: reliable project filtering, a clear live/retroactive/planned visual language, and honest treatment of untracked time.

**Frontend-only** — no backend, no auth, no persistence. Everything lives in local React state and resets on reload.

## Live demo

**[View the live prototype →](https://marianbarrilao.github.io/toggl-focus-prototype/)**

It loads straight into a populated current week, so every state (live-tracked, retroactive, planned, untracked, open, unavailable) is visible immediately — no setup needed.

## Run it locally

Zero-build — plain HTML, CSS, and JS, React via CDN. No `npm install`.

```bash
git clone https://github.com/marianbarrilao/toggl-focus-prototype.git
cd toggl-focus-prototype
python3 -m http.server 4500
```

Then open `http://localhost:4500/`.

> Serve over `http://`, not `file://` — browsers block `app.js` from loading cross-origin off the local filesystem.

## What's in the prototype

- **Real-product layout** — top bar, date nav, "Logged" bar, 5-day week grid, styled to match Toggl Focus.
- **Trustworthy project filtering** — selecting a project fades out everything else (~200ms) with a live entry count; nothing stale lingers.
- **Three time states** — live-tracked (solid block), retroactively logged (tinted + dashed + pencil icon), planned ahead (tinted + dashed + calendar icon).
- **Untracked vs. open vs. unavailable** — amber dashed = untracked past time (click to log), plain "+" = open future slot (click to plan), diagonal-hatched = outside working hours (not interactive).
- **Drag to move, drag the edge to resize**, both snapping to 5 minutes; every entry is also keyboard-focusable (Enter/Space to edit).
- **One modal** for logging, planning, and editing — editable duration (slider + type-to-edit text), editable start time, recurring-task autocomplete.
- **Reports** — per-project breakdown, by-day chart, project filter, PDF export, demo email flow.
- **Working week navigation** — prev/next/Today, all functional. A fixed mock "now" (Jun 30, 2026, noon) keeps every state visible without interacting first.
- **Non-functional UI is marked, not hidden** — inert controls (`@ Task`, `# Tags`, `$`, play button, etc.) are dimmed with a tooltip explaining why, instead of silently doing nothing.

## Accessibility & SEO

- Visually-hidden `<h1>` + semantic landmarks (`header`/`nav`/`main`/`footer`).
- `<noscript>` fallback, meta description, Open Graph/Twitter tags, canonical URL.
- Secondary text uses `stone-500` (not `stone-400`) to clear WCAG AA contrast.
- All icon-only buttons have `aria-label`s; decorative icons are `aria-hidden`.
- Time entries and gap cells are real keyboard-focusable buttons with descriptive accessible names, not bare `<div>`s.
- Modals use `role="dialog"`/`aria-modal`, close on Escape, auto-focus their first field.
- "Logged" bar is a `role="progressbar"`; the by-day chart has a text equivalent.
- Known gap: drag/resize is mouse-only — editing duration/start time as text is the keyboard equivalent.

## Tech

- React 18 (UMD) + in-browser Babel via `<script>` tags — no build step.
- Tailwind CSS via CDN.
- All custom CSS lives in `styles.css`, separate from markup and JS.

## Project structure

```
index.html     Markup, CDN <script> tags, SEO/meta tags
app.js         All component logic
styles.css     All custom CSS and CSS custom properties
```

JS only supplies *data* to CSS (a color, a position, a percentage) via CSS custom properties (`--accent`, `--top`, `--pct`); every visual rule lives in `styles.css`.

## Known limitations (by design)

- No backend — refreshing resets all data to the seeded mock state.
- "Send email" in Reports is a UI demo only; no email is actually sent.
- Desktop-only layout; not responsive.
- Only the 5-day week view is implemented (the "5 Days" selector opens but doesn't switch ranges).
- Zero-build by design — trades a smaller, optimized production bundle for simplicity.
