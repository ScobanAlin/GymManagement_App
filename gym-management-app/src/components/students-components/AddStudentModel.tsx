import React, { useState } from "react";
import { Group } from "./StudentsPage";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    groups: Group[];
    onSubmit: (data: {
        firstName: string;
        lastName: string;
        cnp: string;
        dateOfBirth: string;
        status: string;
        groupId: number | null;
    }) => void;
};

export default function AddStudentModal({ isOpen, onClose, groups, onSubmit }: Props) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [cnp, setCnp] = useState("");
    const [dateOfBirth, setDob] = useState("");
    const [status, setStatus] = useState("active");
    const [groupId, setGroupId] = useState<number | "none">("none");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!firstName || !lastName || !cnp || !dateOfBirth) {
            alert("Please fill all required fields.");
            return;
        }

        onSubmit({
            firstName,
            lastName,
            cnp,
            dateOfBirth,
            status,
            groupId: groupId === "none" ? null : groupId
        });
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1200,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "450px",
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "10px",
                    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
                }}
            >
                <h2>Add New Student</h2>

                {/* FORM */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>

                    <input
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={inputStyle}
                    />

                    <input
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={inputStyle}
                    />

                    <input
                        placeholder="CNP"
                        value={cnp}
                        onChange={(e) => setCnp(e.target.value)}
                        style={inputStyle}
                        maxLength={13}
                    />

                    <label>Date of Birth</label>
                    <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDob(e.target.value)}
                        style={inputStyle}
                    />


                    <label>Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <label>Assign to a Group (optional)</label>
                    <select
                        value={groupId}
                        onChange={(e) =>
                            setGroupId(
                                e.target.value === "none" ? "none" : Number(e.target.value)
                            )
                        }
                        style={inputStyle}
                    >
                        <option value="none">No group</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", gap: "0.5rem" }}>
                    <button onClick={onClose} style={cancelBtn}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} style={saveBtn}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
};

const saveBtn: React.CSSProperties = {
    background: "#4CAF50",
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
};

const cancelBtn: React.CSSProperties = {
    background: "#aaa",
    color: "white",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
};
