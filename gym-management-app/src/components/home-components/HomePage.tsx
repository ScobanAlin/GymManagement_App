import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

interface Student {
    id: number;
}

interface Group {
    id: number;
}

interface Coach {
    id: number;
}

interface UnpaidStudent {
    id: number;
}

interface ClassSession {
    id: number;
}

interface NotificationItem {
    id: number;
    description: string;
    createdAt: string;
    isRead?: boolean;
    studentFirstName?: string;
    studentLastName?: string;
    groupName?: string;
    coachFirstName?: string;
    coachLastName?: string;
}

export default function HomePage() {
    const navigate = useNavigate();
    const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
    const role = user?.role || "guest";
    const isCoach = role === "coach";
    const isAdmin = role === "admin";

    const [studentsCount, setStudentsCount] = useState(0);
    const [groupsCount, setGroupsCount] = useState(0);
    const [coachesCount, setCoachesCount] = useState(0);
    const [todayClassesCount, setTodayClassesCount] = useState(0);
    const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

    const currentMonth = useMemo(() => {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        };
    }, []);

    const fetchNotifications = async () => {
        const notificationsRes = await apiClient.get("/notifications");
        const unreadNotifications = (notificationsRes.data as NotificationItem[]).filter(
            (notification) => !notification.isRead
        );
        setRecentNotifications(unreadNotifications);
    };

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoading(true);

                if (isCoach) {
                    const today = new Date().toISOString().split("T")[0];
                    const [classesRes, unpaidRes] = await Promise.all([
                        apiClient.get("/attendance/upcoming", {
                            params: {
                                startDate: today,
                                endDate: today,
                            },
                        }),
                        apiClient.get("/payments/unpaid", {
                            params: { year: currentMonth.year, month: currentMonth.month },
                        }),
                    ]);

                    setTodayClassesCount((classesRes.data as ClassSession[]).length);
                    setPendingPaymentsCount((unpaidRes.data as UnpaidStudent[]).length);
                    setStudentsCount(0);
                    setGroupsCount(0);
                    setCoachesCount(0);
                } else {
                    const [studentsRes, groupsRes, coachesRes, unpaidRes] = await Promise.all([
                        apiClient.get("/students"),
                        apiClient.get("/groups"),
                        apiClient.get("/coaches"),
                        apiClient.get("/payments/unpaid", {
                            params: { year: currentMonth.year, month: currentMonth.month },
                        }),
                    ]);

                    setStudentsCount((studentsRes.data as Student[]).length);
                    setGroupsCount((groupsRes.data as Group[]).length);
                    setCoachesCount((coachesRes.data as Coach[]).length);
                    setPendingPaymentsCount((unpaidRes.data as UnpaidStudent[]).length);
                }

                await fetchNotifications();
            } catch (error) {
                console.error("Error loading home dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, [currentMonth.month, currentMonth.year, isCoach]);

    const formatDateTime = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString();
    };

    const markNotificationAsRead = async (notification: NotificationItem) => {
        if (notification.isRead) return { ...notification, isRead: true };

        try {
            await apiClient.put(`/notifications/${notification.id}/read`, {
                isRead: true,
            });

            const updated = { ...notification, isRead: true };
            setSelectedNotification(updated);
            await fetchNotifications();
            return updated;
        } catch (error) {
            console.error("Error updating notification:", error);
            alert("Failed to update notification");
            return notification;
        }
    };

    const openNotificationModal = async (notification: NotificationItem) => {
        const updated = await markNotificationAsRead(notification);
        setSelectedNotification(updated);
    };

    const handleDelete = async (notification: NotificationItem) => {
        if (!window.confirm("Delete this notification?")) return;

        try {
            await apiClient.delete(`/notifications/${notification.id}`);
            setSelectedNotification(null);
            await fetchNotifications();
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("Failed to delete notification");
        }
    };

    const getStudentName = (notification: NotificationItem) => {
        if (!notification.studentFirstName) return "Unknown student";
        return `${notification.studentFirstName} ${notification.studentLastName || ""}`.trim();
    };

    const getCoachName = (notification: NotificationItem) => {
        if (!notification.coachFirstName) return "System";
        return `${notification.coachFirstName} ${notification.coachLastName || ""}`.trim();
    };

    return (
        <div className="page-layout">
            <Sidebar />

            <main className="page-content">
                {/* Page Header */}
                <div className="page-header">
                    <h1>🏋️‍♂️ Welcome to Gym Management</h1>
                </div>

                {/* Dashboard Overview */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>Dashboard Overview</h2>

                    {/* Stats Cards Grid */}
                    <div className="cards-grid">
                        {isAdmin && (
                            <>
                                <div className="card-container">
                                    <div className="card-header">
                                        <h3 className="card-title">👥 Total Students</h3>
                                        <span style={{ fontSize: "1.5rem" }}>{loading ? "..." : studentsCount}</span>
                                    </div>
                                    <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                        Active members in the system
                                    </p>
                                </div>

                                <div className="card-container">
                                    <div className="card-header">
                                        <h3 className="card-title">💪 Training Groups</h3>
                                        <span style={{ fontSize: "1.5rem" }}>{loading ? "..." : groupsCount}</span>
                                    </div>
                                    <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                        Active training sessions
                                    </p>
                                </div>

                                <div className="card-container">
                                    <div className="card-header">
                                        <h3 className="card-title">🧑‍🏫 Coaches</h3>
                                        <span style={{ fontSize: "1.5rem" }}>{loading ? "..." : coachesCount}</span>
                                    </div>
                                    <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                        Professional trainers
                                    </p>
                                </div>
                            </>
                        )}

                        {isCoach && (
                            <div className="card-container">
                                <div className="card-header">
                                    <h3 className="card-title">🗓️ Today's Classes</h3>
                                    <span style={{ fontSize: "1.5rem" }}>{loading ? "..." : todayClassesCount}</span>
                                </div>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                    Classes scheduled for today
                                </p>
                            </div>
                        )}

                        <div className="card-container">
                            <div className="card-header">
                                <h3 className="card-title">💳 Pending Payments</h3>
                                <span style={{ fontSize: "1.5rem", color: "var(--warning-color)" }}>
                                    {loading ? "..." : pendingPaymentsCount}
                                </span>
                            </div>
                            <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                Students unpaid this month
                            </p>
                        </div>

                        {isCoach && (
                            <div className="card-container">
                                <div className="card-header">
                                    <h3 className="card-title">🔔 Unread Notifications</h3>
                                    <span style={{ fontSize: "1.5rem" }}>{loading ? "..." : recentNotifications.length}</span>
                                </div>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                    Items requiring your attention
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quick Actions */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>Quick Actions</h2>

                    {isCoach ? (
                        <div className="cards-grid">
                            <div
                                className="card-container"
                                onClick={() => navigate("/my-groups")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/my-groups");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💪</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>My Groups</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>View your assigned groups</p>
                            </div>

                            <div
                                className="card-container"
                                onClick={() => navigate("/attendance")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/attendance");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🗓️</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>Attendance</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage class attendance</p>
                            </div>

                            <div
                                className="card-container"
                                onClick={() => navigate("/payments")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/payments");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💰</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>Payments</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Register monthly payments</p>
                            </div>

                            <div
                                className="card-container"
                                onClick={() => navigate("/observations")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/observations");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📝</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>Observations</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Add and review observations</p>
                            </div>
                        </div>
                    ) : (
                        <div className="cards-grid">
                            <div
                                className="card-container"
                                onClick={() => navigate("/students")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/students");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👤</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>Add Student</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Register new member</p>
                            </div>

                            <div
                                className="card-container"
                                onClick={() => navigate("/groups")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/groups");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📋</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>View Groups</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage training groups</p>
                            </div>

                            <div
                                className="card-container"
                                onClick={() => navigate("/payments")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/payments");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💰</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>Process Payments</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Collect memberships</p>
                            </div>

                            <div
                                className="card-container"
                                onClick={() => navigate("/reports")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") navigate("/reports");
                                }}
                                style={{ cursor: "pointer", textAlign: "center", paddingTop: "2rem", paddingBottom: "2rem" }}
                            >
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
                                <h3 style={{ margin: "0 0 0.5rem 0" }}>View Reports</h3>
                                <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Analytics & insights</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Recent Activity */}
                <section>
                    <h2 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>Recent Activity</h2>

                    <div className="card-container">
                        {loading ? (
                            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                                <p>Loading recent activity...</p>
                            </div>
                        ) : recentNotifications.length === 0 ? (
                            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
                                <p>No recent activity yet</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: "10px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
                                {recentNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openNotificationModal(notification)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                openNotificationModal(notification);
                                            }
                                        }}
                                        style={{
                                            padding: "12px 16px",
                                            borderBottom: "1px solid var(--border-color)",
                                            borderLeft: notification.isRead ? "4px solid #d0d7de" : "4px solid #2ecc71",
                                            backgroundColor: notification.isRead ? "#f7f8f9" : "#ffffff",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
                                            <div style={{ fontWeight: notification.isRead ? 500 : 700 }}>{notification.description}</div>
                                            <span
                                                style={{
                                                    padding: "2px 10px",
                                                    borderRadius: "999px",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    backgroundColor: notification.isRead ? "#e9ecef" : "#e7f9ef",
                                                    color: notification.isRead ? "#6c757d" : "#1b7f4b",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {notification.isRead ? "READ" : "UNREAD"}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>
                                            Student: <strong>{getStudentName(notification)}</strong>
                                            {notification.groupName ? ` • Group: ${notification.groupName}` : ""}
                                            {` • Coach: ${getCoachName(notification)}`}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                            {formatDateTime(notification.createdAt)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {selectedNotification && (
                    <div
                        onClick={() => setSelectedNotification(null)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                        }}
                    >
                        <div
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                padding: "28px",
                                maxWidth: "640px",
                                width: "90%",
                                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "14px" }}>
                                <h2 style={{ margin: 0, color: "#2c3e50" }}>Notification Details</h2>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    <button
                                        onClick={async () => {
                                            const updated = await markNotificationAsRead(selectedNotification);
                                            setSelectedNotification(updated);
                                        }}
                                        style={{
                                            backgroundColor: selectedNotification.isRead ? "#3498db" : "#27ae60",
                                            color: "white",
                                            border: "none",
                                            padding: "6px 12px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Mark Read
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedNotification)}
                                        style={{
                                            backgroundColor: "#e74c3c",
                                            color: "white",
                                            border: "none",
                                            padding: "6px 12px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedNotification(null);
                                            navigate("/notifications");
                                        }}
                                        style={{
                                            backgroundColor: "#8e44ad",
                                            color: "white",
                                            border: "none",
                                            padding: "6px 12px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Open Notifications
                                    </button>
                                    <button
                                        onClick={() => setSelectedNotification(null)}
                                        style={{
                                            backgroundColor: "#95a5a6",
                                            color: "white",
                                            border: "none",
                                            padding: "6px 12px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <p style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#2c3e50" }}>
                                {selectedNotification.description}
                            </p>
                            <p style={{ margin: "0 0 8px 0", color: "#555", fontSize: "14px" }}>
                                Student: <strong>{getStudentName(selectedNotification)}</strong>
                                {selectedNotification.groupName ? ` • Group: ${selectedNotification.groupName}` : ""}
                            </p>
                            <p style={{ margin: "0 0 8px 0", color: "#555", fontSize: "14px" }}>
                                Coach: <strong>{getCoachName(selectedNotification)}</strong>
                            </p>
                            <p style={{ margin: "0", color: "#888", fontSize: "12px" }}>
                                {formatDateTime(selectedNotification.createdAt)}
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}