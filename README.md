# Toggl Focus — Week View Prototype

A UI/UX prototype of a redesigned weekly calendar/timer view for **Toggl Focus**, built to match the real product's layout and explore three trust-building ideas: reliable project filtering, a clear live-vs-retroactive-vs-planned visual language, and honest treatment of untracked time.

This is a **frontend-only prototype** — no backend, no auth, no real data persistence. Everything lives in local React state and resets on page reload.

## Live demo

**[View the live prototype →](https://marianbarrilao.github.io/toggl-focus-prototype/)**

No login, no setup — it loads straight into a populated current week so every state (live-tracked, retroactively logged, planned, untracked, open, unavailable) is visible immediately.

## Demo script

A suggested order for walking someone through it live, ~3–4 minutes:

1. **Orient on the grid.** Point out it's Mon 29–Fri 3, "today" is pinned to Tue the 30th at noon — that's why Monday/Tuesday-morning look "done" and the rest of the week looks open.
2. **Filter by project.** Click the `Project` pill in the top bar, pick one — everything else fades out (~200ms) and the pill shows a live count. Make the point: nothing stale lingers, the count always matches what's on screen.
3. **Point out the three time states** directly on the grid: a solid block (live-tracked), a tinted/dashed block with a pencil (logged after the fact), and a tinted/dashed block with a calendar icon (planned ahead, in the future).
4. **Click an amber dashed cell** (untracked, in the past) → log time retroactively. Then click a plain "+" cell (open, in the future) → same modal, framed as "Add task" instead. Same component, different intent.
5. **Drag an entry** to a new time, then drag its bottom edge to resize it. Then **Tab to an entry and press Enter** instead — same edit modal, no mouse required.
6. **Open Reports** from the summary bar — per-project breakdown, the by-day chart, filter by project, then "Export as PDF" (real browser print dialog) and "Email" (clearly labeled as a demo, no email actually sent).
7. **Close with the honest bits**: hover the dimmed `@ Task` / `# Tags` / `$` / play button in the top bar — each says outright it's not wired up, instead of silently doing nothing.

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

- One visually-hidden `<h1>` plus semantic landmarks (`header`, `nav`, `main`, `footer`) so the page has a proper heading/landmark structure for both SEO crawlers and screen reader users — `<h2>Reports</h2>` inside the reports modal is the only other heading, kept at the correct level.
- A `<noscript>` fallback in `index.html` for the (rare, but real) case of JS being disabled.
- A meaningful page `<title>`/`<meta description>`/Open Graph/Twitter tags/canonical URL for SEO and link previews.
- Secondary text uses `stone-500`, not `stone-400` — the lighter shade fails WCAG AA contrast (~2.5:1) against a white background; `stone-500` clears 4.5:1.
- All icon-only buttons have `aria-label`s; decorative icons are `aria-hidden`.
- Time entries, untracked slots, and open slots are real `<button>`/keyboard-focusable elements with descriptive accessible names (e.g. "1h untracked from 9:00 AM to 10:00 AM. Click to log."), not just clickable `<div>`s.
- Both modals use `role="dialog"`/`aria-modal`, close on <kbd>Escape</kbd>, and auto-focus their first field.
- The "Logged" bar is a proper `role="progressbar"`; the by-day report chart has a text equivalent for screen readers.
- Non-functional controls use `aria-disabled` + `tabIndex={-1}` consistently (not the native `disabled` attribute), since real `disabled` suppresses hover tooltips in some browsers — this way the "why is this inert" explanation stays reachable.
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
styles.css      All custom CSS and CSS custom properties — separate from HTML and JS
```

JS only ever supplies *data* to CSS (a project's color, a computed pixel position, a percentage) via CSS custom properties (e.g. `--accent`, `--top`, `--pct`); every actual visual rule — color, border, background — lives in `styles.css`.

## Known limitations (by design)

- No backend — refreshing the page resets all data to the seeded mock state.
- "Send email" in Reports is a UI demo only; no email is actually sent.
- Desktop-only layout; not responsive for mobile.
- Only the 5-day week view is implemented (the "5 Days" selector in the date nav opens but doesn't switch to other ranges).
- This is a zero-build prototype by design (easy to read, no tooling to install) — it trades a smaller, optimized production bundle for that simplicity.
