import React, { useState, useEffect } from "react";
import { Student, Group } from "./StudentsPage";
import apiClient from "../../services/apiClient";

type Payment = {
    id: number;
    amount: number;
    month: string;
    payment_date: string;
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

    if (!isOpen || !student) return null;

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
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--border-color)" }}>
                        {[
                            "details",
                            "assign",
                            "status",
                            "reports",
                            "payments",
                        ].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderRadius: "0",
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
                                    <p style={{ fontWeight: "600", margin: "0 0 1rem 0" }}>{student.dateOfBirth}</p>
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
                        <div className="empty-state">
                            <div className="empty-state-icon">📄</div>
                            <p>Reports and attendance data coming soon</p>
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
                                                    <td style={{ padding: "1rem" }}>{p.payment_date}</td>
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
        </div>
    );
}
