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
        return <p style={{ color: "#777" }}>No {type} coaches found.</p>;

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
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
