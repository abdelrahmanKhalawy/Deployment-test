import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { superadmin } from "../api/superadmin";

const navItems = [
  { to: "/superadmin/dashboard", icon: "dashboard",        label: "Dashboard" },
  { to: "/superadmin/clinics",   icon: "medical_services", label: "Clinics Management" },
  { to: "/superadmin/reports",   icon: "analytics",        label: "Reports" },
  { to: "/superadmin/settings",  icon: "settings",         label: "Settings" },
];

export default function SuperAdminLayout() {
  const [showLogoutModal, setShowLogoutModal]     = useState(false);
  const [showUserDropdown, setShowUserDropdown]   = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [adminName, setAdminName]                 = useState("Super Admin");
  const [notifications, setNotifications]         = useState([]);
  const [notifsLoading, setNotifsLoading]         = useState(false);

  const userDropdownRef  = useRef(null);
  const notifDropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ── جيب اسم الأدمن ──────────────────────────────────────────────────────
  useEffect(() => {
    superadmin.getProfile()
      .then((res) => {
        const name = res?.data?.fullName || res?.fullName || res?.data?.name || res?.name;
        if (name) setAdminName(name);
      })
      .catch(() => {});
  }, []);

  // ── جيب الإشعارات لما يفتح الـ dropdown ──────────────────────────────────
  useEffect(() => {
    if (!showNotifDropdown) return;
    setNotifsLoading(true);
    // لو مفيش notifications endpoint حالياً هيبقى array فاضي
    setNotifications([]);
    setNotifsLoading(false);
  }, [showNotifDropdown]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target))
        setShowUserDropdown(false);
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target))
        setShowNotifDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen bg-[#fcf8fa]">
      {/* ── Sidebar ── */}
      <aside className="bg-slate-900 w-[280px] h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800 flex flex-col z-50">
        <div className="px-6 py-8">
          <h1 className="text-xl font-bold text-white tracking-tight">Smart Clinics</h1>
          <p className="text-slate-400 text-xs mt-1">Super Admin</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? "bg-white/10 text-white border-l-4 border-emerald-500 flex items-center px-6 py-3 transition-colors"
                  : "text-slate-400 hover:text-slate-100 flex items-center px-6 py-3 hover:bg-slate-800 transition-all duration-200"
              }
            >
              <span className="material-symbols-outlined mr-3">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-6 mt-auto border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              SA
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white font-semibold truncate text-sm">{adminName}</p>
              <p className="text-slate-500 text-xs truncate">System Controller</p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-slate-700 shrink-0"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">

        {/* Top Header */}
        <header className="bg-white h-16 w-full sticky top-0 z-40 border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-2">

            {/* 🔔 Notifications */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => {
                  setShowNotifDropdown((v) => !v);
                  setShowUserDropdown(false);
                }}
                className="relative hover:bg-slate-50 rounded-lg p-2 text-slate-500 transition-all"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifsLoading ? (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-3xl block mb-2 text-slate-300">notifications_off</span>
                        No notifications yet
                      </div>
                    ) : notifications.map((n, i) => (
                      <div
                        key={i}
                        className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                      >
                        <p className="text-sm text-slate-800 font-medium">{n.title ?? n.message}</p>
                        {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
                        {n.createdAt && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            {/* 👤 Admin Name Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => {
                  setShowUserDropdown((v) => !v);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center gap-2 hover:bg-slate-50 rounded-xl px-3 py-2 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                  SA
                </div>
                <span className="font-semibold text-slate-900 text-sm hidden sm:block">{adminName}</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  {showUserDropdown ? "expand_less" : "expand_more"}
                </span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 text-sm">{adminName}</p>
                    <p className="text-xs text-slate-400">System Controller</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate("/superadmin/settings"); setShowUserDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                      Profile Settings
                    </button>
                    <button
                      onClick={() => { setShowLogoutModal(true); setShowUserDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 p-6 bg-[#fcf8fa]">
          <Outlet />
        </main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-[360px] flex flex-col items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full">
              <span className="material-symbols-outlined text-red-500 text-3xl">logout</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Confirm Logout</h3>
            <p className="text-sm text-slate-500 text-center">
              Are you sure you want to logout from Smart Clinics Admin?
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white font-semibold py-2 rounded-xl hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}