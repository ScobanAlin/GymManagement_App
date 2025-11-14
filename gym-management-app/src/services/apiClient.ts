import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

const apiClient = axios.create({
    baseURL: `${BASE_URL}/api`,
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
