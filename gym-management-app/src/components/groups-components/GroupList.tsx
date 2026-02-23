import React from "react";
import { Group } from "./GroupPage";
import GroupCard, { AddGroupCard } from "./GroupCard";

type Props = {
    groups: Group[];
    onAddGroup: () => void;
    onSelectGroup: (group: Group) => void;
};

export default function GroupList({ groups, onAddGroup, onSelectGroup }: Props) {
    return (
        <div className="cards-grid">
            <AddGroupCard onAdd={onAddGroup} />

            {groups.map((group) => (
                <GroupCard key={group.id} group={group} onClick={() => onSelectGroup(group)} />
            ))}
        </div>
    );
}
