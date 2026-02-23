import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

type ReportType = "payments" | "attendance";

interface PaymentRecord {
    id: number;
    amount: number | string;
    year: number;
    month: number;
    paymentDate: string;
    studentId: number;
    studentFirstName: string;
    studentLastName: string;
    cnp: string;
    subscriptionType: string;
}

interface AttendanceRecord {
    id: number;
    attended: boolean;
    notes?: string;
    recordedAt: string;
    classId: number;
    classDate: string;
    beginTime: string;
    endTime: string;
    studentId: number;
    studentFirstName: string;
    studentLastName: string;
    cnp: string;
    groupId: number;
    groupName: string;
    gymId: number;
    gymName: string;
    gymLocation: string;
}

interface Group {
    id: number;
    name: string;
}

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    cnp: string;
}

interface Class {
    id: number;
    gymId: number;
    gymName: string;
    weekday: string;
    hour: string;
    coach: string;
}

export default function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>("payments");
    const [loading, setLoading] = useState(false);
    const [paymentsData, setPaymentsData] = useState<PaymentRecord[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Attendance filters
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");

    // Dropdown data
    const [groups, setGroups] = useState<Group[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);

    // Fetch groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await apiClient.get("/groups");
                setGroups(response.data);
            } catch (err) {
                console.error("Error fetching groups:", err);
            }
        };
        fetchGroups();
    }, []);

    // Fetch students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await apiClient.get("/students");
                setStudents(response.data);
            } catch (err) {
                console.error("Error fetching students:", err);
            }
        };
        fetchStudents();
    }, []);

    // Fetch classes
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await apiClient.get("/classes");
                setClasses(response.data);
            } catch (err) {
                console.error("Error fetching classes:", err);
            }
        };
        fetchClasses();
    }, []);

    const fetchPaymentsReport = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await apiClient.get("/reports/payments", { params });
            setPaymentsData(response.data);
        } catch (err) {
            console.error("Error fetching payments report:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceReport = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (selectedGroupId) params.groupId = selectedGroupId;
            if (selectedStudentId) params.studentId = selectedStudentId;
            if (selectedClassId) params.classId = selectedClassId;

            const response = await apiClient.get("/reports/attendance", { params });
            setAttendanceData(response.data);
        } catch (err) {
            console.error("Error fetching attendance report:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        if (reportType === "payments") {
            fetchPaymentsReport();
        } else {
            fetchAttendanceReport();
        }
    };

    const exportToCSV = () => {
        let csvContent = "";
        let filename = "";

        if (reportType === "payments") {
            filename = `payments_report_${new Date().toISOString().split("T")[0]}.csv`;
            csvContent = "ID,Student Name,CNP,Subscription,Amount,Year,Month,Payment Date\n";
            paymentsData.forEach((record) => {
                csvContent += `${record.id},"${record.studentFirstName} ${record.studentLastName}",${record.cnp},${record.subscriptionType},${record.amount},${record.year},${record.month},${record.paymentDate}\n`;
            });
        } else {
            filename = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`;
            csvContent = "ID,Student Name,CNP,Group,Gym,Class Date,Time,Attended,Notes\n";
            attendanceData.forEach((record) => {
                csvContent += `${record.id},"${record.studentFirstName} ${record.studentLastName}",${record.cnp},${record.groupName},"${record.gymName} (${record.gymLocation})",${record.classDate},"${record.beginTime} - ${record.endTime}",${record.attended ? "Yes" : "No"},"${record.notes || ""}"\n`;
            });
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        return `$${numAmount.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const hasData = reportType === "payments" ? paymentsData.length > 0 : attendanceData.length > 0;

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>📊 Reports & Analytics</h1>
                </div>

                <div className="card-container">
                    {/* Report Type Selection */}
                    <div style={{ marginBottom: "30px", padding: "25px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "2px solid #3498db" }}>
                        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>Report Settings</h2>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                Report Type
                            </label>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={() => setReportType("payments")}
                                    style={{
                                        padding: "12px 24px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        backgroundColor: reportType === "payments" ? "#3498db" : "#ecf0f1",
                                        color: reportType === "payments" ? "white" : "#333",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    💰 Payments Report
                                </button>
                                <button
                                    onClick={() => setReportType("attendance")}
                                    style={{
                                        padding: "12px 24px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        backgroundColor: reportType === "attendance" ? "#3498db" : "#ecf0f1",
                                        color: reportType === "attendance" ? "white" : "#333",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    🗓️ Attendance Report
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
                            <div style={{ flex: "1", minWidth: "200px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        border: "2px solid #ddd",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ flex: "1", minWidth: "200px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        border: "2px solid #ddd",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>

                        {/* Attendance-specific filters */}
                        {reportType === "attendance" && (
                            <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
                                <div style={{ flex: "1", minWidth: "200px" }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                        Filter by Group
                                    </label>
                                    <select
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "2px solid #ddd",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box",
                                            backgroundColor: "white"
                                        }}
                                    >
                                        <option value="">All Groups</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: "1", minWidth: "200px" }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                        Filter by Student
                                    </label>
                                    <select
                                        value={selectedStudentId}
                                        onChange={(e) => setSelectedStudentId(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "2px solid #ddd",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box",
                                            backgroundColor: "white"
                                        }}
                                    >
                                        <option value="">All Students</option>
                                        {students.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.firstName} {student.lastName} ({student.cnp})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: "1", minWidth: "200px" }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                        Filter by Class
                                    </label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "2px solid #ddd",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box",
                                            backgroundColor: "white"
                                        }}
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.gymName} - {cls.weekday} @ {cls.hour}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                style={{
                                    padding: "12px 28px",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    backgroundColor: "#27ae60",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? "Generating..." : "📊 Generate Report"}
                            </button>
                            {reportType === "attendance" && (selectedGroupId || selectedStudentId || selectedClassId) && (
                                <button
                                    onClick={() => {
                                        setSelectedGroupId("");
                                        setSelectedStudentId("");
                                        setSelectedClassId("");
                                    }}
                                    style={{
                                        padding: "12px 28px",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        backgroundColor: "#95a5a6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    🔄 Clear Filters
                                </button>
                            )}
                            {hasData && (
                                <button
                                    onClick={exportToCSV}
                                    style={{
                                        padding: "12px 28px",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        backgroundColor: "#2ecc71",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    📥 Export CSV
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">⏳</div>
                            <p style={{ margin: "0" }}>Generating report...</p>
                        </div>
                    ) : !hasData ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📈</div>
                            <p style={{ margin: "0" }}>No data available. Generate a report to see results.</p>
                        </div>
                    ) : reportType === "payments" ? (
                        <div>
                            <h3 style={{ marginBottom: "15px", color: "#2c3e50" }}>
                                💰 Payments Report ({paymentsData.length} records)
                            </h3>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>ID</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Student Name</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>CNP</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Subscription</th>
                                            <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Amount</th>
                                            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Year-Month</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Payment Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentsData.map((record) => (
                                            <tr key={record.id} style={{ borderBottom: "1px solid #ddd" }}>
                                                <td style={{ padding: "12px" }}>{record.id}</td>
                                                <td style={{ padding: "12px", fontWeight: "500" }}>
                                                    {record.studentFirstName} {record.studentLastName}
                                                </td>
                                                <td style={{ padding: "12px", fontFamily: "monospace" }}>{record.cnp}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "11px",
                                                        backgroundColor: record.subscriptionType === "premium" ? "#f39c12" : "#3498db",
                                                        color: "white",
                                                        fontWeight: "600"
                                                    }}>
                                                        {record.subscriptionType.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#27ae60" }}>
                                                    {formatCurrency(record.amount)}
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center" }}>
                                                    {record.year}-{String(record.month).padStart(2, "0")}
                                                </td>
                                                <td style={{ padding: "12px" }}>{formatDate(record.paymentDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 style={{ marginBottom: "15px", color: "#2c3e50" }}>
                                🗓️ Attendance Report ({attendanceData.length} records)
                            </h3>
                            {(selectedGroupId || selectedStudentId || selectedClassId) && (
                                <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: "#e8f4f8", borderRadius: "6px", borderLeft: "4px solid #3498db" }}>
                                    <strong style={{ color: "#2c3e50" }}>Active Filters:</strong>
                                    <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {selectedGroupId && (
                                            <span style={{ padding: "4px 10px", backgroundColor: "#3498db", color: "white", borderRadius: "4px", fontSize: "13px", fontWeight: "500" }}>
                                                Group: {groups.find(g => g.id === parseInt(selectedGroupId))?.name}
                                            </span>
                                        )}
                                        {selectedStudentId && (
                                            <span style={{ padding: "4px 10px", backgroundColor: "#9b59b6", color: "white", borderRadius: "4px", fontSize: "13px", fontWeight: "500" }}>
                                                Student: {students.find(s => s.id === parseInt(selectedStudentId))?.firstName} {students.find(s => s.id === parseInt(selectedStudentId))?.lastName}
                                            </span>
                                        )}
                                        {selectedClassId && (
                                            <span style={{ padding: "4px 10px", backgroundColor: "#e67e22", color: "white", borderRadius: "4px", fontSize: "13px", fontWeight: "500" }}>
                                                Class ID: {selectedClassId}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>ID</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Student Name</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>CNP</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Group</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Gym</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Class Date</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Time</th>
                                            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Attended</th>
                                            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceData.map((record) => (
                                            <tr key={record.id} style={{ borderBottom: "1px solid #ddd" }}>
                                                <td style={{ padding: "12px" }}>{record.id}</td>
                                                <td style={{ padding: "12px", fontWeight: "500" }}>
                                                    {record.studentFirstName} {record.studentLastName}
                                                </td>
                                                <td style={{ padding: "12px", fontFamily: "monospace" }}>{record.cnp}</td>
                                                <td style={{ padding: "12px" }}>{record.groupName}</td>
                                                <td style={{ padding: "12px" }}>
                                                    {record.gymName}<br />
                                                    <span style={{ fontSize: "12px", color: "#666" }}>({record.gymLocation})</span>
                                                </td>
                                                <td style={{ padding: "12px" }}>{formatDate(record.classDate)}</td>
                                                <td style={{ padding: "12px" }}>
                                                    {record.beginTime} - {record.endTime}
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center" }}>
                                                    <span style={{
                                                        padding: "4px 12px",
                                                        borderRadius: "4px",
                                                        fontSize: "11px",
                                                        backgroundColor: record.attended ? "#d4edda" : "#f8d7da",
                                                        color: record.attended ? "#155724" : "#721c24",
                                                        fontWeight: "600"
                                                    }}>
                                                        {record.attended ? "✓ YES" : "✗ NO"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: "13px", color: "#666" }}>
                                                    {record.notes || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}