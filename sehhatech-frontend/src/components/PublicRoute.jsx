import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (user) {
        switch (user.role) {
            case "SuperAdmin": return <Navigate to="/superadmin/dashboard" replace />;
            case "ClinicAdmin": return <Navigate to="/admin/dashboard" replace />;
            case "Doctor": return <Navigate to="/doctor/dashboard" replace />;
            default: return <Navigate to="/" replace />;
        }
    }

    return children;
}