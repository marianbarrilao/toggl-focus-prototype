import { useState, useMemo, useRef, useEffect } from "react";
import {
  PURPLE,
  PURPLE_LIGHT,
  GRID_START,
  GRID_END,
  WORK_START,
  WORK_END,
  PX_PER_HOUR,
  PROJECTS,
  projectById,
  toMinutes,
  fmtHourLabel,
  fmtTimeOfDay,
  fmtDuration,
  getWeekDays,
  formatWeekRange,
  seedEntries,
  computeGapsForDate,
  topFor,
  heightFor,
} from "./constants.js";
import {
  Tooltip,
  useOutsideClick,
  ClockIcon,
  PencilIcon,
  CalendarPlusIcon,
  PlusIcon,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  FolderIcon,
  PlayIcon,
  GridGlyph,
  ListGlyph,
  PanelGlyph,
  GearGlyph,
  SidebarGlyph,
  IconBtn,
} from "./icons.jsx";
import EntryForm from "./EntryForm.jsx";
import ReportsModal from "./ReportsModal.jsx";

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
      <div className={"text-[11px] font-medium truncate leading-tight pr-3 " + (isLive ? "text-white" : "")} style={!isLive ? { color: project.color } : {}}>
        {entry.title}
      </div>
      <div className={"text-[10px] leading-tight " + (isLive ? "text-white/75" : "")} style={!isLive ? { color: project.color, opacity: 0.7 } : {}}>
        {fmtTimeOfDay(entry.start)}
      </div>
      <span className="absolute top-1 right-1">{isLive ? <Icon className="text-white/80" /> : <Icon color={project.color} />}</span>
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
        "absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden transition-all duration-200 ease-out " +
        (fading ? "opacity-0 scale-95" : "opacity-100 scale-100") +
        " " +
        (draggable ? "cursor-grab hover:ring-2 hover:ring-offset-1 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400" : "") +
        " " +
        (isGhost ? "pointer-events-none shadow-lg ring-2 z-50" : "") +
        " " +
        (justFilled ? "gap-filled-highlight" : "")
      }
      style={{
        top: topFor(entry.start),
        height: heightFor(entry.start, entry.end),
        backgroundColor: isLive ? project.color : `${project.color}2E`,
        border: isLive ? "none" : `1.5px dashed ${project.color}`,
        opacity: dimmed ? 0.3 : undefined,
        ringColor: !isLive ? project.color : undefined,
      }}
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
          <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: project.color }} />
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
      className="absolute left-1 right-1 rounded-md border border-dashed border-amber-300 hover:bg-amber-100/70 cursor-pointer transition-colors duration-150 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500"
      style={{ top: topFor(gap.start), height: heightFor(gap.start, gap.end), backgroundColor: "rgba(245,158,11,0.06)" }}
    >
      <Tooltip content={<div>{fmtDuration(duration)} untracked — click to log</div>}>
        <div className="flex items-center justify-center h-full gap-1 text-amber-500">
          <ClockIcon className="text-amber-500" />
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
      className="absolute left-1 right-1 rounded-md border border-stone-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-300 cursor-pointer transition-colors duration-150 flex items-center justify-center group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400"
      style={{ top: topFor(gap.start), height: heightFor(gap.start, gap.end) }}
    >
      <Tooltip content={<div>{fmtDuration(duration)} open — add a task</div>}>
        <div className="flex items-center justify-center h-full text-stone-300 group-hover:text-indigo-400">
          <PlusIcon />
        </div>
      </Tooltip>
    </button>
  );
}

/* ============ Outside-working-hours block (busy / unavailable) ============ */
function UnavailableBlock({ start, end }) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-1 right-1 rounded-md"
      style={{
        top: topFor(start),
        height: heightFor(start, end),
        backgroundColor: "rgba(245,245,244,0.6)",
        backgroundImage: "repeating-linear-gradient(135deg, rgba(120,113,108,0.12) 0px, rgba(120,113,108,0.12) 4px, transparent 4px, transparent 10px)",
      }}
    >
      <Tooltip content={<div>Outside working hours</div>}>
        <div className="h-full" />
      </Tooltip>
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
        className={"flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium border transition-colors " + (active ? "border-transparent" : "border-stone-200 text-stone-500 hover:bg-stone-50")}
        style={active ? { backgroundColor: PURPLE_LIGHT, color: active.color } : {}}
      >
        <FolderIcon color={active ? active.color : "#6B7280"} />
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
            <span className="text-stone-400 text-[11px]">{totalCount}</span>
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
                <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
              <span className="text-stone-400 text-[11px]">{counts[p.id]}</span>
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
        <button type="button" disabled title="Not functional in this prototype" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-medium text-stone-500 border border-stone-200 opacity-40 cursor-not-allowed">
          @ Task
        </button>
        <ProjectFilterPill activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} counts={counts} totalCount={totalCount} />
        <button type="button" disabled title="Not functional in this prototype" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-medium text-stone-500 border border-stone-200 opacity-40 cursor-not-allowed">
          # Tags
        </button>
        <button type="button" disabled title="Not functional in this prototype" aria-label="Billable, not functional in this prototype" className="flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-medium text-stone-500 border border-stone-200 opacity-40 cursor-not-allowed">
          $
        </button>
      </div>
      <div className="flex items-center gap-3 ml-4 pl-4 border-l border-stone-200">
        <span className="text-[15px] tabular-nums text-stone-700 font-medium" aria-label="Timer, 0 hours 0 minutes 0 seconds">
          0:00:00
        </span>
        <button
          type="button"
          disabled
          title="Not functional in this prototype"
          aria-label="Start timer, not functional in this prototype"
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm opacity-40 cursor-not-allowed"
          style={{ backgroundColor: PURPLE }}
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
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-full mt-1 z-50 w-32 rounded-lg bg-white shadow-xl border border-stone-200 py-1">
          <button type="button" role="option" aria-selected="true" onClick={() => setOpen(false)} className="w-full text-left px-3 py-1.5 text-[13px] font-semibold flex items-center justify-between text-stone-700">
            5 Days <span style={{ color: PURPLE }}>✓</span>
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
        <button type="button" onClick={onPrev} aria-label="Previous week" className="p-1 rounded hover:bg-stone-100">
          <ChevronLeft />
        </button>
        <button type="button" onClick={onNext} aria-label="Next week" className="p-1 rounded hover:bg-stone-100">
          <ChevronRight />
        </button>
        <div className="flex items-center gap-1.5 text-[13px] text-stone-600 font-medium">
          <CalendarIcon />
          {weekLabel}
        </div>
        <button
          type="button"
          onClick={onToday}
          className={"px-2.5 py-1 rounded-md text-[13px] font-medium border " + (isCurrentWeek ? "text-white border-transparent" : "text-stone-600 border-stone-200 bg-white hover:bg-stone-50")}
          style={isCurrentWeek ? { backgroundColor: PURPLE } : {}}
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
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: PURPLE }} />
      </div>
      <span className="text-[13px] font-semibold text-stone-700 flex-shrink-0">{fmtDuration(totalLoggedMins)}</span>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-amber-700 flex-shrink-0">
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {fmtDuration(untrackedMins)} untracked this week
      </span>
      <button type="button" onClick={onViewReports} className="text-[13px] font-medium flex-shrink-0" style={{ color: PURPLE }}>
        View reports &gt;
      </button>
    </div>
  );
}

/* ============ Day header ============ */
function DayHeader({ day, loggedMins }) {
  return (
    <div className="flex flex-col items-center py-2 border-b border-stone-200 border-l border-stone-100 first:border-l-0">
      <div className="text-[11px] text-stone-400 font-medium">{day.label}</div>
      <div className="text-[16px] font-semibold text-stone-700">{day.dateNum}</div>
      <div className="text-[10px] text-stone-400 mt-0.5">{loggedMins > 0 ? fmtDuration(loggedMins) : "-"} / -</div>
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
        <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-stone-400" style={{ top: (h - GRID_START) * PX_PER_HOUR }}>
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
  const workTop = topFor(toMinutes(WORK_START));
  const workHeight = topFor(toMinutes(WORK_END)) - workTop;

  return (
    <div ref={registerRef} className="relative flex-1 border-l border-stone-100" style={{ height: totalHeight }}>
      {hours.map((h) => (
        <div key={h} aria-hidden="true" className="absolute left-0 right-0 border-t border-stone-100" style={{ top: (h - GRID_START) * PX_PER_HOUR }} />
      ))}
      <div aria-hidden="true" className="absolute left-0 right-0 bg-stone-50/40" style={{ top: workTop, height: workHeight }} />

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
export default function App() {
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
      newEnd = Math.max(info.origStart + 5, Math.min(newEnd, toMinutes(GRID_END)));
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
    newStart = Math.max(toMinutes(GRID_START), Math.min(newStart, toMinutes(GRID_END) - duration));
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
      <div className="max-w-[1100px] mx-auto border-x border-stone-200">
        <header>
          <TopBar activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} counts={counts} totalCount={totalCount} />
          <nav aria-label="Week navigation">
            <DateNav weekLabel={weekLabel} onPrev={() => setWeekOffset((o) => o - 1)} onNext={() => setWeekOffset((o) => o + 1)} onToday={() => setWeekOffset(0)} isCurrentWeek={weekOffset === 0} />
          </nav>
          <LoggedSummaryBar totalLoggedMins={totalLoggedMins} untrackedMins={totalUntrackedMins} onViewReports={() => setShowReports(true)} />
        </header>

        <main aria-label={`Week of ${weekLabel}`} className="flex">
          <div className="pt-[42px]">
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
          initialDuration={openForm.mode === "edit" ? openForm.entry.end - openForm.entry.start : openForm.gap.end - openForm.gap.start}
          initialNote={openForm.mode === "edit" ? (["Logged time", "Planned task"].includes(openForm.entry.title) ? "" : openForm.entry.title) : ""}
          onSubmit={openForm.mode === "edit" ? handleSubmitEdit : handleSubmitCreate}
          onDelete={openForm.mode === "edit" ? handleDeleteEntry : undefined}
          onClose={() => setOpenForm(null)}
        />
      )}

      {showReports && <ReportsModal weekLabel={weekLabel} weekDays={weekDays} weekEntries={weekEntries} totalUntrackedMins={totalUntrackedMins} onClose={() => setShowReports(false)} />}

      <footer>
        <p className="text-center text-[11px] text-stone-400 mt-6 mb-4">Toggl Focus — week view prototype</p>
      </footer>
    </div>
  );
}
