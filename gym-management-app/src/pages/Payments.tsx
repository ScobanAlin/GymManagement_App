import { useEffect, useState } from "react";
import PaymentsPage from "../components/payments-components/PaymentsPage";
import CoachPaymentsPage from "../components/coach-components/CoachPaymentsPage";

export default function Payments() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            try {
                const userData = JSON.parse(user);
                setRole(userData.role);
            } catch (err) {
                console.error("Error parsing user data:", err);
            }
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
    }

    // Default to coach page if role is "coach", otherwise admin page
    if ((role || "").toLowerCase() === "coach") {
        return <CoachPaymentsPage />;
    }

    return <PaymentsPage />;
}