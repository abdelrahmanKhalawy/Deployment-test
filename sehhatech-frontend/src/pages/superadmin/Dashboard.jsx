import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { superadmin } from "../../api/superadmin";
import DateRangePicker from "../../components/DateRangePicker";

// ── حساب النسب من الداتا ──────────────────────────────────────────────────────
function calcGrowthPct(growthChart) {
  if (!growthChart || growthChart.length < 2) return null;
  const sorted = [...growthChart].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
  const prev = sorted[sorted.length - 2]?.count || 0;
  const curr = sorted[sorted.length - 1]?.count || 0;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function calcNewDoctorsThisMonth(growthChart) {
  // مفيش endpoint للـ doctors growth، فهنرجع null
  return null;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, iconColor, badge, badgeBg, badgeText, label, value }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${iconBg} ${iconColor} rounded-lg`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`text-xs font-bold ${badgeText} ${badgeBg} px-2 py-1 rounded`}>
          {badge}
        </span>
      </div>
      <p className="text-slate-500 text-[12px] font-semibold uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-semibold text-slate-900 mt-1">{value ?? "—"}</h3>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function AppointmentDonut({ confirmed = 0, pending = 0, cancelled = 0 }) {
  const total = confirmed + pending + cancelled;
  const pct = (n) => (total ? (n / total) * 100 : 0);
  const c_pct = pct(confirmed);
  const p_pct = pct(pending);
  const x_pct = pct(cancelled);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900 mb-6">Appointment Status</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle className="stroke-slate-100" cx="18" cy="18" fill="none" r="15.915" strokeWidth="3" />
            <circle cx="18" cy="18" fill="none" r="15.915" stroke="#EF4444"
              strokeDasharray={`${x_pct} ${100 - x_pct}`} strokeDashoffset="0" strokeWidth="4" />
            <circle cx="18" cy="18" fill="none" r="15.915" stroke="#F59E0B"
              strokeDasharray={`${p_pct} ${100 - p_pct}`} strokeDashoffset={-x_pct} strokeWidth="4" />
            <circle cx="18" cy="18" fill="none" r="15.915" stroke="#10B981"
              strokeDasharray={`${c_pct} ${100 - c_pct}`} strokeDashoffset={-(x_pct + p_pct)} strokeWidth="4" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{total || "—"}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total</span>
          </div>
        </div>
        <div className="w-full space-y-3">
          {[
            { color: "bg-[#10B981]", label: "Confirmed",  value: confirmed },
            { color: "bg-[#F59E0B]", label: "Pending",    value: pending },
            { color: "bg-[#EF4444]", label: "Cancelled",  value: cancelled },
          ].map(({ color, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm font-medium text-slate-600">{label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Growth Chart ──────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function GrowthChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.count ?? 0), 1);
  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Clinics Growth</h3>
        <p className="text-sm text-slate-500">Monthly onboarding trends</p>
      </div>
      <div className="h-48 flex items-end gap-2 px-2">
        {data.map((d, i) => {
          const pct = Math.max((d.count / max) * 100, 4);
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                title={`${MONTHS[(d.month ?? 1) - 1]}: ${d.count}`}
                className={`w-full rounded-t-lg transition-all ${isLast ? "bg-slate-800" : "bg-blue-100 hover:bg-blue-200"}`}
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {data.map((d, i) => (
          <span key={i}>{MONTHS[(d.month ?? 1) - 1]}</span>
        ))}
      </div>
    </div>
  );
}

// ── Recent Clinics Table ──────────────────────────────────────────────────────
function RecentClinicsTable({ clinics = [], loading }) {
  return (
    <div className="mt-8 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Recent Clinics</h3>
        <Link to="/superadmin/clinics" className="text-sm text-slate-600 font-semibold hover:underline">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Name", "Email", "Onboarding", "Status"].map((h) => (
                <th key={h} className={`px-6 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider ${h === "Status" ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">Loading...</td></tr>
            ) : clinics.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">No clinics found.</td></tr>
            ) : clinics.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 text-sm">{c.name}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">{c.email}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {c.isActive ? "Active" : "Inactive"}
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

// ── Date helpers ───────────────────────────────────────────────────────────────
function formatRangeLabel(start, end) {
  if (!start || !end) return "Last 30 Days";
  const opts = { month: "short", day: "numeric" };
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString("en-US", opts);
  const endStr = end.toLocaleDateString("en-US", { ...opts, year: sameYear ? undefined : "numeric" });
  return `${startStr} - ${endStr}`;
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return { start, end };
  });

  const fetchDashboard = useCallback((start, end) => {
    setLoading(true);
    const params = start && end ? { startDate: toISO(start), endDate: toISO(end) } : {};
    superadmin.getDashboard(params)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard(dateRange.start, dateRange.end);
  }, [dateRange, fetchDashboard]);

  function handleApplyRange(start, end) {
    setDateRange({ start, end });
    setPickerOpen(false);
  }

  // ── parse appointment status ───────────────────────────────────────────────
  const apptStatus = {};
  (data?.appointmentStatusDistribution ?? []).forEach(({ status, count }) => {
    if (status && typeof status === "string") {
      apptStatus[status.toLowerCase()] = count;
    }
  });

  // ── growth chart data (sorted) ─────────────────────────────────────────────
  const growthData = [...(data?.clinicsGrowthChart ?? [])].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );

  // ── نسبة نمو الكلينيكات مقارنة بالشهر اللي قبله ─────────────────────────
  const growthPct = calcGrowthPct(growthData);
  const growthBadge = growthPct === null ? "—" : growthPct >= 0 ? `+${growthPct}%` : `${growthPct}%`;
  const growthPositive = growthPct === null || growthPct >= 0;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-[30px] font-bold leading-[38px] tracking-tight text-slate-900">
            Executive Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time operational status across the clinic network.</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            {formatRangeLabel(dateRange.start, dateRange.end)}
          </button>

          {pickerOpen && (
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onApply={handleApplyRange}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          icon="domain" iconBg="bg-blue-50" iconColor="text-blue-600"
          badge={loading ? "..." : growthBadge}
          badgeBg={growthPositive ? "bg-emerald-50" : "bg-red-50"}
          badgeText={growthPositive ? "text-emerald-600" : "text-red-600"}
          label="Total Clinics"
          value={loading ? null : data?.totalClinics}
        />
        <KpiCard
          icon="check_circle" iconBg="bg-emerald-50" iconColor="text-emerald-600"
          badge={loading ? "..." : `${data?.activeClinics ?? 0} Active`}
          badgeBg="bg-emerald-50" badgeText="text-emerald-600"
          label="Active Clinics"
          value={loading ? null : data?.activeClinics}
        />
        <KpiCard
          icon="group" iconBg="bg-purple-50" iconColor="text-purple-600"
          badge="Doctors"
          badgeBg="bg-blue-50" badgeText="text-blue-600"
          label="Total Doctors"
          value={loading ? null : data?.totalDoctors}
        />
        <KpiCard
          icon="event_note" iconBg="bg-orange-50" iconColor="text-orange-600"
          badge="Today"
          badgeBg="bg-orange-50" badgeText="text-orange-600"
          label="Appointments Today"
          value={loading ? null : data?.todayAppointments}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GrowthChart data={growthData} />
        <AppointmentDonut
          confirmed={apptStatus["confirmed"] ?? 0}
          pending={apptStatus["pending"] ?? 0}
          cancelled={apptStatus["cancelled"] ?? 0}
        />
      </div>

      {/* Recent Clinics */}
      <RecentClinicsTable clinics={data?.recentClinics ?? []} loading={loading} />
    </div>
  );
}