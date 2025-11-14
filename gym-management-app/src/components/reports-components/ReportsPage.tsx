
import Sidebar from "../Sidebar";


export default function ReportsPage() {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <div style={{ padding: "1.5rem" }}>
                <h1>🔔 Reports</h1>
            </div>
        </div>
    );
}