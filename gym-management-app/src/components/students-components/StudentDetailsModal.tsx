import React, { useState, useEffect } from "react";
import { Student, Group } from "./StudentsPage";
import apiClient from "../../services/apiClient";

type Payment = {
    id: number;
    amount: number;
    month: string;
    payment_date: string;
};

type AttendanceReportRecord = {
    id: number;
    attended: boolean;
    classDate: string;
    beginTime: string;
    endTime: string;
    groupName: string;
    gymName: string;
    gymLocation?: string;
};

type StudentNotification = {
    id: number;
    description: string;
    createdAt: string;
    isRead: boolean;
    studentId: number | null;
    groupName?: string | null;
    coachFirstName?: string | null;
    coachLastName?: string | null;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    groups: Group[];
    onDelete: (id: number) => void;
    reload: () => void; // reload students list after edits
};

export default function StudentDetailsModal({
    isOpen,
    onClose,
    student,
    groups,
    onDelete,
    reload,
}: Props) {
    const [activeTab, setActiveTab] = useState("details");
    const [payments, setPayments] = useState<Payment[]>([]);
    const [groupId, setGroupId] = useState<number | null>(null);
    const [subscriptionType, setSubscriptionType] = useState("normal");
    const [status, setStatus] = useState("active");
    const [attendanceReports, setAttendanceReports] = useState<AttendanceReportRecord[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState<string | null>(null);
    const [attendanceSearch, setAttendanceSearch] = useState("");
    const [attendanceYear, setAttendanceYear] = useState("");
    const [attendanceMonth, setAttendanceMonth] = useState("");
    const [attendanceDay, setAttendanceDay] = useState("");
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<StudentNotification | null>(null);

    // Load additional student data when modal opens
    useEffect(() => {
        if (!student) return;

        setGroupId(student.groupId ?? null);
        setSubscriptionType(student.subscriptionType ?? "normal");
        setStatus(student.status ?? "active");

        // Fetch payments
        apiClient.get(`/students/${student.id}/payments`).then((res) => {
            setPayments(res.data);
        });
    }, [student]);

    useEffect(() => {
        if (!student || activeTab !== "attendance") return;

        const fetchAttendance = async () => {
            try {
                setAttendanceLoading(true);
                setAttendanceError(null);

                const response = await apiClient.get("/reports/attendance", {
                    params: { studentId: student.id },
                });

                setAttendanceReports(response.data ?? []);
            } catch (error) {
                console.error("Error fetching student attendance:", error);
                setAttendanceError("Failed to load attendance");
                setAttendanceReports([]);
            } finally {
                setAttendanceLoading(false);
            }
        };

        fetchAttendance();
    }, [student, activeTab]);

    useEffect(() => {
        if (!student || activeTab !== "reports") return;

        const fetchStudentNotifications = async () => {
            try {
                setNotificationsLoading(true);
                setNotificationsError(null);

                const response = await apiClient.get("/notifications");
                const allNotifications = (response.data ?? []) as StudentNotification[];
                setNotifications(allNotifications.filter((item) => item.studentId === student.id));
            } catch (error) {
                console.error("Error fetching student notifications:", error);
                setNotificationsError("Failed to load notifications");
                setNotifications([]);
            } finally {
                setNotificationsLoading(false);
            }
        };

        fetchStudentNotifications();
    }, [student, activeTab]);

    if (!isOpen || !student) return null;

    const formatDateOfBirth = (date?: string) => {
        if (!date) return "-";

        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return date;

        const day = String(parsedDate.getDate()).padStart(2, "0");
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const year = String(parsedDate.getFullYear());

        return `${day}.${month}.${year}`;
    };

    const formatPaymentDateTime = (dateTime?: string) => {
        if (!dateTime) return "-";

        const parsedDate = new Date(dateTime);
        if (Number.isNaN(parsedDate.getTime())) return dateTime;

        const day = String(parsedDate.getDate()).padStart(2, "0");
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const year = String(parsedDate.getFullYear());
        const hours = String(parsedDate.getHours()).padStart(2, "0");
        const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

        return `${day}.${month}.${year} - ${hours}:${minutes}`;
    };

    const formatDate = (date?: string) => {
        if (!date) return "-";

        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return date;

        const day = String(parsedDate.getDate()).padStart(2, "0");
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const year = String(parsedDate.getFullYear());

        return `${day}.${month}.${year}`;
    };

    const formatDateTime = (dateTime?: string) => {
        if (!dateTime) return "-";

        const parsedDate = new Date(dateTime);
        if (Number.isNaN(parsedDate.getTime())) return dateTime;

        const day = String(parsedDate.getDate()).padStart(2, "0");
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const year = String(parsedDate.getFullYear());
        const hours = String(parsedDate.getHours()).padStart(2, "0");
        const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

        return `${day}.${month}.${year} - ${hours}:${minutes}`;
    };

    const filteredAttendance = attendanceReports.filter((item) => {
        const classDate = new Date(item.classDate);
        const searchTerm = attendanceSearch.trim().toLowerCase();

        if (Number.isNaN(classDate.getTime())) return false;

        if (attendanceYear && classDate.getFullYear() !== Number(attendanceYear)) return false;
        if (attendanceMonth && classDate.getMonth() + 1 !== Number(attendanceMonth)) return false;
        if (attendanceDay && classDate.getDate() !== Number(attendanceDay)) return false;

        if (!searchTerm) return true;

        const searchableText = `${item.groupName} ${item.gymName} ${item.gymLocation ?? ""} ${item.beginTime} ${item.endTime} ${item.attended ? "yes" : "no"}`.toLowerCase();
        return searchableText.includes(searchTerm);
    });

    const handleDelete = () => {
        if (window.confirm("Delete student?")) {
            onDelete(student.id);
            onClose();
        }
    };

    const handleAssignGroup = async () => {
        await apiClient.post(`/students/${student.id}/assign-group`, { groupId });
        alert("Group updated!");
        reload();
    };

    const markNotificationAsRead = async (notification: StudentNotification) => {
        if (notification.isRead) return { ...notification, isRead: true };

        try {
            await apiClient.put(`/notifications/${notification.id}/read`, {
                isRead: true,
            });

            const updated = { ...notification, isRead: true };
            setNotifications((prev) =>
                prev.map((item) => (item.id === notification.id ? updated : item))
            );
            return updated;
        } catch (error) {
            console.error("Error updating notification:", error);
            alert("Failed to update notification");
            return notification;
        }
    };

    const openNotificationModal = async (notification: StudentNotification) => {
        const updated = await markNotificationAsRead(notification);
        setSelectedNotification(updated);
    };



    const handleStatusChange = async () => {
        const newStatus = status === "active" ? "inactive" : "active";
        await apiClient.post(`/students/${student.id}/status`, {
            status: newStatus,
        });
        setStatus(newStatus);
        alert("Status updated!");
        reload();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: "700px" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>👤 {student.firstName} {student.lastName}</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {/* ---------- TABS ---------- */}
                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginBottom: "1.5rem",
                            borderBottom: "2px solid var(--border-color)",
                            overflowX: "auto",
                            overflowY: "hidden",
                            whiteSpace: "nowrap",
                            WebkitOverflowScrolling: "touch",
                            paddingBottom: "0.25rem",
                        }}
                    >
                        {[
                            "details",
                            "assign",
                            "status",
                            "reports",
                            "attendance",
                            "payments",
                        ].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderRadius: "0",
                                    flexShrink: 0,
                                    borderBottom: activeTab === tab ? "3px solid var(--primary-accent)" : "3px solid transparent",
                                    border: "none",
                                    background: "transparent",
                                    color: activeTab === tab ? "var(--primary-accent)" : "var(--text-secondary)",
                                    cursor: "pointer",
                                    fontWeight: activeTab === tab ? "600" : "500",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {tab === "details" && "👤 Details"}
                                {tab === "assign" && "🔄 Assign"}
                                {tab === "status" && "❄️ Status"}
                                {tab === "reports" && "📄 Reports"}
                                {tab === "attendance" && "🗓️ Attendance"}
                                {tab === "payments" && "💰 Payments"}
                            </button>
                        ))}
                    </div>

                    {/* ---------- TAB CONTENT ---------- */}
                    {activeTab === "details" && (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 0.25rem 0" }}>CNP</p>
                                    <p style={{ fontWeight: "600", margin: "0 0 1rem 0" }}>{student.cnp}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 0.25rem 0" }}>Date of Birth</p>
                                    <p style={{ fontWeight: "600", margin: "0 0 1rem 0" }}>{formatDateOfBirth(student.dateOfBirth)}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 0.25rem 0" }}>Subscription</p>
                                    <p style={{ fontWeight: "600", margin: "0 0 1rem 0" }}>{subscriptionType}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 0.25rem 0" }}>Status</p>
                                    <span className={`badge badge-${status === 'active' ? 'success' : 'warning'}`} style={{ marginBottom: "1rem", display: "inline-block" }}>
                                        {status}
                                    </span>
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 0.25rem 0" }}>Group</p>
                                    <p style={{ fontWeight: "600", margin: "0" }}>{student.groupName || "Not assigned"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "assign" && (
                        <div>
                            <div className="form-group">
                                <label>Assign to Group</label>
                                <select
                                    value={groupId ?? ""}
                                    onChange={(e) => setGroupId(Number(e.target.value))}
                                    style={{ width: "100%" }}
                                >
                                    <option value="">Select group</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleAssignGroup} className="btn-primary">
                                ✓ Save Assignment
                            </button>
                        </div>
                    )}

                    {activeTab === "status" && (
                        <div>
                            <p style={{ marginBottom: "1.5rem" }}>
                                Current Status: <span className={`badge badge-${status === 'active' ? 'success' : 'warning'}`}>{status}</span>
                            </p>
                            <button onClick={handleStatusChange} className={status === "active" ? "btn-warning" : "btn-success"}>
                                {status === "active"
                                    ? "❄️ Freeze Membership"
                                    : "🔥 Activate Membership"}
                            </button>
                        </div>
                    )}

                    {activeTab === "reports" && (
                        <div>
                            {notificationsLoading ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">⏳</div>
                                    <p style={{ margin: 0 }}>Loading notifications...</p>
                                </div>
                            ) : notificationsError ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">⚠️</div>
                                    <p style={{ margin: 0 }}>{notificationsError}</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📄</div>
                                    <p style={{ margin: 0 }}>No notifications for this student</p>
                                </div>
                            ) : (
                                <div>
                                    <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "var(--text-primary)" }}>
                                        Student Notifications ({notifications.length})
                                    </h3>
                                    <div style={{ display: "grid", gap: "12px" }}>
                                        {notifications.map((item) => (
                                            <div
                                                key={item.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => openNotificationModal(item)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        openNotificationModal(item);
                                                    }
                                                }}
                                                style={{
                                                    padding: "12px 16px",
                                                    border: "1px solid var(--border-color)",
                                                    borderLeft: item.isRead ? "4px solid #d0d7de" : "4px solid #2ecc71",
                                                    borderRadius: "8px",
                                                    backgroundColor: item.isRead ? "#f7f8f9" : "#ffffff",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
                                                    <div style={{ fontWeight: item.isRead ? 500 : 700 }}>{item.description}</div>
                                                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                                        {formatDateTime(item.createdAt)}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "13px", color: "#555" }}>
                                                    {item.groupName ? `Group: ${item.groupName} • ` : ""}
                                                    Coach: {item.coachFirstName || item.coachLastName
                                                        ? `${item.coachFirstName || ""} ${item.coachLastName || ""}`.trim()
                                                        : "System"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "attendance" && (
                        <div>
                            <div className="filter-bar" style={{ marginBottom: "1rem" }}>
                                <div className="filter-group" style={{ flex: 2 }}>
                                    <label>Search attendance</label>
                                    <input
                                        type="text"
                                        value={attendanceSearch}
                                        onChange={(e) => setAttendanceSearch(e.target.value)}
                                        placeholder="Search by group, gym, time or status"
                                    />
                                </div>
                                <div className="filter-group" style={{ minWidth: "130px" }}>
                                    <label>Year</label>
                                    <input
                                        type="number"
                                        value={attendanceYear}
                                        onChange={(e) => setAttendanceYear(e.target.value)}
                                        placeholder="2026"
                                    />
                                </div>
                                <div className="filter-group" style={{ minWidth: "110px" }}>
                                    <label>Month</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={attendanceMonth}
                                        onChange={(e) => setAttendanceMonth(e.target.value)}
                                        placeholder="1-12"
                                    />
                                </div>
                                <div className="filter-group" style={{ minWidth: "110px" }}>
                                    <label>Day</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={attendanceDay}
                                        onChange={(e) => setAttendanceDay(e.target.value)}
                                        placeholder="1-31"
                                    />
                                </div>
                            </div>

                            {attendanceLoading ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">⏳</div>
                                    <p style={{ margin: 0 }}>Loading attendance...</p>
                                </div>
                            ) : attendanceError ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">⚠️</div>
                                    <p style={{ margin: 0 }}>{attendanceError}</p>
                                </div>
                            ) : filteredAttendance.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🗓️</div>
                                    <p style={{ margin: 0 }}>No attendance records found</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: "1rem" }}>Date</th>
                                                <th style={{ padding: "1rem" }}>Time</th>
                                                <th style={{ padding: "1rem" }}>Group</th>
                                                <th style={{ padding: "1rem" }}>Gym</th>
                                                <th style={{ padding: "1rem" }}>Attended</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAttendance.map((item) => (
                                                <tr key={item.id}>
                                                    <td style={{ padding: "1rem" }}>{formatDate(item.classDate)}</td>
                                                    <td style={{ padding: "1rem" }}>{item.beginTime} - {item.endTime}</td>
                                                    <td style={{ padding: "1rem" }}>{item.groupName}</td>
                                                    <td style={{ padding: "1rem" }}>
                                                        {item.gymName}
                                                        {item.gymLocation ? ` (${item.gymLocation})` : ""}
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <span className={`badge ${item.attended ? "badge-success" : "badge-warning"}`}>
                                                            {item.attended ? "Yes" : "No"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div>
                            {payments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">💰</div>
                                    <p>No payments recorded</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: "1rem" }}>Month</th>
                                                <th style={{ padding: "1rem" }}>Amount</th>
                                                <th style={{ padding: "1rem" }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((p) => (
                                                <tr key={p.id}>
                                                    <td style={{ padding: "1rem" }}>{p.month}</td>
                                                    <td style={{ padding: "1rem", fontWeight: "600" }}>{p.amount} RON</td>
                                                    <td style={{ padding: "1rem" }}>{formatPaymentDateTime(p.payment_date)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ---------- FOOTER ---------- */}
                <div className="modal-footer">
                    <button onClick={handleDelete} className="btn-danger btn-sm">
                        🗑 Delete
                    </button>
                    <button onClick={onClose} className="btn-primary">
                        Close
                    </button>
                </div>
            </div>

            {selectedNotification ? (
                <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setSelectedNotification(null)}>
                    <div className="modal-content" style={{ maxWidth: "600px" }} onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🔔 Notification</h2>
                            <button className="modal-close" onClick={() => setSelectedNotification(null)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <p style={{ margin: "0 0 12px 0", fontSize: "16px", color: "var(--text-primary)" }}>
                                {selectedNotification.description}
                            </p>
                            <p style={{ margin: "0 0 8px 0", color: "#555", fontSize: "14px" }}>
                                {selectedNotification.groupName ? `Group: ${selectedNotification.groupName}` : "Group: -"}
                            </p>
                            <p style={{ margin: "0 0 8px 0", color: "#555", fontSize: "14px" }}>
                                Coach: {selectedNotification.coachFirstName || selectedNotification.coachLastName
                                    ? `${selectedNotification.coachFirstName || ""} ${selectedNotification.coachLastName || ""}`.trim()
                                    : "System"}
                            </p>
                            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>
                                {formatDateTime(selectedNotification.createdAt)}
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-secondary btn-sm"
                                onClick={async () => {
                                    if (!selectedNotification) return;
                                    const updated = await markNotificationAsRead(selectedNotification);
                                    setSelectedNotification(updated);
                                }}
                            >
                                Mark Read
                            </button>
                            <button className="btn-primary" onClick={() => setSelectedNotification(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
