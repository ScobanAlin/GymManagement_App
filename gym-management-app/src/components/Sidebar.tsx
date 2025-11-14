import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "guest";

  // 🔹 Define role-based link sets
  const adminLinks = [
    { to: "/home", icon: "🏠", label: "Home" },
    { to: "/students", icon: "👩‍🎓", label: "Students" },
    { to: "/groups", icon: "💪", label: "Groups" },
    { to: "/coaches", icon: "🧑‍🏫", label: "Coaches" },
    { to: "/gyms", icon: "🏋️‍♀️", label: "Gyms" },
    { to: "/payments", icon: "💳", label: "Payments" },
    { to: "/notifications", icon: "🔔", label: "Notifications" },
    { to: "/reports", icon: "📊", label: "Reports" },
  ];

  const coachLinks = [
    { to: "/home", icon: "🏠", label: "Dashboard" },
    { to: "/my-groups", icon: "💪", label: "My Groups" },
    { to: "/attendance", icon: "🗓️", label: "Attendance" },
    { to: "/payments", icon: "💳", label: "Payments" },
    { to: "/observations", icon: "📝", label: "Observations" },
  ];

  const guestLinks = [
    { to: "/home", icon: "🏠", label: "Home" },
    { to: "/login", icon: "🔐", label: "Login" },
  ];

  let navLinks = guestLinks;
  if (role === "admin") navLinks = adminLinks;
  else if (role === "coach") navLinks = coachLinks;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>
          🏋️‍♂️ Gym<span>Manager</span>
        </h2>

        <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
          {role !== "guest" ? role.charAt(0).toUpperCase() + role.slice(1) + ' : ' + user.last_name + " " + user.first_name : "Welcome, Guest"}
        </p>

      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " active" : "")
            }
          >
            <span className="icon">{link.icon}</span> {link.label}
          </NavLink>
        ))}
      </nav>
      {role !== "guest" && (
        <button className="sidebar-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      )}
    </aside>
  );
}
