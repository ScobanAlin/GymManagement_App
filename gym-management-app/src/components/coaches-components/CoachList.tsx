import React from "react";
import CoachCard from "./CoachCard";
import { Coach } from "./CoachesPage";

type Props = {
    coaches: Coach[];
    type: "active" | "inactive";
    onActivate: (id: number) => void;
    onDelete: (id: number) => void;
};

export default function CoachList({ coaches, type, onActivate, onDelete }: Props) {
    if (coaches.length === 0)
        return (
            <div className="card-container">
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p style={{ margin: "0" }}>No {type} coaches found</p>
                </div>
            </div>
        );

    return (
        <div className="cards-grid">
            {coaches.map(coach => (
                <CoachCard
                    key={coach.id}
                    coach={coach}
                    type={type}
                    onActivate={onActivate}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
