import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

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

interface AttendanceRecord {
    id: number | null;
    classId: number;
    studentId: number;
    studentFirstName: string;
    studentLastName: string;
    cnp: string;
    attended: boolean | null;
    recordedAt: string | null;
}

export default function AttendancePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [savingAttendance, setSavingAttendance] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchUpcomingClasses();
    }, []);

    const fetchUpcomingClasses = async () => {
        try {
            setLoading(true);
            setError(null);
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
            setError("Failed to load classes");
        } finally {
            setLoading(false);
        }
    };

    const fetchClassAttendance = async (classId: number) => {
        try {
            setLoadingAttendance(true);
            setSelectedClassId(classId);
            const res = await apiClient.get(`/attendance/classes/${classId}`);
            setAttendanceRecords(res.data);
        } catch (err) {
            console.error("Error fetching attendance:", err);
            alert("Failed to load attendance records");
        } finally {
            setLoadingAttendance(false);
        }
    };

    const updateAttendanceStatus = async (classId: number, studentId: number, attended: boolean) => {
        const currentRecord = attendanceRecords.find(record => record.studentId === studentId);
        if (!currentRecord || currentRecord.attended === attended) return;

        try {
            setSavingAttendance(prev => ({ ...prev, [studentId]: true }));

            if (attended) {
                await apiClient.post(`/attendance/classes/${classId}/students/${studentId}/present`);
            } else {
                await apiClient.post(`/attendance/classes/${classId}/students/${studentId}/absent`);
            }

            // Refresh attendance records for the class
            const res = await apiClient.get(`/attendance/classes/${classId}`);
            setAttendanceRecords(res.data);
        } catch (err) {
            console.error("Error saving attendance:", err);
            alert("Failed to save attendance");
        } finally {
            setSavingAttendance(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric"
        });
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>🗓️ Attendance Management</h1>
                </div>

                {loading ? (
                    <div className="card-container">
                        <p style={{ margin: 0 }}>Loading classes...</p>
                    </div>
                ) : error ? (
                    <div className="card-container" style={{ color: "#c0392b" }}>
                        <p style={{ margin: 0 }}>{error}</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem" }}>
                        {/* Classes List */}
                        <div>
                            <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>📅 Today's Classes</h3>
                            {classes.length === 0 ? (
                                <div className="card-container">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🔍</div>
                                        <p style={{ margin: 0, fontSize: "0.9rem" }}>No classes today</p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: "0.5rem", maxHeight: "600px", overflowY: "auto" }}>
                                    {classes.map(cls => (
                                        <div
                                            key={cls.id}
                                            onClick={() => fetchClassAttendance(cls.id)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === "Enter" && fetchClassAttendance(cls.id)}
                                            style={{
                                                padding: "1rem",
                                                backgroundColor: selectedClassId === cls.id ? "#e3f2fd" : "var(--bg-secondary)",
                                                border: selectedClassId === cls.id ? "2px solid #4338ca" : "1px solid var(--border-color)",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600, color: "var(--text-primary)" }}>
                                                {cls.groupName}
                                            </p>
                                            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                                {formatDate(cls.classDate)}
                                            </p>
                                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                                                {cls.beginTime} - {cls.endTime}
                                            </p>
                                            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#666" }}>
                                                📍 {cls.gymName}
                                            </p>
                                            <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                                Weekly recurring schedule
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attendance Details */}
                        <div>
                            {!selectedClassId ? (
                                <div className="card-container">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👈</div>
                                        <p style={{ margin: 0 }}>Select a class to manage attendance</p>
                                    </div>
                                </div>
                            ) : loadingAttendance ? (
                                <div className="card-container">
                                    <p style={{ margin: 0 }}>Loading attendance...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="card-container" style={{ marginBottom: "1.5rem", backgroundColor: "#f0f4f8" }}>
                                        <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-primary)" }}>
                                            Class Details
                                        </h3>
                                        {selectedClass && (
                                            <>
                                                <p style={{ margin: "0 0 0.5rem 0" }}>
                                                    <strong>Group:</strong> {selectedClass.groupName}
                                                </p>
                                                <p style={{ margin: "0 0 0.5rem 0" }}>
                                                    <strong>Date:</strong> {formatDate(selectedClass.classDate)}
                                                </p>
                                                <p style={{ margin: "0 0 0.5rem 0" }}>
                                                    <strong>Time:</strong> {selectedClass.beginTime} - {selectedClass.endTime}
                                                </p>
                                                <p style={{ margin: "0" }}>
                                                    <strong>Location:</strong> {selectedClass.gymName}, {selectedClass.gymLocation}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>
                                        📝 Student Attendance ({attendanceRecords.length})
                                    </h3>

                                    {attendanceRecords.length === 0 ? (
                                        <div className="card-container">
                                            <div className="empty-state">
                                                <div className="empty-state-icon">🔍</div>
                                                <p style={{ margin: 0 }}>No students enrolled</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "2px solid var(--border-color)" }}>
                                                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "var(--text-primary)" }}>Student</th>
                                                        <th style={{ padding: "1rem", textAlign: "center", fontWeight: 600, color: "var(--text-primary)" }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceRecords.map((record, idx) => {
                                                        return (
                                                            <tr
                                                                key={record.studentId}
                                                                style={{
                                                                    backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                                                                    borderBottom: "1px solid var(--border-color)",
                                                                    transition: "background-color 0.2s"
                                                                }}
                                                            >
                                                                <td style={{ padding: "1rem", color: "var(--text-primary)" }}>
                                                                    <div style={{ fontWeight: 600 }}>{record.studentLastName} {record.studentFirstName}</div>
                                                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>CNP: {record.cnp}</div>
                                                                </td>
                                                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                                                        <button
                                                                            onClick={() => updateAttendanceStatus(selectedClassId!, record.studentId, true)}
                                                                            disabled={savingAttendance[record.studentId]}
                                                                            style={{
                                                                                padding: "0.5rem",
                                                                                backgroundColor: record.attended === true ? "#2ecc71" : "transparent",
                                                                                color: record.attended === true ? "white" : "var(--text-primary)",
                                                                                border: `2px solid ${record.attended === true ? "#2ecc71" : "var(--border-color)"}`,
                                                                                borderRadius: "4px",
                                                                                cursor: savingAttendance[record.studentId] ? "not-allowed" : "pointer",
                                                                                fontWeight: 600,
                                                                                fontSize: "0.85rem",
                                                                                opacity: savingAttendance[record.studentId] ? 0.7 : 1
                                                                            }}
                                                                        >
                                                                            ✓ Present
                                                                        </button>
                                                                        <button
                                                                            onClick={() => updateAttendanceStatus(selectedClassId!, record.studentId, false)}
                                                                            disabled={savingAttendance[record.studentId]}
                                                                            style={{
                                                                                padding: "0.5rem",
                                                                                backgroundColor: record.attended === false ? "#e74c3c" : "transparent",
                                                                                color: record.attended === false ? "white" : "var(--text-primary)",
                                                                                border: `2px solid ${record.attended === false ? "#e74c3c" : "var(--border-color)"}`,
                                                                                borderRadius: "4px",
                                                                                cursor: savingAttendance[record.studentId] ? "not-allowed" : "pointer",
                                                                                fontWeight: 600,
                                                                                fontSize: "0.85rem",
                                                                                opacity: savingAttendance[record.studentId] ? 0.7 : 1
                                                                            }}
                                                                        >
                                                                            ✗ Absent
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
