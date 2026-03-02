import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";
import StudentList from "./StudentList";
import StudentDetailsModal from "./StudentDetailsModal";
import AddStudentModal from "./AddStudentModel"
import EditStudentModal from "./EditStudentModal"
export type Student = {
  id: number;
  firstName: string;
  lastName: string;
  cnp?: string;
  dateOfBirth?: string;
  email?: string;
  subscriptionType?: string;
  status?: string;
  groupId?: number | null;
  groupName?: string | null;
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
  const [editModalOpen, setEditModalOpen] = useState(false);

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
            `${s.lastName} ${s.firstName}`.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setFilteredStudents(groupStudents);
      });
      return;
    }

    if (searchQuery.trim()) {
      list = list.filter((s) =>
        `${s.lastName} ${s.firstName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStudents(list);
  }, [students, selectedGroup, searchQuery]);

  const handleSelectStudent = async (student: Student) => {
    const res = await apiClient.get(`/students/${student.id}`);
    setSelectedStudent(res.data);
    setDetailsModalOpen(true);
  };


  const handleDeleteStudent = async (id: number) => {
    await apiClient.delete(`/students/${id}`);
    await loadStudents();
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  };

  /** Reload the student list AND refresh the selected student in the modal */
  const reloadWithSelectedStudent = useCallback(async () => {
    await loadStudents();
    if (selectedStudent) {
      try {
        const res = await apiClient.get(`/students/${selectedStudent.id}`);
        setSelectedStudent(res.data);
      } catch {
        // student may have been deleted; leave as-is
      }
    }
  }, [loadStudents, selectedStudent]);

  return (
    <div className="page-layout">
      <Sidebar />

      <main className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>👥 Students Management</h1>
          <div className="header-actions">
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-primary"
            >
              ➕ Add New Student
            </button>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="filter-bar">
          <div className="filter-group" style={{ flex: 2 }}>
            <label>Search by name</label>
            <input
              type="text"
              placeholder="Enter student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Filter by group</label>
            <select
              value={selectedGroup}
              onChange={(e) =>
                setSelectedGroup(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
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
          onEdit={handleEditStudent}
          groups={groups}
          reload={reloadWithSelectedStudent}
        />
        <AddStudentModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          groups={groups}
          onSubmit={async (data) => {
            try {
              await apiClient.post("/students", data);
              setAddModalOpen(false);
              await loadStudents();
            } catch (err: any) {
              const msg = err?.response?.data?.message || "Failed to add student.";
              alert(msg);
            }
          }}
        />
        <EditStudentModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          student={selectedStudent}
          onSubmit={async (data) => {
            if (!selectedStudent) return;
            await apiClient.put(`/students/${selectedStudent.id}`, data);
            setEditModalOpen(false);
            await loadStudents();
          }}
        />
      </main>
    </div>
  );
}
