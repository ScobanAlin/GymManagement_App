import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

interface StudentPaymentStatus {
    id: number;
    firstName: string;
    lastName: string;
    status: string;
    subscriptionType: string;
    hasPaid: boolean;
    paymentId?: number;
    amount?: number | string;
    paymentDate?: string;
}

interface Payment {
    id: number;
    amount: number | string;
    year: number;
    month: number;
    paymentDate: string;
    studentId: number;
    firstName: string;
    lastName: string;
}

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    status: string;
    subscriptionType: string;
}

type TabType = "monthly" | "history";

export default function PaymentsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("monthly");
    const [studentPaymentStatus, setStudentPaymentStatus] = useState<StudentPaymentStatus[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonthNum, setSelectedMonthNum] = useState("");
    const [storedMonths, setStoredMonths] = useState<any[]>([]);

    // Modal states
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [formData, setFormData] = useState({
        amount: "",
        year: new Date().getFullYear().toString(),
        month: String(new Date().getMonth() + 1).padStart(2, '0'),
        paymentDate: new Date().toISOString().split('T')[0]
    });


    const monthNames = [
        { num: "01", name: "January" },
        { num: "02", name: "February" },
        { num: "03", name: "March" },
        { num: "04", name: "April" },
        { num: "05", name: "May" },
        { num: "06", name: "June" },
        { num: "07", name: "July" },
        { num: "08", name: "August" },
        { num: "09", name: "September" },
        { num: "10", name: "October" },
        { num: "11", name: "November" },
        { num: "12", name: "December" }
    ];

    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return { year, month };
    };

    useEffect(() => {
        const { year, month } = getCurrentMonth();
        setSelectedYear(year);
        setSelectedMonthNum(month);
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === "monthly" && selectedYear && selectedMonthNum) {
            fetchMonthlyData(parseInt(selectedYear), parseInt(selectedMonthNum));
        } else if (activeTab === "history") {
            fetchHistoryData();
        }
    }, [activeTab, selectedYear, selectedMonthNum]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [studentsRes, monthsRes] = await Promise.all([
                apiClient.get("/students"),
                apiClient.get("/payments/stored-months")
            ]);
            setAllStudents(studentsRes.data);
            setStoredMonths(monthsRes.data);
            console.log("Available months:", monthsRes.data);
        } catch (err) {
            console.error("Error fetching initial data:", err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyData = async (year: number, month: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get("/payments/status-by-month", {
                params: { year, month }
            });
            setStudentPaymentStatus(response.data);
        } catch (err) {
            console.error("Error fetching monthly data:", err);
            setError("Failed to load payment data");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoryData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get("/payments");
            setAllPayments(response.data);
        } catch (err) {
            console.error("Error fetching history:", err);
            setError("Failed to load payment history");
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentPayments = async (studentId: number) => {
        try {
            const response = await apiClient.get(`/payments/by-student/${studentId}`);
            setStudentPayments(response.data);
        } catch (err) {
            console.error("Error fetching student payments:", err);
        }
    };

    const handleMonthlyRowClick = (student: StudentPaymentStatus) => {
        const fullStudent = allStudents.find(s => s.id === student.id);
        if (!fullStudent) return;
        setSelectedStudent(fullStudent);

        if (student.hasPaid && student.paymentId) {
            const amt = student.amount !== undefined ? student.amount.toString() : "";
            const pDate = student.paymentDate ?? new Date().toISOString().split('T')[0];
            setEditingPayment({
                id: student.paymentId,
                amount: student.amount ?? 0,
                year: parseInt(selectedYear),
                month: parseInt(selectedMonthNum),
                paymentDate: pDate,
                studentId: student.id,
                firstName: student.firstName,
                lastName: student.lastName
            });
            setFormData({
                amount: amt,
                year: selectedYear,
                month: selectedMonthNum,
                paymentDate: pDate
            });
        } else {
            setEditingPayment(null);
            setFormData({
                amount: "",
                year: selectedYear,
                month: selectedMonthNum,
                paymentDate: new Date().toISOString().split('T')[0]
            });
        }
        setShowPaymentModal(true);
    };

    const handleAddPayment = () => {
        setEditingPayment(null);
        setFormData({
            amount: "",
            year: new Date().getFullYear().toString(),
            month: String(new Date().getMonth() + 1).padStart(2, '0'),
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setShowPaymentModal(true);
    };

    const handleEditPayment = (payment: Payment) => {
        setEditingPayment(payment);
        setFormData({
            amount: payment.amount.toString(),
            year: payment.year.toString(),
            month: String(payment.month).padStart(2, '0'),
            paymentDate: payment.paymentDate
        });
        setShowPaymentModal(true);
    };

    const handleSavePayment = async () => {
        if (!selectedStudent || !formData.amount) {
            alert("Please fill all fields");
            return;
        }

        try {
            const paymentData = {
                amount: parseFloat(formData.amount),
                studentId: selectedStudent.id,
                year: parseInt(formData.year),
                month: parseInt(formData.month),
                paymentDate: formData.paymentDate
            };

            if (editingPayment) {
                await apiClient.put(`/payments/${editingPayment.id}`, paymentData);
            } else {
                await apiClient.post("/payments", paymentData);
            }

            fetchStudentPayments(selectedStudent.id);
            fetchHistoryData();
            fetchMonthlyData(parseInt(selectedYear), parseInt(selectedMonthNum));
            setShowPaymentModal(false);
        } catch (err) {
            console.error("Error saving payment:", err);
            alert("Failed to save payment");
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!window.confirm("Are you sure you want to delete this payment?")) return;

        try {
            await apiClient.delete(`/payments/${paymentId}`);
            if (selectedStudent) {
                fetchStudentPayments(selectedStudent.id);
            }
            fetchHistoryData();
            fetchMonthlyData(parseInt(selectedYear), parseInt(selectedMonthNum));
        } catch (err) {
            console.error("Error deleting payment:", err);
            alert("Failed to delete payment");
        }
    };

    const formatCurrency = (amount: number | string | undefined) => {
        if (!amount) return "-";
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `$${numAmount.toFixed(2)}`;
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const generateYearOptions = () => {
        const years = [];
        const now = new Date();
        const currentYear = now.getFullYear();
        for (let i = currentYear; i >= currentYear - 5; i--) {
            years.push(i.toString());
        }
        return years;
    };

    if (loading && activeTab === "monthly") {
        return (
            <div className="page-layout">
                <Sidebar />
                <main className="page-content">
                    <div className="page-header">
                        <h1>💳 Payments Management</h1>
                    </div>
                    <div className="card-container">
                        <p>Loading...</p>
                    </div>
                </main>
            </div>
        );
    }

    const paidCount = studentPaymentStatus.filter(s => s.hasPaid).length;
    const unpaidCount = studentPaymentStatus.filter(s => !s.hasPaid).length;


    const filteredStudents = studentPaymentStatus.filter((student) => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return fullName.includes(searchLower) || student.id.toString().includes(searchTerm);
    });

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>💳 Payments Management</h1>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #ddd" }}>
                    <button
                        onClick={() => setActiveTab("monthly")}
                        style={{
                            padding: "12px 24px",
                            fontSize: "16px",
                            fontWeight: "600",
                            backgroundColor: activeTab === "monthly" ? "#3498db" : "transparent",
                            color: activeTab === "monthly" ? "white" : "#333",
                            border: "none",
                            borderRadius: "4px 4px 0 0",
                            cursor: "pointer",
                            transition: "all 0.3s ease"
                        }}
                    >
                        📅 Monthly View
                    </button>
                    <button
                        onClick={() => { setActiveTab("history"); setSelectedStudent(null); }}
                        style={{
                            padding: "12px 24px",
                            fontSize: "16px",
                            fontWeight: "600",
                            backgroundColor: activeTab === "history" ? "#3498db" : "transparent",
                            color: activeTab === "history" ? "white" : "#333",
                            border: "none",
                            borderRadius: "4px 4px 0 0",
                            cursor: "pointer",
                            transition: "all 0.3s ease"
                        }}
                    >
                        � Manage Student
                    </button>
                </div>

                <div className="card-container">
                    {/* MONTHLY VIEW TAB */}
                    {activeTab === "monthly" && (
                        <>
                            <div style={{ marginBottom: "30px", padding: "30px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "2px solid #3498db" }}>
                                <h2 style={{ margin: "0 0 25px 0", color: "#2c3e50", marginTop: 0 }}>📅 Select Period</h2>

                                <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "6px", fontSize: "13px", color: "#1565c0" }}>
                                    <strong>Available months in database:</strong> {storedMonths.length > 0 ? storedMonths.map(m => `${m.year}-${String(m.month).padStart(2, '0')}`).join(", ") : "No payments recorded yet"}
                                </div>

                                <div style={{ display: "flex", gap: "30px", alignItems: "flex-end", flexWrap: "wrap" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "12px", fontWeight: "700", color: "#2c3e50", fontSize: "16px" }}>
                                            Year
                                        </label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            style={{
                                                padding: "15px 20px",
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                border: "2px solid #3498db",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontFamily: "inherit",
                                                backgroundColor: "#fff",
                                                minWidth: "150px"
                                            }}
                                        >
                                            {generateYearOptions().map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", marginBottom: "12px", fontWeight: "700", color: "#2c3e50", fontSize: "16px" }}>
                                            Month
                                        </label>
                                        <select
                                            value={selectedMonthNum}
                                            onChange={(e) => setSelectedMonthNum(e.target.value)}
                                            style={{
                                                padding: "15px 20px",
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                border: "2px solid #3498db",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontFamily: "inherit",
                                                backgroundColor: "#fff",
                                                minWidth: "200px"
                                            }}
                                        >
                                            {monthNames.map(month => (
                                                <option key={month.num} value={month.num}>{month.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: "flex", gap: "20px", marginLeft: "auto" }}>
                                        <div style={{ padding: "15px 25px", backgroundColor: "#d4edda", borderRadius: "8px", border: "2px solid #28a745" }}>
                                            <p style={{ margin: "0", fontWeight: "700", color: "#155724", fontSize: "18px" }}>
                                                ✅ Paid: <span style={{ fontSize: "24px" }}>{paidCount}</span>
                                            </p>
                                        </div>
                                        <div style={{ padding: "15px 25px", backgroundColor: "#f8d7da", borderRadius: "8px", border: "2px solid #f5c6cb" }}>
                                            <p style={{ margin: "0", fontWeight: "700", color: "#721c24", fontSize: "18px" }}>
                                                ❌ Unpaid: <span style={{ fontSize: "24px" }}>{unpaidCount}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Search by student name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: "10px 15px",
                                        fontSize: "14px",
                                        width: "100%",
                                        maxWidth: "400px",
                                        border: "2px solid #ddd",
                                        borderRadius: "6px",
                                        boxSizing: "border-box",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>

                            {studentPaymentStatus.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <p style={{ fontSize: "18px", color: "#666" }}>No students found for this period</p>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <p style={{ fontSize: "18px", color: "#666" }}>No students match your search</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                                                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>ID</th>
                                                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Student Name</th>
                                                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Subscription</th>
                                                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Payment Status</th>
                                                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Amount</th>
                                                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Payment Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map((student) => {
                                                const rowBgColor = student.hasPaid ? "#d4edda" : "#f8d7da";
                                                const statusColor = student.hasPaid ? "#155724" : "#721c24";
                                                const statusText = student.hasPaid ? "✅ PAID" : "❌ NOT PAID";

                                                return (
                                                    <tr
                                                        key={student.id}
                                                        onClick={() => handleMonthlyRowClick(student)}
                                                        style={{ borderBottom: "1px solid #ddd", backgroundColor: rowBgColor, cursor: "pointer" }}
                                                        title={student.hasPaid ? "Click to edit payment" : "Click to add payment"}
                                                    >
                                                        <td style={{ padding: "12px" }}>{student.id}</td>
                                                        <td style={{ padding: "12px", fontWeight: "500" }}>
                                                            {student.firstName} {student.lastName}
                                                        </td>
                                                        <td style={{ padding: "12px" }}>
                                                            <span style={{
                                                                padding: "4px 8px",
                                                                borderRadius: "4px",
                                                                fontSize: "12px",
                                                                backgroundColor: student.subscriptionType === 'premium' ? "#f39c12" : "#3498db",
                                                                color: "white",
                                                                fontWeight: "600"
                                                            }}>
                                                                {(student.subscriptionType || "basic").toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px", fontWeight: "600", color: statusColor }}>
                                                            {statusText}
                                                        </td>
                                                        <td style={{ padding: "12px", fontWeight: "600", color: "#27ae60" }}>
                                                            {formatCurrency(student.amount)}
                                                        </td>
                                                        <td style={{ padding: "12px" }}>
                                                            {formatDate(student.paymentDate)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* MANAGE STUDENT TAB */}
                    {activeTab === "history" && (
                        <>
                            {!selectedStudent ? (
                                <>
                                    <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>👥 Select a Student</h2>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>ID</th>
                                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
                                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Subscription</th>
                                                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allStudents.map((student) => (
                                                    <tr
                                                        key={student.id}
                                                        onClick={() => { setSelectedStudent(student); fetchStudentPayments(student.id); }}
                                                        style={{ borderBottom: "1px solid #ddd", cursor: "pointer" }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f7ff")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                                                    >
                                                        <td style={{ padding: "12px" }}>{student.id}</td>
                                                        <td style={{ padding: "12px", fontWeight: "500" }}>{student.firstName} {student.lastName}</td>
                                                        <td style={{ padding: "12px" }}>
                                                            <span style={{
                                                                padding: "4px 8px", borderRadius: "4px", fontSize: "12px",
                                                                backgroundColor: student.subscriptionType === "premium" ? "#f39c12" : "#3498db",
                                                                color: "white", fontWeight: "600"
                                                            }}>
                                                                {(student.subscriptionType || "basic").toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px" }}>
                                                            <span style={{
                                                                padding: "4px 8px", borderRadius: "4px", fontSize: "12px",
                                                                backgroundColor: student.status === "active" ? "#d4edda" : "#f8d7da",
                                                                color: student.status === "active" ? "#155724" : "#721c24",
                                                                fontWeight: "600"
                                                            }}>
                                                                {(student.status || "active").toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                        <h2 style={{ margin: 0, color: "#2c3e50" }}>👤 {selectedStudent.firstName} {selectedStudent.lastName}</h2>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={handleAddPayment}
                                                style={{ padding: "10px 20px", fontSize: "14px", fontWeight: "600", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                            >
                                                ➕ Add Payment
                                            </button>
                                            <button
                                                onClick={() => setSelectedStudent(null)}
                                                style={{ padding: "10px 20px", fontSize: "14px", fontWeight: "600", backgroundColor: "#95a5a6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                            >
                                                ← Back
                                            </button>
                                        </div>
                                    </div>
                                    {studentPayments.length === 0 ? (
                                        <p style={{ color: "#666", fontSize: "16px" }}>No payments recorded for this student</p>
                                    ) : (
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                                                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Amount</th>
                                                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Year-Month</th>
                                                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Payment Date</th>
                                                        <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentPayments.map((payment) => (
                                                        <tr key={payment.id} style={{ borderBottom: "1px solid #ddd" }}>
                                                            <td style={{ padding: "12px", fontWeight: "600", color: "#27ae60" }}>{formatCurrency(payment.amount)}</td>
                                                            <td style={{ padding: "12px" }}>{payment.year}-{String(payment.month).padStart(2, "0")}</td>
                                                            <td style={{ padding: "12px" }}>{formatDate(payment.paymentDate)}</td>
                                                            <td style={{ padding: "12px", textAlign: "center" }}>
                                                                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                                                    <button
                                                                        onClick={() => handleEditPayment(payment)}
                                                                        style={{ padding: "6px 12px", backgroundColor: "#f39c12", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                                                                    >
                                                                        ✏️ Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePayment(payment.id)}
                                                                        style={{ padding: "6px 12px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                                                                    >
                                                                        🗑️ Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Payment Form Modal */}
                {showPaymentModal && selectedStudent && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1001
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "40px",
                            maxWidth: "500px",
                            width: "90%",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
                        }}>
                            <h2 style={{ margin: "0 0 25px 0", color: "#2c3e50" }}>
                                {editingPayment ? "✏️ Edit Payment" : "➕ Add New Payment"}
                            </h2>
                            <p style={{ color: "#666", marginBottom: "20px" }}>
                                Student: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                            </p>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "2px solid #ddd",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "20px", display: "flex", gap: "15px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                        Year
                                    </label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            border: "2px solid #ddd",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        {generateYearOptions().map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                        Month
                                    </label>
                                    <select
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            border: "2px solid #ddd",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        {monthNames.map(month => (
                                            <option key={month.num} value={month.num}>{month.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "2px solid #ddd",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                {editingPayment && (
                                    <button
                                        onClick={async () => {
                                            if (!window.confirm("Delete this payment?")) return;
                                            await handleDeletePayment(editingPayment.id);
                                            setShowPaymentModal(false);
                                        }}
                                        style={{
                                            padding: "12px 24px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            backgroundColor: "#e74c3c",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            marginRight: "auto"
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    style={{
                                        padding: "12px 24px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        backgroundColor: "#95a5a6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePayment}
                                    style={{
                                        padding: "12px 24px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        backgroundColor: "#27ae60",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Save Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
