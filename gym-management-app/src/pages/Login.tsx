import React, { useState, useEffect } from "react";
import "./Login.css";
import LoginHeader from "../components/LoginHeader";
import apiClient from "../services/apiClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiClient.post("/login", { email, password });
      const { user, token } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("Login successful:", user);
      window.location.href = "/home"; // or use navigate("/home");
    } catch (err: any) {
      console.error("Login error:", err);
      const message = err.response?.data?.message || "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoginHeader />
      <div className="login-page">
        <div className="login-box">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
          <p className="register-text">
            Don’t have an account? <a href="/register">Register</a>
          </p>
        </div>
      </div>
    </>
  );
}
