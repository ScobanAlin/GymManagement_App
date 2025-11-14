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
        <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <AddGroupCard onAdd={onAddGroup} />

            {groups.map((group) => (
                <GroupCard key={group.id} group={group} onClick={() => onSelectGroup(group)} />
            ))}
        </div>
    );
}
