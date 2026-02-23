import React from "react";
import GymCard from "./GymCard";
import { AddGymCard } from "./GymCard";
import { Gym } from "./GymsPage";

type Props = {
    gyms: Gym[];
    onEdit: (gym: Gym) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
};

export default function GymList({ gyms, onEdit, onDelete, onAdd }: Props) {
    return (
        <div className="cards-grid">
            <AddGymCard onAdd={onAdd} />
            {gyms.map((gym) => (
                <GymCard key={gym.id} gym={gym} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </div>
    );
}
