import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";
const token = () => localStorage.getItem("token") || sessionStorage.getItem("token");

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, activeColor = "bg-emerald-500" }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200
          after:content-[''] after:absolute after:top-[2px] after:left-[2px]
          after:bg-white after:border after:border-gray-300 after:rounded-full
          after:h-5 after:w-5 after:transition-all
          ${checked ? (activeColor === "bg-red-500" ? "bg-red-500" : "bg-emerald-500") : "bg-slate-200"}
          ${checked ? "after:translate-x-full" : ""}`}
      />
    </label>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [profile, setProfile] = useState({ name: "—", role: "—", email: "—" });
  const [passwords, setPasswords] = useState({ old: "", new: "" });
  const [pwMsg, setPwMsg]     = useState(null); // { type: "success"|"error", text }
  const [toggles, setToggles] = useState({
    maintenance: false,
    notifications: true,
    auditLogging: true,
  });

  // Load profile
  useEffect(() => {
  const name  = localStorage.getItem("fullName");
  const email = localStorage.getItem("email");
  const role  = localStorage.getItem("role");
  setProfile({
    name:  name  ?? "Super Admin",
    role:  role  ?? "Super Administrator",
    email: email ?? "—",
  });
}, []);

  async function handleChangePassword() {
    if (!passwords.old || !passwords.new) {
      setPwMsg({ type: "error", text: "Please fill in both fields." });
      return;
    }
    try {
      await apiFetch("/api/SuperAdmin/change-password", {
  method: "POST",
  body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new }),
});
      setPwMsg({ type: "success", text: "Password updated successfully." });
      setPasswords({ old: "", new: "" });
    } catch {
      setPwMsg({ type: "error", text: "Failed to update password. Check your current password." });
    }
    setTimeout(() => setPwMsg(null), 4000);
  }

  const systemToggles = [
    {
      key: "maintenance",
      icon: "engineering",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      title: "Maintenance Mode",
      desc: "Prevent users from logging in during system updates.",
      activeColor: "bg-red-500",
    },
    {
      key: "notifications",
      icon: "notifications_active",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      title: "System-Wide Notifications",
      desc: "Enable alert banners for all active clinic administrators.",
      activeColor: "bg-emerald-500",
    },
    {
      key: "auditLogging",
      icon: "list_alt",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Detailed Audit Logging",
      desc: "Record all database read/write actions for compliance.",
      activeColor: "bg-emerald-500",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-[30px] font-bold leading-[38px] tracking-tight text-slate-900">
          System Settings
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Configure your medical network's global parameters and security protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-4 space-y-6">

          {/* Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-2xl mb-4">
                SA
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{profile.name}</h3>
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-4">
                {profile.role}
              </p>
              <div className="w-full space-y-3 text-left">
                <div>
                  <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <p className="text-sm text-slate-900">{profile.email}</p>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Role
                  </label>
                  <p className="text-sm text-slate-900">Super Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Security</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwords.old}
                  onChange={(e) => setPasswords((p) => ({ ...p, old: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-slate-300 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={passwords.new}
                  onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-slate-300 outline-none transition-all text-sm"
                />
              </div>
              {pwMsg && (
                <p className={`text-sm font-medium ${pwMsg.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                  {pwMsg.text}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-8 space-y-6">

          {/* System Toggles */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-2xl font-semibold text-slate-900">System Status & Toggles</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {systemToggles.map(({ key, icon, iconBg, iconColor, title, desc, activeColor }) => (
                <div key={key} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{title}</p>
                      <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <Toggle
                    checked={toggles[key]}
                    onChange={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
                    activeColor={activeColor}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/30 border border-red-200/60 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-600 mb-1">Danger Zone</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Actions here are irreversible and will affect the entire network.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-white border border-red-200 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 transition-all text-sm font-semibold">
                    Flush System Cache
                  </button>
                  <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all text-sm font-semibold">
                    Factory Reset Network
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
