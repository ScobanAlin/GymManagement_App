import React from "react";
import { Gym } from "./GymsPage";
type Props = {
    gym: Gym;
    onOpen: (gym: Gym) => void;
};

type AddGymCardProps = {
    onAdd: () => void;
};

export default function GymCard({ gym, onOpen }: Props) {
    return (
        <div
            className="card-container"
            onClick={() => onOpen(gym)}
            style={{ cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; }}
        >
            <div className="card-header">
                <h3 className="card-title">{gym.name}</h3>
            </div>
            <div className="card-body">
                <p style={{ margin: "0.5rem 0", color: "var(--text-secondary)" }}>📍 {gym.location}</p>
                <p style={{ margin: "0.5rem 0", color: "var(--text-secondary)" }}>💪 Capacity: {gym.capacity}</p>
            </div>
        </div>
    );
}

export function AddGymCard({ onAdd }: AddGymCardProps) {
    return (
        <div
            onClick={onAdd}
            className="card-container"
            style={{
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
                border: "2px dashed var(--border-color)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-accent)";
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)";
            }}
        >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>➕</div>
            <h3 style={{ margin: "0", color: "var(--primary-accent)" }}>Add New Gym</h3>
        </div>
    );
}