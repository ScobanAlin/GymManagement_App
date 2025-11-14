import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";
import StudentList from "./StudentList";
import StudentDetailsModal from "./StudentDetailsModal";
import AddStudentModal from "./AddStudentModel"
export type Student = {
    id: number;
    firstName: string;
    lastName: string;
};

export type Group = {
    id: number;
    name: string;
};

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);

    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    /** Load all students */
    const loadStudents = useCallback(async () => {
        const res = await apiClient.get("/students");
        setStudents(res.data);
        setFilteredStudents(res.data);
    }, []);

    /** Load all groups */
    const loadGroups = useCallback(async () => {
        const res = await apiClient.get("/groups");
        setGroups(res.data);
    }, []);

    useEffect(() => {
        loadStudents();
        loadGroups();
    }, [loadStudents, loadGroups]);

    /** Filter logic */
    useEffect(() => {
        let list = [...students];

        if (selectedGroup !== "all") {
            apiClient.get(`/groups/${selectedGroup}/students`).then((res) => {
                let groupStudents = res.data as Student[];

                if (searchQuery.trim()) {
                    groupStudents = groupStudents.filter((s) =>
                        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                }

                setFilteredStudents(groupStudents);
            });
            return;
        }

        if (searchQuery.trim()) {
            list = list.filter((s) =>
                `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredStudents(list);
    }, [students, selectedGroup, searchQuery]);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setDetailsModalOpen(true);
    };

    const handleDeleteStudent = async (id: number) => {
        await apiClient.delete(`/students/${id}`);
        await loadStudents();
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />

            <main style={{ padding: "1.5rem", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h1>🧍 Students</h1>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        style={{
                            padding: "0.5rem 1rem",
                            background: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            marginBottom: "1rem",
                        }}
                    >
                        ➕ Add Student
                    </button>
                </div>


                {/* FILTERS BAR */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            padding: "0.5rem",
                            flex: 1,
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                        }}
                    />

                    <select
                        value={selectedGroup}
                        onChange={(e) =>
                            setSelectedGroup(
                                e.target.value === "all" ? "all" : Number(e.target.value)
                            )
                        }
                        style={{
                            padding: "0.5rem",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                        }}
                    >
                        <option value="all">All Groups</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                </div>

                <StudentList
                    students={filteredStudents}
                    onSelectStudent={handleSelectStudent}
                />

                <StudentDetailsModal
                    isOpen={detailsModalOpen}
                    student={selectedStudent}
                    onClose={() => setDetailsModalOpen(false)}
                    onDelete={handleDeleteStudent}
                />
                <AddStudentModal
                    isOpen={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    groups={groups}
                    onSubmit={async (data) => {
                        await apiClient.post("/students", data);
                        setAddModalOpen(false);
                        await loadStudents();
                    }}
                />
            </main>
        </div>
    );
}
