import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ profile }) {
    const { logout } = useAuth();

    const name = profile?.user?.fullName || "Loading...";
    const spec = profile?.specialization || "";
    const imgUrl = profile?.doctorProfileImageUrl || profile?.user?.userProfileImageUrl;

    function handleLogout() {
        logout();
        window.location.href = "/login";
    }

    const links = [
        { to: "/doctor/dashboard", icon: "dashboard", label: "Dashboard" },
        { to: "/doctor/schedule", icon: "calendar_today", label: "My Schedule" },
        { to: "/doctor/patients", icon: "folder_shared", label: "Patient Records" },
        { to: "/doctor/profile", icon: "manage_accounts", label: "My Profile" },
    ];

    return (
        <aside
            id="sidebar"
            className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col py-8 px-4 z-50"
        >
            <div className="mb-8 px-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
                    <span
                        className="material-symbols-outlined text-white text-xl"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                        medical_services
                    </span>
                </div>
                <span className="text-xl font-800 tracking-tight text-slate-900">SehhaTech</span>
            </div>

            <div className="mx-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {imgUrl ? (
                            <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <span
                                className="material-symbols-outlined text-white text-lg"
                                style={{ fontVariationSettings: '"FILL" 1' }}
                            >
                                person
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase truncate">{spec}</p>
                    </div>
                </div>
                <NavLink
                    to="/doctor/profile"
                    className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors font-medium"
                >
                    <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                    View Profile
                </NavLink>
            </div>

            <nav className="flex-1 space-y-1.5">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                ? "bg-slate-100 text-slate-900 font-semibold border-r-3 border-slate-900"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[22px]">{link.icon}</span>
                        <span className="text-sm">{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
                <a
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-error transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[22px]">logout</span>
                    <span className="text-sm font-medium">Logout</span>
                </a>
            </div>
        </aside>
    );
}