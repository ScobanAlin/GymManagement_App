import React, { useState } from "react";

type AddGroupModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
};

export default function AddGroupModal({ isOpen, onClose, onSubmit }: AddGroupModalProps) {
    const [name, setName] = useState("");

    if (!isOpen) return null; // do not render

    const handleSubmit = () => {
        if (name.trim().length === 0) return;
        onSubmit(name.trim());
        setName("");
    };

    const handleClose = () => {
        setName("");
        onClose();
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
            onClick={handleClose}
        >
            {/* Modal box */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "400px",
                    background: "white",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
                    animation: "fadeIn 0.2s ease",
                }}
            >
                <h2 style={{ marginBottom: "1rem" }}>➕ Add New Group</h2>

                <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.3rem" }}>
                    Group Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kids Beginner"
                    style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginBottom: "1rem",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                    }}
                />

                {/* Buttons */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                    }}
                >
                    <button
                        onClick={handleClose}
                        style={{
                            background: "#ccc",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        style={{
                            background: "#4CAF50",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
