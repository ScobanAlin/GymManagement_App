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
            className="card-container"
            style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "150px",
                textAlign: "center"
            }}
        >
            <h3 style={{ margin: "0" }}>{group.name}</h3>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Click to view details</p>
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
            className="card-container"
            style={{
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "150px",
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
            <h3 style={{ margin: "0", color: "var(--primary-accent)" }}>Create New Group</h3>
        </div>
    );
}
