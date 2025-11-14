import React from "react";
import { Student } from "./StudentsPage";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onDelete: (id: number) => void;
};

export default function StudentDetailsModal({ isOpen, onClose, student, onDelete }: Props) {
    if (!isOpen || !student) return null;

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${student.firstName}?`)) {
            onDelete(student.id);
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
                    width: "400px",
                    background: "white",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
                }}
            >
                <h2>Student Details</h2>
                <h3 style={{ marginBottom: "1rem" }}>
                    {student.firstName} {student.lastName}
                </h3>

                <button
                    onClick={handleDelete}
                    style={{
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "1rem",
                    }}
                >
                    Delete Student
                </button>

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
    );
}
