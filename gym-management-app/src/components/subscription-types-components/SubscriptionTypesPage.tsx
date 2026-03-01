import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

interface SubscriptionType {
    id: number;
    name: string;
    price: number;
}

export default function SubscriptionTypesPage() {
    const [types, setTypes] = useState<SubscriptionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<SubscriptionType | null>(null);
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [error, setError] = useState<string | null>(null);

    const fetchTypes = async () => {
        try {
            const res = await apiClient.get("/subscription-types");
            setTypes(res.data);
        } catch (err) {
            console.error("Error fetching subscription types:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTypes(); }, []);

    const openAdd = () => {
        setEditing(null);
        setFormName("");
        setFormPrice("");
        setError(null);
        setShowModal(true);
    };

    const openEdit = (t: SubscriptionType) => {
        setEditing(t);
        setFormName(t.name);
        setFormPrice(t.price.toString());
        setError(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || formPrice === "") {
            setError("Name and price are required.");
            return;
        }
        const price = parseFloat(formPrice);
        if (isNaN(price) || price < 0) {
            setError("Price must be a non-negative number.");
            return;
        }
        try {
            if (editing) {
                await apiClient.put(`/subscription-types/${editing.id}`, { name: formName.trim(), price });
            } else {
                await apiClient.post("/subscription-types", { name: formName.trim(), price });
            }
            setShowModal(false);
            fetchTypes();
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Failed to save.");
        }
    };

    const handleDelete = async (t: SubscriptionType) => {
        if (!window.confirm(`Delete subscription type "${t.name}"?`)) return;
        try {
            await apiClient.delete(`/subscription-types/${t.id}`);
            fetchTypes();
        } catch (err: any) {
            alert(err.response?.data?.message ?? "Failed to delete.");
        }
    };

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>🏷️ Subscription Types</h1>
                </div>

                <div className="card-container">
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                        <button
                            onClick={openAdd}
                            style={{ padding: "10px 20px", fontSize: "14px", fontWeight: "600", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        >
                            ➕ Add Type
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : types.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                            <p style={{ fontSize: "18px" }}>No subscription types defined yet.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>ID</th>
                                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Monthly Price (RON)</th>
                                        <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {types.map((t) => (
                                        <tr key={t.id} style={{ borderBottom: "1px solid #ddd" }}>
                                            <td style={{ padding: "12px" }}>{t.id}</td>
                                            <td style={{ padding: "12px" }}>
                                                <span style={{
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "13px",
                                                    fontWeight: "600",
                                                    backgroundColor: t.name === "premium" ? "#fff3cd" : "#e8f4fd",
                                                    color: t.name === "premium" ? "#856404" : "#1a5276",
                                                    border: `1px solid ${t.name === "premium" ? "#ffc107" : "#3498db"}`
                                                }}>
                                                    {t.name.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", fontWeight: "600", color: "#27ae60" }}>
                                                {parseFloat(t.price as unknown as string).toFixed(2)} RON
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center" }}>
                                                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                                    <button
                                                        onClick={() => openEdit(t)}
                                                        style={{ padding: "6px 14px", backgroundColor: "#f39c12", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t)}
                                                        style={{ padding: "6px 14px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "36px", maxWidth: "440px", width: "90%", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
                            <h2 style={{ margin: "0 0 24px 0", color: "#2c3e50" }}>
                                {editing ? "✏️ Edit Subscription Type" : "➕ New Subscription Type"}
                            </h2>

                            {error && (
                                <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. premium"
                                    style={{ width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>Monthly Price (RON)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formPrice}
                                    onChange={(e) => setFormPrice(e.target.value)}
                                    placeholder="e.g. 150.00"
                                    style={{ width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ padding: "12px 24px", fontSize: "14px", fontWeight: "600", backgroundColor: "#95a5a6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{ padding: "12px 24px", fontSize: "14px", fontWeight: "600", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                >
                                    💾 Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
