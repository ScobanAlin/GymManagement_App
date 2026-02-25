import React, { useState, useEffect } from "react";
import { Gym } from "./GymsPage";

type Props = {
    gym: Gym | null;
    onClose: () => void;
    onSave: (data: Omit<Gym, "id">, id?: number) => void;
};

export default function GymFormModal({ gym, onClose, onSave }: Props) {
    const [form, setForm] = useState({
        name: gym?.name ?? "",
        location: gym?.location ?? "",
        capacity: gym?.capacity?.toString() ?? "",
    });

    useEffect(() => {
        setForm({
            name: gym?.name ?? "",
            location: gym?.location ?? "",
            capacity: gym?.capacity?.toString() ?? "",
        });
    }, [gym]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: form.name,
            location: form.location,
            capacity: Number(form.capacity),
        }, gym?.id);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form
                onSubmit={handleSubmit}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{gym ? "✏️ Edit Gym" : "➕ Add New Gym"}</h2>
                    <button type="button" className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Gym Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Downtown Fitness"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            placeholder="e.g. 123 Main Street"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Capacity</label>
                        <input
                            type="number"
                            placeholder="e.g. 50"
                            value={form.capacity}
                            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                        ✓ {gym ? "Update" : "Create"} Gym
                    </button>
                </div>
            </form>
        </div>
    );
}
