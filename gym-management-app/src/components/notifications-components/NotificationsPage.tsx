import { useEffect, useMemo, useState } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

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

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<"newest" | "oldest" | "unread-first" | "read-first">("newest");
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

    const sortedNotifications = useMemo(() => {
        const cloned = [...notifications];

        if (sortOption === "unread-first") {
            return cloned.sort((a, b) => Number(a.isRead) - Number(b.isRead));
        }

        if (sortOption === "read-first") {
            return cloned.sort((a, b) => Number(b.isRead) - Number(a.isRead));
        }

        if (sortOption === "oldest") {
            return cloned.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        return cloned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notifications, sortOption]);

    const fetchNotifications = async (search?: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get("/notifications", {
                params: search ? { search } : undefined
            });
            setNotifications(response.data);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNotifications(searchTerm.trim() || undefined);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const formatDateTime = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString();
    };

    const markNotificationAsRead = async (notification: NotificationItem) => {
        if (notification.isRead) return { ...notification, isRead: true };

        try {
            await apiClient.put(`/notifications/${notification.id}/read`, {
                isRead: true
            });

            const updated = { ...notification, isRead: true };
            setNotifications((prev) =>
                prev.map((item) => (item.id === notification.id ? updated : item))
            );
            return updated;
        } catch (err) {
            console.error("Error updating notification:", err);
            alert("Failed to update notification");
            return notification;
        }
    };

    const markNotificationAsUnread = async (notification: NotificationItem) => {
        if (!notification.isRead) return { ...notification, isRead: false };

        try {
            await apiClient.put(`/notifications/${notification.id}/read`, {
                isRead: false
            });

            const updated = { ...notification, isRead: false };
            setNotifications((prev) =>
                prev.map((item) => (item.id === notification.id ? updated : item))
            );
            return updated;
        } catch (err) {
            console.error("Error updating notification:", err);
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
            fetchNotifications(searchTerm.trim() || undefined);
        } catch (err) {
            console.error("Error deleting notification:", err);
            alert("Failed to delete notification");
        }
    };

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>🔔 Notifications</h1>
                </div>

                <div className="card-container">
                    <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <input
                            type="text"
                            placeholder="🔍 Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: "10px 15px",
                                fontSize: "14px",
                                width: "100%",
                                maxWidth: "400px",
                                border: "2px solid #ddd",
                                borderRadius: "6px",
                                boxSizing: "border-box",
                                fontFamily: "inherit"
                            }}
                        />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as "newest" | "oldest" | "unread-first" | "read-first")}
                            style={{
                                padding: "10px 12px",
                                fontSize: "14px",
                                border: "2px solid #ddd",
                                borderRadius: "6px",
                                minWidth: "220px",
                                backgroundColor: "white",
                                fontFamily: "inherit"
                            }}
                        >
                            <option value="newest">Sort: Newest Date</option>
                            <option value="oldest">Sort: Oldest Date</option>
                            <option value="unread-first">Sort: Unread First</option>
                            <option value="read-first">Sort: Read First</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">⏳</div>
                            <p style={{ margin: "0" }}>Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">⚠️</div>
                            <p style={{ margin: "0", color: "red" }}>{error}</p>
                        </div>
                    ) : sortedNotifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📬</div>
                            <p style={{ margin: "0" }}>No notifications match your search</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "16px" }}>
                            {sortedNotifications.map((notification) => {
                                const studentName = notification.studentFirstName
                                    ? `${notification.studentLastName || ""} ${notification.studentFirstName}`.trim()
                                    : "Unknown student";
                                const coachName = notification.coachFirstName
                                    ? `${notification.coachLastName || ""} ${notification.coachFirstName}`.trim()
                                    : "System";

                                return (
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
                                            padding: "16px",
                                            border: "1px solid #e0e0e0",
                                            borderRadius: "10px",
                                            borderLeft: notification.isRead ? "6px solid #d0d7de" : "6px solid #2ecc71",
                                            backgroundColor: notification.isRead ? "#f7f8f9" : "#ffffff",
                                            boxShadow: notification.isRead
                                                ? "0 1px 4px rgba(0,0,0,0.06)"
                                                : "0 6px 16px rgba(46, 204, 113, 0.12)",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                                            <div>
                                                <p style={{ margin: "0 0 6px 0", fontWeight: notification.isRead ? "600" : "700", color: "#2c3e50" }}>
                                                    {notification.description}
                                                </p>
                                                <p style={{ margin: "0", color: "#555", fontSize: "13px" }}>
                                                    Student: <strong>{studentName}</strong>
                                                    {notification.groupName ? ` • Group: ${notification.groupName}` : ""}
                                                    {coachName ? ` • Coach: ${coachName}` : ""}
                                                </p>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>
                                                {formatDateTime(notification.createdAt)}
                                            </div>
                                        </div>
                                        <div style={{ marginTop: "8px" }}>
                                            <span style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "4px 10px",
                                                borderRadius: "999px",
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                letterSpacing: "0.3px",
                                                backgroundColor: notification.isRead ? "#e9ecef" : "#e7f9ef",
                                                color: notification.isRead ? "#6c757d" : "#1b7f4b"
                                            }}>
                                                {notification.isRead ? "READ" : "UNREAD"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedNotification && (
                    <div
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
                            zIndex: 1000
                        }}
                        onClick={() => setSelectedNotification(null)}
                    >
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                padding: "28px",
                                maxWidth: "600px",
                                width: "90%",
                                boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
                            }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
                                <h2 style={{ margin: 0, color: "#2c3e50" }}>Notification</h2>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {!selectedNotification.isRead ? (
                                        <button
                                            onClick={async () => {
                                                const updated = await markNotificationAsRead(selectedNotification);
                                                setSelectedNotification(updated);
                                            }}
                                            style={{
                                                backgroundColor: "#27ae60",
                                                color: "white",
                                                border: "none",
                                                padding: "6px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontWeight: "600"
                                            }}
                                        >
                                            ✅ Mark as Read
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                const updated = await markNotificationAsUnread(selectedNotification);
                                                setSelectedNotification(updated);
                                            }}
                                            style={{
                                                backgroundColor: "#f39c12",
                                                color: "white",
                                                border: "none",
                                                padding: "6px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontWeight: "600"
                                            }}
                                        >
                                            🔔 Mark as Unread
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(selectedNotification)}
                                        style={{
                                            backgroundColor: "#e74c3c",
                                            color: "white",
                                            border: "none",
                                            padding: "6px 12px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Delete
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
                                            fontWeight: "600"
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <p style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#2c3e50" }}>
                                {selectedNotification.description}
                            </p>

                            <p style={{ margin: 0, color: "#555", fontSize: "13px" }}>
                                {selectedNotification.studentFirstName
                                    ? `Student: ${selectedNotification.studentLastName || ""} ${selectedNotification.studentFirstName}`.trim()
                                    : "Student: Unknown"}
                                {selectedNotification.groupName ? ` • Group: ${selectedNotification.groupName}` : ""}
                                {selectedNotification.coachFirstName
                                    ? ` • Coach: ${selectedNotification.coachLastName || ""} ${selectedNotification.coachFirstName}`.trim()
                                    : " • Coach: System"}
                            </p>
                            <p style={{ margin: "8px 0 0 0", color: "#888", fontSize: "12px" }}>
                                {formatDateTime(selectedNotification.createdAt)}
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}