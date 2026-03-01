import React, { useState, useEffect } from "react";
import { Student } from "./StudentsPage";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onSubmit: (data: {
        firstName: string;
        lastName: string;
        cnp: string;
        dateOfBirth: string;
        email: string;
    }) => void;
};

export default function EditStudentModal({ isOpen, onClose, student, onSubmit }: Props) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [cnp, setCnp] = useState("");
    const [dateOfBirth, setDob] = useState("");
    const [email, setEmail] = useState("");

    // Pre-fill form with student data when modal opens
    useEffect(() => {
        if (isOpen && student) {
            setFirstName(student.firstName || "");
            setLastName(student.lastName || "");
            setCnp(student.cnp || "");
            // Format date for input (YYYY-MM-DD)
            if (student.dateOfBirth) {
                const d = new Date(student.dateOfBirth);
                if (!Number.isNaN(d.getTime())) {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    setDob(`${yyyy}-${mm}-${dd}`);
                } else {
                    setDob(student.dateOfBirth);
                }
            } else {
                setDob("");
            }
            setEmail(student.email || "");
        }
    }, [isOpen, student]);

    if (!isOpen || !student) return null;

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
            email,
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✏️ Edit Student</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        style={{ background: "none", color: "var(--text-secondary)" }}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>CNP</label>
                            <input
                                placeholder="CNP"
                                value={cnp}
                                onChange={(e) => setCnp(e.target.value)}
                                maxLength={13}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn-primary">
                        ✓ Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
