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

    await apiClient.post(`/groups/${group.id}/classes`, {
      gymId: newClassGym,
      date: newClassDate,
      begin: newClassBegin,
      end: newClassEnd,
    });

    refresh();
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "700px",
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>📘 {group.name}</h2>

          <button
            onClick={handleDeleteGroup}
            style={{
              background: "#d9534f",
              border: "none",
              color: "white",
              borderRadius: "6px",
              padding: "0.4rem 0.8rem",
              cursor: "pointer",
            }}
          >
            Delete Group
          </button>
        </div>

        {/* TABS */}
        <div
          style={{ display: "flex", marginTop: "1rem", marginBottom: "1rem" }}
        >
          <TabButton
            active={activeTab === "students"}
            label="Students"
            onClick={() => setActiveTab("students")}
          />
          <TabButton
            active={activeTab === "classes"}
            label="Classes"
            onClick={() => setActiveTab("classes")}
          />
        </div>

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
            addClass={addClass}
          />
        )}

        {/* FOOTER */}
        <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
          <button
            onClick={onClose}
            style={{
              background: "#4CAF50",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "6px",
            }}
          >
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
      flex: 1,
      padding: "0.7rem",
      background: active ? "#4CAF50" : "#f0f0f0",
      color: active ? "white" : "#555",
      border: "none",
      borderBottom: active ? "3px solid #398f3b" : "3px solid transparent",
      cursor: "pointer",
      fontWeight: 500,
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
    <h3>Students</h3>
    <div style={{ marginTop: "1rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f7f7f7", textAlign: "left" }}>
            <th style={th}>Name</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.map((s: any) => (
            <tr key={s.id} style={tr}>
              <td style={td}>
                {s.firstName} {s.lastName}
              </td>
              <td style={td}>
                <button style={dangerBtn} onClick={() => removeStudent(s.id)}>
                  Remove
                </button>

                <select
                  style={select}
                  onChange={(e) =>
                    setSelectedGroupForReassign(Number(e.target.value))
                  }
                >
                  <option value="">Reassign…</option>
                  {allGroups.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <button
                  style={secondaryBtn}
                  onClick={() => assignStudent(s.id)}
                >
                  Apply
                </button>
              </td>
            </tr>
          ))}
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
  addClass,
}: any) => (
  <div>
    <h3>Classes</h3>

    <table
      style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
    >
      <thead>
        <tr style={{ background: "#f7f7f7" }}>
          <th style={th}>Date</th>
          <th style={th}>Time</th>
          <th style={th}>Gym</th>
          <th style={th}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {classes.map((c: any) => (
          <tr key={c.id} style={tr}>
            <td style={td}>{c.date}</td>
            <td style={td}>
              {c.begin}–{c.end}
            </td>
            <td style={td}>{c.gymName}</td>
            <td style={td}>
              <button style={dangerBtn} onClick={() => deleteClass(c.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <h4 style={{ marginTop: "1.5rem" }}>Add Class</h4>

    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
      <select
        style={select}
        onChange={(e) => setNewClassGym(Number(e.target.value))}
      >
        <option value="">Gym</option>
        {gyms.map((g: any) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        style={input}
        onChange={(e) => setNewClassDate(e.target.value)}
      />
      <input
        type="time"
        style={input}
        onChange={(e) => setNewClassBegin(e.target.value)}
      />
      <input
        type="time"
        style={input}
        onChange={(e) => setNewClassEnd(e.target.value)}
      />

      <button style={primaryBtn} onClick={addClass}>
        Add
      </button>
    </div>
  </div>
);

// STYLE HELPERS
const th: React.CSSProperties = {
  padding: "0.7rem",
  fontWeight: 600,
  borderBottom: "1px solid #ddd",
};

const tr: React.CSSProperties = {
  borderBottom: "1px solid #eee",
};

const td: React.CSSProperties = {
  padding: "0.7rem",
};

const input: React.CSSProperties = {
  padding: "0.4rem",
  border: "1px solid #ccc",
  borderRadius: "6px",
  width: "100%",
};

const select: React.CSSProperties = {
  padding: "0.4rem",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const primaryBtn: React.CSSProperties = {
  background: "#4CAF50",
  border: "none",
  color: "white",
  padding: "0.45rem 0.8rem",
  borderRadius: "6px",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  background: "#5bc0de",
  border: "none",
  color: "white",
  padding: "0.4rem 0.7rem",
  borderRadius: "6px",
  marginLeft: "0.3rem",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  background: "#d9534f",
  border: "none",
  color: "white",
  padding: "0.4rem 0.7rem",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "0.3rem",
};
