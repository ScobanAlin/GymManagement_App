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
    id: number;
    classId: number;
    studentId: number;
    studentFirstName: string;
    studentLastName: string;
    cnp: string;
    attended: boolean;
    recordedAt: string;
}

export default function AdminAttendancePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [savingAttendance, setSavingAttendance] = useState<Record<number, boolean>>({});
    const currentYear = new Date().getFullYear().toString();
    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterDay, setFilterDay] = useState("");
    const [filterGroup, setFilterGroup] = useState("");

    useEffect(() => {
        const startDate = new Date(Number(currentYear), 0, 1).toISOString().split("T")[0];
        const endDate = new Date(Number(currentYear), 11, 31).toISOString().split("T")[0];
        fetchAllClasses({ startDate, endDate });
    }, []);

    const fetchAllClasses = async (range?: { startDate: string; endDate: string }) => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/attendance/upcoming", {
                params: range,
            });
            setClasses(res.data);
            setSelectedClassId(null);
            setAttendanceRecords([]);
        } catch (err) {
            console.error("Error fetching classes:", err);
            setError("Failed to load classes");
        } finally {
            setLoading(false);
        }
    };

    const buildDateRange = () => {
        const year = Number(filterYear);
        const month = filterMonth ? Number(filterMonth) : null;
        const day = filterDay ? Number(filterDay) : null;

        if (!filterYear || Number.isNaN(year) || year < 1900) {
            setError("Please enter a valid year");
            return null;
        }

        if (day !== null && month === null) {
            setError("Please enter a month when filtering by day");
            return null;
        }

        if (month !== null && (month < 1 || month > 12)) {
            setError("Month must be between 1 and 12");
            return null;
        }

        if (day !== null && (day < 1 || day > 31)) {
            setError("Day must be between 1 and 31");
            return null;
        }

        let startDate: Date;
        let endDate: Date;

        if (month === null) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
        } else if (day === null) {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
        } else {
            startDate = new Date(year, month - 1, day);
            endDate = new Date(year, month - 1, day);
        }

        return {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        };
    };

    const applyFilters = () => {
        setError(null);
        const range = buildDateRange();
        if (!range) return;
        fetchAllClasses(range);
    };

    const resetFilters = () => {
        setFilterYear(currentYear);
        setFilterMonth("");
        setFilterDay("");
        setFilterGroup("");
        setError(null);
        const startDate = new Date(Number(currentYear), 0, 1).toISOString().split("T")[0];
        const endDate = new Date(Number(currentYear), 11, 31).toISOString().split("T")[0];
        fetchAllClasses({ startDate, endDate });
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

    const updateAttendanceStatus = async (recordId: number, attended: boolean) => {
        const currentRecord = attendanceRecords.find((record) => record.id === recordId);
        if (!currentRecord || currentRecord.attended === attended) return;

        try {
            setSavingAttendance((prev) => ({ ...prev, [recordId]: true }));

            await apiClient.put(`/attendance/${recordId}`, {
                attended,
            });

            setAttendanceRecords((prev) =>
                prev.map((record) =>
                    record.id === recordId ? { ...record, attended } : record
                )
            );
        } catch (err) {
            console.error("Error saving attendance:", err);
            alert("Failed to save attendance");
        } finally {
            setSavingAttendance((prev) => ({ ...prev, [recordId]: false }));
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const uniqueGroups = Array.from(
        new Map(classes.map((c) => [c.groupId, c.groupName])).entries()
    ).map(([id, name]) => ({ id, name }));

    const displayedClasses = filterGroup
        ? classes.filter((c) => c.groupId === Number(filterGroup))
        : classes;

    const selectedClass = classes.find((c) => c.id === selectedClassId);

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>🗓️ Attendance Management (Admin)</h1>
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
                        <div>
                            <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>📚 Scheduled Classes</h3>
                            <div className="card-container" style={{ marginBottom: "1rem" }}>
                                <p style={{ margin: "0 0 1rem 0", fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                    🔍 Filter by Date
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {/* Year */}
                                    <div>
                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Year
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={filterYear}
                                            onChange={(e) => setFilterYear(e.target.value)}
                                            placeholder="e.g. 2026"
                                            style={{
                                                width: "100%",
                                                padding: "0.6rem 0.75rem",
                                                borderRadius: "8px",
                                                border: "1.5px solid var(--border-color)",
                                                fontFamily: "inherit",
                                                fontSize: "0.9rem",
                                                boxSizing: "border-box",
                                                outline: "none",
                                                transition: "border-color 0.2s",
                                            }}
                                        />
                                    </div>

                                    {/* Month */}
                                    <div>
                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Month <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                                        </label>
                                        <select
                                            value={filterMonth}
                                            onChange={(e) => { setFilterMonth(e.target.value); if (!e.target.value) setFilterDay(""); }}
                                            style={{
                                                width: "100%",
                                                padding: "0.6rem 0.75rem",
                                                borderRadius: "8px",
                                                border: "1.5px solid var(--border-color)",
                                                fontFamily: "inherit",
                                                fontSize: "0.9rem",
                                                boxSizing: "border-box",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                                outline: "none",
                                            }}
                                        >
                                            <option value="">— All months —</option>
                                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((name, i) => (
                                                <option key={i + 1} value={String(i + 1)}>{name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Group */}
                                    <div>
                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Group <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                                        </label>
                                        <select
                                            value={filterGroup}
                                            onChange={(e) => setFilterGroup(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "0.6rem 0.75rem",
                                                borderRadius: "8px",
                                                border: "1.5px solid var(--border-color)",
                                                fontFamily: "inherit",
                                                fontSize: "0.9rem",
                                                boxSizing: "border-box",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                                outline: "none",
                                            }}
                                        >
                                            <option value="">— All groups —</option>
                                            {uniqueGroups.map((g) => (
                                                <option key={g.id} value={String(g.id)}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Day — only shown when month is selected */}
                                    {filterMonth && (
                                        <div>
                                            <label style={{ display: "block", marginBottom: "4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                Day <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                                            </label>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={filterDay}
                                                onChange={(e) => setFilterDay(e.target.value)}
                                                placeholder="1 – 31"
                                                min={1}
                                                max={31}
                                                style={{
                                                    width: "100%",
                                                    padding: "0.6rem 0.75rem",
                                                    borderRadius: "8px",
                                                    border: "1.5px solid var(--border-color)",
                                                    fontFamily: "inherit",
                                                    fontSize: "0.9rem",
                                                    boxSizing: "border-box",
                                                    outline: "none",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                                    <button
                                        className="btn-primary"
                                        onClick={applyFilters}
                                        style={{ flex: 1 }}
                                    >
                                        Search
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={resetFilters}
                                        style={{ flex: 1 }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            {displayedClasses.length === 0 ? (
                                <div className="card-container">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🔍</div>
                                        <p style={{ margin: 0, fontSize: "0.9rem" }}>No classes found for this filter</p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: "0.5rem", maxHeight: "600px", overflowY: "auto" }}>
                                    {displayedClasses.map((cls) => {
                                        return (
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
                                                    transition: "all 0.2s",
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
                                        );
                                    })}
                                </div>
                            )}
                        </div>

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
                                        <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-primary)" }}>Class Details</h3>
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
                                                <p style={{ margin: 0 }}>
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
                                                    {attendanceRecords.map((record, idx) => (
                                                        <tr
                                                            key={record.id}
                                                            style={{
                                                                backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                                                                borderBottom: "1px solid var(--border-color)",
                                                                transition: "background-color 0.2s",
                                                            }}
                                                        >
                                                            <td style={{ padding: "1rem", color: "var(--text-primary)" }}>
                                                                <div style={{ fontWeight: 600 }}>{record.studentFirstName} {record.studentLastName}</div>
                                                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>CNP: {record.cnp}</div>
                                                            </td>
                                                            <td style={{ padding: "1rem", textAlign: "center" }}>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                                                    <button
                                                                        onClick={() => updateAttendanceStatus(record.id, true)}
                                                                        disabled={savingAttendance[record.id]}
                                                                        style={{
                                                                            padding: "0.5rem",
                                                                            backgroundColor: record.attended ? "#2ecc71" : "transparent",
                                                                            color: record.attended ? "white" : "var(--text-primary)",
                                                                            border: `2px solid ${record.attended ? "#2ecc71" : "var(--border-color)"}`,
                                                                            borderRadius: "4px",
                                                                            cursor: savingAttendance[record.id] ? "not-allowed" : "pointer",
                                                                            fontWeight: 600,
                                                                            fontSize: "0.85rem",
                                                                            opacity: savingAttendance[record.id] ? 0.7 : 1,
                                                                        }}
                                                                    >
                                                                        ✓ Present
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateAttendanceStatus(record.id, false)}
                                                                        disabled={savingAttendance[record.id]}
                                                                        style={{
                                                                            padding: "0.5rem",
                                                                            backgroundColor: !record.attended ? "#e74c3c" : "transparent",
                                                                            color: !record.attended ? "white" : "var(--text-primary)",
                                                                            border: `2px solid ${!record.attended ? "#e74c3c" : "var(--border-color)"}`,
                                                                            borderRadius: "4px",
                                                                            cursor: savingAttendance[record.id] ? "not-allowed" : "pointer",
                                                                            fontWeight: 600,
                                                                            fontSize: "0.85rem",
                                                                            opacity: savingAttendance[record.id] ? 0.7 : 1,
                                                                        }}
                                                                    >
                                                                        ✗ Absent
                                                                    </button>
                                                                </div>
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
                    </div>
                )}
            </main>
        </div>
    );
}
