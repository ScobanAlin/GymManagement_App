import React from "react";
import StudentCard from "./StudentCard";
import { Student } from "./StudentsPage";

type Props = {
    students: Student[];
    onSelectStudent: (student: Student) => void;
};

export default function StudentList({ students, onSelectStudent }: Props) {
    if (students.length === 0) {
        return (
            <div className="card-container">
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p style={{ margin: "0" }}>No students found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cards-grid">
            {students.map((s) => (
                <StudentCard key={s.id} student={s} onClick={() => onSelectStudent(s)} />
            ))}
        </div>
    );
}
