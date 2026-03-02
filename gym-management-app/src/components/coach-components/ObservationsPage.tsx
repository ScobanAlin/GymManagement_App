import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

interface Observation {
    id: number;
    description: string;
    createdAt: string;
    isRead: boolean;
    groupId: number | null;
    groupName: string | null;
    studentId: number | null;
    studentFirstName: string | null;
    studentLastName: string | null;
}

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

interface Class {
    id: number;
    classDate: string;
    beginTime: string;
    endTime: string;
    groupId: number;
    groupName: string;
    gymId: number;
    gymName: string;
    gymLocation: string;
}

export default function ObservationsPage() {
    const [observations, setObservations] = useState<Observation[]>([]);
    const [filteredObservations, setFilteredObservations] = useState<Observation[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    // Add observation form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    const [observationNotes, setObservationNotes] = useState("");
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [savingObservation, setSavingObservation] = useState(false);

    useEffect(() => {
        fetchObservations();
        fetchGroups();
        fetchClasses();
    }, []);

    useEffect(() => {
        filterObservations();
    }, [observations, selectedGroupId, searchTerm]);

    const fetchObservations = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/notifications");
            setObservations(res.data);
        } catch (err) {
            console.error("Error fetching observations:", err);
            setError("Failed to load observations");
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await apiClient.get("/groups");
            setGroups(res.data);
        } catch (err) {
            console.error("Error fetching groups:", err);
        }
    };

    const fetchClasses = async () => {
        try {
            const today = new Date().toISOString().split("T")[0];

            const res = await apiClient.get("/attendance/upcoming", {
                params: {
                    startDate: today,
                    endDate: today
                }
            });
            setClasses(res.data);
        } catch (err) {
            console.error("Error fetching classes:", err);
        }
    };

    const fetchStudentsForClass = async (classId: number) => {
        try {
            const selectedCls = classes.find(c => c.id === classId);
            if (!selectedCls) return;

            const res = await apiClient.get(`/attendance/groups/${selectedCls.groupId}/students`);
            setStudents(res.data);
            setSelectedStudent("");
        } catch (err) {
            console.error("Error fetching students:", err);
        }
    };

    const filterObservations = () => {
        let filtered = observations;

        // Filter by group
        if (selectedGroupId) {
            filtered = filtered.filter(obs => obs.groupId === Number(selectedGroupId));
        }

        // Filter by search term (student name)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(obs =>
                (obs.studentFirstName || "").toLowerCase().includes(term) ||
                (obs.studentLastName || "").toLowerCase().includes(term)
            );
        }

        setFilteredObservations(filtered);
    };

    const handleAddObservation = async () => {
        if (!selectedClass || !selectedStudent || !observationNotes.trim()) {
            alert("Please select a class, student, and add notes");
            return;
        }

        try {
            setSavingObservation(true);
            await apiClient.post("/notifications", {
                description: observationNotes,
                studentId: Number(selectedStudent),
                groupId: selectedClass.groupId
            });

            // Reset form
            setShowAddForm(false);
            setSelectedClass(null);
            setSelectedStudent("");
            setObservationNotes("");
            setStudents([]);

            // Refresh observations
            await fetchObservations();
        } catch (err) {
            console.error("Error creating observation:", err);
            alert("Failed to create observation");
        } finally {
            setSavingObservation(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatTime = (timeStr: string) => {
        return timeStr.slice(0, 5);
    };

    const formatDateTime = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString();
    };

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>📝 My Observations</h1>
                </div>

                {/* Add Observation Button */}
                <div style={{ marginBottom: "2rem" }}>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: showAddForm ? "#666" : "#4338ca",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "1rem"
                        }}
                    >
                        {showAddForm ? "✕ Cancel" : "+ Add New Observation"}
                    </button>
                </div>

                {/* Add Observation Form */}
                {showAddForm && (
                    <div className="card-container" style={{ marginBottom: "2rem", backgroundColor: "#f9f9f9" }}>
                        <h3 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>Add New Observation</h3>

                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            {/* Select Class */}
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>
                                    Select Class *
                                </label>
                                <select
                                    value={selectedClass?.id || ""}
                                    onChange={(e) => {
                                        const classId = Number(e.target.value);
                                        const cls = classes.find(c => c.id === classId) || null;
                                        setSelectedClass(cls);
                                        if (cls) {
                                            fetchStudentsForClass(classId);
                                        }
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-color)",
                                        fontFamily: "inherit",
                                        fontSize: "0.9rem",
                                        backgroundColor: "white"
                                    }}
                                >
                                    <option value="">-- Choose a class --</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.groupName} - {formatDate(cls.classDate)} at {formatTime(cls.beginTime)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Select Student */}
                            {selectedClass && (
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>
                                        Select Student *
                                    </label>
                                    <select
                                        value={selectedStudent}
                                        onChange={(e) => setSelectedStudent(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid var(--border-color)",
                                            fontFamily: "inherit",
                                            fontSize: "0.9rem",
                                            backgroundColor: "white"
                                        }}
                                    >
                                        <option value="">-- Choose a student --</option>
                                        {students.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.lastName} {student.firstName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Observation Notes */}
                            {selectedStudent && (
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>
                                        Observation Notes *
                                    </label>
                                    <textarea
                                        value={observationNotes}
                                        onChange={(e) => setObservationNotes(e.target.value)}
                                        placeholder="Write your observation here... (e.g., 'Great improvement in form', 'Arrived late', 'Needs extra focus on breathing technique')"
                                        style={{
                                            width: "100%",
                                            minHeight: "120px",
                                            padding: "0.75rem",
                                            borderRadius: "6px",
                                            border: "1px solid var(--border-color)",
                                            fontFamily: "inherit",
                                            fontSize: "0.9rem",
                                            resize: "vertical",
                                            backgroundColor: "white"
                                        }}
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            {selectedStudent && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    <button
                                        onClick={handleAddObservation}
                                        disabled={savingObservation}
                                        style={{
                                            padding: "0.75rem 1.5rem",
                                            backgroundColor: savingObservation ? "#ccc" : "#2ecc71",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: savingObservation ? "not-allowed" : "pointer",
                                            fontWeight: 600,
                                            fontSize: "0.9rem"
                                        }}
                                    >
                                        {savingObservation ? "Saving..." : "✓ Save Observation"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setSelectedClass(null);
                                            setSelectedStudent("");
                                            setObservationNotes("");
                                            setStudents([]);
                                        }}
                                        style={{
                                            padding: "0.75rem 1.5rem",
                                            backgroundColor: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            fontSize: "0.9rem"
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Filters Card */}
                <div className="card-container" style={{ marginBottom: "2rem" }}>
                    <h3 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>My Observations</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>
                                Filter by Group
                            </label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontFamily: "inherit",
                                    fontSize: "0.9rem",
                                    backgroundColor: "white"
                                }}
                            >
                                <option value="">All Groups</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>
                                Search Student
                            </label>
                            <input
                                type="text"
                                placeholder="Enter student name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontFamily: "inherit",
                                    fontSize: "0.9rem",
                                    backgroundColor: "white"
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="card-container">
                        <p style={{ margin: 0 }}>Loading observations...</p>
                    </div>
                ) : error ? (
                    <div className="card-container" style={{ color: "#c0392b" }}>
                        <p style={{ margin: 0 }}>{error}</p>
                    </div>
                ) : filteredObservations.length === 0 ? (
                    <div className="card-container">
                        <div className="empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <p style={{ margin: 0 }}>No observations yet. Click "Add New Observation" to create one.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
                            Showing {filteredObservations.length} observation{filteredObservations.length !== 1 ? "s" : ""}
                        </p>

                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            {filteredObservations.map(obs => (
                                <div
                                    key={obs.id}
                                    style={{
                                        padding: "1.5rem",
                                        backgroundColor: "var(--bg-secondary)",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-color)",
                                        borderLeft: "4px solid #4338ca"
                                    }}
                                >
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", marginBottom: "1rem", alignItems: "start" }}>
                                        <div>
                                            <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
                                                {obs.studentLastName} {obs.studentFirstName}
                                            </h4>
                                            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                                <strong>Group:</strong> {obs.groupName || "-"}
                                            </p>
                                        </div>
                                        <span style={{
                                            display: "inline-block",
                                            padding: "4px 12px",
                                            borderRadius: "4px",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            backgroundColor: "#e0e7ff",
                                            color: "#4338ca"
                                        }}>
                                            Observation
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr", gap: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                        <div>
                                            <strong>Recorded:</strong> {formatDateTime(obs.createdAt)}
                                        </div>
                                    </div>

                                    <div style={{ padding: "1rem", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: "6px" }}>
                                        <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                                            📌 Observation:
                                        </p>
                                        <p style={{ margin: 0, lineHeight: "1.5", color: "var(--text-primary)" }}>
                                            {obs.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

