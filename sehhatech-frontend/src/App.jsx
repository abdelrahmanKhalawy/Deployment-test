import { Routes, Route } from "react-router-dom";
import SuperAdminLayout from "./components/SuperAdminLayout";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import Clinics from "./pages/superadmin/clinics";
import Reports from "./pages/superadmin/reports";
import Settings from "./pages/superadmin/settings";

// Public
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Payment from "./pages/public/Payment";
import ResetPassword from "./pages/public/ResetPassword";
import Privacy from "./pages/public/Privacy";
import Security from "./pages/public/Security";
import Status from "./pages/public/Status";
import Terms from "./pages/public/Terms";

// Doctor
import Dashboard from "./pages/doctor/Dashboard";
import MySchedule from "./pages/doctor/MySchedule";
import PatientRecords from "./pages/doctor/PatientRecords";
import DoctorProfile from "./pages/doctor/DoctorProfile";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminReceptionists from "./pages/admin/AdminReceptionists";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDoctorSchedule from "./pages/admin/AdminDoctorSchedule";

// Reception
import ReceptionLayout from "./pages/reception/ReceptionLayout";
import ReceptionDashboard from "./pages/reception/ReceptionDashboard";
import ReceptionPatients from "./pages/reception/ReceptionPatients";
import ReceptionAppointments from "./pages/reception/ReceptionAppointments";
import ReceptionPayments from "./pages/reception/ReceptionPayments";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ScrollToTop from "./components/ScrollToTop";

function App() {
    return (
        <>
            <ScrollToTop />

            <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />

                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                <Route path="/register" element={<Register />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/security" element={<Security />} />
                <Route path="/status" element={<Status />} />
                <Route path="/terms" element={<Terms />} />

                {/* Doctor */}
                <Route path="/doctor/dashboard" element={<Dashboard />} />
                <Route path="/doctor/schedule" element={<MySchedule />} />
                <Route path="/doctor/patients" element={<PatientRecords />} />
                <Route path="/doctor/profile" element={<DoctorProfile />} />

                {/* Admin */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="doctors" element={<AdminDoctors />} />
                    <Route
                        path="doctors/:doctorId/schedule"
                        element={<AdminDoctorSchedule />}
                    />
                    <Route
                        path="receptionists"
                        element={<AdminReceptionists />}
                    />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Reception */}
                <Route
                    path="/reception"
                    element={
                        <ProtectedRoute allowedRoles={["Reception"]}>
                            <ReceptionLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path="dashboard"
                        element={<ReceptionDashboard />}
                    />
                    <Route
                        path="patients"
                        element={<ReceptionPatients />}
                    />
                    <Route
                        path="appointments"
                        element={<ReceptionAppointments />}
                    />
                    <Route
                        path="payments"
                        element={<ReceptionPayments />}
                    />
                </Route>

                {/* Super Admin */}
                <Route
                    path="/superadmin"
                    element={
                        <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                            <SuperAdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path="dashboard"
                        element={<SuperAdminDashboard />}
                    />
                    <Route path="clinics" element={<Clinics />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;