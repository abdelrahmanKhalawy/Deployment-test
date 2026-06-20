import axios from "axios";

// ✅ axios instance منفصلة - بتتكلم مع SehhaTech.PatientPortal.API
// (المشروع المختلف اللي فيه endpoints الجداول/المواعيد، مش SehhaTech.API الأساسي)
// غيّر الـ baseURL ده لو الـ port مختلف عندك
const portalApi = axios.create({
    baseURL: import.meta.env.VITE_PORTAL_API_URL || "http://localhost:5238",
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ بنستخدم نفس التوكن بتاع الـ admin (من SehhaTech.API)
// لأن الـ PatientPortal.API بقى عنده StaffScheme بيتحقق من نفس الـ JwtSettings
portalApi.interceptors.request.use((config) => {
    const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

portalApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default portalApi;