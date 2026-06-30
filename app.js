const { useState, useMemo, useRef, useEffect } = React;

/* ============ Constants ============ */
const GRID_START = 7;
const GRID_END = 20;
const WORK_START = 8;
const WORK_END = 19;
const PX_PER_HOUR = 56;

const PROJECTS = [
  { id: "acme", name: "Acme Corp", color: "#5B4FE5" },
  { id: "personal", name: "Personal", color: "#1E9E8A" },
  { id: "side", name: "Side Project", color: "#D98A2B" },
];
const projectById = (id) => PROJECTS.find((p) => p.id === id);

const RECENT_TASKS = [
  { title: "Design review", projectId: "acme" },
  { title: "1:1 with mentor", projectId: "personal" },
  { title: "Sprint planning", projectId: "acme" },
  { title: "Stakeholder sync", projectId: "acme" },
  { title: "Bug fixes", projectId: "side" },
  { title: "Inbox triage", projectId: "personal" },
];

const BASE_MONDAY = new Date(2026, 5, 29); // Jun 29 2026
const NOW = new Date(2026, 5, 30, 12, 0); // Jun 30 2026, noon — "today" is the 30th, afternoon is the future

const toMinutes = (h, m = 0) => h * 60 + m;

const fmtHourLabel = (h) => {
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:00 ${ampm}`;
};

const fmtTimeOfDay = (mins) => {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const fmtDuration = (mins) => {
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

function parseDurationInput(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  if (!s) return null;
  let total = 0,
    matched = false;
  const hMatch = s.match(/(\d+(?:\.\d+)?)\s*h/);
  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*m/);
  if (hMatch) {
    total += parseFloat(hMatch[1]) * 60;
    matched = true;
  }
  if (mMatch) {
    total += parseFloat(mMatch[1]);
    matched = true;
  }
  if (!matched) {
    const num = parseFloat(s);
    if (!isNaN(num)) {
      total = num;
      matched = true;
    }
  }
  return matched ? Math.round(total) : null;
}

function parseTimeInput(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3];
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  if (!ampm && h >= 1 && h <= 7) h += 12;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = d - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}
function getWeekDays(weekOffset) {
  const monday = addDays(BASE_MONDAY, weekOffset * 7);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return labels.map((label, i) => {
    const d = addDays(monday, i);
    return { label, dateObj: d, dateStr: isoDate(d), dateNum: d.getDate() };
  });
}
function formatWeekRange(days) {
  const first = days[0].dateObj,
    last = days[4].dateObj;
  const firstMonth = first.toLocaleString("default", { month: "short" });
  const lastMonth = last.toLocaleString("default", { month: "short" });
  const year = last.getFullYear();
  const weekNum = getISOWeek(first);
  const range =
    firstMonth === lastMonth
      ? `${firstMonth} ${first.getDate()} – ${last.getDate()} ${year}`
      : `${firstMonth} ${first.getDate()} – ${lastMonth} ${last.getDate()} ${year}`;
  return `${range} · W${weekNum}`;
}

/* ============ Seed data (current week only) ============ */
const seedEntries = () => [
  { id: "e1", date: "2026-06-29", projectId: "acme", start: toMinutes(9, 0), end: toMinutes(10, 0), title: "Sprint planning", type: "live", loggedAt: null },
  { id: "e2", date: "2026-06-29", projectId: "personal", start: toMinutes(13, 0), end: toMinutes(13, 30), title: "Lunch errands", type: "manual", loggedAt: "12:50 PM" },
  { id: "e3", date: "2026-06-29", projectId: "acme", start: toMinutes(15, 0), end: toMinutes(17, 0), title: "Client deck review", type: "live", loggedAt: null },

  { id: "e4", date: "2026-06-30", projectId: "side", start: toMinutes(10, 0), end: toMinutes(11, 30), title: "Landing page redesign", type: "live", loggedAt: null },
  { id: "e5", date: "2026-06-30", projectId: "acme", start: toMinutes(14, 0), end: toMinutes(14, 45), title: "Stakeholder sync", type: "planned", loggedAt: null },

  { id: "e6", date: "2026-07-01", projectId: "personal", start: toMinutes(9, 0), end: toMinutes(9, 30), title: "Inbox triage", type: "planned", loggedAt: null },
  { id: "e7", date: "2026-07-01", projectId: "side", start: toMinutes(11, 0), end: toMinutes(12, 0), title: "Bug fixes", type: "planned", loggedAt: null },

  { id: "e9", date: "2026-07-02", projectId: "acme", start: toMinutes(9, 30), end: toMinutes(11, 0), title: "Design review", type: "planned", loggedAt: null },
  { id: "e10", date: "2026-07-02", projectId: "side", start: toMinutes(15, 0), end: toMinutes(15, 30), title: "Dependency upgrade", type: "planned", loggedAt: null },

  { id: "e11", date: "2026-07-03", projectId: "personal", start: toMinutes(10, 0), end: toMinutes(10, 30), title: "1:1 with mentor", type: "planned", loggedAt: null },
  { id: "e12", date: "2026-07-03", projectId: "acme", start: toMinutes(13, 0), end: toMinutes(14, 0), title: "Retro + planning notes", type: "planned", loggedAt: null },
];

/* ============ Gap computation — split into past (untracked) vs future (open) ============ */
function minutesOfNowRelativeTo(dateObj) {
  const dStr = isoDate(dateObj),
    nowStr = isoDate(NOW);
  if (dStr < nowStr) return Infinity;
  if (dStr > nowStr) return -Infinity;
  return NOW.getHours() * 60 + NOW.getMinutes();
}
function computeGapsForDate(dateEntries, dateObj) {
  const workStart = toMinutes(WORK_START),
    workEnd = toMinutes(WORK_END);
  const sorted = [...dateEntries].sort((a, b) => a.start - b.start);
  const rawGaps = [];
  let cursor = workStart;
  for (const e of sorted) {
    const s = Math.max(e.start, workStart),
      en = Math.min(e.end, workEnd);
    if (en <= workStart || s >= workEnd) continue;
    if (s > cursor) rawGaps.push({ start: cursor, end: s });
    cursor = Math.max(cursor, en);
  }
  if (cursor < workEnd) rawGaps.push({ start: cursor, end: workEnd });

  const nowMins = minutesOfNowRelativeTo(dateObj);
  const past = [],
    future = [];
  for (const g of rawGaps) {
    if (nowMins > g.start) {
      const end = Math.min(g.end, nowMins);
      if (end - g.start >= 10) past.push({ start: g.start, end });
    }
    if (nowMins < g.end) {
      const start = Math.max(g.start, nowMins);
      if (g.end - start >= 10) future.push({ start, end: g.end });
    }
  }
  return { past, future };
}

const topPx = (mins) => ((mins - toMinutes(GRID_START)) / 60) * PX_PER_HOUR;
const heightPx = (s, e) => Math.max(((e - s) / 60) * PX_PER_HOUR, 22);
// CSS custom properties for a grid-positioned block — keeps top/height math in JS (it's runtime data),
// while every visual rule (color, border, background) lives in styles.css.
const gridVars = (start, end) => ({ "--top": `${topPx(start)}px`, "--height": `${heightPx(start, end)}px` });

/* ============ Outside-click hook ============ */
function useOutsideClick(ref, onOutside, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [enabled, onOutside]);
}

/* ============ Tooltip ============ */
function Tooltip({ content, children, width = "w-56" }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className={`absolute z-40 ${width} left-1/2 -translate-x-1/2 -top-2 -translate-y-full rounded-lg bg-stone-900 text-white text-[11px] px-2.5 py-2 shadow-xl leading-snug pointer-events-none`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

/* ============ Icons (all default to currentColor — callers set color via a CSS class/var, not a prop) ============ */
function ClockIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function PencilIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function CalendarPlusIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 16h6M12 13v6" />
    </svg>
  );
}
function PlusIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6h14Z" />
    </svg>
  );
}
function ChevronLeft({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function ChevronRight({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function CalendarIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function FolderIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}
function ChevronDown({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function GridGlyph({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function ListGlyph({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function PanelGlyph({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </svg>
  );
}
function GearGlyph({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}
function SidebarGlyph({ className }) {
  return (
    <svg aria-hidden="true" className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  );
}
function IconBtn({ children, active, title }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-disabled={!active}
      tabIndex={active ? 0 : -1}
      className={"w-7 h-7 rounded-md flex items-center justify-center text-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400 " + (active ? "bg-stone-100" : "opacity-40 cursor-not-allowed")}
    >
      {children}
    </button>
  );
}

/* ============ Entry block ============ */
function EntryBlock({ entry, fading, draggable, dimmed, isGhost, justFilled, onStartDrag, onStartResize, onActivate }) {
  const project = projectById(entry.projectId);
  const isLive = entry.type === "live";
  const isPlanned = entry.type === "planned";
  const duration = entry.end - entry.start;

  const Icon = isLive ? ClockIcon : isPlanned ? CalendarPlusIcon : PencilIcon;
  const statusLine = isLive
    ? "Tracked live"
    : isPlanned
      ? `Planned for ${fmtTimeOfDay(entry.start)}`
      : `Logged manually · ${entry.loggedAt}`;
  const a11yLabel = `${entry.title}, ${project.name}, ${fmtDuration(duration)}, ${statusLine}${draggable ? ". Press Enter to edit." : ""}`;

  const body = (
    <div className="relative h-full">
      <div className={"text-[11px] font-medium truncate leading-tight pr-3 " + (isLive ? "text-white" : "entry-text-accent")}>{entry.title}</div>
      <div className={"text-[10px] leading-tight " + (isLive ? "text-white/75" : "entry-time-accent")}>{fmtTimeOfDay(entry.start)}</div>
      <span className={"absolute top-1 right-1 " + (isLive ? "text-white/80" : "entry-text-accent")}>
        <Icon />
      </span>
    </div>
  );

  return (
    <div
      role={draggable ? "button" : undefined}
      tabIndex={draggable ? 0 : undefined}
      aria-label={draggable ? a11yLabel : undefined}
      onKeyDown={
        draggable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate(entry);
              }
            }
          : undefined
      }
      className={
        "grid-block entry-block rounded-md px-2 py-1 overflow-hidden transition-all duration-200 ease-out " +
        (isLive ? "is-live" : "is-retro") +
        " " +
        (fading ? "opacity-0 scale-95" : "opacity-100 scale-100") +
        " " +
        (draggable ? "cursor-grab hover:ring-2 hover:ring-offset-1 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400" : "") +
        " " +
        (isGhost ? "pointer-events-none shadow-lg ring-2 z-50" : "") +
        " " +
        (justFilled ? "gap-filled-highlight" : "") +
        " " +
        (dimmed ? "is-dimmed" : "")
      }
      style={{ ...gridVars(entry.start, entry.end), "--accent": project.color }}
      onMouseDown={draggable ? (e) => onStartDrag(e, entry) : undefined}
    >
      {isGhost ? (
        body
      ) : (
        <Tooltip
          content={
            <div>
              <div className="font-semibold mb-0.5">{entry.title}</div>
              <div className="text-stone-300">
                {project.name} · {fmtDuration(duration)}
              </div>
              <div className="text-stone-300">{statusLine}</div>
              {draggable && <div className="text-stone-400 mt-1">Drag to move · drag edge to resize · click to edit</div>}
            </div>
          }
        >
          {body}
        </Tooltip>
      )}
      {draggable && !isGhost && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartResize(e, entry);
          }}
        >
          <div className="resize-grip w-6 h-0.5 rounded-full" />
        </div>
      )}
    </div>
  );
}

/* ============ Past untracked-gap cell ============ */
function UntrackedBlock({ gap, onClick }) {
  const duration = gap.end - gap.start;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${fmtDuration(duration)} untracked from ${fmtTimeOfDay(gap.start)} to ${fmtTimeOfDay(gap.end)}. Click to log.`}
      className="grid-block untracked-block rounded-md border border-dashed border-amber-300 hover:bg-amber-100/70 cursor-pointer transition-colors duration-150 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500"
      style={gridVars(gap.start, gap.end)}
    >
      <Tooltip content={<div>{fmtDuration(duration)} untracked — click to log</div>}>
        <div className="flex items-center justify-center h-full gap-1 text-amber-500">
          <ClockIcon />
          <span className="text-[11px] font-medium">—</span>
        </div>
      </Tooltip>
    </button>
  );
}

/* ============ Future open-slot cell (plan ahead) ============ */
function OpenSlotBlock({ gap, onClick }) {
  const duration = gap.end - gap.start;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${fmtDuration(duration)} open from ${fmtTimeOfDay(gap.start)} to ${fmtTimeOfDay(gap.end)}. Click to add a task.`}
      className="grid-block rounded-md border border-stone-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-300 cursor-pointer transition-colors duration-150 flex items-center justify-center group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400"
      style={gridVars(gap.start, gap.end)}
    >
      <Tooltip content={<div>{fmtDuration(duration)} open — add a task</div>}>
        <div className="flex items-center justify-center h-full text-stone-400 group-hover:text-indigo-400">
          <PlusIcon />
        </div>
      </Tooltip>
    </button>
  );
}

/* ============ Outside-working-hours block (busy / unavailable) ============ */
function UnavailableBlock({ start, end }) {
  return (
    <div aria-hidden="true" className="grid-block unavailable-block rounded-md" style={gridVars(start, end)}>
      <Tooltip content={<div>Outside working hours</div>}>
        <div className="h-full" />
      </Tooltip>
    </div>
  );
}

/* ============ Editable duration field (slider + inline editable text) ============ */
function DurationField({ duration, setDuration, maxDuration }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(fmtDuration(duration));

  useEffect(() => {
    if (!editing) setRaw(fmtDuration(duration));
  }, [duration, editing]);

  function commit() {
    const parsed = parseDurationInput(raw);
    if (parsed != null) {
      const clamped = Math.max(5, Math.min(maxDuration, Math.round(parsed / 5) * 5));
      setDuration(clamped);
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min="5"
        max={maxDuration}
        step="5"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        aria-label="Duration in minutes"
        className="flex-1"
      />
      <input
        type="text"
        aria-label="Duration, editable"
        value={editing ? raw : fmtDuration(duration)}
        onFocus={() => {
          setEditing(true);
          setRaw(fmtDuration(duration));
        }}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit();
            e.target.blur();
          }
        }}
        className="w-16 text-[13px] text-right font-medium text-stone-700 rounded-md border border-stone-200 px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}

function TimeField({ start, setStart }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(fmtTimeOfDay(start));

  useEffect(() => {
    if (!editing) setRaw(fmtTimeOfDay(start));
  }, [start, editing]);

  function commit() {
    const parsed = parseTimeInput(raw);
    if (parsed != null) {
      const clamped = Math.max(toMinutes(WORK_START), Math.min(parsed, toMinutes(WORK_END) - 5));
      setStart(Math.round(clamped / 5) * 5);
    }
    setEditing(false);
  }

  return (
    <input
      type="text"
      aria-label="Start time"
      value={editing ? raw : fmtTimeOfDay(start)}
      onFocus={() => {
        setEditing(true);
        setRaw(fmtTimeOfDay(start));
      }}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
          e.target.blur();
        }
      }}
      className="w-full text-[13px] rounded-md border border-stone-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
  );
}

/* ============ Entry form — centered modal for log / plan / edit ============ */
function EntryForm({ kind, defaultProjectId, initialStart, initialDuration, initialNote, onSubmit, onDelete, onClose }) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [start, setStart] = useState(initialStart);
  const [duration, setDuration] = useState(initialDuration);
  const [note, setNote] = useState(initialNote || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const project = projectById(projectId);
  const descriptionRef = useRef(null);
  const skipAutofocusSuggestRef = useRef(true);

  useEffect(() => {
    skipAutofocusSuggestRef.current = true;
    descriptionRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const maxDuration = Math.max(5, Math.min(480, toMinutes(WORK_END) - start));
  useEffect(() => {
    if (duration > maxDuration) setDuration(maxDuration);
  }, [start]);

  const filteredSuggestions = (note.trim() === ""
    ? RECENT_TASKS
    : RECENT_TASKS.filter((t) => t.title.toLowerCase().includes(note.trim().toLowerCase()))
  ).slice(0, 4);

  function selectSuggestion(item) {
    setNote(item.title);
    setProjectId(item.projectId);
    setShowSuggestions(false);
  }

  const verb = kind === "plan" ? "Add task" : "Log time";
  const title = kind === "edit" ? "Edit entry" : `${verb} · ${fmtTimeOfDay(start)}`;
  const ctaLabel = kind === "edit" ? "Save changes" : `${verb} · ${fmtDuration(duration)}`;

  return (
    <div className="fixed inset-0 bg-stone-900/30 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-2xl shadow-2xl w-[380px] p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">{title}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400">
            ✕
          </button>
        </div>

        <div className="flex items-start gap-2">
          <div className="relative flex-1">
            <input
              ref={descriptionRef}
              type="text"
              placeholder="Add a description"
              aria-label="Task description"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (skipAutofocusSuggestRef.current) {
                  skipAutofocusSuggestRef.current = false;
                  return;
                }
                setShowSuggestions(true);
              }}
              onBlur={() => setShowSuggestions(false)}
              className="w-full text-[14px] text-stone-700 placeholder-stone-400 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg bg-white shadow-xl border border-stone-200 py-1.5 px-1">
                <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide px-2 pb-1">Recurring</div>
                {filteredSuggestions.map((item, i) => {
                  const p = projectById(item.projectId);
                  return (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(item)}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-stone-50 flex items-center justify-between text-[13px]"
                    >
                      <span className="text-stone-700">{item.title}</span>
                      <span className="project-accent-text flex items-center gap-1 text-[11px]" style={{ "--accent": p.color }}>
                        <FolderIcon /> {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="project-pill project-accent-text flex items-center gap-1.5 px-2.5 py-2 rounded-full flex-shrink-0" style={{ "--accent": project.color }}>
            <FolderIcon />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label="Project"
              className="project-accent-text text-[13px] font-medium bg-transparent focus:outline-none appearance-none pr-1"
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Start time</div>
          <TimeField start={start} setStart={setStart} />
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Duration</div>
          <DurationField duration={duration} setDuration={setDuration} maxDuration={maxDuration} />
        </div>

        <div className="flex items-center justify-between pt-1">
          {kind === "edit" ? (
            <button type="button" onClick={onDelete} className="text-[12px] px-2 py-1.5 rounded-md text-red-500 hover:bg-red-50 flex items-center gap-1">
              <TrashIcon /> Remove
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={() => onSubmit({ projectId, start, duration, note })} className="bg-brand text-[13px] font-medium px-4 py-2 rounded-lg text-white">
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ Project filter dropdown (top bar) ============ */
function ProjectFilterPill({ activeProjectId, setActiveProjectId, counts, totalCount }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false), open);
  const active = activeProjectId ? projectById(activeProjectId) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={"flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium border transition-colors " + (active ? "project-pill project-accent-text border-transparent" : "border-stone-200 text-stone-500 hover:bg-stone-50")}
        style={active ? { "--accent": active.color } : {}}
      >
        <FolderIcon />
        {active ? active.name : "Project"}
        {active && (
          <span className="text-[11px] opacity-70">
            · {counts[active.id]} {counts[active.id] === 1 ? "entry" : "entries"}
          </span>
        )}
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg bg-white shadow-xl border border-stone-200 py-1">
          <button
            type="button"
            role="option"
            aria-selected={!activeProjectId}
            onClick={() => {
              setActiveProjectId(null);
              setOpen(false);
            }}
            className={"w-full text-left px-3 py-1.5 text-[13px] hover:bg-stone-50 flex items-center justify-between " + (!activeProjectId ? "font-semibold" : "")}
          >
            All projects
            <span className="text-stone-500 text-[11px]">{totalCount}</span>
          </button>
          {PROJECTS.map((p) => (
            <button
              type="button"
              role="option"
              aria-selected={activeProjectId === p.id}
              key={p.id}
              onClick={() => {
                setActiveProjectId(p.id);
                setOpen(false);
              }}
              className={"w-full text-left px-3 py-1.5 text-[13px] hover:bg-stone-50 flex items-center gap-2 justify-between " + (activeProjectId === p.id ? "font-semibold" : "")}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="project-accent-dot w-2 h-2 rounded-full" style={{ "--accent": p.color }} />
                {p.name}
              </span>
              <span className="text-stone-500 text-[11px]">{counts[p.id]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ Top bar ============ */
function TopBar({ activeProjectId, setActiveProjectId, counts, totalCount }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-200">
      <input
        type="text"
        placeholder="What are you working on?"
        aria-label="What are you working on"
        readOnly
        title="Not functional in this prototype"
        aria-disabled="true"
        className="flex-1 text-[14px] text-stone-700 placeholder-stone-400 focus:outline-none opacity-50 cursor-not-allowed"
      />
      <div className="flex items-center gap-1.5">
        <button type="button" aria-disabled="true" tabIndex={-1} title="Not functional in this prototype" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-medium text-stone-500 border border-stone-200 opacity-40 cursor-not-allowed">
          @ Task
        </button>
        <ProjectFilterPill activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} counts={counts} totalCount={totalCount} />
        <button type="button" aria-disabled="true" tabIndex={-1} title="Not functional in this prototype" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-medium text-stone-500 border border-stone-200 opacity-40 cursor-not-allowed">
          # Tags
        </button>
        <button type="button" aria-disabled="true" tabIndex={-1} title="Not functional in this prototype" aria-label="Billable, not functional in this prototype" className="flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-medium text-stone-500 border border-stone-200 opacity-40 cursor-not-allowed">
          $
        </button>
      </div>
      <div className="flex items-center gap-3 ml-4 pl-4 border-l border-stone-200">
        <span className="text-[15px] tabular-nums text-stone-700 font-medium" aria-label="Timer, 0 hours 0 minutes 0 seconds">
          0:00:00
        </span>
        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          title="Not functional in this prototype"
          aria-label="Start timer, not functional in this prototype"
          className="bg-brand w-9 h-9 rounded-full flex items-center justify-center shadow-sm opacity-40 cursor-not-allowed"
        >
          <PlayIcon />
        </button>
      </div>
    </div>
  );
}

/* ============ Date nav bar ============ */
function FiveDaysDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false), open);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-medium text-stone-600 border border-stone-200 bg-white hover:bg-stone-50"
      >
        5 Days
        <ChevronDown className="text-stone-500" />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-full mt-1 z-50 w-32 rounded-lg bg-white shadow-xl border border-stone-200 py-1">
          <button type="button" role="option" aria-selected="true" onClick={() => setOpen(false)} className="w-full text-left px-3 py-1.5 text-[13px] font-semibold flex items-center justify-between text-stone-700">
            5 Days <span className="text-brand">✓</span>
          </button>
        </div>
      )}
    </div>
  );
}

function DateNav({ weekLabel, onPrev, onNext, onToday, isCurrentWeek }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 border-b border-stone-200">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onPrev} aria-label="Previous week" className="p-1 rounded hover:bg-stone-100 text-stone-500">
          <ChevronLeft />
        </button>
        <button type="button" onClick={onNext} aria-label="Next week" className="p-1 rounded hover:bg-stone-100 text-stone-500">
          <ChevronRight />
        </button>
        <div className="flex items-center gap-1.5 text-[13px] text-stone-600 font-medium">
          <CalendarIcon className="text-stone-500" />
          {weekLabel}
        </div>
        <button
          type="button"
          onClick={onToday}
          className={"px-2.5 py-1 rounded-md text-[13px] font-medium border " + (isCurrentWeek ? "bg-brand text-white border-transparent" : "text-stone-600 border-stone-200 bg-white hover:bg-stone-50")}
        >
          Today
        </button>
        <FiveDaysDropdown />
      </div>
      <div className="flex items-center gap-0.5">
        <IconBtn active title="Calendar view">
          <CalendarIcon />
        </IconBtn>
        <IconBtn title="Not available in this prototype">
          <PanelGlyph />
        </IconBtn>
        <IconBtn title="Not available in this prototype">
          <ListGlyph />
        </IconBtn>
        <IconBtn title="Not available in this prototype">
          <GridGlyph />
        </IconBtn>
        <IconBtn title="Not available in this prototype">
          <GearGlyph />
        </IconBtn>
        <IconBtn title="Not available in this prototype">
          <SidebarGlyph />
        </IconBtn>
      </div>
    </div>
  );
}

/* ============ Logged summary bar ============ */
function LoggedSummaryBar({ totalLoggedMins, untrackedMins, onViewReports }) {
  const targetMins = toMinutes(40, 0);
  const pct = Math.min(100, (totalLoggedMins / targetMins) * 100);
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-stone-200">
      <span className="text-[13px] font-medium text-stone-500 flex-shrink-0">Logged</span>
      <div
        className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${fmtDuration(totalLoggedMins)} logged this week`}
      >
        <div className="bg-brand progress-fill h-full rounded-full transition-all duration-300" style={{ "--pct": `${pct}%` }} />
      </div>
      <span className="text-[13px] font-semibold text-stone-700 flex-shrink-0">{fmtDuration(totalLoggedMins)}</span>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-amber-700 flex-shrink-0">
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {fmtDuration(untrackedMins)} untracked this week
      </span>
      <button type="button" onClick={onViewReports} className="text-brand text-[13px] font-medium flex-shrink-0">
        View reports &gt;
      </button>
    </div>
  );
}

/* ============ Reports modal — project filter, by-day chart, PDF + email ============ */
function ReportsModal({ weekLabel, weekDays, weekEntries, totalUntrackedMins, onClose }) {
  const [filterProjectId, setFilterProjectId] = useState(null);
  const [showEmailBox, setShowEmailBox] = useState(false);
  const [email, setEmail] = useState("");
  const [sentConfirmation, setSentConfirmation] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filteredEntries = filterProjectId ? weekEntries.filter((e) => e.projectId === filterProjectId) : weekEntries;
  const totalLoggedMins = filteredEntries.reduce((s, e) => s + (e.end - e.start), 0);
  const perProject = (filterProjectId ? PROJECTS.filter((p) => p.id === filterProjectId) : PROJECTS).map((p) => ({
    ...p,
    mins: filteredEntries.filter((e) => e.projectId === p.id).reduce((s, e) => s + (e.end - e.start), 0),
  }));
  const maxMins = Math.max(1, ...perProject.map((p) => p.mins));
  const liveCount = filteredEntries.filter((e) => e.type === "live").length;
  const manualCount = filteredEntries.filter((e) => e.type === "manual").length;
  const plannedCount = filteredEntries.filter((e) => e.type === "planned").length;
  const filterLabel = filterProjectId ? projectById(filterProjectId).name : "All projects";

  const dailyTotals = weekDays.map((d) => ({
    ...d,
    mins: filteredEntries.filter((e) => e.date === d.dateStr).reduce((s, e) => s + (e.end - e.start), 0),
  }));
  const maxDailyMins = Math.max(1, ...dailyTotals.map((d) => d.mins));

  function handleSendEmail() {
    if (!email.trim()) return;
    setSentConfirmation(true);
    setShowEmailBox(false);
    setTimeout(() => setSentConfirmation(false), 2500);
  }

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        id="report-printable"
        role="dialog"
        aria-modal="true"
        aria-label="Reports"
        className="bg-white rounded-2xl shadow-2xl w-[440px] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Reports</h2>
            <p className="text-xs text-stone-500">
              {weekLabel} · {filterLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reports"
            className="no-print w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400"
          >
            ✕
          </button>
        </div>

        <div className="no-print flex items-center gap-2">
          <label htmlFor="report-project-filter" className="text-[12px] text-stone-500">
            Project
          </label>
          <select
            id="report-project-filter"
            value={filterProjectId || ""}
            onChange={(e) => setFilterProjectId(e.target.value || null)}
            className="text-[12px] rounded-md border border-stone-200 px-2 py-1 bg-stone-50 focus:outline-none"
          >
            <option value="">All projects</option>
            {PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-stone-800">{fmtDuration(totalLoggedMins)}</span>
          <span className="text-xs text-stone-500">logged this week</span>
        </div>

        {filteredEntries.length === 0 ? (
          <p className="text-[13px] text-stone-500">No entries logged this week yet.</p>
        ) : (
          <>
            <div className="bg-stone-50 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-stone-500 mb-2">By day</div>
              <div className="flex items-end gap-2 h-16" role="img" aria-label={dailyTotals.map((d) => `${d.label}: ${fmtDuration(d.mins)}`).join(", ")}>
                {dailyTotals.map((d) => (
                  <div key={d.dateStr} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                    <div
                      aria-hidden="true"
                      className={"report-day-bar w-full rounded-t-md " + (d.mins > 0 ? "" : "is-empty")}
                      style={{ "--pct": `${Math.max((d.mins / maxDailyMins) * 100, d.mins > 0 ? 8 : 2)}%`, "--accent": "var(--color-purple)" }}
                    />
                    <span className="text-[10px] text-stone-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3.5 space-y-2.5">
              <div className="text-[11px] font-medium text-stone-500">By project</div>
              {perProject.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="flex items-center gap-1.5 text-stone-600">
                      <span aria-hidden="true" className="project-accent-dot w-2 h-2 rounded-full" style={{ "--accent": p.color }} />
                      {p.name}
                    </span>
                    <span className="text-stone-500">{fmtDuration(p.mins)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white overflow-hidden">
                    <div aria-hidden="true" className="report-bar-fill h-full rounded-full" style={{ "--pct": `${(p.mins / maxMins) * 100}%`, "--accent": p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-[12px] text-stone-500 border-t border-stone-100 pt-3">
          <span>
            {liveCount} tracked live · {manualCount} logged manually · {plannedCount} planned
          </span>
        </div>
        <div className="text-[12px] text-stone-500">{fmtDuration(totalUntrackedMins)} untracked this week (all projects)</div>

        <div className="no-print flex items-center gap-2">
          <button type="button" onClick={() => window.print()} className="bg-brand flex-1 text-[13px] font-medium px-4 py-2 rounded-lg text-white">
            Export as PDF
          </button>
          <button
            type="button"
            onClick={() => setShowEmailBox((o) => !o)}
            aria-expanded={showEmailBox}
            className="px-3 py-2 rounded-lg text-[13px] font-medium border border-stone-200 text-stone-600 hover:bg-stone-50"
          >
            Email
          </button>
        </div>
        {showEmailBox && (
          <div className="no-print flex items-center gap-2">
            <label htmlFor="report-email" className="sr-only">
              Email address
            </label>
            <input
              id="report-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 text-[12px] rounded-md border border-stone-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button type="button" onClick={handleSendEmail} className="bg-brand text-[12px] px-3 py-1.5 rounded-md text-white">
              Send
            </button>
          </div>
        )}
        {sentConfirmation && (
          <div role="status" className="no-print text-[12px] text-emerald-600">
            Sent to {email} (demo only — no email actually sent)
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Day header ============ */
function DayHeader({ day, loggedMins }) {
  return (
    <div className="flex flex-col items-center py-2 border-b border-stone-200 border-l border-stone-100 first:border-l-0">
      <div className="text-[11px] text-stone-500 font-medium">{day.label}</div>
      <div className="text-[16px] font-semibold text-stone-700">{day.dateNum}</div>
      <div className="text-[10px] text-stone-500 mt-0.5">{loggedMins > 0 ? fmtDuration(loggedMins) : "-"} / -</div>
    </div>
  );
}

// Invisible clone of DayHeader's exact markup/classes, so the hour gutter's top offset always
// matches the real header height (a hardcoded pixel value drifted out of sync and misaligned the grid).
function DayHeaderSpacer() {
  return (
    <div aria-hidden="true" className="invisible flex flex-col items-center py-2 border-b border-stone-200">
      <div className="text-[11px] font-medium">Mon</div>
      <div className="text-[16px] font-semibold">00</div>
      <div className="text-[10px] mt-0.5">0h / -</div>
    </div>
  );
}

/* ============ Hour gutter ============ */
function HourGutter() {
  const hours = [];
  for (let h = GRID_START; h <= GRID_END; h++) hours.push(h);
  return (
    <div aria-hidden="true" className="relative w-16 flex-shrink-0" style={{ height: (GRID_END - GRID_START) * PX_PER_HOUR }}>
      {hours.map((h) => (
        <div key={h} className="top-pos right-2 -translate-y-1/2 text-[11px] text-stone-500" style={{ "--top": `${(h - GRID_START) * PX_PER_HOUR}px` }}>
          {fmtHourLabel(h)}
        </div>
      ))}
    </div>
  );
}

/* ============ Day column ============ */
function DayColumn({ day, visible, hidden, dragSourceId, ghostEntry, pastGaps, futureGaps, justFilledEntryId, registerRef, onOpenLog, onOpenPlan, onStartDrag, onStartResize, onActivate }) {
  const hours = [];
  for (let h = GRID_START; h <= GRID_END; h++) hours.push(h);
  const totalHeight = (GRID_END - GRID_START) * PX_PER_HOUR;
  const workTop = topPx(toMinutes(WORK_START));
  const workHeight = topPx(toMinutes(WORK_END)) - workTop;

  return (
    <div ref={registerRef} className="relative flex-1 border-l border-stone-100" style={{ height: totalHeight }}>
      {hours.map((h) => (
        <div key={h} aria-hidden="true" className="grid-line border-t border-stone-100" style={{ "--top": `${(h - GRID_START) * PX_PER_HOUR}px` }} />
      ))}
      <div aria-hidden="true" className="grid-band bg-stone-50/40" style={{ "--top": `${workTop}px`, "--height": `${workHeight}px` }} />

      <UnavailableBlock start={toMinutes(GRID_START)} end={toMinutes(WORK_START)} />
      <UnavailableBlock start={toMinutes(WORK_END)} end={toMinutes(GRID_END)} />

      {pastGaps.map((g) => {
        const key = `past-${day.dateStr}-${g.start}-${g.end}`;
        return <UntrackedBlock key={key} gap={g} onClick={() => onOpenLog(day.dateStr, g)} />;
      })}
      {futureGaps.map((g) => {
        const key = `future-${day.dateStr}-${g.start}-${g.end}`;
        return <OpenSlotBlock key={key} gap={g} onClick={() => onOpenPlan(day.dateStr, g)} />;
      })}

      {visible.map((e) => (
        <EntryBlock
          key={e.id}
          entry={e}
          fading={false}
          draggable={e.type !== "live"}
          dimmed={dragSourceId === e.id}
          justFilled={justFilledEntryId === e.id}
          onStartDrag={onStartDrag}
          onStartResize={onStartResize}
          onActivate={onActivate}
        />
      ))}
      {hidden.map((e) => (
        <EntryBlock key={e.id} entry={e} fading={true} draggable={false} />
      ))}

      {ghostEntry && <EntryBlock entry={ghostEntry} fading={false} draggable={false} isGhost />}
    </div>
  );
}

/* ============ Main App ============ */
function App() {
  const [entries, setEntries] = useState(seedEntries());
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [openForm, setOpenForm] = useState(null); // { mode:'log'|'plan', date, gap } | { mode:'edit', entry }
  const [justFilledEntryId, setJustFilledEntryId] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [showReports, setShowReports] = useState(false);

  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const dayBodyRefs = useRef({});
  const dragInfo = useRef(null);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekRange(weekDays), [weekDays]);
  const weekDateSet = useMemo(() => new Set(weekDays.map((d) => d.dateStr)), [weekDays]);
  const weekEntries = useMemo(() => entries.filter((e) => weekDateSet.has(e.date)), [entries, weekDateSet]);

  const counts = useMemo(() => {
    const c = {};
    PROJECTS.forEach((p) => {
      c[p.id] = weekEntries.filter((e) => e.projectId === p.id).length;
    });
    return c;
  }, [weekEntries]);
  const totalCount = weekEntries.length;

  const gapsByDate = useMemo(() => {
    const m = {};
    weekDays.forEach((d) => {
      const dateEntries = weekEntries.filter((e) => e.date === d.dateStr);
      m[d.dateStr] = computeGapsForDate(dateEntries, d.dateObj);
    });
    return m;
  }, [weekDays, weekEntries]);

  const totalUntrackedMins = useMemo(
    () => weekDays.reduce((sum, d) => sum + gapsByDate[d.dateStr].past.reduce((s, g) => s + (g.end - g.start), 0), 0),
    [weekDays, gapsByDate]
  );
  const totalLoggedMins = useMemo(() => weekEntries.reduce((sum, e) => sum + (e.end - e.start), 0), [weekEntries]);

  /* ---- form handlers ---- */
  const handleOpenLog = (dateStr, gap) => setOpenForm({ mode: "log", date: dateStr, gap });
  const handleOpenPlan = (dateStr, gap) => setOpenForm({ mode: "plan", date: dateStr, gap });

  const handleSubmitCreate = ({ projectId, start, duration, note }) => {
    const { mode, date } = openForm;
    const planned = mode === "plan";
    const newEntry = {
      id: `e-${Date.now()}`,
      date,
      projectId,
      start,
      end: start + duration,
      title: note || (planned ? "Planned task" : "Logged time"),
      type: planned ? "planned" : "manual",
      loggedAt: planned ? null : fmtTimeOfDay(toMinutes(new Date().getHours(), new Date().getMinutes())),
    };
    setEntries((prev) => [...prev, newEntry]);
    setOpenForm(null);
    setJustFilledEntryId(newEntry.id);
    setTimeout(() => setJustFilledEntryId(null), 1000);
  };
  const handleSubmitEdit = ({ projectId, start, duration, note }) => {
    const entry = openForm.entry;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, projectId, start, end: start + duration, title: note || e.title } : e)));
    setOpenForm(null);
  };
  const handleDeleteEntry = () => {
    setEntries((prev) => prev.filter((e) => e.id !== openForm.entry.id));
    setOpenForm(null);
  };
  const openEditForm = (entry) => setOpenForm({ mode: "edit", entry });

  /* ---- drag handlers ---- */
  function findColumnAt(clientX) {
    let best = null,
      bestDist = Infinity;
    for (const [dateStr, node] of Object.entries(dayBodyRefs.current)) {
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return { dateStr, rect };
      const dist = Math.min(Math.abs(clientX - rect.left), Math.abs(clientX - rect.right));
      if (dist < bestDist) {
        bestDist = dist;
        best = { dateStr, rect };
      }
    }
    return best;
  }

  function handleDragMove(e) {
    const info = dragInfo.current;
    if (!info) return;
    const dx = e.clientX - info.startClientX,
      dy = e.clientY - info.startClientY;
    if (!info.moved && Math.hypot(dx, dy) > 4) info.moved = true;
    if (!info.moved) return;

    if (info.mode === "resize") {
      const deltaMinutes = Math.round((dy / PX_PER_HOUR) * 60 / 5) * 5;
      let newEnd = info.origEnd + deltaMinutes;
      newEnd = Math.max(info.origStart + 5, Math.min(newEnd, toMinutes(WORK_END)));
      info.preview = { date: info.origDate, start: info.origStart, end: newEnd };
      setDragPreview({ entryId: info.entryId, ...info.preview });
      return;
    }

    const col = findColumnAt(e.clientX);
    if (!col) return;
    const duration = info.origEnd - info.origStart;
    const relY = e.clientY - col.rect.top;
    let newStart = toMinutes(GRID_START) + (relY / PX_PER_HOUR) * 60;
    newStart = Math.round(newStart / 5) * 5;
    newStart = Math.max(toMinutes(WORK_START), Math.min(newStart, toMinutes(WORK_END) - duration));
    info.preview = { date: col.dateStr, start: newStart, end: newStart + duration };
    setDragPreview({ entryId: info.entryId, ...info.preview });
  }

  function handleDragEnd() {
    const info = dragInfo.current;
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
    dragInfo.current = null;
    if (!info) return;
    if (info.moved && info.preview) {
      const { date, start, end } = info.preview;
      setEntries((prev) => prev.map((en) => (en.id === info.entryId ? { ...en, date, start, end } : en)));
    } else if (!info.moved && info.mode === "move") {
      const entry = entriesRef.current.find((en) => en.id === info.entryId);
      if (entry) openEditForm(entry);
    }
    setDragPreview(null);
  }

  function handleStartDrag(e, entry) {
    e.preventDefault();
    dragInfo.current = {
      mode: "move",
      entryId: entry.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origDate: entry.date,
      origStart: entry.start,
      origEnd: entry.end,
      moved: false,
      preview: null,
    };
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  }

  function handleStartResize(e, entry) {
    e.preventDefault();
    dragInfo.current = {
      mode: "resize",
      entryId: entry.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origDate: entry.date,
      origStart: entry.start,
      origEnd: entry.end,
      moved: false,
      preview: null,
    };
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  }

  return (
    <div className="min-h-screen bg-white text-stone-700">
      <h1 className="sr-only">Toggl Focus — Week View Prototype</h1>
      <div className="max-w-[1100px] mx-auto border-x border-stone-200">
        <header>
          <TopBar activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} counts={counts} totalCount={totalCount} />
          <nav aria-label="Week navigation">
            <DateNav weekLabel={weekLabel} onPrev={() => setWeekOffset((o) => o - 1)} onNext={() => setWeekOffset((o) => o + 1)} onToday={() => setWeekOffset(0)} isCurrentWeek={weekOffset === 0} />
          </nav>
          <LoggedSummaryBar totalLoggedMins={totalLoggedMins} untrackedMins={totalUntrackedMins} onViewReports={() => setShowReports(true)} />
        </header>

        <main aria-label={`Week of ${weekLabel}`} className="flex">
          <div>
            <DayHeaderSpacer />
            <HourGutter />
          </div>
          {weekDays.map((day) => {
            const dateEntries = weekEntries.filter((e) => e.date === day.dateStr);
            const visible = activeProjectId ? dateEntries.filter((e) => e.projectId === activeProjectId) : dateEntries;
            const hidden = activeProjectId ? dateEntries.filter((e) => e.projectId !== activeProjectId) : [];
            const loggedMins = dateEntries.reduce((s, e) => s + (e.end - e.start), 0);

            const isDragSourceHere = dragPreview && entries.find((e) => e.id === dragPreview.entryId)?.date === day.dateStr;
            const ghostEntry =
              dragPreview && dragPreview.date === day.dateStr
                ? (() => {
                    const orig = entries.find((e) => e.id === dragPreview.entryId);
                    return orig ? { ...orig, start: dragPreview.start, end: dragPreview.end } : null;
                  })()
                : null;

            return (
              <div key={day.dateStr} className="flex-1 flex flex-col">
                <DayHeader day={day} loggedMins={loggedMins} />
                <DayColumn
                  day={day}
                  visible={visible}
                  hidden={hidden}
                  dragSourceId={isDragSourceHere ? dragPreview.entryId : null}
                  ghostEntry={ghostEntry}
                  pastGaps={gapsByDate[day.dateStr].past}
                  futureGaps={gapsByDate[day.dateStr].future}
                  justFilledEntryId={justFilledEntryId}
                  registerRef={(node) => {
                    dayBodyRefs.current[day.dateStr] = node;
                  }}
                  onOpenLog={handleOpenLog}
                  onOpenPlan={handleOpenPlan}
                  onStartDrag={handleStartDrag}
                  onStartResize={handleStartResize}
                  onActivate={openEditForm}
                />
              </div>
            );
          })}
        </main>
      </div>

      {openForm && (
        <EntryForm
          kind={openForm.mode}
          defaultProjectId={openForm.mode === "edit" ? openForm.entry.projectId : activeProjectId || PROJECTS[0].id}
          initialStart={openForm.mode === "edit" ? openForm.entry.start : openForm.gap.start}
          initialDuration={openForm.mode === "edit" ? openForm.entry.end - openForm.entry.start : Math.min(45, openForm.gap.end - openForm.gap.start)}
          initialNote={openForm.mode === "edit" ? (["Logged time", "Planned task"].includes(openForm.entry.title) ? "" : openForm.entry.title) : ""}
          onSubmit={openForm.mode === "edit" ? handleSubmitEdit : handleSubmitCreate}
          onDelete={openForm.mode === "edit" ? handleDeleteEntry : undefined}
          onClose={() => setOpenForm(null)}
        />
      )}

      {showReports && <ReportsModal weekLabel={weekLabel} weekDays={weekDays} weekEntries={weekEntries} totalUntrackedMins={totalUntrackedMins} onClose={() => setShowReports(false)} />}

      <footer>
        <p className="text-center text-[11px] text-stone-500 mt-6 mb-4">Toggl Focus — week view prototype</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
