export const PURPLE = "#5B4FE5";
export const PURPLE_LIGHT = "#EEEBFC";
export const GRID_START = 7;
export const GRID_END = 20;
export const WORK_START = 8;
export const WORK_END = 19;
export const PX_PER_HOUR = 56;

export const PROJECTS = [
  { id: "acme", name: "Acme Corp", color: "#5B4FE5" },
  { id: "personal", name: "Personal", color: "#1E9E8A" },
  { id: "side", name: "Side Project", color: "#D98A2B" },
];
export const projectById = (id) => PROJECTS.find((p) => p.id === id);

export const RECENT_TASKS = [
  { title: "Design review", projectId: "acme" },
  { title: "1:1 with mentor", projectId: "personal" },
  { title: "Sprint planning", projectId: "acme" },
  { title: "Stakeholder sync", projectId: "acme" },
  { title: "Bug fixes", projectId: "side" },
  { title: "Inbox triage", projectId: "personal" },
];

export const BASE_MONDAY = new Date(2026, 5, 29); // Jun 29 2026
export const NOW = new Date(2026, 5, 30, 12, 0); // Jun 30 2026, noon — "today" is the 30th, afternoon is the future

export const toMinutes = (h, m = 0) => h * 60 + m;

export const fmtHourLabel = (h) => {
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:00 ${ampm}`;
};

export const fmtTimeOfDay = (mins) => {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export const fmtDuration = (mins) => {
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export function parseDurationInput(str) {
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

export function parseTimeInput(str) {
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

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = d - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}
export function getWeekDays(weekOffset) {
  const monday = addDays(BASE_MONDAY, weekOffset * 7);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return labels.map((label, i) => {
    const d = addDays(monday, i);
    return { label, dateObj: d, dateStr: isoDate(d), dateNum: d.getDate() };
  });
}
export function formatWeekRange(days) {
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

export const seedEntries = () => [
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

export function minutesOfNowRelativeTo(dateObj) {
  const dStr = isoDate(dateObj),
    nowStr = isoDate(NOW);
  if (dStr < nowStr) return Infinity;
  if (dStr > nowStr) return -Infinity;
  return NOW.getHours() * 60 + NOW.getMinutes();
}

export function computeGapsForDate(dateEntries, dateObj) {
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

export const topFor = (mins) => ((mins - toMinutes(GRID_START)) / 60) * PX_PER_HOUR;
export const heightFor = (s, e) => Math.max(((e - s) / 60) * PX_PER_HOUR, 22);
