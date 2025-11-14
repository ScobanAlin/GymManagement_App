import React from "react";
import { Group } from "./GroupPage";

type Props = {
    group: Group;
    onClick: () => void;
};

export default function GroupCard({ group, onClick }: Props) {
    return (
        <div
            onClick={onClick}
            style={{
                flex: "1 1 250px",
                background: "#f9f9f9",
                borderRadius: "10px",
                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                padding: "1rem",
                cursor: "pointer",
                transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f9f9f9")}
        >
            <h3 style={{ margin: 0 }}>{group.name}</h3>
        </div>
    );
}

type AddGroupCardProps = {
    onAdd: () => void;
};

export function AddGroupCard({ onAdd }: AddGroupCardProps) {
    return (
        <div
            onClick={onAdd}
            style={{
                flex: "1 1 250px",
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
            <h3>➕ Add Group</h3>
        </div>
    );
}
