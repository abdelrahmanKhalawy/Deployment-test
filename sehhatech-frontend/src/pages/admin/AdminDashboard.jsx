import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

const statusColors = {
    Completed: 'text-green-700 bg-green-50',
    NoShow: 'text-red-600 bg-red-50',
    Scheduled: 'text-blue-700 bg-blue-50',
};

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (!data?.activityChart?.length) return;
        import('chart.js/auto').then(({ default: Chart }) => {
            if (chartInstance.current) chartInstance.current.destroy();
            const ctx = chartRef.current?.getContext('2d');
            if (!ctx) return;
            const sorted = [...data.activityChart].sort((a, b) =>
                (a.date || a.Date) > (b.date || b.Date) ? 1 : -1
            );
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sorted.map((x) => x.date || x.Date),
                    datasets: [
                        {
                            label: 'Appointments',
                            data: sorted.map((x) => x.count || x.Count || 0),
                            backgroundColor: '#002045',
                            borderRadius: 6,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } },
                        x: { grid: { display: false } },
                    },
                },
            });
        });
        return () => chartInstance.current?.destroy();
    }, [data]);

    async function loadDashboard() {
        try {
            const res = await api.get('/api/admin/dashboard');
            setData(res.data.data ?? res.data);
        } catch {
            setError('Failed to load dashboard data.');
        }
    }

    if (error) return <p className="text-red-500 text-sm">{error}</p>;
    if (!data) return <p className="text-slate-400 text-sm">Loading...</p>;

    const stats = [
        { label: 'Total Doctors', value: data.totalDoctors ?? '—', icon: 'medical_information', color: 'hover:bg-[#002045]' },
        { label: 'Total Receptionists', value: data.totalReceptionists ?? '—', icon: 'support_agent', color: 'hover:bg-teal-700' },
        { label: "Today's Appointments", value: data.todaysAppointments ?? '—', icon: 'calendar_today', color: 'hover:bg-green-700' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">Clinic Dashboard</h1>
                <p className="text-slate-500 mt-1 text-sm">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className={`bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4 group ${s.color} transition-all duration-300 cursor-default`}
                    >
                        <div className="p-2 rounded-lg bg-slate-50 w-fit group-hover:bg-white/20">
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-white">{s.icon}</span>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-slate-900 group-hover:text-white">{s.value}</div>
                            <div className="text-sm text-slate-500 group-hover:text-white/70">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Chart */}
                <div className="col-span-7 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-bold text-[#002045] mb-4">Activity — Last 7 Days</h3>
                    <canvas ref={chartRef} height={160} />
                </div>

                {/* Recent Patients */}
                <div className="col-span-5 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-bold text-[#002045] mb-4">Recent Patients</h3>
                    <div className="space-y-3">
                        {(data.recentRegistrations || []).length === 0 && (
                            <p className="text-slate-400 text-sm">No recent patients.</p>
                        )}
                        {(data.recentRegistrations || []).map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-[#002045] flex items-center justify-center text-white font-bold text-sm">
                                    {(p.fullName || p.FullName || '?').charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-slate-900 truncate">{p.fullName || p.FullName}</p>
                                    <p className="text-xs text-slate-400 truncate">{p.phone || p.Phone || ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Queue */}
                <div className="col-span-12 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-bold text-[#002045] mb-4">Upcoming Appointments Queue</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    {['Patient', 'Doctor', 'Date', 'Time', 'Status'].map((h) => (
                                        <th key={h} className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider px-4">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(data.upcomingAppointmentsQueue || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">
                                            No upcoming appointments
                                        </td>
                                    </tr>
                                ) : (
                                    (data.upcomingAppointmentsQueue || []).map((a, i) => {
                                        const status = a.status || a.Status || 'Scheduled';
                                        return (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium">{a.patientName || a.PatientName || '—'}</td>
                                                <td className="px-4 py-3 text-slate-500">{a.doctorName || a.DoctorName || '—'}</td>
                                                <td className="px-4 py-3 text-slate-500">{a.date || a.Date || '—'}</td>
                                                <td className="px-4 py-3 text-slate-500">{a.time || a.Time || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[status] || statusColors.Scheduled}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}