import React, { useState, useEffect } from "react";
import { Gym } from "./GymsPage";

type Props = {
    gym: Gym | null;
    onClose: () => void;
    onSave: (data: Omit<Gym, "id">, id?: number) => void;
};

export default function GymFormModal({ gym, onClose, onSave }: Props) {
    const [form, setForm] = useState({ name: "", location: "", capacity: "" });

    useEffect(() => {
        if (gym) setForm({
            name: gym.name,
            location: gym.location,
            capacity: gym.capacity.toString(),
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
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    background: "#fff",
                    padding: "2rem",
                    borderRadius: "10px",
                    width: "350px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                }}
            >
                <h2>{gym ? "Edit Gym" : "Add New Gym"}</h2>
                <input
                    type="text"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                />
                <input
                    type="number"
                    placeholder="Capacity"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    required
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button type="submit" style={{ background: "#007bff", color: "white" }}>
                        💾 Save
                    </button>
                    <button type="button" onClick={onClose} style={{ background: "#ccc", color: "black" }}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
