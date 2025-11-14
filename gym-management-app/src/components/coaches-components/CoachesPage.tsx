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

    const fetchCoaches = useCallback(async () => {
        try {
            const res = await apiClient.get("/users");
            setCoaches(res.data);
        } catch (err) {
            console.error("Error fetching coaches:", err);
        }
    }, []);

    useEffect(() => {
        fetchCoaches();
    }, [fetchCoaches]);

    const handleActivate = async (id: number) => {
        try {
            await apiClient.put(`/coaches/${id}/activate`);
            fetchCoaches();
        } catch (err) {
            console.error("Error activating coach:", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to remove this coach?")) return;
        try {
            await apiClient.delete(`/coaches/${id}`);
            fetchCoaches();
        } catch (err) {
            console.error("Error deleting coach:", err);
        }
    };

    const activeCoaches = coaches.filter(c => c.status === "active");
    const inactiveCoaches = coaches.filter(c => c.status === "inactive");

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ padding: "1.5rem", flex: 1 }}>
                <h1>🏋️ Coaches</h1>

                <h2>My Coaches  </h2>
                <CoachList
                    coaches={activeCoaches}
                    type="active"
                    onActivate={handleActivate}
                    onDelete={handleDelete}
                />

                <h2 style={{ marginTop: "2rem" }}>Pending Registers</h2>
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
