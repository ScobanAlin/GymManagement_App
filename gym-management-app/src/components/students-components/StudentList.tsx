import React from "react";
import StudentCard from "./StudentCard";
import { Student } from "./StudentsPage";

type Props = {
    students: Student[];
    onSelectStudent: (student: Student) => void;
};

export default function StudentList({ students, onSelectStudent }: Props) {
    if (students.length === 0) {
        return <p>No students found.</p>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {students.map((s) => (
                <StudentCard key={s.id} student={s} onClick={() => onSelectStudent(s)} />
            ))}
        </div>
    );
}
