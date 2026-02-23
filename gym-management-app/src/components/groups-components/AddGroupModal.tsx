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
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>➕ Add New Group</h2>
                    <button className="modal-close" onClick={handleClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Kids Beginner"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={handleClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn-primary">
                        ✓ Save Group
                    </button>
                </div>
            </div>
        </div>
    );
}
