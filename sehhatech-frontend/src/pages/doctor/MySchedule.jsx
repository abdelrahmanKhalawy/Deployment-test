import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function MySchedule() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        async function fetchSchedule() {
            try {
                const res = await api.get("/api/Doctor/appointments/upcoming");
                const data = res.data.data ?? [];
                setAppointments(data);
                if (data.length) setSelected(data[0]);
            } catch (err) {
                console.error("Schedule load error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchSchedule();
    }, []);

    async function openPatientDetails() {
        if (!selected) return;
        try {
            const res = await api.get(`/api/Doctor/patients/${selected.patientId}`);
            setPatientDetails(res.data);
            setShowModal(true);
        } catch (err) {
            console.error("Error loading patient:", err);
        }
    }

    const today = new Date();
    const count = appointments.length;
    const scheduleInfo =
        today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }) + ` — ${count} ${count === 1 ? "Appointment Remaining" : "Appointments Remaining"}`;

    const apptDate = selected ? new Date(selected.appointmentDate) : null;

    return (
        <Layout>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-primary mb-1">Daily Schedule</h2>
                <p className="text-slate-500 font-medium">{loading ? "Loading..." : scheduleInfo}</p>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* Left: Appointment List */}
                <div className="col-span-12 lg:col-span-5 space-y-3">
                    {loading ? (
                        <p className="text-slate-400 text-sm">Loading...</p>
                    ) : !appointments.length ? (
                        <p className="text-slate-400 text-sm px-2">No upcoming appointments.</p>
                    ) : (
                        appointments.map((app, i) => {
                            const date = new Date(app.appointmentDate);
                            const hour = date.getHours();
                            const displayHour = hour % 12 || 12;
                            const ampm = hour >= 12 ? "PM" : "AM";
                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelected(app)}
                                    className="bg-white rounded border border-slate-200 hover:border-primary flex items-center justify-between p-4 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center bg-slate-50 text-slate-600 w-14 h-14 rounded flex-shrink-0">
                                            <span className="text-xl font-bold leading-none">{displayHour}</span>
                                            <span className="text-[10px] font-bold uppercase">{ampm}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{app.patientName ?? "Unknown"}</h3>
                                            <p className="text-sm text-slate-500">{app.status}</p>
                                            <p className="text-xs text-slate-400">{date.toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">
                                        chevron_right
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right: Patient Details */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <section className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-start gap-6">
                            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <span
                                    className="material-symbols-outlined text-slate-400 text-5xl"
                                    style={{ fontVariationSettings: '"FILL" 1' }}
                                >
                                    person
                                </span>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-2xl font-bold text-primary">
                                    {selected ? selected.patientName ?? "Unknown" : "Select an appointment"}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {selected ? `PATIENT ID: ${selected.patientId}` : ""}
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Scheduled For
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                                        <p className="font-bold text-primary">
                                            {apptDate ? apptDate.toLocaleDateString() : "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Appointment Time
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                                        <p className="font-bold text-primary">
                                            {apptDate
                                                ? apptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                : "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button
                                    onClick={openPatientDetails}
                                    disabled={!selected}
                                    className="w-full bg-primary text-white py-3.5 rounded font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[20px]">person</span>
                                    View Patient Profile
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Patient Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[520px] max-w-[90%] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-primary">Patient Details</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {patientDetails && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Name</p>
                                        <p className="font-semibold text-slate-900 mt-1">
                                            {patientDetails.data?.fullName ?? "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Phone</p>
                                        <p className="font-semibold text-slate-900 mt-1">
                                            {patientDetails.data?.phone ?? "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Email</p>
                                        <p className="font-semibold text-slate-900 mt-1">
                                            {patientDetails.data?.email ?? "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Gender</p>
                                        <p className="font-semibold text-slate-900 mt-1">
                                            {patientDetails.data?.gender ?? "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Date of Birth</p>
                                        <p className="font-semibold text-slate-900 mt-1">
                                            {patientDetails.data?.dateOfBirth
                                                ? new Date(patientDetails.data.dateOfBirth).toLocaleDateString()
                                                : "-"}
                                        </p>
                                    </div>
                                </div>

                                {patientDetails.data?.medicalHistory && (
                                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Medical History</p>
                                        <p className="text-sm text-slate-700">{patientDetails.data.medicalHistory}</p>
                                    </div>
                                )}

                                {patientDetails.appointmentHistory?.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">
                                            Appointment History
                                        </p>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {patientDetails.appointmentHistory.map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm"
                                                >
                                                    <span className="text-slate-700">
                                                        {new Date(h.appointmentDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                                                        {h.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}