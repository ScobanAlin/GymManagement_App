import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import LoginHeader from "../components/LoginHeader";
import apiClient from "../services/apiClient";

export default function Register() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }, []);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        if (password !== password2) {
            setError("Passwords must match");
            setLoading(false);
            return;
        }

        try {
            await apiClient.post("/register", {
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                role: "coach",
            });

            setSuccess(true);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            setPassword2("");
        } catch (err: any) {
            console.error("Registration error:", err);
            const message = err.response?.data?.message || "Registration failed. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <LoginHeader />
            <div className="login-page">
                <div className="auth-shell">
                    <div className="auth-side-panel">
                        <h2>Join GymManager</h2>
                        <p>Create a secure account to manage classes, coaches, students and reports.</p>
                    </div>

                    <div className="login-box">
                        <h2>Create Account</h2>
                        <p className="auth-subtitle">Fill in your details to register as a coach.</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            <input
                                className="auth-input"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                className="auth-input"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <input
                                className="auth-input"
                                type="password"
                                placeholder="Re-enter Password"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                required
                            />

                            <button className="auth-button" type="submit" disabled={loading}>
                                {loading ? "Registering..." : "Create Account"}
                            </button>

                            {error && <p className="error">{error}</p>}
                            {success && (
                                <p className="success-message">
                                    ✅ Registration successful! You can now <Link to="/login">login</Link>.
                                </p>
                            )}
                        </form>
                        <p className="register-text">
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
