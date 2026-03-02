import { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

interface Group {
    id: number;
    name: string;
}

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    cnp: string;
}

interface StudentDetails {
    id: number;
    firstName: string;
    lastName: string;
    cnp?: string;
    dateOfBirth?: string;
    subscriptionType?: string;
    status?: string;
    groupName?: string | null;
}

interface Class {
    id: number;
    date: string;
    begin: string;
    end: string;
    gymName: string;
}

interface ClassAttendance {
    id: number;
    studentFirstName: string;
    studentLastName: string;
    attended: boolean;
    recordedAt: string;
}

export default function MyGroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [activeTab, setActiveTab] = useState<"students" | "classes">("students");
    const [groupStudents, setGroupStudents] = useState<Record<number, Student[]>>({});
    const [groupClasses, setGroupClasses] = useState<Record<number, Class[]>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

    const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
    const [studentModalOpen, setStudentModalOpen] = useState(false);
    const [studentModalLoading, setStudentModalLoading] = useState(false);

    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [classModalOpen, setClassModalOpen] = useState(false);
    const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
    const [classModalLoading, setClassModalLoading] = useState(false);

    const currentYear = new Date().getFullYear().toString();
    const initialStartDate = new Date(Number(currentYear), 0, 1);
    const initialEndDate = new Date(Number(currentYear), 11, 31);
    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterDow, setFilterDow] = useState<number | null>(null);
    const [filterError, setFilterError] = useState<string | null>(null);
    const [classFilterRange, setClassFilterRange] = useState<{ startDate: Date; endDate: Date } | null>({
        startDate: initialStartDate,
        endDate: initialEndDate,
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/groups");
            setGroups(res.data);
        } catch (err) {
            console.error("Error fetching groups:", err);
            setError("Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupDetails = async (groupId: number) => {
        try {
            setLoadingDetails((prev) => ({ ...prev, [groupId]: true }));

            const [studentsRes, classesRes] = await Promise.all([
                apiClient.get(`/groups/${groupId}/students`),
                apiClient.get(`/groups/${groupId}/classes`),
            ]);

            setGroupStudents((prev) => ({ ...prev, [groupId]: studentsRes.data }));
            setGroupClasses((prev) => ({ ...prev, [groupId]: classesRes.data }));
        } catch (err) {
            console.error(`Error fetching group ${groupId} details:`, err);
        } finally {
            setLoadingDetails((prev) => ({ ...prev, [groupId]: false }));
        }
    };

    const openGroupModal = async (group: Group) => {
        setSelectedGroup(group);
        setActiveTab("students");
        resetClassFilters();
        setGroupModalOpen(true);

        if (!groupStudents[group.id] || !groupClasses[group.id]) {
            await fetchGroupDetails(group.id);
        }
    };

    const closeGroupModal = () => {
        setGroupModalOpen(false);
        setSelectedGroup(null);
    };

    const openStudentModal = async (studentId: number) => {
        try {
            setStudentModalOpen(true);
            setStudentModalLoading(true);
            const res = await apiClient.get(`/students/${studentId}`);
            setSelectedStudent(res.data);
        } catch (err) {
            console.error("Error loading student details:", err);
            alert("Failed to load student details");
            setStudentModalOpen(false);
        } finally {
            setStudentModalLoading(false);
        }
    };

    const openClassModal = async (cls: Class) => {
        try {
            setClassModalOpen(true);
            setClassModalLoading(true);
            setSelectedClass(cls);

            const res = await apiClient.get(`/attendance/classes/${cls.id}`);
            setClassAttendance(res.data);
        } catch (err) {
            console.error("Error loading class details:", err);
            alert("Failed to load class details");
            setClassModalOpen(false);
        } finally {
            setClassModalLoading(false);
        }
    };

    const closeStudentModal = () => {
        setStudentModalOpen(false);
        setSelectedStudent(null);
    };

    const closeClassModal = () => {
        setClassModalOpen(false);
        setSelectedClass(null);
        setClassAttendance([]);
    };

    const resetClassFilters = () => {
        setFilterYear(currentYear);
        setFilterMonth("");
        setFilterDow(null);
        setFilterError(null);
        setClassFilterRange({ startDate: initialStartDate, endDate: initialEndDate });
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

    const formatDob = (iso: string | undefined) => {
        if (!iso) return "-";
        const d = new Date(iso);
        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const year = d.getUTCFullYear();
        return `${day}.${month}.${year}`;
    };

    const buildClassFilterRange = () => {
        const year = Number(filterYear);
        const month = filterMonth ? Number(filterMonth) : null;

        if (!filterYear || Number.isNaN(year) || year < 1900) {
            return { error: "Please enter a valid year" };
        }

        if (month !== null && (month < 1 || month > 12)) {
            return { error: "Month must be between 1 and 12" };
        }

        let startDate: Date;
        let endDate: Date;

        if (month === null) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
        } else {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
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

    const filteredGroups = groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredClasses = selectedGroup
        ? (groupClasses[selectedGroup.id] || []).filter((cls) => {
            const [y, m, d] = cls.date.split("-").map(Number);
            const localDate = new Date(y, m - 1, d);
            if (classFilterRange) {
                if (localDate < classFilterRange.startDate || localDate > classFilterRange.endDate) return false;
            }
            if (filterDow !== null && localDate.getDay() !== filterDow) return false;
            return true;
        })
        : [];

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>💪 My Groups</h1>
                </div>

                {loading && (
                    <div className="card-container" style={{ marginBottom: "1rem" }}>
                        <p style={{ margin: 0 }}>Loading groups...</p>
                    </div>
                )}

                {error && (
                    <div className="card-container" style={{ marginBottom: "1rem", color: "#c0392b" }}>
                        <p style={{ margin: 0 }}>{error}</p>
                    </div>
                )}

                {!loading && groups.length === 0 && (
                    <div className="card-container">
                        <div className="empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <p style={{ margin: "0" }}>No groups found</p>
                        </div>
                    </div>
                )}

                {!loading && groups.length > 0 && (
                    <div style={{ display: "grid", gap: "1rem" }}>
                        <div className="card-container">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="🔍 Search groups by name..."
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontFamily: "inherit",
                                    fontSize: "0.95rem",
                                }}
                            />
                        </div>

                        {filteredGroups.map((group) => (
                            <div key={group.id} className="card-container">
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        padding: "0.5rem 0",
                                    }}
                                    onClick={() => openGroupModal(group)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && openGroupModal(group)}
                                >
                                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>{group.name}</h3>
                                    <span style={{ fontSize: "1rem", color: "var(--primary-accent)", fontWeight: 700 }}>
                                        Open Details →
                                    </span>
                                </div>
                            </div>
                        ))}

                        {filteredGroups.length === 0 && (
                            <div className="card-container">
                                <div className="empty-state">
                                    <div className="empty-state-icon">🔍</div>
                                    <p style={{ margin: 0 }}>No groups match your search</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {groupModalOpen && selectedGroup && (
                <div className="modal-overlay" onClick={closeGroupModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
                        <div className="modal-header">
                            <h2>💪 {selectedGroup.name}</h2>
                            <button className="modal-close" onClick={closeGroupModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)" }}>
                                <button
                                    onClick={() => setActiveTab("students")}
                                    style={{
                                        padding: "0.75rem 1rem",
                                        border: "none",
                                        borderBottom: activeTab === "students" ? "3px solid #4338ca" : "3px solid transparent",
                                        background: "transparent",
                                        color: activeTab === "students" ? "#4338ca" : "var(--text-secondary)",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    👥 Students ({groupStudents[selectedGroup.id]?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab("classes")}
                                    style={{
                                        padding: "0.75rem 1rem",
                                        border: "none",
                                        borderBottom: activeTab === "classes" ? "3px solid #2ecc71" : "3px solid transparent",
                                        background: "transparent",
                                        color: activeTab === "classes" ? "#2ecc71" : "var(--text-secondary)",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    🗓️ Classes ({filteredClasses.length})
                                </button>
                            </div>

                            {loadingDetails[selectedGroup.id] ? (
                                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Loading details...</p>
                            ) : activeTab === "students" ? (
                                groupStudents[selectedGroup.id]?.length === 0 ? (
                                    <p style={{ color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>No students in this group</p>
                                ) : (
                                    <div style={{ display: "grid", gap: "0.5rem" }}>
                                        {groupStudents[selectedGroup.id]?.map((student) => (
                                            <div
                                                key={student.id}
                                                onClick={() => openStudentModal(student.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === "Enter" && openStudentModal(student.id)}
                                                style={{
                                                    padding: "1rem",
                                                    backgroundColor: "var(--bg-secondary)",
                                                    borderRadius: "8px",
                                                    borderLeft: "4px solid #4338ca",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <p style={{ margin: "0 0 0.25rem 0", fontWeight: 600 }}>
                                                    {student.lastName} {student.firstName}
                                                </p>
                                                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", color: "#4338ca", fontWeight: 600 }}>
                                                    Click for details →
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <>
                                    <div className="card-container" style={{ marginBottom: "0.75rem" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {/* Year + Month row */}
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                                <div>
                                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Year</label>
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={filterYear}
                                                        onChange={(e) => setFilterYear(e.target.value)}
                                                        placeholder="e.g. 2026"
                                                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontFamily: "inherit", fontSize: "0.9rem", boxSizing: "border-box" as const }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Month <span style={{ fontWeight: 400, textTransform: "none" as const, letterSpacing: 0 }}>(optional)</span></label>
                                                    <select
                                                        value={filterMonth}
                                                        onChange={(e) => setFilterMonth(e.target.value)}
                                                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontFamily: "inherit", fontSize: "0.9rem", boxSizing: "border-box" as const, backgroundColor: "white", cursor: "pointer" }}
                                                    >
                                                        <option value="">— All months —</option>
                                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((name, i) => (
                                                            <option key={i + 1} value={String(i + 1)}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {/* Day of week pills */}
                                            <div>
                                                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Day of Week <span style={{ fontWeight: 400, textTransform: "none" as const, letterSpacing: 0 }}>(optional)</span></label>
                                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
                                                    {[{ label: "Mon", value: 1 }, { label: "Tue", value: 2 }, { label: "Wed", value: 3 }, { label: "Thu", value: 4 }, { label: "Fri", value: 5 }, { label: "Sat", value: 6 }, { label: "Sun", value: 0 }].map((d) => {
                                                        const active = filterDow === d.value;
                                                        return (
                                                            <button
                                                                key={d.value}
                                                                type="button"
                                                                onClick={() => setFilterDow(active ? null : d.value)}
                                                                style={{
                                                                    padding: "0.3rem 0.8rem", borderRadius: "20px", cursor: "pointer",
                                                                    border: `2px solid ${active ? "#2ecc71" : "var(--border-color)"}`,
                                                                    background: active ? "#2ecc71" : "transparent",
                                                                    color: active ? "#fff" : "var(--text-secondary)",
                                                                    fontWeight: active ? 700 : 400, fontSize: "0.85rem",
                                                                    transition: "all 0.2s ease",
                                                                }}
                                                            >
                                                                {d.label}
                                                            </button>
                                                        );
                                                    })}
                                                    {filterDow !== null && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFilterDow(null)}
                                                            style={{ padding: "0.3rem 0.7rem", borderRadius: "20px", cursor: "pointer", border: "1.5px solid var(--border-color)", background: "transparent", color: "var(--text-secondary)", fontSize: "0.78rem" }}
                                                        >
                                                            ✕ Clear
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                                            <button className="btn-primary" onClick={applyClassFilters} style={{ flex: 1 }}>Search</button>
                                            <button className="btn-secondary" onClick={resetClassFilters} style={{ flex: 1 }}>Reset</button>
                                        </div>
                                        {filterError && (
                                            <p style={{ margin: "0.75rem 0 0", color: "#c0392b", fontSize: "0.85rem" }}>{filterError}</p>
                                        )}
                                    </div>
                                    {filteredClasses.length === 0 ? (
                                        <p style={{ color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>No classes found for this filter</p>
                                    ) : (
                                        <div style={{ display: "grid", gap: "0.5rem" }}>
                                            {filteredClasses.map((cls) => (
                                                <div
                                                    key={cls.id}
                                                    onClick={() => openClassModal(cls)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => e.key === "Enter" && openClassModal(cls)}
                                                    style={{
                                                        padding: "1rem",
                                                        backgroundColor: "var(--bg-secondary)",
                                                        borderRadius: "8px",
                                                        borderLeft: "4px solid #2ecc71",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <p style={{ margin: "0 0 0.25rem 0", fontWeight: 600 }}>
                                                        {formatDate(cls.date)}
                                                    </p>
                                                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                                        {cls.begin} - {cls.end} at {cls.gymName}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#2ecc71", fontWeight: 600 }}>
                                                        Click for details →
                                                    </p>
                                                    <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                                        Weekly recurring schedule
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-primary" onClick={closeGroupModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {studentModalOpen && (
                <div className="modal-overlay" onClick={closeStudentModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px" }}>
                        <div className="modal-header">
                            <h2>👤 Student Details</h2>
                            <button className="modal-close" onClick={closeStudentModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            {studentModalLoading ? (
                                <p style={{ margin: 0 }}>Loading student details...</p>
                            ) : !selectedStudent ? (
                                <p style={{ margin: 0, color: "#c0392b" }}>Student details not available</p>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <p style={{ margin: "0 0 0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Name</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedStudent.lastName} {selectedStudent.firstName}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>CNP</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedStudent.cnp || "-"}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Date of Birth</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{formatDob(selectedStudent.dateOfBirth)}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Subscription</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedStudent.subscriptionType || "-"}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Status</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedStudent.status || "-"}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Group</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedStudent.groupName || "Not assigned"}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-primary" onClick={closeStudentModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {classModalOpen && (
                <div className="modal-overlay" onClick={closeClassModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
                        <div className="modal-header">
                            <h2>🗓️ Class Details</h2>
                            <button className="modal-close" onClick={closeClassModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            {!selectedClass ? null : (
                                <div style={{ marginBottom: "1.25rem" }}>
                                    <p style={{ margin: "0 0 0.35rem 0" }}><strong>Date:</strong> {formatDate(selectedClass.date)}</p>
                                    <p style={{ margin: "0 0 0.35rem 0" }}><strong>Time:</strong> {selectedClass.begin} - {selectedClass.end}</p>
                                    <p style={{ margin: 0 }}><strong>Gym:</strong> {selectedClass.gymName}</p>
                                </div>
                            )}

                            {classModalLoading ? (
                                <p style={{ margin: 0 }}>Loading class attendance...</p>
                            ) : (
                                <>
                                    <p style={{ marginBottom: "0.75rem", color: "var(--text-secondary)" }}>
                                        Students in class: {classAttendance.length}
                                    </p>

                                    {classAttendance.length === 0 ? (
                                        <p style={{ margin: 0, color: "var(--text-secondary)" }}>No attendance records found.</p>
                                    ) : (
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                                        <th style={{ padding: "0.75rem", textAlign: "left" }}>Student</th>
                                                        <th style={{ padding: "0.75rem", textAlign: "center" }}>Status</th>
                                                        <th style={{ padding: "0.75rem", textAlign: "right" }}>Recorded</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {classAttendance.map((row) => (
                                                        <tr key={row.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                                            <td style={{ padding: "0.75rem" }}>{row.studentLastName} {row.studentFirstName}</td>
                                                            <td style={{ padding: "0.75rem", textAlign: "center" }}>
                                                                <span style={{
                                                                    padding: "0.2rem 0.5rem",
                                                                    borderRadius: "999px",
                                                                    fontSize: "0.8rem",
                                                                    backgroundColor: row.attended ? "#d4edda" : "#f8d7da",
                                                                    color: row.attended ? "#155724" : "#721c24",
                                                                    fontWeight: 600,
                                                                }}>
                                                                    {row.attended ? "Present" : "Absent"}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "0.75rem", textAlign: "right", color: "var(--text-secondary)" }}>
                                                                {new Date(row.recordedAt).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-primary" onClick={closeClassModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
