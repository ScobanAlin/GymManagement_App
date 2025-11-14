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
        try {
            await apiClient.delete(`/gyms/${id}`);
            fetchGyms();
        } catch (err) {
            console.error("Error deleting gym:", err);
        }
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ padding: "1.5rem", flex: 1 }}>
                <h1>🏋️‍♂️ Gyms</h1>
                <GymList gyms={gyms} onEdit={setEditGym} onDelete={handleDelete} onAdd={() => setShowForm(true)} />
            </main>

            {showForm && (
                <GymFormModal
                    gym={editGym}
                    onClose={() => { setShowForm(false); setEditGym(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
