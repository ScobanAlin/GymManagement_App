import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Gyms from "./pages/Gyms";
import Students from "./pages/Students";
import Coaches from "./pages/Coaches";
import Groups from "./pages/Groups";
import Notifications from "./pages/Notifications";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import MyGroups from "./pages/MyGroups";
import Attendance from "./pages/Attendance";
import Observations from "./pages/Observations";

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/gyms" element={<Gyms />} />
            <Route path="/students" element={<Students />} />
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/my-groups" element={<MyGroups />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/observations" element={<Observations />} />
        </Routes >
    );
}