import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import CoachList from "./CoachList";
import apiClient from "../../services/apiClient";

export type Coach = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: "active" | "inactive";
    created_at: string;
};

export default function CoachesPage() {
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCoaches = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/coaches");
            setCoaches(res.data);
        } catch (err) {
            console.error("Error fetching coaches:", err);
            setError("Failed to load coaches.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoaches();
    }, [fetchCoaches]);

    const handleActivate = async (id: number) => {
        try {
            await apiClient.put(`/coaches/${id}/activate`);
            await fetchCoaches();
        } catch (err) {
            console.error("Error activating coach:", err);
            alert("Failed to activate coach");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to remove this coach?")) return;
        try {
            await apiClient.delete(`/coaches/${id}`);
            await fetchCoaches();
        } catch (err) {
            console.error("Error deleting coach:", err);
            alert("Failed to delete coach");
        }
    };

    const activeCoaches = coaches.filter(c => c.status === "active");
    const inactiveCoaches = coaches.filter(c => c.status === "inactive");

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>🧑‍🏫 Coaches Management</h1>
                </div>

                {loading && (
                    <div className="card-container" style={{ marginBottom: "1rem" }}>
                        <p style={{ margin: 0 }}>Loading coaches...</p>
                    </div>
                )}

                {error && (
                    <div className="card-container" style={{ marginBottom: "1rem", color: "#c0392b" }}>
                        <p style={{ margin: 0 }}>{error}</p>
                    </div>
                )}

                <h2 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>Active Coaches</h2>
                <CoachList
                    coaches={activeCoaches}
                    type="active"
                    onActivate={handleActivate}
                    onDelete={handleDelete}
                />

                <h2 style={{ marginTop: "2rem", marginBottom: "1.5rem", color: "var(--text-primary)" }}>Pending Registrations</h2>
                <CoachList
                    coaches={inactiveCoaches}
                    type="inactive"
                    onActivate={handleActivate}
                    onDelete={handleDelete}
                />
            </main>
        </div>
    );
}
