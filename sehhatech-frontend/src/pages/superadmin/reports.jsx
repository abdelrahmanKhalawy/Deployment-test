import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";
const token = () => localStorage.getItem("token") || sessionStorage.getItem("token");

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ── Leaderboard Table ─────────────────────────────────────────────────────────
function Leaderboard({ rows = [], loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-xl font-semibold text-slate-900">Performance Leaderboard</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              {["Clinic Name", "Doctors", "Load", "Satisfaction", "Patients", "Status"].map((h) => (
                <th key={h} className="px-6 py-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">No data available.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 text-sm">{r.name}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">{r.doctors_count ?? "—"}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-slate-800 h-1.5 rounded-full"
                        style={{ width: `${Math.min(r.load ?? 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-slate-500 text-xs">{r.load ?? "—"}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-slate-700 font-medium">{r.satisfaction ?? "—"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{r.patients_count ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    r.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {r.status ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Growth Line Chart (SVG) ───────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function GrowthLineChart({ data = [] }) {
  if (data.length < 2) return null;

  const counts = data.map((d) => d.count ?? 0);
  const max    = Math.max(...counts, 1);
  const W = 800, H = 280, PAD = 20;

  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.count ?? 0) / max) * (H - PAD * 2);
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${H} L ${points[0][0]} ${H} Z`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Clinics Growth Trend</h3>
        <p className="text-sm text-slate-500">Monthly new clinic acquisitions</p>
      </div>
      <div className="relative h-[300px] w-full">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#131b2e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#131b2e" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[50, 150, 250].map((y) => (
            <line key={y} className="stroke-slate-200" strokeDasharray="4" x1="0" x2={W} y1={y} y2={y} />
          ))}
          <path fill="url(#areaGrad)" d={areaPath} />
          <path fill="none" stroke="#131b2e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={linePath} />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="#131b2e" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
        {data.map((d, i) => (
          <span key={i}>{MONTHS[(d.month ?? i + 1) - 1]}</span>
        ))}
      </div>
    </div>
  );
}

// ── Status Donut ──────────────────────────────────────────────────────────────
function StatusDonut({ active = 0, inactive = 0 }) {
  const total = active + inactive;
  const circ  = 251.2; // 2π × 40
  const activeDash   = total ? (active / total) * circ : 0;
  const inactiveDash = total ? (inactive / total) * circ : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-sm">
      <h3 className="text-xl font-semibold text-slate-900 mb-1">Status Distribution</h3>
      <p className="text-sm text-slate-500 mb-8">Active vs. Inactive entities</p>
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#F1F5F9" strokeWidth="12" />
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#10b981"
              strokeDasharray={`${activeDash} ${circ - activeDash}`}
              strokeLinecap="round" strokeWidth="12" />
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f43f5e"
              strokeDasharray={`${inactiveDash} ${circ - inactiveDash}`}
              strokeDashoffset={-activeDash}
              strokeLinecap="round" strokeWidth="12" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{total || "—"}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
          </div>
        </div>
        <div className="w-full mt-8 space-y-3">
          {[
            { color: "bg-emerald-500", label: "Active Clinics",   value: active },
            { color: "bg-rose-500",    label: "Inactive/Paused",  value: inactive },
          ].map(({ color, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [growth, setGrowth]           = useState([]);
  const [donut, setDonut]             = useState({ active: 0, inactive: 0 });
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [lb, gr, stats] = await Promise.allSettled([
  apiFetch("/api/SuperAdmin/reports"),
  apiFetch("/api/SuperAdmin/dashboard"),
  apiFetch("/api/SuperAdmin/dashboard"),
]);

       if (lb.status === "fulfilled") setLeaderboard(lb.value?.clinicPerformance ?? lb.value?.data ?? []);
if (gr.status === "fulfilled") setGrowth(gr.value?.clinicsGrowthChart ?? gr.value?.data ?? []);
if (stats.status === "fulfilled") {
  const d = stats.value;
  setDonut({ active: d.activeClinics ?? 0, inactive: (d.totalClinics ?? 0) - (d.activeClinics ?? 0) });
}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[30px] font-bold leading-[38px] tracking-tight text-slate-900">
          System-wide Reports
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Real-time performance metrics and clinic growth analytics.
        </p>
      </div>

      <Leaderboard rows={leaderboard} loading={loading} />
      <GrowthLineChart data={growth} />
      <StatusDonut active={donut.active} inactive={donut.inactive} />
    </div>
  );
}
