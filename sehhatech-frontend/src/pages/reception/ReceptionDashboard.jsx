import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { receptionApi } from "../../api/receptionApi";

import { useToast } from "../../hooks/useToast";
import ReceptionTopbar from "../../components/ReceptionTopbar";
import Toast from "../../components/Toast";

function getInitials(name) {
  if (!name) return "PT";
  return String(name).trim().split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join("").toUpperCase();
}

function getStatusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("checkedin") || s.includes("confirmed")) return "bg-green-50 text-green-700";
  if (s.includes("scheduled")) return "bg-blue-50 text-blue-700";
  if (s.includes("cancelled")) return "bg-red-50 text-red-700";
  if (s.includes("completed")) return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
}

function canCheckIn(status) {
  const s = String(status || "").toLowerCase();
  return s.includes("scheduled") || s.includes("confirmed");
}

export default function ReceptionDashboard() {
  const { openSidebar } = useOutletContext();
  const { toast, showToast } = useToast();

  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await receptionApi.getDashboard();
      setQueue(data.queue?.data || []);
      setDoctors(data.availableDoctors?.data || []);
    } catch (err) {
      console.error(err);
      setError(true);
      showToast(err.message || "Failed to load dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function checkInPatient(appointmentId) {
    if (!appointmentId) return;

    try {
      const result = await receptionApi.checkInAppointment(appointmentId);
      showToast(result?.message || "Patient checked in successfully");
      await loadDashboard();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to check-in patient.", "error");
    }
  }

  const filteredQueue = search
    ? queue.filter((item) => {
        const patient = item.patient || {};
        const value = search.trim().toLowerCase();
        return (
          String(patient.fullName || "").toLowerCase().includes(value) ||
          String(patient.phone || "").toLowerCase().includes(value) ||
          String(patient.id || "").toLowerCase().includes(value)
        );
      })
    : queue;

  return (
    <>
      <ReceptionTopbar title="Reception Desk" onMenuClick={openSidebar}>
        <div className="relative w-full lg:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            placeholder="Search in today's queue..."
          />
        </div>
        <button
          onClick={loadDashboard}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
          title="Refresh"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </ReceptionTopbar>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto space-y-6 lg:space-y-8">

        {/* Patient Queue */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 font-manrope">Patient Queue</h2>
              <p className="text-slate-500 text-sm">Manage waiting patients and check-ins</p>
            </div>
            <button
              onClick={loadDashboard}
              className="bg-[#eefcf4] text-[#10b981] px-4 sm:px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#d1fae5] transition-colors border border-[#10b981]/20"
            >
              <span className="material-symbols-outlined">refresh</span>
              Refresh Queue
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Patient Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Purpose</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Waiting Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Loading patient queue...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-red-500">
                      Failed to load patient queue.
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredQueue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      No patients in today's queue.
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredQueue.map((item) => {
                  const patient = item.patient || {};
                  const doctor = item.doctor || {};
                  const status = item.status || "Scheduled";
                  const waitingText =
                    status === "CheckedIn"
                      ? `${item.waitingMinutes ?? 0} min`
                      : item.appointmentTime || "--";

                  return (
                    <tr key={item.appointmentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {getInitials(patient.fullName)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {patient.fullName || "Unknown Patient"}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID #{patient.id || "--"} • {patient.phone || "--"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{item.notes || "Visit"}</div>
                        <div className="text-xs text-slate-500">{doctor.specialization || "Not assigned"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{waitingText}</td>
                      <td className="px-6 py-4 text-right">
                        {canCheckIn(status) ? (
                          <button
                            onClick={() => checkInPatient(item.appointmentId)}
                            className="text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Check-in
                          </button>
                        ) : (
                          <button disabled className="text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 cursor-not-allowed">
                            Checked
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 text-center">
            <span className="text-blue-600 font-semibold text-sm">
              {loading ? "Loading..." : `View Full Daily Queue (${queue.length} Remaining)`}
            </span>
          </div>
        </section>

        {/* Doctor Availability */}
        <section className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-slate-400">stethoscope</span>
            Doctor Availability
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {loading && (
              <div className="col-span-full text-center text-slate-500 py-8">Loading doctors...</div>
            )}

            {!loading && doctors.length === 0 && (
              <div className="col-span-full text-center text-slate-500 py-8">
                No available doctors right now.
              </div>
            )}

            {!loading && doctors.map((doctor) => {
              const name = doctor.user?.fullName || "Doctor";
              const isActive = doctor.isActive === true;

              return (
                <div key={doctor.id} className="flex items-center p-4 rounded-lg bg-slate-50/50 border border-transparent hover:border-slate-200 transition-all">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {getInitials(name)}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isActive ? "bg-green-500" : "bg-slate-300"}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className={`text-xs font-medium ${isActive ? "text-green-600" : "text-slate-400"}`}>
                      {isActive ? `Active • ${doctor.specialization || "General"}` : "Not available"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}