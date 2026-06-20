import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function PatientRecords() {
    const [profile, setProfile] = useState(null);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, patientsRes, apptRes] = await Promise.all([
                    api.get("/api/Doctor/profile"),
                    api.get("/api/Doctor/patients"),
                    api.get("/api/Doctor/appointments/upcoming"),
                ]);
                setProfile(profileRes.data.data);
                setPatients(patientsRes.data);
                setAppointments(apptRes.data.data ?? []);
            } catch (err) {
                console.error("Patient records load error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const d = profile;
    const name = d?.user?.fullName;
    const spec = d?.specialization;
    const imgUrl = d?.doctorProfileImageUrl || d?.user?.userProfileImageUrl;

    return (
        <Layout>
            {/* Doctor Info */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start gap-5">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {imgUrl ? (
                            <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <span
                                className="material-symbols-outlined text-white text-3xl"
                                style={{ fontVariationSettings: '"FILL" 1' }}
                            >
                                person
                            </span>
                        )}
                    </div>
                    <div className="flex-grow">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                            <h1 className="text-2xl font-extrabold text-primary">{name}</h1>
                            <span className="text-[11px] font-bold text-on-primary-container bg-surface-container px-2.5 py-1 rounded tracking-wider uppercase w-fit">
                                {d ? `Doctor ID: ${d.id}` : ""}
                            </span>
                        </div>
                        <p className="text-base font-semibold text-slate-500 mb-2">{spec}</p>
                        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{d?.bio ?? ""}</p>
                    </div>
                </div>
            </section>

            {/* Tab */}
            <nav className="flex border-b border-slate-200">
                <button className="px-8 py-3 text-sm font-bold text-primary border-b-2 border-primary">
                    Patients & Appointments
                </button>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Patients Table */}
                <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-extrabold text-primary">My Patients</h2>
                        <span className="text-xs text-slate-400 font-semibold">
                            {!loading && patients.count !== undefined ? `${patients.count} patients` : ""}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Gender
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-slate-400 text-sm">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : !patients.data?.length ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-slate-400 text-sm">
                                            No patients found.
                                        </td>
                                    </tr>
                                ) : (
                                    patients.data.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <span
                                                            className="material-symbols-outlined text-slate-400 text-sm"
                                                            style={{ fontVariationSettings: '"FILL" 1' }}
                                                        >
                                                            person
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-primary">{p.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{p.phone ?? "-"}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{p.email ?? "-"}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{p.gender ?? "-"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Upcoming */}
                <aside className="lg:col-span-4">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                            <h2 className="text-lg font-extrabold text-primary">Upcoming</h2>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <p className="text-slate-400 text-sm">Loading...</p>
                            ) : !appointments.length ? (
                                <p className="text-slate-400 text-sm">No upcoming appointments.</p>
                            ) : (
                                appointments.map((a, i) => {
                                    const date = new Date(a.appointmentDate);
                                    return (
                                        <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-bold text-primary">
                                                    {date.toLocaleDateString()}
                                                </span>
                                                <span className="text-[12px] font-bold text-slate-500">
                                                    {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-600">
                                                {a.patientName ?? "Unknown"}
                                            </p>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 mt-1 inline-block">
                                                {a.status}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    );
}