import React from "react";
import { Coach } from "./CoachesPage";

type Props = {
    coach: Coach;
    type: "active" | "inactive";
    onActivate: (id: number) => void;
    onDelete: (id: number) => void;
};

export default function CoachCard({ coach, type, onActivate, onDelete }: Props) {
    const fullName = `${coach.first_name} ${coach.last_name}`;

    return (
        <div className="card-container">
            <div className="card-header">
                <h3 className="card-title">{fullName}</h3>
                <span className={`badge ${type === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {type === 'active' ? 'Active' : 'Pending'}
                </span>
            </div>
            <div className="card-body">
                <p style={{ margin: "0", color: "var(--text-secondary)" }}>📧 {coach.email}</p>
            </div>
            <div className="card-footer">
                {type === "inactive" && (
                    <button
                        onClick={() => onActivate(coach.id)}
                        className="btn-success btn-sm"
                    >
                        ✓ Activate
                    </button>
                )}
                <button
                    onClick={() => onDelete(coach.id)}
                    className="btn-danger btn-sm"
                >
                    🗑 Delete
                </button>
            </div>
        </div>
    );
}
