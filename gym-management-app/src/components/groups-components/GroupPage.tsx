import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import GroupList from "./GroupList";
import AddGroupModal from "./AddGroupModal";
import GroupDetailsModal from "./GroupDetailsModal";
import apiClient from "../../services/apiClient";

export type Group = {
    id: number;
    name: string;
};
type Gym = {
  id: number;
  name: string;
};


export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupStudents, setGroupStudents] = useState([]);
    const [groupClasses, setGroupClasses] = useState([]);
const [gyms, setGyms] = useState<Gym[]>([]);
    const handleDeleteGroup = async (id: number) => {
        try {
            await apiClient.delete(`/groups/${id}`);
            await loadGroups();
        } catch (err) {
            console.error("Failed to delete group:", err);
        }
    };

    const loadGroups = useCallback(async () => {
        try {
            const response = await apiClient.get("/groups");
            setGroups(response.data);
        } catch (error) {
            console.error("Failed to fetch groups:", error);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    const handleAddGroupClick = () => {
        setCreateModalOpen(true);
    };

    const handleSubmitGroup = async (name: string) => {
        await apiClient.post("/groups", { name });
        setCreateModalOpen(false);
        await loadGroups();
    };

    const handleSelectGroup = async (group: Group) => {
        setSelectedGroup(group);

        const studentsRes = await apiClient.get(`/groups/${group.id}/students`);
        setGroupStudents(studentsRes.data);

        const classesRes = await apiClient.get(`/groups/${group.id}/classes`);
        setGroupClasses(classesRes.data);

        setDetailsModalOpen(true);
    };

const loadGyms = useCallback(async () => {
  const res = await apiClient.get("/gyms");
  setGyms(res.data);
}, []);

useEffect(() => {
  loadGyms();
}, [loadGyms]);

    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ padding: "1.5rem", flex: 1 }}>
          <h1>👥 Group Categories</h1>

          <GroupList
            groups={groups}
            onAddGroup={handleAddGroupClick}
            onSelectGroup={handleSelectGroup}
          />

          <AddGroupModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleSubmitGroup}
          />

          <GroupDetailsModal
            isOpen={detailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            onDelete={handleDeleteGroup}
            group={selectedGroup}
            students={groupStudents}
            classes={groupClasses}
            allGroups={groups} // ✅ REQUIRED
            gyms={gyms} // ✅ REQUIRED
            refresh={async () => {
              // ✅ REQUIRED
              await loadGroups();
              if (selectedGroup) {
                const studentsRes = await apiClient.get(
                  `/groups/${selectedGroup.id}/students`
                );
                setGroupStudents(studentsRes.data);

                const classesRes = await apiClient.get(
                  `/groups/${selectedGroup.id}/classes`
                );
                setGroupClasses(classesRes.data);
              }
            }}
          />
        </main>
      </div>
    );
}
