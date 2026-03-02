import React from "react";
import { Student } from "./StudentsPage";

type Props = {
    student: Student;
    onClick: () => void;
};

export default function StudentCard({ student, onClick }: Props) {
    return (
        <div
            onClick={onClick}
            className="card-container"
            style={{
                cursor: "pointer",
            }}
        >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
                {student.lastName} {student.firstName}
            </h3>
            {student.cnp && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    ID: {student.cnp}
                </p>
            )}
            {student.groupName && (
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Group: <span style={{ fontWeight: "600", color: "var(--primary-accent)" }}>{student.groupName}</span>
                </p>
            )}
            {student.status && (
                <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: "0.75rem", display: "inline-block" }}>
                    {student.status}
                </span>
            )}
        </div>
    );
}
