import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import apiClient from "../../services/apiClient";

interface StudentPaymentStatus {
    id: number;
    firstName: string;
    lastName: string;
    subscriptionType: string;
    isPaid: boolean;
    paymentAmount: number | null;
}

type StudentPaymentStatusApi = StudentPaymentStatus & {
    hasPaid?: boolean;
    amount?: number | null;
};

interface Payment {
    id: number;
    amount: number;
    year: number;
    month: number;
    paymentDate: string;
    studentFirstName: string;
    studentLastName: string;
}

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    subscriptionType: string;
}

interface FormData {
    amount: string;
    year: string;
    month: string;
}

export default function CoachPaymentsPage() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [students, setStudents] = useState<StudentPaymentStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<StudentPaymentStatus | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        amount: "",
        year: String(currentYear),
        month: String(currentMonth),
    });
    const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
    const [studentPaymentsAll, setStudentPaymentsAll] = useState<Payment[]>([]);
    const [saving, setSaving] = useState(false);

    // Fetch students with current month payment status
    useEffect(() => {
        fetchStudentsWithPaymentStatus();
    }, []);

    const normalizeStudent = (student: StudentPaymentStatusApi): StudentPaymentStatus => {
        return {
            ...student,
            isPaid: student.hasPaid ?? student.isPaid ?? false,
            paymentAmount: student.amount ?? student.paymentAmount ?? null,
        };
    };

    const fetchStudentsWithPaymentStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get("/payments/status-by-month", {
                params: {
                    year: currentYear,
                    month: currentMonth,
                },
            });
            setStudents(res.data.map(normalizeStudent));
        } catch (err) {
            console.error("Error fetching students:", err);
            setError("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentPaymentsCurrent = async (studentId: number) => {
        try {
            const res = await apiClient.get(`/payments/by-student/${studentId}`, {
                params: {
                    year: currentYear,
                    month: currentMonth,
                }
            });
            setStudentPayments(res.data);
        } catch (err) {
            console.error("Error fetching student payments:", err);
            setStudentPayments([]);
        }
    };

    const fetchStudentPaymentsAll = async (studentId: number) => {
        try {
            const res = await apiClient.get(`/payments/by-student/${studentId}`);
            setStudentPaymentsAll(res.data);
        } catch (err) {
            console.error("Error fetching student payment history:", err);
            setStudentPaymentsAll([]);
        }
    };

    const handleSelectStudent = async (student: StudentPaymentStatus) => {
        setSelectedStudent(student);
        await Promise.all([
            fetchStudentPaymentsCurrent(student.id),
            fetchStudentPaymentsAll(student.id)
        ]);
    };

    const handleAddPaymentClick = () => {
        setFormData({
            amount: "",
            year: String(currentYear),
            month: String(currentMonth),
        });
        setShowPaymentModal(true);
    };

    const handleSavePayment = async () => {
        if (!selectedStudent || !formData.amount) {
            alert("Please enter an amount");
            return;
        }

        try {
            setSaving(true);
            const studentIdToUpdate = selectedStudent.id;

            await apiClient.post("/payments", {
                studentId: studentIdToUpdate,
                amount: parseFloat(formData.amount),
                year: parseInt(formData.year),
                month: parseInt(formData.month),
            });

            setShowPaymentModal(false);

            // Refetch all students to get updated payment status
            const res = await apiClient.get("/payments/status-by-month", {
                params: {
                    year: currentYear,
                    month: currentMonth,
                },
            });
            const normalizedStudents = res.data.map(normalizeStudent);
            setStudents(normalizedStudents);

            // Find the updated student in the new list and select it
            const updatedStudent = normalizedStudents.find((s: StudentPaymentStatus) => s.id === studentIdToUpdate);
            if (updatedStudent) {
                setSelectedStudent(updatedStudent);
                // Fetch payments for the updated student
                await Promise.all([
                    fetchStudentPaymentsCurrent(studentIdToUpdate),
                    fetchStudentPaymentsAll(studentIdToUpdate)
                ]);
            }
        } catch (err) {
            console.error("Error saving payment:", err);
            alert("Failed to save payment");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!window.confirm("Are you sure you want to delete this payment?")) return;

        try {
            await apiClient.delete(`/payments/${paymentId}`);

            // Refetch students list
            const res = await apiClient.get("/payments/status-by-month", {
                params: {
                    year: currentYear,
                    month: currentMonth,
                },
            });
            const normalizedStudents = res.data.map(normalizeStudent);
            setStudents(normalizedStudents);

            // Refetch payments for current student
            if (selectedStudent) {
                await Promise.all([
                    fetchStudentPaymentsCurrent(selectedStudent.id),
                    fetchStudentPaymentsAll(selectedStudent.id)
                ]);

                // Update selected student with new status
                const updatedStudent = normalizedStudents.find((s: StudentPaymentStatus) => s.id === selectedStudent.id);
                if (updatedStudent) {
                    setSelectedStudent(updatedStudent);
                }
            }
        } catch (err) {
            console.error("Error deleting payment:", err);
            alert("Failed to delete payment");
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

    const paidCount = students.filter(s => s.isPaid).length;
    const unpaidCount = students.length - paidCount;

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content">
                <div className="page-header">
                    <h1>💳 Payments - {monthNames[currentMonth - 1]} {currentYear}</h1>
                    <p style={{ margin: "0.5rem 0 0 0", color: "var(--text-secondary)" }}>
                        Current month payment tracking
                    </p>
                </div>

                {loading ? (
                    <div className="card-container">
                        <p style={{ margin: 0 }}>Loading students...</p>
                    </div>
                ) : error ? (
                    <div className="card-container" style={{ color: "#c0392b" }}>
                        <p style={{ margin: 0 }}>{error}</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        {/* Students List */}
                        <div>
                            {/* Summary Cards */}
                            <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                                <div style={{
                                    padding: "1.5rem",
                                    backgroundColor: "#d4edda",
                                    borderRadius: "8px",
                                    borderLeft: "4px solid #28a745"
                                }}>
                                    <p style={{ margin: 0, fontWeight: 600, color: "#155724", fontSize: "18px" }}>
                                        ✅ Paid: <span style={{ fontSize: "24px" }}>{paidCount}</span>
                                    </p>
                                </div>
                                <div style={{
                                    padding: "1.5rem",
                                    backgroundColor: "#f8d7da",
                                    borderRadius: "8px",
                                    borderLeft: "4px solid #dc3545"
                                }}>
                                    <p style={{ margin: 0, fontWeight: 600, color: "#721c24", fontSize: "18px" }}>
                                        ❌ Unpaid: <span style={{ fontSize: "24px" }}>{unpaidCount}</span>
                                    </p>
                                </div>
                            </div>

                            <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>📋 Students</h3>
                            {students.length === 0 ? (
                                <div className="card-container">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🔍</div>
                                        <p style={{ margin: 0 }}>No students found</p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: "0.5rem", maxHeight: "600px", overflowY: "auto" }}>
                                    {students.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => handleSelectStudent(student)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === "Enter" && handleSelectStudent(student)}
                                            style={{
                                                padding: "1rem",
                                                backgroundColor: selectedStudent?.id === student.id ? "#e3f2fd" : "var(--bg-secondary)",
                                                border: selectedStudent?.id === student.id ? "2px solid #4338ca" : "1px solid var(--border-color)",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                borderLeft: `4px solid ${student.isPaid ? "#28a745" : "#dc3545"}`
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <p style={{ margin: "0 0 0.25rem 0", fontWeight: 600, color: "var(--text-primary)" }}>
                                                        {student.firstName} {student.lastName}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                        {student.subscriptionType}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    display: "inline-block",
                                                    padding: "6px 12px",
                                                    borderRadius: "4px",
                                                    fontSize: "0.85rem",
                                                    fontWeight: 600,
                                                    backgroundColor: student.isPaid ? "#d4edda" : "#f8d7da",
                                                    color: student.isPaid ? "#155724" : "#721c24"
                                                }}>
                                                    {student.isPaid ? "✓ Paid" : "✗ Unpaid"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Student Details */}
                        <div>
                            {!selectedStudent ? (
                                <div className="card-container">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👈</div>
                                        <p style={{ margin: 0 }}>Select a student to manage payments</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="card-container" style={{ marginBottom: "1.5rem", backgroundColor: "#f0f4f8" }}>
                                        <h3 style={{ margin: "0 0 1rem 0", color: "var(--text-primary)" }}>
                                            👤 {selectedStudent.firstName} {selectedStudent.lastName}
                                        </h3>
                                        <p style={{ margin: "0 0 0.5rem 0" }}>
                                            <strong>Subscription:</strong> {selectedStudent.subscriptionType}
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong>Status:</strong>
                                            <span style={{
                                                marginLeft: "0.5rem",
                                                display: "inline-block",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                backgroundColor: selectedStudent.isPaid ? "#d4edda" : "#f8d7da",
                                                color: selectedStudent.isPaid ? "#155724" : "#721c24",
                                                fontWeight: 600,
                                                fontSize: "0.9rem"
                                            }}>
                                                {selectedStudent.isPaid ? "✓ Paid" : "✗ Unpaid"}
                                            </span>
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: "1.5rem" }}>
                                        <button
                                            onClick={handleAddPaymentClick}
                                            style={{
                                                padding: "0.75rem 1.5rem",
                                                backgroundColor: "#4338ca",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontWeight: 600,
                                                fontSize: "1rem",
                                                width: "100%"
                                            }}
                                        >
                                            ➕ Add Payment
                                        </button>
                                    </div>

                                    <h4 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>
                                        📜 {monthNames[currentMonth - 1]} {currentYear} Payments
                                    </h4>

                                    {studentPayments.length === 0 ? (
                                        <div className="card-container">
                                            <div className="empty-state">
                                                <div className="empty-state-icon">💸</div>
                                                <p style={{ margin: 0 }}>No payments recorded</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gap: "1rem" }}>
                                            {studentPayments.map(payment => (
                                                <div
                                                    key={payment.id}
                                                    style={{
                                                        padding: "1rem",
                                                        backgroundColor: "#f0f4f8",
                                                        borderRadius: "8px",
                                                        border: "1px solid var(--border-color)",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <div>
                                                        <p style={{ margin: "0 0 0.25rem 0", fontWeight: 600, color: "var(--text-primary)" }}>
                                                            {formatCurrency(payment.amount)}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                            {new Date(payment.paymentDate).toLocaleDateString("en-US")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <h4 style={{ margin: "2rem 0 1rem", color: "var(--text-primary)" }}>
                                        📚 All Payments History
                                    </h4>

                                    {studentPaymentsAll.length === 0 ? (
                                        <div className="card-container">
                                            <div className="empty-state">
                                                <div className="empty-state-icon">🧾</div>
                                                <p style={{ margin: 0 }}>No payment history</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gap: "1rem" }}>
                                            {studentPaymentsAll.map(payment => (
                                                <div
                                                    key={`history-${payment.id}`}
                                                    style={{
                                                        padding: "1rem",
                                                        backgroundColor: "#ffffff",
                                                        borderRadius: "8px",
                                                        border: "1px solid var(--border-color)",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <div>
                                                        <p style={{ margin: "0 0 0.25rem 0", fontWeight: 600, color: "var(--text-primary)" }}>
                                                            {formatCurrency(payment.amount)}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                            {payment.year}-{String(payment.month).padStart(2, "0")} • {new Date(payment.paymentDate).toLocaleDateString("en-US")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && selectedStudent && (
                    <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: "400px" }}
                        >
                            <div className="modal-header">
                                <h2>➕ Add Payment</h2>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowPaymentModal(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="modal-body">
                                <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
                                    Student: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                                </p>

                                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                                    <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "6px",
                                            fontSize: "1rem",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                    <div className="form-group">
                                        <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
                                            Year
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                border: "1px solid var(--border-color)",
                                                borderRadius: "6px",
                                                fontSize: "1rem",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
                                            Month
                                        </label>
                                        <select
                                            value={formData.month}
                                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                border: "1px solid var(--border-color)",
                                                borderRadius: "6px",
                                                fontSize: "1rem",
                                                boxSizing: "border-box"
                                            }}
                                        >
                                            {monthNames.map((month, idx) => (
                                                <option key={idx} value={idx + 1}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePayment}
                                    disabled={saving}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        backgroundColor: saving ? "#ccc" : "#2ecc71",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: saving ? "not-allowed" : "pointer",
                                        fontWeight: 600
                                    }}
                                >
                                    {saving ? "Saving..." : "✓ Save Payment"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
