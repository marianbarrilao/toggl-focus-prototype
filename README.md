# Toggl Focus — Week View Prototype

A UI/UX prototype of a redesigned weekly calendar/timer view for **Toggl Focus**, built to match the real product's layout and explore three trust-building ideas: reliable project filtering, a clear live-vs-retroactive-vs-planned visual language, and honest treatment of untracked time.

This is a **frontend-only prototype** — no backend, no auth, no real data persistence. Everything lives in local React state and resets on page reload.

## Run it locally

This is a **zero-build** project — plain HTML, CSS, and JS, with React loaded from a CDN. No `npm install`, no bundler.

```bash
git clone https://github.com/marianbarrilao/toggl-focus-prototype.git
cd toggl-focus-prototype
python3 -m http.server 4500   # any static server works
```

Then open `http://localhost:4500/` in your browser.

> Don't open `index.html` directly via `file://` — the browser blocks the `app.js` script from being fetched cross-origin from a local file. Always serve it over `http://` (a one-line static server, or any "Live Server"-style editor extension).

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
- Verified with a real browser pass: keyboard-only entry editing (Tab → Enter → edit → Escape to close) works end-to-end.
- Known gap: dragging/resizing itself is mouse-only — the equivalent action (open the entry, edit duration/start time as text) is fully keyboard-reachable instead.

## Tech

- React 18 (UMD build) + in-browser Babel — loaded via `<script>` tags in `index.html`, no build step
- Tailwind CSS via the CDN script
- All custom CSS lives in its own file (`styles.css`), separate from markup and JS
- Plain JS state, no backend, no router (single screen)

## Project structure

```
index.html     Markup, CDN <script> tags, SEO/meta tags
app.js          All component logic (loaded as a separate <script type="text/babel" src="app.js">)
styles.css      Custom CSS (keyframes, print rules) — separate from HTML and JS
legacy/
  early-exploration-daily-view.html   Earlier single-day concept, superseded by this week view
```

## Known limitations (by design)

- No backend — refreshing the page resets all data to the seeded mock state.
- "Send email" in Reports is a UI demo only; no email is actually sent.
- Desktop-only layout; not responsive for mobile.
- Only the 5-day week view is implemented (the "5 Days" selector in the date nav opens but doesn't switch to other ranges).
- This is a zero-build prototype by design (easy to read, no tooling to install) — it trades a smaller, optimized production bundle for that simplicity.
