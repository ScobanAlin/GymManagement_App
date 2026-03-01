import axios from "axios";

const runtimeApiUrl = process.env.REACT_APP_API_URL;
const BASE_URL = runtimeApiUrl || (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "");

if (!runtimeApiUrl && process.env.NODE_ENV === "production") {
    console.error("REACT_APP_API_URL is not set. Falling back to same-origin /api.");
}

const apiClient = axios.create({
    baseURL: BASE_URL ? `${BASE_URL}/api` : "/api",
    headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
