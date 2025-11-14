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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1500,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "600px",
          background: "white",
          borderRadius: "10px",
          padding: "1.5rem",
        }}
      >
        <h2>
          {student.firstName} {student.lastName}
        </h2>

        {/* ---------- TABS ---------- */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
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
                padding: "0.4rem 0.7rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: activeTab === tab ? "#4CAF50" : "white",
                color: activeTab === tab ? "white" : "black",
                cursor: "pointer",
              }}
            >
              {tab === "details" && "👤 Details"}
              {tab === "assign" && "🔄 Assign Group"}
              {tab === "status" && "❄ Status"}
              {tab === "reports" && "📄 Reports"}
              {tab === "payments" && "💰 Payments"}
            </button>
          ))}
        </div>

        {/* ---------- TAB CONTENT ---------- */}
        {activeTab === "details" && (
          <div>
            <p>
              <strong>CNP:</strong> {student.cnp}
            </p>
            <p>
              <strong>Date of Birth:</strong> {student.dateOfBirth}
            </p>
            <p>
              <strong>Subscription:</strong> {subscriptionType}
            </p>
            <p>
              <strong>Status:</strong> {status}
            </p>
            <p>
              <strong>Group:</strong> {student.groupName || "None"}
            </p>
          </div>
        )}

        {activeTab === "assign" && (
          <div>
            <h3>Assign to another group</h3>
            <select
              value={groupId ?? ""}
              onChange={(e) => setGroupId(Number(e.target.value))}
              style={{ padding: "0.5rem", width: "100%" }}
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button onClick={handleAssignGroup} style={buttonPrimary}>
              Save
            </button>
          </div>
        )}


        {activeTab === "status" && (
          <div>
            <h3>Membership Status</h3>
            <p>
              Current: <strong>{status}</strong>
            </p>
            <button onClick={handleStatusChange} style={buttonPrimary}>
              {status === "active"
                ? "Freeze (inactive)"
                : "Unfreeze (activate)"}
            </button>
          </div>
        )}

        {activeTab === "reports" && (
          <div>
            <h3>Reports</h3>
            <p>Future section for attendance, performance, etc.</p>
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            <h3>Payments</h3>
            {payments.length === 0 ? (
              <p>No payments yet.</p>
            ) : (
              <ul>
                {payments.map((p) => (
                  <li key={p.id}>
                    {p.month} — {p.amount} RON on {p.payment_date}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ---------- FOOTER ---------- */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button onClick={handleDelete} style={buttonDanger}>
            Delete Student
          </button>
          <button onClick={onClose} style={buttonPrimary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* Button styles */
const buttonPrimary: React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.5rem 1rem",
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const buttonDanger: React.CSSProperties = {
  padding: "0.5rem 1rem",
  background: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
