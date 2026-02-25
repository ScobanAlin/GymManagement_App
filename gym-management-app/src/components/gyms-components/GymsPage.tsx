import React, { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import GymList from "./GymList";
import GymFormModal from "./GymFormModal";
import apiClient from "../../services/apiClient";

export type Gym = {
    id: number;
    name: string;
    location: string;
    capacity: number;
};

export default function GymsPage() {
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editGym, setEditGym] = useState<Gym | null>(null);
    const [detailGym, setDetailGym] = useState<Gym | null>(null);

    const fetchGyms = async () => {
        try {
            const res = await apiClient.get("/gyms");
            setGyms(res.data);
        } catch (err) {
            console.error("Error fetching gyms:", err);
        }
    };

    useEffect(() => { fetchGyms(); }, []);

    const handleSave = async (data: Omit<Gym, "id">, id?: number) => {
        try {
            id ? await apiClient.put(`/gyms/${id}`, data)
                : await apiClient.post("/gyms", data);
            setShowForm(false);
            setEditGym(null);
            fetchGyms();
        } catch (err) {
            console.error("Error saving gym:", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this gym?")) return;
        try {
            await apiClient.delete(`/gyms/${id}`);
            setDetailGym(null);
            fetchGyms();
        } catch (err) {
            console.error("Error deleting gym:", err);
        }
    };

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>🏋️‍♂️ Gyms Management</h1>
                </div>
                <GymList gyms={gyms} onOpen={setDetailGym} onAdd={() => setShowForm(true)} />
            </main>

            {/* Detail modal */}
            {detailGym && (
                <div className="modal-overlay" onClick={() => setDetailGym(null)}>
                    <div className="modal-content" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🏋️ {detailGym.name}</h2>
                            <button className="modal-close" onClick={() => setDetailGym(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Location</p>
                                    <p style={{ margin: 0, fontWeight: 500 }}>📍 {detailGym.location}</p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Capacity</p>
                                    <p style={{ margin: 0, fontWeight: 500 }}>💪 {detailGym.capacity} people</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                            <button
                                className="btn-danger"
                                onClick={() => handleDelete(detailGym.id)}
                            >
                                🗑 Delete
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => { setEditGym(detailGym); setDetailGym(null); setShowForm(true); }}
                            >
                                ✏️ Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <GymFormModal
                    key={editGym?.id ?? "new"}
                    gym={editGym}
                    onClose={() => { setShowForm(false); setEditGym(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
