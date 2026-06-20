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

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function StatusBadge({ row }) {
  if (row.status === "CheckedIn") {
    const text = row.waitingMinutes ? `Waiting (${row.waitingMinutes}m)` : "Checked In";
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        {text}
      </span>
    );
  }
  if (row.status === "Scheduled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
        Scheduled{row.appointmentTime ? `: ${row.appointmentTime}` : ""}
      </span>
    );
  }
  if (row.status === "Registered") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
        Registered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
      {row.status || "-"}
    </span>
  );
}

export default function ReceptionPatients() {
  const { openSidebar } = useOutletContext();
  const { toast, showToast } = useToast();

  const [patients, setPatients] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [combinedRows, setCombinedRows] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const [patientForm, setPatientForm] = useState({
    fullName: "", phone: "", email: "", dateOfBirth: "", gender: "",
  });
  const [savingPatient, setSavingPatient] = useState(false);

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "", doctorId: "", appointmentDate: "", duration: "00:30:00", notes: "",
  });
  const [bookingAppointment, setBookingAppointment] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const [dashboardData, patientsData, doctorsData] = await Promise.all([
        receptionApi.getDashboard(),
        receptionApi.getPatients(),
        receptionApi.getAvailableDoctors(),
      ]);

      const queue = dashboardData.queue?.data || [];
      const docs = doctorsData.data || dashboardData.availableDoctors?.data || [];
      const pts = patientsData.data || [];

      setQueueItems(queue);
      setDoctors(docs);
      setPatients(pts);

      const queueByPatientId = new Map();
      queue.forEach((q) => {
        if (q.patient?.id) queueByPatientId.set(q.patient.id, q);
      });

      const rows = pts.map((p) => {
        const q = queueByPatientId.get(p.id);
        return {
          patientId: p.id,
          fullName: p.fullName,
          phone: p.phone,
          email: p.email,
          gender: p.gender,
          dateOfBirth: p.dateOfBirth,
          appointmentId: q?.appointmentId || null,
          status: q?.status || "Registered",
          waitingMinutes: q?.waitingMinutes || 0,
          appointmentTime: q?.appointmentTime || null,
          doctorSpecialization: q?.doctor?.specialization || "-",
          inQueue: !!q,
        };
      });

      queue.forEach((q) => {
        const exists = rows.some((r) => r.patientId === q.patient?.id);
        if (!exists) {
          rows.push({
            patientId: q.patient?.id,
            fullName: q.patient?.fullName || "Unknown Patient",
            phone: q.patient?.phone || "-",
            email: q.patient?.email || "-",
            gender: "-",
            dateOfBirth: null,
            appointmentId: q.appointmentId,
            status: q.status,
            waitingMinutes: q.waitingMinutes || 0,
            appointmentTime: q.appointmentTime,
            doctorSpecialization: q.doctor?.specialization || "-",
            inQueue: true,
          });
        }
      });

      setCombinedRows(rows);
    } catch (err) {
      console.error(err);
      setError(true);
      showToast(err.message || "Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredRows = combinedRows.filter((r) => {
    const value = search.trim().toLowerCase();
    const matchesSearch =
      !value ||
      (r.fullName || "").toLowerCase().includes(value) ||
      (r.phone || "").toLowerCase().includes(value) ||
      String(r.patientId || "").includes(value);

    if (!matchesSearch) return false;

    if (statusFilter === "queue") return r.inQueue;
    if (statusFilter === "checkedin") return r.status === "CheckedIn";
    if (statusFilter === "scheduled") return r.status === "Scheduled";
    if (statusFilter === "registered") return r.status === "Registered";
    return true;
  });

  async function checkInPatient(appointmentId) {
    if (!appointmentId) return;
    try {
      const result = await receptionApi.checkInAppointment(appointmentId);
      showToast(result?.message || "Patient checked in successfully");
      await loadAll();
    } catch (err) {
      showToast(err.message || "Failed to check-in patient.", "error");
    }
  }

  async function openProfile(patientId) {
    try {
      const data = await receptionApi.getPatient(patientId);
      setProfileData(data.data);
      setProfileModalOpen(true);
    } catch (err) {
      showToast(err.message || "Failed to load profile.", "error");
    }
  }

  async function handleAddPatient(e) {
    e.preventDefault();
    setSavingPatient(true);

    try {
      const result = await receptionApi.addPatient(patientForm);
      showToast(result?.message || "Patient added successfully");
      setPatientModalOpen(false);
      setPatientForm({ fullName: "", phone: "", email: "", dateOfBirth: "", gender: "" });
      await loadAll();
    } catch (err) {
      showToast(err.message || "Failed to add patient.", "error");
    } finally {
      setSavingPatient(false);
    }
  }

  async function handleBookAppointment(e) {
    e.preventDefault();
    setBookingAppointment(true);

    try {
      const result = await receptionApi.bookAppointment({
        patientId: Number(appointmentForm.patientId),
        doctorId: Number(appointmentForm.doctorId),
        appointmentDate: appointmentForm.appointmentDate,
        duration: appointmentForm.duration,
        notes: appointmentForm.notes.trim(),
      });
      showToast(result?.message || "Appointment booked successfully");
      setAppointmentModalOpen(false);
      setAppointmentForm({ patientId: "", doctorId: "", appointmentDate: "", duration: "00:30:00", notes: "" });
      await loadAll();
    } catch (err) {
      showToast(err.message || "Failed to book appointment.", "error");
    } finally {
      setBookingAppointment(false);
    }
  }

  return (
    <>
      <ReceptionTopbar title="Patient Management" onMenuClick={openSidebar}>
        <button onClick={loadAll} className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </button>
        <button onClick={() => setAppointmentModalOpen(true)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">event_available</span>
          Book Appointment
        </button>
        <button onClick={() => setPatientModalOpen(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">person_add</span>
          Add New Patient
        </button>
      </ReceptionTopbar>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto space-y-6">

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Today's Queue</p>
            <h2 className="text-3xl font-black mt-2">{queueItems.length}</h2>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Available Doctors</p>
            <h2 className="text-3xl font-black mt-2">{doctors.length}</h2>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Patients</p>
            <h2 className="text-3xl font-black mt-2">{patients.length}</h2>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[24px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none"
              placeholder="Start typing name or phone..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 h-[58px] bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-slate-700 focus:ring-4 focus:ring-blue-600/10 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="queue">In Queue Today</option>
            <option value="checkedin">Checked In</option>
            <option value="scheduled">Scheduled</option>
            <option value="registered">Registered Only</option>
          </select>
        </section>

        {/* Patient Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-5 text-xs text-slate-500 uppercase tracking-wider font-bold">Patient Details</th>
                  <th className="px-8 py-5 text-xs text-slate-500 uppercase tracking-wider font-bold">Status / Queue</th>
                  <th className="px-8 py-5 text-xs text-slate-500 uppercase tracking-wider font-bold">Doctor</th>
                  <th className="px-8 py-5 text-xs text-slate-500 uppercase tracking-wider font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400">Loading patients...</td></tr>
                )}
                {!loading && error && (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-red-500">Failed to load data.</td></tr>
                )}
                {!loading && !error && filteredRows.length === 0 && (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400">No patients found.</td></tr>
                )}
                {!loading && !error && filteredRows.map((row) => {
                  const disabled = !row.appointmentId || row.status === "CheckedIn" || row.status === "Completed";
                  return (
                    <tr key={row.patientId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg ring-2 ring-slate-100">
                            {getInitials(row.fullName)}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-slate-900">{row.fullName || "-"}</p>
                            <p className="text-sm text-slate-500 font-medium">ID: #SC-{row.patientId || "-"} • {row.phone || "-"}</p>
                            <p className="text-xs text-slate-400">{row.email || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5"><StatusBadge row={row} /></td>
                      <td className="px-8 py-5">
                        <p className="font-semibold text-slate-700">{row.doctorSpecialization || "-"}</p>
                        <p className="text-xs text-slate-400">
                          {row.appointmentTime ? `Today at ${row.appointmentTime}` : "No appointment today"}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            disabled={disabled}
                            onClick={() => checkInPatient(row.appointmentId)}
                            className={disabled
                              ? "px-5 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed"
                              : "px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition-all"}
                          >
                            Check-in
                          </button>
                          <button
                            onClick={() => openProfile(row.patientId)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Queue + Doctors */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-xl font-semibold mb-2">Today Queue</h2>
            <div className="space-y-3">
              {queueItems.length === 0 && <p className="text-sm text-slate-400">No patients in today's queue.</p>}
              {queueItems.slice(0, 5).map((q) => (
                <div key={q.appointmentId} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{q.patient?.fullName || "-"}</p>
                    <p className="text-sm text-slate-500">{q.patient?.phone || "-"} • {q.appointmentTime || "-"}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{q.status || "-"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-xl font-semibold mb-2">Available Doctors</h2>
            <div className="space-y-3">
              {doctors.length === 0 && <p className="text-sm text-slate-400">No available doctors found.</p>}
              {doctors.slice(0, 5).map((d) => (
                <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                  </div>
                  <div>
                    <p className="font-bold">{d.user?.fullName || "Doctor"}</p>
                    <p className="text-sm text-slate-500">{d.specialization || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Add Patient Modal */}
      {patientModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-extrabold">Add New Patient</h3>
                <p className="text-sm text-slate-500">Connects to POST /Reception/patients</p>
              </div>
              <button onClick={() => setPatientModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
            </div>

            <form onSubmit={handleAddPatient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Full Name</span>
                <input required minLength={3} value={patientForm.fullName}
                  onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Phone</span>
                <input required value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Email</span>
                <input required type="email" value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Date of Birth</span>
                <input required type="date" value={patientForm.dateOfBirth}
                  onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Gender</span>
                <select required value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <button disabled={savingPatient} className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-60">
                {savingPatient ? "Saving..." : "Save Patient"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {appointmentModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-extrabold">Book Appointment</h3>
                <p className="text-sm text-slate-500">Connects to POST /Reception/appointments</p>
              </div>
              <button onClick={() => setAppointmentModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
            </div>

            <form onSubmit={handleBookAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Patient</span>
                <select required value={appointmentForm.patientId}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300">
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Doctor</span>
                <select required value={appointmentForm.doctorId}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300">
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.user?.fullName || "Doctor"} - {d.specialization || "-"}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Appointment Date</span>
                <input required type="datetime-local" value={appointmentForm.appointmentDate}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <label>
                <span className="text-sm font-bold text-slate-600">Duration</span>
                <select required value={appointmentForm.duration}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, duration: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300">
                  <option value="00:30:00">30 minutes</option>
                  <option value="01:00:00">60 minutes</option>
                  <option value="01:30:00">90 minutes</option>
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-bold text-slate-600">Notes</span>
                <textarea value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border-slate-300" />
              </label>
              <button disabled={bookingAppointment} className="md:col-span-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-60">
                {bookingAppointment ? "Booking..." : "Book Appointment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileModalOpen && profileData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-extrabold">Patient Profile</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 grid place-items-center font-black text-xl">
                {getInitials(profileData.fullName)}
              </div>
              <div><p className="text-sm text-slate-500">Full Name</p><p className="font-bold">{profileData.fullName || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Phone</p><p className="font-bold">{profileData.phone || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Email</p><p className="font-bold">{profileData.email || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Gender</p><p className="font-bold">{profileData.gender || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Date of Birth</p><p className="font-bold">{formatDate(profileData.dateOfBirth)}</p></div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}