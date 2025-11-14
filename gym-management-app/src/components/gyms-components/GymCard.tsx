import React from "react";
import { Gym } from "./GymsPage";
type Props = {
    gym: Gym;
    onEdit: (gym: Gym) => void;
    onDelete: (id: number) => void;
};

type AddGymCardProps = {
    onAdd: () => void;
};

export default function GymCard({ gym, onEdit, onDelete }: Props) {
    return (
        <div
            style={{
                flex: "1 1 280px",
                background: "#f9f9f9",
                borderRadius: "10px",
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                padding: "1rem",
            }}
        >
            <h2>{gym.name}</h2>
            <p>📍 {gym.location}</p>
            <p>🏋️ Capacity: {gym.capacity}</p>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button onClick={() => onEdit(gym)}>✏️ Edit</button>
                <button
                    onClick={() => onDelete(gym.id)}
                    style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}
                >
                    🗑 Delete
                </button>
            </div>
        </div>
    );
}

export function AddGymCard({ onAdd }: AddGymCardProps) {
    return (
        <div
            onClick={onAdd}
            style={{
                flex: "1 1 280px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#e0e0e0",
                borderRadius: "10px",
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                padding: "1rem",
                cursor: "pointer",
                transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d0d0d0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#e0e0e0")}
        >
            <h2>➕ Add New Gym</h2>
        </div>
    );
}