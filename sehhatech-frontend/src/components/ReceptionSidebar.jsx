import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/reception/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/reception/patients", icon: "group", label: "Patients" },
  { to: "/reception/appointments", icon: "calendar_month", label: "Appointments" },
  { to: "/reception/payments", icon: "payments", label: "Payments" },
];

export default function ReceptionSidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-6 py-3 text-sm font-manrope transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold"
        : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-slate-200 flex flex-col py-6 z-[70]
        transition-transform duration-300 lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:flex`}
      >
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">
                clinical_notes
              </span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-blue-600 font-manrope">
                SmartClinic
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Reception Portal
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 lg:hidden">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-3 text-slate-600 hover:bg-slate-50 text-sm font-manrope"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}