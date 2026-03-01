import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

/* ───────────── shared quick-action card ───────────── */
function ActionCard({
    icon,
    label,
    description,
    accent,
    onClick,
}: {
    icon: string;
    label: string;
    description: string;
    accent: string;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? accent : "var(--card-background, #fff)",
                border: `2px solid ${accent}`,
                borderRadius: "14px",
                padding: "1.5rem 1.25rem",
                cursor: "pointer",
                textAlign: "center",
                transition: "background 0.18s, transform 0.15s, box-shadow 0.18s",
                transform: hovered ? "translateY(-3px)" : "none",
                boxShadow: hovered ? `0 8px 24px ${accent}55` : "0 2px 8px rgba(0,0,0,0.07)",
                userSelect: "none",
            }}
        >
            <div style={{ fontSize: "2.4rem", marginBottom: "0.65rem" }}>{icon}</div>
            <div style={{
                fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem",
                color: hovered ? "#fff" : "var(--text-primary)",
            }}>{label}</div>
            <div style={{
                fontSize: "0.8rem",
                color: hovered ? "rgba(255,255,255,0.82)" : "var(--text-secondary)",
            }}>{description}</div>
        </div>
    );
}

/* ───────────── stat card ───────────── */
function StatCard({
    icon, value, label, accent, loading, alert,
}: {
    icon: string; value: number; label: string; accent: string; loading: boolean; alert?: boolean;
}) {
    return (
        <div className="card-container" style={{ borderLeft: `5px solid ${accent}`, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.6rem" }}>{icon}</span>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: alert ? "#e74c3c" : accent }}>
                    {loading ? "…" : value}
                </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-primary)" }}>{label}</div>
        </div>
    );
}

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
    const [gymsCount, setGymsCount] = useState(0);
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
                    const [studentsRes, groupsRes, coachesRes, gymsRes, unpaidRes] = await Promise.all([
                        apiClient.get("/students"),
                        apiClient.get("/groups"),
                        apiClient.get("/coaches"),
                        apiClient.get("/gyms"),
                        apiClient.get("/payments/unpaid", {
                            params: { year: currentMonth.year, month: currentMonth.month },
                        }),
                    ]);

                    setStudentsCount((studentsRes.data as Student[]).length);
                    setGroupsCount((groupsRes.data as Group[]).length);
                    setCoachesCount((coachesRes.data as Coach[]).length);
                    setGymsCount((gymsRes.data as unknown[]).length);
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

    const markNotificationAsUnread = async (notification: NotificationItem) => {
        if (!notification.isRead) return { ...notification, isRead: false };

        try {
            await apiClient.put(`/notifications/${notification.id}/read`, {
                isRead: false,
            });

            const updated = { ...notification, isRead: false };
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

    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="page-layout">
            <Sidebar />

            <main className="page-content">
                {/* ── Header ── */}
                <div className="page-header" style={{ marginBottom: "1.75rem" }}>
                    <div>
                        <h1 style={{ marginBottom: "0.25rem" }}>
                            {isAdmin ? "🏋️‍♂️ Admin Dashboard" : "🏠 Dashboard"}
                        </h1>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                            {greeting}, <strong>{user.first_name || "User"}</strong> —{" "}
                            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                </div>

                {/* ══════════ ADMIN DASHBOARD ══════════ */}
                {isAdmin && (
                    <>
                        {/* Stat Cards */}
                        <section style={{ marginBottom: "2.5rem" }}>
                            <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)", fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Overview
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1rem" }}>
                                <StatCard icon="👩‍🎓" value={studentsCount} label="Total Students" accent="#3498db" loading={loading} />
                                <StatCard icon="💪" value={groupsCount} label="Training Groups" accent="#9b59b6" loading={loading} />
                                <StatCard icon="🧑‍🏫" value={coachesCount} label="Coaches" accent="#1abc9c" loading={loading} />
                                <StatCard icon="🏋️‍♀️" value={gymsCount} label="Gyms" accent="#e67e22" loading={loading} />
                                <StatCard icon="💳" value={pendingPaymentsCount} label="Unpaid This Month" accent="#e74c3c" loading={loading} alert />
                                <StatCard icon="🔔" value={recentNotifications.length} label="Unread Notifications" accent="#f39c12" loading={loading} />
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section style={{ marginBottom: "2.5rem" }}>
                            <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)", fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Quick Actions
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                                <ActionCard icon="👩‍🎓" label="Students" description="Manage members" accent="#3498db" onClick={() => navigate("/students")} />
                                <ActionCard icon="💪" label="Groups" description="Training groups" accent="#9b59b6" onClick={() => navigate("/groups")} />
                                <ActionCard icon="🗓️" label="Attendance" description="Track sessions" accent="#27ae60" onClick={() => navigate("/attendance")} />
                                <ActionCard icon="🧑‍🏫" label="Coaches" description="Staff directory" accent="#1abc9c" onClick={() => navigate("/coaches")} />
                                <ActionCard icon="🏋️‍♀️" label="Gyms" description="Locations & capacity" accent="#e67e22" onClick={() => navigate("/gyms")} />
                                <ActionCard icon="💳" label="Payments" description="Collect memberships" accent="#e74c3c" onClick={() => navigate("/payments")} />
                                <ActionCard icon="🔔" label="Notifications" description="Alerts & messages" accent="#f39c12" onClick={() => navigate("/notifications")} />
                                <ActionCard icon="📊" label="Reports" description="Analytics & insights" accent="#8e44ad" onClick={() => navigate("/reports")} />
                            </div>
                        </section>

                        {/* Recent Notifications */}
                        <section>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Recent Notifications
                                </h2>
                                {recentNotifications.length > 0 && (
                                    <button className="btn-secondary" style={{ fontSize: "0.82rem", padding: "4px 14px" }} onClick={() => navigate("/notifications")}>
                                        View all →
                                    </button>
                                )}
                            </div>
                            <div className="card-container" style={{ padding: 0, overflow: "hidden" }}>
                                {loading ? (
                                    <p style={{ padding: "1.25rem", color: "var(--text-secondary)", textAlign: "center" }}>Loading…</p>
                                ) : recentNotifications.length === 0 ? (
                                    <p style={{ padding: "1.25rem", color: "var(--text-secondary)", textAlign: "center" }}>🎉 No unread notifications</p>
                                ) : (
                                    <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                                        {recentNotifications.map((n, idx) => (
                                            <div
                                                key={n.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => openNotificationModal(n)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openNotificationModal(n); }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f6f8")}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                                                style={{
                                                    padding: "14px 18px",
                                                    borderBottom: idx < recentNotifications.length - 1 ? "1px solid var(--border-color)" : "none",
                                                    borderLeft: "4px solid #2ecc71",
                                                    cursor: "pointer",
                                                    background: "#fff",
                                                    transition: "background 0.15s",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
                                                    <div style={{ fontWeight: 700, fontSize: "0.93rem" }}>{n.description}</div>
                                                    <span style={{ padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", backgroundColor: "#e7f9ef", color: "#1b7f4b" }}>
                                                        UNREAD
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "12.5px", color: "#555", marginBottom: "2px" }}>
                                                    Student: <strong>{getStudentName(n)}</strong>
                                                    {n.groupName ? ` • Group: ${n.groupName}` : ""}
                                                    {` • Coach: ${getCoachName(n)}`}
                                                </div>
                                                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>{formatDateTime(n.createdAt)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}

                {/* ══════════ COACH DASHBOARD ══════════ */}
                {isCoach && (
                    <>
                        <section style={{ marginBottom: "2rem" }}>
                            <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)", fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Overview</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1rem" }}>
                                <StatCard icon="🗓️" value={todayClassesCount} label="Today's Classes" accent="#27ae60" loading={loading} />
                                <StatCard icon="💳" value={pendingPaymentsCount} label="Unpaid This Month" accent="#e74c3c" loading={loading} alert />
                                <StatCard icon="🔔" value={recentNotifications.length} label="Unread Notifications" accent="#f39c12" loading={loading} />
                            </div>
                        </section>

                        <section style={{ marginBottom: "2rem" }}>
                            <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)", fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Actions</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                                <ActionCard icon="💪" label="My Groups" description="View assigned groups" accent="#9b59b6" onClick={() => navigate("/my-groups")} />
                                <ActionCard icon="🗓️" label="Attendance" description="Manage sessions" accent="#27ae60" onClick={() => navigate("/attendance")} />
                                <ActionCard icon="💳" label="Payments" description="Register payments" accent="#e74c3c" onClick={() => navigate("/payments")} />
                                <ActionCard icon="📝" label="Observations" description="Notes & feedback" accent="#3498db" onClick={() => navigate("/observations")} />
                            </div>
                        </section>
                    </>
                )}

                {/* ══════════ NOTIFICATION DETAIL MODAL ══════════ */}
                {selectedNotification && (
                    <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                        <div className="modal-content" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>🔔 Notification</h2>
                                <button className="modal-close" onClick={() => setSelectedNotification(null)}>✕</button>
                            </div>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{selectedNotification.description}</p>
                                <div style={{ fontSize: "14px", color: "#555" }}>
                                    Student: <strong>{getStudentName(selectedNotification)}</strong>
                                    {selectedNotification.groupName && <span> • Group: <strong>{selectedNotification.groupName}</strong></span>}
                                </div>
                                <div style={{ fontSize: "14px", color: "#555" }}>Coach: <strong>{getCoachName(selectedNotification)}</strong></div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{formatDateTime(selectedNotification.createdAt)}</div>
                            </div>
                            <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button className="btn-secondary" onClick={() => { setSelectedNotification(null); navigate("/notifications"); }}>Open Page</button>
                                    {!selectedNotification.isRead ? (
                                        <button className="btn-primary" onClick={async () => { const u = await markNotificationAsRead(selectedNotification); setSelectedNotification(u); }}>
                                            ✅ Mark as Read
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => { const u = await markNotificationAsUnread(selectedNotification); setSelectedNotification(u); }}
                                            style={{ backgroundColor: "#f39c12", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                        >
                                            🔔 Mark as Unread
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
