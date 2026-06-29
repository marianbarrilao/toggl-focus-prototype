import { useState, useEffect, useRef } from "react";
import {
  PROJECTS,
  PURPLE,
  PURPLE_LIGHT,
  RECENT_TASKS,
  GRID_START,
  GRID_END,
  toMinutes,
  fmtDuration,
  fmtTimeOfDay,
  parseDurationInput,
  parseTimeInput,
  projectById,
} from "./constants.js";
import { FolderIcon, TrashIcon } from "./icons.jsx";

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
      const clamped = Math.max(toMinutes(GRID_START), Math.min(parsed, toMinutes(GRID_END) - 5));
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

export default function EntryForm({ kind, defaultProjectId, initialStart, initialDuration, initialNote, onSubmit, onDelete, onClose }) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [start, setStart] = useState(initialStart);
  const [duration, setDuration] = useState(initialDuration);
  const [note, setNote] = useState(initialNote || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const project = projectById(projectId);
  const descriptionRef = useRef(null);

  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const maxDuration = Math.max(5, Math.min(480, toMinutes(GRID_END) - start));
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
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">{title}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400">
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
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              className="w-full text-[14px] text-stone-700 placeholder-stone-400 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-lg bg-white shadow-xl border border-stone-200 py-1.5 px-1">
                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-2 pb-1">Recurring</div>
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
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: p.color }}>
                        <FolderIcon color={p.color} /> {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-full flex-shrink-0" style={{ backgroundColor: PURPLE_LIGHT }}>
            <FolderIcon color={project.color} />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label="Project"
              className="text-[13px] font-medium bg-transparent focus:outline-none appearance-none pr-1"
              style={{ color: project.color }}
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={project.color} strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Start time</div>
          <TimeField start={start} setStart={setStart} />
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Duration</div>
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
          <button
            type="button"
            onClick={() => onSubmit({ projectId, start, duration, note })}
            className="text-[13px] font-medium px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: PURPLE }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
