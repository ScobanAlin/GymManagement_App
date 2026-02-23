import React, { useState } from "react";
import { Group } from "./GroupPage";
import apiClient from "../../services/apiClient";
type Student = {
  id: number;
  firstName: string;
  lastName: string;
};

type ClassItem = {
  id: number;
  date: string;
  begin: string;
  end: string;
  gymName: string;
  gymId: number;
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

export default function GroupDetailsModal({
  isOpen,
  onClose,
  onDelete,
  group,
  students,
  classes,
  allGroups,
  gyms,
  refresh,
}: GroupDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"students" | "classes">(
    "students"
  );

  const [selectedGroupForReassign, setSelectedGroupForReassign] = useState<
    number | null
  >(null);
  const [newClassGym, setNewClassGym] = useState<number | null>(null);
  const [newClassDate, setNewClassDate] = useState("");
  const [newClassBegin, setNewClassBegin] = useState("");
  const [newClassEnd, setNewClassEnd] = useState("");
  const [newClassWeeks, setNewClassWeeks] = useState("52");
  const currentYear = new Date().getFullYear().toString();
  const initialStartDate = new Date(Number(currentYear), 0, 1);
  const initialEndDate = new Date(Number(currentYear), 11, 31);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [filterError, setFilterError] = useState<string | null>(null);
  const [classFilterRange, setClassFilterRange] = useState<{ startDate: Date; endDate: Date } | null>({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });

  if (!isOpen || !group) return null;

  // ACTIONS
  const removeStudent = async (studentId: number) => {
    await apiClient.delete(`/groups/${group.id}/remove-student/${studentId}`);
    refresh();
  };
  const assignStudent = async (studentId: number) => {
    if (!selectedGroupForReassign) return alert("Select a group first");
    ///todo , look for name in database to see id 
    await apiClient.post(`/students/${studentId}/assign-group`, {
      groupId: group.id,
    });

    refresh();
  };


  const addClass = async () => {
    if (!newClassGym || !newClassDate || !newClassBegin || !newClassEnd)
      return alert("Fill all fields");

    const recurrenceWeeks = Number(newClassWeeks);
    if (!Number.isFinite(recurrenceWeeks) || recurrenceWeeks <= 0) {
      return alert("Recurrence weeks must be a positive number");
    }

    await apiClient.post(`/groups/${group.id}/classes`, {
      gymId: newClassGym,
      date: newClassDate,
      begin: newClassBegin,
      end: newClassEnd,
      recurrenceWeeks,
    });

    refresh();
  };

  const resetClassFilters = () => {
    setFilterYear(currentYear);
    setFilterMonth("");
    setFilterDay("");
    setFilterError(null);
    setClassFilterRange({ startDate: initialStartDate, endDate: initialEndDate });
  };

  const buildClassFilterRange = () => {
    const year = Number(filterYear);
    const month = filterMonth ? Number(filterMonth) : null;
    const day = filterDay ? Number(filterDay) : null;

    if (!filterYear || Number.isNaN(year) || year < 1900) {
      return { error: "Please enter a valid year" };
    }

    if (day !== null && month === null) {
      return { error: "Please enter a month when filtering by day" };
    }

    if (month !== null && (month < 1 || month > 12)) {
      return { error: "Month must be between 1 and 12" };
    }

    if (day !== null && (day < 1 || day > 31)) {
      return { error: "Day must be between 1 and 31" };
    }

    let startDate: Date;
    let endDate: Date;

    if (month === null) {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    } else if (day === null) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, month - 1, day);
      endDate = new Date(year, month - 1, day);
    }

    return { startDate, endDate };
  };

  const applyClassFilters = () => {
    const result = buildClassFilterRange();
    if (result?.error) {
      setFilterError(result.error);
      return;
    }

    if (result?.startDate && result?.endDate) {
      setFilterError(null);
      setClassFilterRange({ startDate: result.startDate, endDate: result.endDate });
    }
  };


  const deleteClass = async (classId: number) => {
    await apiClient.delete(`/classes/${classId}`);
    refresh();
  };


  const handleDeleteGroup = () => {
    if (window.confirm(`Delete group "${group.name}"?`)) {
      onDelete(group.id);
      onClose();
    }
  };

  return (
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
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--border-color)" }}>
          <TabButton
            active={activeTab === "students"}
            label="👥 Students"
            onClick={() => setActiveTab("students")}
          />
          <TabButton
            active={activeTab === "classes"}
            label="📅 Classes"
            onClick={() => setActiveTab("classes")}
          />
        </div>

        <div className="modal-body">
          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <StudentsTab
              students={students}
              allGroups={allGroups}
              removeStudent={removeStudent}
              assignStudent={assignStudent}
              setSelectedGroupForReassign={setSelectedGroupForReassign}
            />
          )}

          {/* CLASSES TAB */}
          {activeTab === "classes" && (
            <ClassesTab
              classes={classes}
              gyms={gyms}
              deleteClass={deleteClass}
              setNewClassDate={setNewClassDate}
              setNewClassBegin={setNewClassBegin}
              setNewClassEnd={setNewClassEnd}
              setNewClassGym={setNewClassGym}
              newClassWeeks={newClassWeeks}
              setNewClassWeeks={setNewClassWeeks}
              addClass={addClass}
              filterYear={filterYear}
              filterMonth={filterMonth}
              filterDay={filterDay}
              filterError={filterError}
              setFilterYear={setFilterYear}
              setFilterMonth={setFilterMonth}
              setFilterDay={setFilterDay}
              applyClassFilters={applyClassFilters}
              resetClassFilters={resetClassFilters}
              classFilterRange={classFilterRange}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// COMPONENTS
const TabButton = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    style={{
      padding: "0.75rem 1rem",
      borderRadius: "0",
      borderBottom: active ? "3px solid var(--primary-accent)" : "3px solid transparent",
      border: "none",
      background: "transparent",
      color: active ? "var(--primary-accent)" : "var(--text-secondary)",
      cursor: "pointer",
      fontWeight: active ? "600" : "500",
      transition: "all 0.3s ease",
    }}
  >
    {label}
  </button>
);

const StudentsTab = ({
  students,
  allGroups,
  removeStudent,
  assignStudent,
  setSelectedGroupForReassign,
}: any) => (
  <div>
    <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>
      Manage Students
    </h3>
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
                <td style={{ padding: "1rem" }}>
                  {s.firstName} {s.lastName}
                </td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button className="btn-danger btn-sm" onClick={() => removeStudent(s.id)}>
                      Remove
                    </button>

                    <select
                      onChange={(e) =>
                        setSelectedGroupForReassign(Number(e.target.value))
                      }
                      style={{
                        padding: "0.4rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                      }}
                    >
                      <option value="">Move to…</option>
                      {allGroups.map((g: any) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => assignStudent(s.id)}
                    >
                      Move
                    </button>
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

const ClassesTab = ({
  classes,
  gyms,
  deleteClass,
  setNewClassGym,
  setNewClassDate,
  setNewClassBegin,
  setNewClassEnd,
  newClassWeeks,
  setNewClassWeeks,
  addClass,
  filterYear,
  filterMonth,
  filterDay,
  filterError,
  setFilterYear,
  setFilterMonth,
  setFilterDay,
  applyClassFilters,
  resetClassFilters,
  classFilterRange,
}: any) => (
  <div>
    <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>
      Scheduled Classes
    </h3>
    <div style={{ marginTop: "0.5rem", padding: "1.5rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
      <h4 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>➕ Add New Class</h4>
      <p style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        This class will be created as a weekly recurring schedule (same day/time each week).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
        <select
          onChange={(e) => setNewClassGym(Number(e.target.value))}
          style={{
            padding: "0.6rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            fontSize: "0.9rem",
          }}
        >
          <option value="">Select Gym</option>
          {gyms.map((g: any) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          onChange={(e) => setNewClassDate(e.target.value)}
          style={{
            padding: "0.6rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            fontSize: "0.9rem",
          }}
        />
        <input
          type="time"
          onChange={(e) => setNewClassBegin(e.target.value)}
          style={{
            padding: "0.6rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            fontSize: "0.9rem",
          }}
        />
        <input
          type="time"
          onChange={(e) => setNewClassEnd(e.target.value)}
          style={{
            padding: "0.6rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            fontSize: "0.9rem",
          }}
        />
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        <input
          type="number"
          min={1}
          value={newClassWeeks}
          onChange={(e) => setNewClassWeeks(e.target.value)}
          placeholder="Recurrence weeks"
          style={{
            padding: "0.6rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            fontSize: "0.9rem",
            width: "180px",
          }}
        />
        <span style={{ marginLeft: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          weeks
        </span>
      </div>

      <button className="btn-primary" onClick={addClass} style={{ marginTop: "1rem" }}>
        ✓ Add Class
      </button>
    </div>

    <div className="card-container" style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        <input
          type="number"
          inputMode="numeric"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          placeholder="Year (e.g. 2026)"
          style={{
            padding: "0.6rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
        <input
          type="number"
          inputMode="numeric"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          placeholder="Month (1-12)"
          style={{
            padding: "0.6rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
        <input
          type="number"
          inputMode="numeric"
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          placeholder="Day (1-31)"
          style={{
            padding: "0.6rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
        <button className="btn-primary" onClick={applyClassFilters}>Search</button>
        <button className="btn-secondary" onClick={resetClassFilters}>Reset</button>
      </div>
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        Leave month/day empty to show the full year. Leave day empty to show the entire month.
      </p>
      {filterError && (
        <p style={{ margin: "0.75rem 0 0", color: "#c0392b", fontSize: "0.85rem" }}>{filterError}</p>
      )}
    </div>

    <div className="table-container" style={{ marginTop: "1.5rem" }}>
      <table>
        <thead>
          <tr>
            <th style={{ padding: "1rem" }}>Date</th>
            <th style={{ padding: "1rem" }}>Time</th>
            <th style={{ padding: "1rem" }}>Gym</th>
            <th style={{ padding: "1rem" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {classes.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                No classes scheduled
              </td>
            </tr>
          ) : (
            classes
              .filter((c: any) => {
                if (!classFilterRange) return true;
                const classDate = new Date(c.date);
                return classDate >= classFilterRange.startDate && classDate <= classFilterRange.endDate;
              })
              .map((c: any) => (
                <tr key={c.id}>
                  <td style={{ padding: "1rem" }}>{c.date}</td>
                  <td style={{ padding: "1rem" }}>
                    {c.begin}–{c.end}
                  </td>
                  <td style={{ padding: "1rem" }}>{c.gymName}</td>
                  <td style={{ padding: "1rem" }}>
                    <button className="btn-danger btn-sm" onClick={() => deleteClass(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
