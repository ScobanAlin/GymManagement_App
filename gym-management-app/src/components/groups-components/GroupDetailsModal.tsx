import React, { useState, useEffect, useCallback } from "react";
import { Group } from "./GroupPage";
import apiClient from "../../services/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type Student = { id: number; firstName: string; lastName: string };

type ClassItem = {
  id: number;
  date: string;
  begin: string;
  end: string;
  gymName: string;
  gymId: number;
};

type ScheduleSlot = {
  weekday: number;
  beginTime: string;
  endTime: string;
  gymId: number;
  gymName: string;
};

type AttendanceRecord = {
  id: number;
  studentId: number;
  studentFirstName: string;
  studentLastName: string;
  attended: boolean;
};

type GroupDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (groupId: number) => void;
  group: Group | null;
  students: Student[];
  classes: ClassItem[];
  allGroups: Group[];
  gyms: { id: number; name: string }[];
  refresh: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];
const DAY_NAME = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Returns the ISO date of the next occurrence of a JS weekday (0=Sun…6=Sat) from today. */
const nextWeekdayDate = (weekday: number): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let daysUntil = weekday - today.getDay();
  if (daysUntil <= 0) daysUntil += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntil);
  return next.toISOString().split("T")[0];
};

const endOfCurrentYear = (): string => `${new Date().getFullYear()}-12-31`;

export default function GroupDetailsModal({
  isOpen,
  onClose,
  onDelete,
  group,
  students,
  allGroups,
  gyms,
  refresh,
}: GroupDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"students" | "schedule" | "past">("students");

  // ── Students tab ──────────────────────────────────────────────────────────
  const [selectedGroupForReassign, setSelectedGroupForReassign] = useState<number | null>(null);

  // ── Schedule tab ──────────────────────────────────────────────────────────
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [slotGym, setSlotGym] = useState<number | "">("");
  const [slotDay, setSlotDay] = useState<number | null>(null);
  const [slotBegin, setSlotBegin] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotAdding, setSlotAdding] = useState(false);

  // ── Past classes tab ──────────────────────────────────────────────────────
  const [pastClasses, setPastClasses] = useState<ClassItem[]>([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastYear, setPastYear] = useState("");
  const [pastMonth, setPastMonth] = useState("");
  const [pastSearch, setPastSearch] = useState("");

  // ── Attendance modal ──────────────────────────────────────────────────────
  const [attendanceClass, setAttendanceClass] = useState<ClassItem | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadSchedule = useCallback(async () => {
    if (!group) return;
    setScheduleLoading(true);
    try {
      const res = await apiClient.get(`/groups/${group.id}/schedule`);
      setSchedule(res.data ?? []);
    } catch (e) {
      console.error("Failed to load schedule", e);
    } finally {
      setScheduleLoading(false);
    }
  }, [group]);

  const loadPastClasses = useCallback(async () => {
    if (!group) return;
    setPastLoading(true);
    try {
      const res = await apiClient.get(`/groups/${group.id}/classes/past`);
      setPastClasses(res.data ?? []);
    } catch (e) {
      console.error("Failed to load past classes", e);
    } finally {
      setPastLoading(false);
    }
  }, [group]);

  useEffect(() => {
    if (activeTab === "schedule") loadSchedule();
  }, [activeTab, loadSchedule]);

  useEffect(() => {
    if (activeTab === "past") loadPastClasses();
  }, [activeTab, loadPastClasses]);

  if (!isOpen || !group) return null;

  // ── Actions ───────────────────────────────────────────────────────────────

  const removeStudent = async (studentId: number) => {
    await apiClient.delete(`/groups/${group.id}/remove-student/${studentId}`);
    refresh();
  };

  const assignStudent = async (studentId: number) => {
    if (!selectedGroupForReassign) return alert("Select a target group first");
    await apiClient.post(`/students/${studentId}/assign-group`, { groupId: selectedGroupForReassign });
    refresh();
  };

  const addSlot = async () => {
    if (!slotGym || slotDay === null || !slotBegin || !slotEnd)
      return alert("Fill all fields: gym, day of the week, begin time and end time");

    const startDate = nextWeekdayDate(slotDay);
    const endDate = endOfCurrentYear();

    setSlotAdding(true);
    try {
      await apiClient.post(`/groups/${group.id}/classes`, {
        gymId: slotGym,
        startDate,
        endDate,
        begin: slotBegin,
        end: slotEnd,
        weekdays: [slotDay],
      });
      setSlotGym(""); setSlotDay(null); setSlotBegin(""); setSlotEnd("");
      await loadSchedule();
      refresh();
    } catch (e) {
      console.error("Failed to add slot", e);
      alert("Failed to add slot");
    } finally {
      setSlotAdding(false);
    }
  };

  const removeSlot = async (slot: ScheduleSlot) => {
    const dayName = DAY_NAME[slot.weekday];
    if (!window.confirm(
      `Remove all future ${dayName} ${slot.beginTime.slice(0, 5)}–${slot.endTime.slice(0, 5)} classes at ${slot.gymName}?`
    )) return;
    await apiClient.delete(`/groups/${group.id}/schedule-slot`, {
      data: { weekday: slot.weekday, beginTime: slot.beginTime, endTime: slot.endTime, gymId: slot.gymId },
    });
    await loadSchedule();
    refresh();
  };

  const openAttendance = async (cls: ClassItem) => {
    setAttendanceClass(cls);
    setAttendanceRecords([]);
    setAttendanceLoading(true);
    try {
      const res = await apiClient.get(`/attendance/classes/${cls.id}`);
      setAttendanceRecords(res.data ?? []);
    } catch (e) {
      console.error("Failed to load attendance", e);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const deletePastClass = async (classId: number) => {
    if (!window.confirm("Delete this class record? This will also remove its attendance data.")) return;
    await apiClient.delete(`/classes/${classId}`);
    setPastClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  const handleDeleteGroup = () => {
    if (window.confirm(`Delete group "${group.name}"?`)) {
      onDelete(group.id);
      onClose();
    }
  };

  const filteredPast = pastClasses.filter((c) => {
    const d = new Date(c.date);
    if (pastYear && d.getFullYear() !== Number(pastYear)) return false;
    if (pastMonth && d.getMonth() + 1 !== Number(pastMonth)) return false;
    if (pastSearch.trim()) {
      const q = pastSearch.toLowerCase();
      return c.gymName.toLowerCase().includes(q) || c.date.includes(q) || c.begin.includes(q);
    }
    return true;
  });

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          style={{ maxWidth: "700px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>📘 {group.name}</h2>
            <button className="modal-close" onClick={handleDeleteGroup}>🗑</button>
          </div>

          {/* TABS */}
          <div style={{
            display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
            borderBottom: "2px solid var(--border-color)",
            overflowX: "auto", whiteSpace: "nowrap",
          }}>
            <TabButton active={activeTab === "students"} label="👥 Students" onClick={() => setActiveTab("students")} />
            <TabButton active={activeTab === "schedule"} label="📋 Weekly Schedule" onClick={() => setActiveTab("schedule")} />
            <TabButton active={activeTab === "past"} label="📜 Past Classes" onClick={() => setActiveTab("past")} />
          </div>

          <div className="modal-body">
            {activeTab === "students" && (
              <StudentsTab
                students={students}
                allGroups={allGroups}
                removeStudent={removeStudent}
                assignStudent={assignStudent}
                setSelectedGroupForReassign={setSelectedGroupForReassign}
              />
            )}

            {activeTab === "schedule" && (
              <ScheduleTab
                schedule={schedule}
                scheduleLoading={scheduleLoading}
                gyms={gyms}
                slotGym={slotGym} setSlotGym={setSlotGym}
                slotDay={slotDay} setSlotDay={setSlotDay}
                slotBegin={slotBegin} setSlotBegin={setSlotBegin}
                slotEnd={slotEnd} setSlotEnd={setSlotEnd}
                slotAdding={slotAdding}
                addSlot={addSlot}
                removeSlot={removeSlot}
              />
            )}

            {activeTab === "past" && (
              <PastClassesTab
                pastClasses={filteredPast}
                pastLoading={pastLoading}
                pastYear={pastYear} setPastYear={setPastYear}
                pastMonth={pastMonth} setPastMonth={setPastMonth}
                pastSearch={pastSearch} setPastSearch={setPastSearch}
                openAttendance={openAttendance}
                deletePastClass={deletePastClass}
              />
            )}
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="btn-primary">Close</button>
          </div>
        </div>
      </div>

      {/* Attendance inner modal */}
      {attendanceClass ? (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setAttendanceClass(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "560px", zIndex: 1101 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                🧾 Presence — {attendanceClass.date}&nbsp;
                {attendanceClass.begin.slice(0, 5)}–{attendanceClass.end.slice(0, 5)}&nbsp;
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {attendanceClass.gymName}
                </span>
              </h2>
            </div>
            <div className="modal-body">
              {attendanceLoading ? (
                <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
              ) : attendanceRecords.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No attendance records for this class.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ padding: "0.75rem 1rem" }}>Student</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Present</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((r) => (
                        <tr key={r.id}>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            {r.studentFirstName} {r.studentLastName}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "0.2rem 0.65rem",
                              borderRadius: "12px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              background: r.attended ? "rgba(39,174,96,0.15)" : "rgba(231,76,60,0.15)",
                              color: r.attended ? "#27ae60" : "#e74c3c",
                            }}>
                              {r.attended ? "✓ Yes" : "✗ No"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setAttendanceClass(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TabButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0,
      padding: "0.75rem 1rem",
      borderRadius: 0,
      borderBottom: active ? "3px solid var(--primary-accent)" : "3px solid transparent",
      border: "none",
      background: "transparent",
      color: active ? "var(--primary-accent)" : "var(--text-secondary)",
      cursor: "pointer",
      fontWeight: active ? 600 : 500,
      transition: "all 0.2s ease",
    }}
  >
    {label}
  </button>
);

// ── Students Tab ──────────────────────────────────────────────────────────────

const StudentsTab = ({ students, allGroups, removeStudent, assignStudent, setSelectedGroupForReassign }: any) => (
  <div>
    <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>Manage Students</h3>
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{ padding: "1rem" }}>Name</th>
            <th style={{ padding: "1rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={2} style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                No students in this group
              </td>
            </tr>
          ) : (
            students.map((s: any) => (
              <tr key={s.id}>
                <td style={{ padding: "1rem" }}>{s.firstName} {s.lastName}</td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button className="btn-danger btn-sm" onClick={() => removeStudent(s.id)}>Remove</button>
                    <select
                      onChange={(e) => setSelectedGroupForReassign(Number(e.target.value))}
                      style={{ padding: "0.4rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.9rem" }}
                    >
                      <option value="">Move to…</option>
                      {allGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button className="btn-secondary btn-sm" onClick={() => assignStudent(s.id)}>Move</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Weekly Schedule Tab ───────────────────────────────────────────────────────

const ScheduleTab = ({
  schedule, scheduleLoading, gyms,
  slotGym, setSlotGym, slotDay, setSlotDay,
  slotBegin, setSlotBegin, slotEnd, setSlotEnd,
  slotAdding, addSlot, removeSlot,
}: any) => (
  <div>
    <h3 style={{ marginTop: 0, marginBottom: "0.75rem", color: "var(--text-primary)" }}>
      Current Weekly Schedule
    </h3>

    {scheduleLoading ? (
      <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
    ) : schedule.length === 0 ? (
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        No recurring schedule defined yet. Add slots below.
      </p>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {schedule.map((slot: ScheduleSlot, i: number) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.75rem 1rem",
            background: "var(--bg-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
          }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span style={{
                padding: "0.2rem 0.7rem", borderRadius: "12px",
                background: "var(--primary-accent)", color: "#fff",
                fontWeight: 700, fontSize: "0.82rem",
              }}>
                {DAY_NAME[slot.weekday]}
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {slot.beginTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{slot.gymName}</span>
            </div>
            <button className="btn-danger btn-sm" onClick={() => removeSlot(slot)}>Remove</button>
          </div>
        ))}
      </div>
    )}

    {/* Add slot form */}
    <div style={{ padding: "1.5rem", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
      <h4 style={{ marginTop: 0, marginBottom: "0.75rem", color: "var(--text-primary)" }}>➕ Add New Slot</h4>
      <p style={{ margin: "0 0 1rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        Choose a gym, day of the week and time. Classes will be added weekly from the next occurrence of that day until the end of the year.
      </p>

      {/* Gym */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Gym</label>
        <select
          value={slotGym}
          onChange={(e) => setSlotGym(Number(e.target.value))}
          style={{ padding: "0.6rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.9rem", maxWidth: "260px" }}
        >
          <option value="">Select gym…</option>
          {gyms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Day picker */}
      <div style={{ marginTop: "1rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
          Day of the Week
        </label>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {DAYS.map((d) => {
            const selected = slotDay === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setSlotDay(selected ? null : d.value)}
                style={{
                  padding: "0.35rem 0.8rem", borderRadius: "20px", cursor: "pointer",
                  border: `2px solid ${selected ? "var(--primary-accent)" : "var(--border-color)"}`,
                  background: selected ? "var(--primary-accent)" : "transparent",
                  color: selected ? "#fff" : "var(--text-secondary)",
                  fontWeight: selected ? 700 : 400, fontSize: "0.85rem",
                  transition: "all 0.2s ease",
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Begin + End time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Begin Time</label>
          <input
            type="time" value={slotBegin}
            onChange={(e) => setSlotBegin(e.target.value)}
            style={{ padding: "0.6rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.9rem" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>End Time</label>
          <input
            type="time" value={slotEnd}
            onChange={(e) => setSlotEnd(e.target.value)}
            style={{ padding: "0.6rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.9rem" }}
          />
        </div>
      </div>

      <button className="btn-primary" onClick={addSlot} disabled={slotAdding} style={{ marginTop: "1rem" }}>
        {slotAdding ? "Adding…" : "✓ Add Slot"}
      </button>
    </div>
  </div>
);

// ── Past Classes Tab ──────────────────────────────────────────────────────────

const PastClassesTab = ({
  pastClasses, pastLoading,
  pastYear, setPastYear,
  pastMonth, setPastMonth,
  pastSearch, setPastSearch,
  openAttendance, deletePastClass,
}: any) => (
  <div>
    <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>Past Classes</h3>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "0.75rem", marginBottom: "1rem" }}>
      <input
        type="number" placeholder="Year" value={pastYear}
        onChange={(e) => setPastYear(e.target.value)}
        style={{ padding: "0.6rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.9rem" }}
      />
      <input
        type="number" placeholder="Month (1-12)" value={pastMonth}
        onChange={(e) => setPastMonth(e.target.value)}
        style={{ padding: "0.6rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.9rem" }}
      />
      <input
        type="text" placeholder="Search by gym or time…" value={pastSearch}
        onChange={(e) => setPastSearch(e.target.value)}
        style={{ padding: "0.6rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.9rem" }}
      />
    </div>

    {pastLoading ? (
      <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
    ) : (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ padding: "0.75rem 1rem" }}>Date</th>
              <th style={{ padding: "0.75rem 1rem" }}>Time</th>
              <th style={{ padding: "0.75rem 1rem" }}>Gym</th>
              <th style={{ padding: "0.75rem 1rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pastClasses.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  No past classes found
                </td>
              </tr>
            ) : (
              pastClasses.map((c: ClassItem) => (
                <tr key={c.id}>
                  <td style={{ padding: "0.75rem 1rem" }}>{c.date}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{c.begin.slice(0, 5)}–{c.end.slice(0, 5)}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{c.gymName}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-secondary btn-sm" onClick={() => openAttendance(c)}>
                        👁 Presence
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => deletePastClass(c.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);