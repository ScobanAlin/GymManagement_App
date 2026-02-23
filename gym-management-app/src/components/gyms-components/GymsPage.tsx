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
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>🏋️‍♂️ Gyms Management</h1>
                    <div className="header-actions">
                        <button className="btn-primary" onClick={() => setShowForm(true)}>
                            ➕ Add New Gym
                        </button>
                    </div>
                </div>
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
