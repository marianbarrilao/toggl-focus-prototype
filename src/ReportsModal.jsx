import { useState, useEffect } from "react";
import { PROJECTS, PURPLE, fmtDuration, projectById } from "./constants.js";

export default function ReportsModal({ weekLabel, weekDays, weekEntries, totalUntrackedMins, onClose }) {
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
            <p className="text-xs text-stone-400">
              {weekLabel} · {filterLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reports"
            className="no-print w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400"
          >
            ✕
          </button>
        </div>

        <div className="no-print flex items-center gap-2">
          <label htmlFor="report-project-filter" className="text-[12px] text-stone-400">
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
          <span className="text-xs text-stone-400">logged this week</span>
        </div>

        {filteredEntries.length === 0 ? (
          <p className="text-[13px] text-stone-400">No entries logged this week yet.</p>
        ) : (
          <>
            <div className="bg-stone-50 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-stone-400 mb-2">By day</div>
              <div className="flex items-end gap-2 h-16" role="img" aria-label={dailyTotals.map((d) => `${d.label}: ${fmtDuration(d.mins)}`).join(", ")}>
                {dailyTotals.map((d) => (
                  <div key={d.dateStr} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                    <div
                      aria-hidden="true"
                      className="w-full rounded-t-md"
                      style={{
                        height: `${Math.max((d.mins / maxDailyMins) * 100, d.mins > 0 ? 8 : 2)}%`,
                        backgroundColor: d.mins > 0 ? PURPLE : "#E7E5E4",
                      }}
                    />
                    <span className="text-[10px] text-stone-400">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3.5 space-y-2.5">
              <div className="text-[11px] font-medium text-stone-400">By project</div>
              {perProject.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="flex items-center gap-1.5 text-stone-600">
                      <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                    <span className="text-stone-400">{fmtDuration(p.mins)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white overflow-hidden">
                    <div aria-hidden="true" className="h-full rounded-full" style={{ width: `${(p.mins / maxMins) * 100}%`, backgroundColor: p.color }} />
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
          <button type="button" onClick={() => window.print()} className="flex-1 text-[13px] font-medium px-4 py-2 rounded-lg text-white" style={{ backgroundColor: PURPLE }}>
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
            <button type="button" onClick={handleSendEmail} className="text-[12px] px-3 py-1.5 rounded-md text-white" style={{ backgroundColor: PURPLE }}>
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
