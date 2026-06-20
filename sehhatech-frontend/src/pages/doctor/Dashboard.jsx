import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const res = await api.get("/api/Doctor/dashboard");
                setData(res.data.data);
            } catch (err) {
                console.error("Dashboard load error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const count = data?.appointmentsTodayCount ?? 0;
    const upcoming = data?.upcomingAppointments ?? [];
    const recentPatients = data?.recentPatients ?? [];
    const timeline = data?.dailyTimeline ?? [];

    return (
        <Layout>
            <div>
                <p className="text-slate-500 font-medium mt-1">
                    Daily clinical overview for {today}
                </p>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-shadow flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[11px] font-800 text-slate-400 uppercase tracking-widest">
                                APPOINTMENTS TODAY
                            </span>
                            <div className="mt-2">
                                <span className="text-4xl font-800 text-slate-900">
                                    {loading ? "0" : count}
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl text-slate-900">
                            <span
                                className="material-symbols-outlined text-2xl"
                                style={{ fontVariationSettings: '"FILL" 1' }}
                            >
                                calendar_month
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full"
                            style={{ width: `${Math.min(count * 10, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Upcoming Appointments */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-700 text-slate-900 flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-primary text-xl">
                                    event_list
                                </span>
                                Upcoming Appointments
                            </h2>
                            <button
                                onClick={() => navigate("/doctor/schedule")}
                                className="text-primary text-sm font-700 hover:underline"
                            >
                                View Full Schedule
                            </button>
                        </div>
                        <div>
                            {loading ? (
                                <p className="px-6 py-5 text-slate-400 text-sm">Loading...</p>
                            ) : upcoming.length ? (
                                upcoming.map((a, i) => (
                                    <div key={i} className="px-6 py-5 border-b border-slate-100">
                                        <div className="font-bold text-slate-900">
                                            {a.patientName ?? "Unknown"}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1">
                                            {new Date(a.appointmentDate).toLocaleString()}
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                            {a.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="px-6 py-5 text-slate-400 text-sm">No upcoming appointments.</p>
                            )}
                        </div>
                    </section>

                    {/* Recent Patients */}
                    <section className="space-y-5">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-700 text-slate-900 flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-primary text-xl">
                                    recent_actors
                                </span>
                                Recent Patients
                            </h2>
                            <button
                                onClick={() => navigate("/doctor/patients")}
                                className="text-slate-500 text-xs font-700 hover:text-slate-900"
                            >
                                See All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {loading ? (
                                <p className="text-slate-400 text-sm col-span-3">Loading...</p>
                            ) : recentPatients.length ? (
                                recentPatients.map((p, i) => (
                                    <div
                                        key={i}
                                        onClick={() => navigate("/doctor/patients")}
                                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card transition-shadow cursor-pointer"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <span
                                                className="material-symbols-outlined text-slate-400"
                                                style={{ fontVariationSettings: '"FILL" 1' }}
                                            >
                                                person
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900">{p.fullName}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{p.phone ?? "-"}</p>
                                        <p className="text-xs text-slate-400 mt-1">ID: {p.id}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm col-span-3">No recent patients.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Daily Timeline */}
                <div className="col-span-12 lg:col-span-4">
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-subtle h-full">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-700 text-slate-900 flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                                Daily Timeline
                            </h2>
                        </div>
                        <div className="p-8">
                            {loading ? (
                                <p className="text-slate-400 text-sm">Loading...</p>
                            ) : timeline.length ? (
                                timeline.map((i, idx) => (
                                    <div key={idx} className="mb-4 p-3 border-l-2 border-primary pl-4">
                                        <div className="font-bold text-slate-900 text-sm">
                                            {new Date(i.appointmentDate).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-0.5">
                                            {i.patientName ?? "Unknown"}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">{i.status}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm">No appointments today.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </Layout>
    );
}