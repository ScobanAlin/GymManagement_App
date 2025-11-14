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
            style={{
                padding: "1rem",
                background: "#fff",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f3f3")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
            <strong>
                {student.firstName} {student.lastName}
            </strong>
        </div>
    );
}
