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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>👤 Add New Student</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        style={{ background: "none", color: "var(--text-secondary)" }}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {/* FORM */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                        <div className="form-group">
                            <input
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                placeholder="CNP"
                                value={cnp}
                                onChange={(e) => setCnp(e.target.value)}
                                maxLength={13}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDob(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                style={{ width: "100%" }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Assign to a Group (optional)</label>
                            <select
                                value={groupId}
                                onChange={(e) =>
                                    setGroupId(
                                        e.target.value === "none" ? "none" : Number(e.target.value)
                                    )
                                }
                                style={{ width: "100%" }}
                            >
                                <option value="none">No group</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn-primary">
                        ✓ Save Student
                    </button>
                </div>
            </div>
        </div>
    );
}
