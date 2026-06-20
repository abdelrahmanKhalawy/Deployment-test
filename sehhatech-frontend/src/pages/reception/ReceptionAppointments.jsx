import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { receptionApi } from "../../api/receptionApi";

import { useToast } from "../../hooks/useToast";
import ReceptionTopbar from "../../components/ReceptionTopbar";
import Toast from "../../components/Toast";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(name) {
  if (!name) return "PT";
  return String(name).trim().split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join("").toUpperCase();
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLongDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function formatMonthTitle(value) {
  if (!value) return "Today";
  return new Date(value).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    checkedin: "bg-emerald-100 text-emerald-700",
    scheduled: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-slate-100 text-slate-600",
  };
  const cls = map[s] || "bg-amber-100 text-amber-700";
  const label = status || "-";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
      {s === "checkedin" ? "Checked In" : label}
    </span>
  );
}

export default function ReceptionAppointments() {
  const { openSidebar } = useOutletContext();
  const { toast, showToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queueItems, setQueueItems] = useState([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [quickDate, setQuickDate] = useState(todayISO());
  const [quickDoctor, setQuickDoctor] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({
    patientId: "", doctorId: "", appointmentDate: "", duration: "00:30:00", notes: "",
  });

  const loadStaticData = useCallback(async () => {
    try {
      const [dashboardData, patientsData, doctorsData] = await Promise.all([
        receptionApi.getDashboard(),
        receptionApi.getPatients(),
        receptionApi.getAvailableDoctors(),
      ]);

      setQueueItems(dashboardData.queue?.data || []);
      setPatients(patientsData.data || []);
      setDoctors(doctorsData.data || dashboardData.availableDoctors?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      params.append("page", currentPage);
      params.append("pageSize", pageSize);

      const data = await receptionApi.getAppointments(params.toString());

      setAppointments(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount ?? (data.data || []).length);
    } catch (err) {
      console.error(err);
      setError(true);
      showToast(err.message || "Failed to load appointments.", "error");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, currentPage, showToast]);

  useEffect(() => {
    loadStaticData();
  }, [loadStaticData]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = search
    ? appointments.filter((a) => {
        const value = search.trim().toLowerCase();
        return (
          String(a.patientName || "").toLowerCase().includes(value) ||
          String(a.doctorSpecialization || "").toLowerCase().includes(value) ||
          String(a.status || "").toLowerCase().includes(value) ||
          String(a.notes || "").toLowerCase().includes(value)
        );
      })
    : appointments;

  const scheduledCount = appointments.filter((a) => String(a.status).toLowerCase() === "scheduled").length;
  const checkedInCount = appointments.filter((a) => String(a.status).toLowerCase() === "checkedin").length;

  const queueCount = queueItems.length;
  const waitValues = queueItems.map((q) => Number(q.waitingMinutes || 0)).filter((v) => v > 0);
  const avgWait = waitValues.length
    ? Math.round(waitValues.reduce((a, b) => a + b, 0) / waitValues.length)
    : 0;

  async function checkInAppointment(appointmentId) {
    if (!appointmentId) return;
    try {
      const result = await receptionApi.checkInAppointment(appointmentId);
      showToast(result?.message || "Patient checked in successfully");
      await Promise.all([loadAppointments(), loadStaticData()]);
    } catch (err) {
      showToast(err.message || "Failed to check-in patient.", "error");
    }
  }

  function applyQuickSearch() {
    if (quickDate) {
      setFromDate(quickDate);
      setToDate(quickDate);
    }
    setCurrentPage(1);
  }

  async function handleBookAppointment(e) {
    e.preventDefault();
    setBooking(true);

    try {
      const result = await receptionApi.bookAppointment({
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        appointmentDate: form.appointmentDate,
        duration: form.duration,
        notes: form.notes.trim(),
      });

      showToast(result?.message || "Appointment booked successfully");
      setModalOpen(false);
      setForm({ patientId: "", doctorId: "", appointmentDate: "", duration: "00:30:00", notes: "" });
      setCurrentPage(1);
      await Promise.all([loadAppointments(), loadStaticData()]);
    } catch (err) {
      showToast(err.message || "Failed to book appointment.", "error");
    } finally {
      setBooking(false);
    }
  }

  return (
    <>
      <ReceptionTopbar title="Reception Desk" onMenuClick={openSidebar}>
        <div className="relative w-full xl:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            placeholder="Search appointment by patient, doctor, status..."
          />
        </div>
        <button onClick={loadAppointments} className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </button>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">event_available</span>
          New Appointment
        </button>
      </ReceptionTopbar>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto space-y-6">

        {/* Header + Date Filter */}
        <section className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-manrope">Daily Schedule</h1>
            <p className="text-slate-500 font-medium mt-1">
              {loading ? "Loading appointments..." : `${formatLongDate(fromDate)} • ${totalCount} appointments loaded`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded-lg border-slate-200 bg-white text-sm focus:ring-blue-600 focus:border-blue-600" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full rounded-lg border-slate-200 bg-white text-sm focus:ring-blue-600 focus:border-blue-600" />
            </label>
            <button onClick={() => setCurrentPage(1)} className="mt-5 sm:mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 inline-flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">filter_alt</span>
              Apply
            </button>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Appointments</p>
            <h2 className="text-3xl font-black mt-2">{totalCount}</h2>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Scheduled</p>
            <h2 className="text-3xl font-black mt-2">{scheduledCount}</h2>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Checked In</p>
            <h2 className="text-3xl font-black mt-2">{checkedInCount}</h2>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Available Doctors</p>
            <h2 className="text-3xl font-black mt-2">{doctors.length}</h2>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* Appointments List */}
          <section className="xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Appointment Queue</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {loading ? "Loading entries..." : `Showing ${filteredAppointments.length} appointments`}
                </p>
              </div>
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded w-fit">Live Updates</span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading && <div className="px-6 py-10 text-center text-slate-500">Loading appointments...</div>}
              {!loading && error && <div className="px-6 py-10 text-center text-red-500">Failed to load appointments.</div>}
              {!loading && !error && filteredAppointments.length === 0 && (
                <div className="px-6 py-10 text-center text-slate-500">No appointments found for this filter.</div>
              )}

              {!loading && !error && filteredAppointments.map((a) => {
                const status = a.status || "Scheduled";
                const disabled = ["CheckedIn", "Completed", "Cancelled"].includes(status);
                const patientName = a.patientName || `Patient #${a.patientId || "-"}`;

                return (
                  <div key={a.id} className={`group flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-5 sm:px-6 py-5 hover:bg-slate-50 transition-colors ${status === "CheckedIn" ? "bg-emerald-50/40" : ""}`}>
                    <div className="flex items-start sm:items-center gap-5">
                      <div className="text-center w-16 shrink-0">
                        <span className={`block text-lg font-extrabold ${status === "CheckedIn" ? "text-emerald-600" : "text-slate-900"}`}>
                          {formatTime(a.appointmentDate)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{formatDateShort(a.appointmentDate)}</span>
                      </div>

                      <div className="h-12 w-px bg-slate-200 hidden sm:block" />

                      <div>
                        <h4 className="text-base font-bold text-slate-900">{patientName}</h4>
                        <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[14px]">stethoscope</span>
                          {a.doctorSpecialization || "Doctor"} • {a.notes || "Visit"}
                        </p>
                        <div className="mt-2"><StatusBadge status={status} /></div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <button disabled className="px-5 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed">
                        Reschedule
                      </button>
                      {disabled ? (
                        <button disabled className="px-5 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed">
                          Check-in
                        </button>
                      ) : (
                        <button onClick={() => checkInAppointment(a.id)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all">
                          Check-in
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-500">Page {currentPage} / {totalPages}</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {/* Right Panel */}
          <aside className="xl:col-span-4 space-y-6">

            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">{formatMonthTitle(fromDate)}</h3>
                <span className="material-symbols-outlined text-slate-400">calendar_month</span>
              </div>
              <p className="text-4xl font-black text-blue-600">{fromDate ? new Date(fromDate).getDate() : "--"}</p>
              <p className="text-sm text-slate-500 mt-2">Appointments loaded from backend filters.</p>
            </section>

            <section className="bg-slate-900 p-6 rounded-xl shadow-xl">
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-lg">monitoring</span>
                Clinic Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Today Queue</span>
                  <span className="text-white font-bold">{queueCount}</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, queueCount * 10)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Avg. Wait Time</span>
                  <span className="text-amber-400 font-bold">{avgWait} min</span>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Available Doctors</h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{doctors.length}</span>
              </div>
              <div className="space-y-3">
                {doctors.length === 0 && <p className="text-sm text-slate-400">Loading doctors...</p>}
                {doctors.slice(0, 5).map((d) => (
                  <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{d.user?.fullName || "Doctor"}</p>
                      <p className="text-xs text-slate-500">{d.specialization || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-blue-600">
              <h3 className="font-bold text-slate-900 mb-4">Quick Slot Search</h3>
              <div className="space-y-3">
                <label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Doctor</span>
                  <select value={quickDoctor} onChange={(e) => setQuickDoctor(e.target.value)}
                    className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm py-2 px-3 focus:ring-blue-600 focus:border-blue-600">
                    <option value="">All Doctors</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.user?.fullName || "Doctor"} - {d.specialization || "-"}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Date</span>
                  <input type="date" value={quickDate} onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm py-2 px-3 focus:ring-blue-600 focus:border-blue-600" />
                </label>
                <button onClick={applyQuickSearch} className="w-full mt-2 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">event_available</span>
                  Check Schedule
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-extrabold">Book Appointment</h3>
                <p className="text-sm text-slate-500">Connects to POST /Reception/appointments</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
            </div>

            <form onSubmit={handleBookAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Patient</span>
                <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300">
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Doctor</span>
                <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300">
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.user?.fullName || "Doctor"} - {d.specialization || "-"}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Appointment Date</span>
                <input required type="datetime-local" value={form.appointmentDate}
                  onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Duration</span>
                <select required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300">
                  <option value="00:30:00">30 minutes</option>
                  <option value="01:00:00">60 minutes</option>
                  <option value="01:30:00">90 minutes</option>
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Notes</span>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes" className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <button disabled={booking} className="md:col-span-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-60">
                {booking ? "Booking..." : "Book Appointment"}
              </button>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}