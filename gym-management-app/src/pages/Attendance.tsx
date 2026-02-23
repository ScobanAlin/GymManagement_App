import React, { useEffect, useState } from "react";
import AttendancePage from "../components/coach-components/AttendancePage";
import AdminAttendancePage from "../components/admin-components/AdminAttendancePage";

export default function Attendance() {
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            try {
                const userData = JSON.parse(user);
                setRole(userData.role);
            } catch {
                setRole(null);
            }
        }
    }, []);

    if (role === "admin") {
        return <AdminAttendancePage />;
    }

    return <AttendancePage />;
}
