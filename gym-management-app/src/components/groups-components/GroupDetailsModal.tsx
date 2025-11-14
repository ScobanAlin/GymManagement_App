import React, { useState } from "react";
import { Group } from "./GroupPage";

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
};

type GroupDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onDelete: (groupId: number) => void;
    group: Group | null;
    students: Student[];
    classes: ClassItem[];
};

export default function GroupDetailsModal({
    isOpen,
    onClose,
    onDelete,
    group,
    students,
    classes,
}: GroupDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<"students" | "classes">("students");

    if (!isOpen || !group) return null;

    const handleDeleteClick = () => {
        if (window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
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
                zIndex: 1500,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "600px",
                    background: "white",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h2>📘 Group Details</h2>

                    {/* DELETE GROUP BUTTON */}
                    <button
                        onClick={handleDeleteClick}
                        style={{
                            background: "#e74c3c",
                            height: "2.5rem",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.3rem 0.7rem",
                            cursor: "pointer",
                        }}
                    >
                        Delete
                    </button>
                </div>

                <h3 style={{ marginBottom: "1.5rem" }}>{group.name}</h3>

                {/* TABS */}
                <div style={{ display: "flex", marginBottom: "1rem" }}>
                    <button
                        onClick={() => setActiveTab("students")}
                        style={{
                            flex: 1,
                            padding: "0.7rem",
                            background: activeTab === "students" ? "#4CAF50" : "#eee",
                            color: activeTab === "students" ? "white" : "#333",
                            border: "none",
                            borderRadius: "6px 0 0 6px",
                            cursor: "pointer",
                        }}
                    >
                        Students
                    </button>

                    <button
                        onClick={() => setActiveTab("classes")}
                        style={{
                            flex: 1,
                            padding: "0.7rem",
                            background: activeTab === "classes" ? "#4CAF50" : "#eee",
                            color: activeTab === "classes" ? "white" : "#333",
                            border: "none",
                            borderRadius: "0 6px 6px 0",
                            cursor: "pointer",
                        }}
                    >
                        Classes
                    </button>
                </div>

                {/* TAB CONTENT */}
                {activeTab === "students" && (
                    <div>
                        <h4>Students</h4>
                        {students.length === 0 ? (
                            <p>No students in this group.</p>
                        ) : (
                            <ul>
                                {students.map((s) => (
                                    <li key={s.id}>
                                        {s.firstName} {s.lastName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === "classes" && (
                    <div>
                        <h4>Classes</h4>
                        {classes.length === 0 ? (
                            <p>No classes scheduled.</p>
                        ) : (
                            <ul>
                                {classes.map((c) => (
                                    <li key={c.id}>
                                        {c.date} — {c.begin} to {c.end} @ {c.gymName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#4CAF50",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
