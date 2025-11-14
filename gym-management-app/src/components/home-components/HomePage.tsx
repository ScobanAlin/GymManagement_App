
import Sidebar from "../Sidebar";

export default function HomePage() {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main style={{ flex: 1, padding: "1.5rem" }}>
                <h1>Welcome to Gym Management System 🏋️‍♂️</h1>
                <p>Manage your students, groups, and payments easily.</p>

                <section style={{ marginTop: "2rem" }}>
                    <h2>Dashboard Overview</h2>
                    <p>Here you could later show key metrics like:</p>
                    <ul>
                        <li>Total active athletes</li>
                        <li>Pending payments</li>
                        <li>Upcoming training sessions</li>
                    </ul>
                </section>
            </main>
        </div>
    );
}