import React from "react";
import GymCard from "./GymCard";
import { AddGymCard } from "./GymCard";
import { Gym } from "./GymsPage";

type Props = {
    gyms: Gym[];
    onOpen: (gym: Gym) => void;
    onAdd: () => void;
};

export default function GymList({ gyms, onOpen, onAdd }: Props) {
    return (
        <div className="cards-grid">
            <AddGymCard onAdd={onAdd} />
            {gyms.map((gym) => (
                <GymCard key={gym.id} gym={gym} onOpen={onOpen} />
            ))}
        </div>
    );
}
