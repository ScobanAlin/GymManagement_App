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
        <div
            style={{
                flex: "1 1 280px",
                background: "#f9f9f9",
                borderRadius: "10px",
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                padding: "1rem",
            }}
        >
            <h3>{fullName}</h3>
            <p>📧 {coach.email}</p>

            {type === "inactive" ? (
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                    <button
                        onClick={() => onActivate(coach.id)}
                        style={{
                            background: "#2ecc71",
                            border: "none",
                            color: "white",
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            cursor: "pointer",
                        }}
                    >
                        Activate
                    </button>
                    <button
                        onClick={() => onDelete(coach.id)}
                        style={{
                            background: "#e74c3c",
                            border: "none",
                            color: "white",
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            cursor: "pointer",
                        }}
                    >
                        Delete
                    </button>
                </div>
            ) : (
                <div>
                    <button
                        onClick={() => onDelete(coach.id)}
                        style={{
                            background: "#e74c3c",
                            border: "none",
                            color: "white",
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            cursor: "pointer",
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
