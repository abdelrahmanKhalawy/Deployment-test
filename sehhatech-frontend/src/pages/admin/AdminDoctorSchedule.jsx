import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import portalApi from '../../api/portalApi';

const DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-[#002045] text-lg">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// "09:00:00" -> "09:00" (للعرض في input type=time)
function toInputTime(t) {
    if (!t) return '';
    return t.substring(0, 5);
}

export default function AdminDoctorSchedule() {
    const { doctorId } = useParams();
    const navigate = useNavigate();

    const [doctorName, setDoctorName] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState({
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 30,
        maxPatientsPerSlot: 1,
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        loadDoctorInfo();
        loadSchedules();
    }, [doctorId]);

    async function loadDoctorInfo() {
        try {
            const res = await api.get('/api/admin/doctors');
            const list = res.data.data ?? res.data;
            const found = (list || []).find(d => String(d.id ?? d.Id) === String(doctorId));
            if (found) setDoctorName(found.fullName || found.FullName || '');
        } catch { /* الاسم مش حرج - الصفحة تشتغل من غيره */ }
    }

    async function loadSchedules() {
        setLoading(true);
        setError('');
        try {
            const res = await portalApi.get(`/api/portal/admin/slots/${doctorId}`);
            const list = Array.isArray(res.data) ? res.data : [];
            // ترتيب منطقي - الأحد للسبت
            list.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
            setSchedules(list);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load schedule.');
        } finally {
            setLoading(false);
        }
    }

    async function submitAdd() {
        setFormError('');

        if (!form.startTime || !form.endTime) {
            setFormError('Please fill start and end time.');
            return;
        }
        if (form.startTime >= form.endTime) {
            setFormError('End time must be after start time.');
            return;
        }

        setSubmitting(true);
        try {
            await portalApi.post('/api/portal/admin/slots', {
                doctorId: Number(doctorId),
                dayOfWeek: Number(form.dayOfWeek),
                startTime: `${form.startTime}:00`,
                endTime: `${form.endTime}:00`,
                slotDurationMinutes: Number(form.slotDurationMinutes),
                maxPatientsPerSlot: Number(form.maxPatientsPerSlot),
            });
            setAddOpen(false);
            setForm({ dayOfWeek: 0, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxPatientsPerSlot: 1 });
            loadSchedules();
        } catch (e) {
            // ✅ هنا بتظهر رسالة "already exists" لو حاولت تضيف نفس اليوم/الوقت مرتين
            setFormError(e.response?.data?.message || 'Failed to add schedule.');
        } finally {
            setSubmitting(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        try {
            await portalApi.delete(`/api/portal/admin/slots/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadSchedules();
        } catch {
            setDeleteTarget(null);
        }
    }

    return (
        <div>
            <Link
                to="/admin/doctors"
                className="flex items-center gap-1 text-slate-500 hover:text-[#002045] transition-colors text-sm font-medium mb-6"
            >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Doctors
            </Link>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#002045]">
                        Schedule {doctorName ? `— ${doctorName}` : ''}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Define the days and hours this doctor is available for patient bookings.
                    </p>
                </div>
                <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#002045] text-white rounded-lg font-bold text-sm hover:bg-[#1a365d] transition-colors shadow"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Add Working Hours
                </button>
            </div>

            {/* جدول الأسبوع - كل يوم وحالته */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50">
                            {['Day', 'Working Hours', 'Slot Duration', 'Max / Slot', ''].map((h) => (
                                <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-red-500">{error}</td></tr>
                        ) : schedules.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                    No working hours set yet. Patients won't be able to book until you add at least one day.
                                </td>
                            </tr>
                        ) : (
                            schedules.map((s) => {
                                const dayLabel = DAYS.find(d => d.value === s.dayOfWeek)?.label || s.dayOfWeek;
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-[#002045] text-sm">{dayLabel}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {toInputTime(s.startTime)} — {toInputTime(s.endTime)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{s.slotDurationMinutes} min</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{s.maxPatientsPerSlot}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setDeleteTarget({ id: s.id, label: dayLabel })}
                                                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Schedule Modal */}
            <Modal open={addOpen} onClose={() => { setAddOpen(false); setFormError(''); }} title="Add Working Hours">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Day *</label>
                        <select
                            value={form.dayOfWeek}
                            onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]"
                        >
                            {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Start Time *</label>
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">End Time *</label>
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Slot Duration (min)</label>
                            <input
                                type="number"
                                min={5}
                                step={5}
                                value={form.slotDurationMinutes}
                                onChange={(e) => setForm({ ...form, slotDurationMinutes: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Max Patients / Slot</label>
                            <input
                                type="number"
                                min={1}
                                value={form.maxPatientsPerSlot}
                                onChange={(e) => setForm({ ...form, maxPatientsPerSlot: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]"
                            />
                        </div>
                    </div>

                    {formError && <p className="text-red-500 text-sm">{formError}</p>}

                    <button
                        onClick={submitAdd}
                        disabled={submitting}
                        className="w-full py-3 bg-[#002045] text-white font-bold rounded-lg hover:bg-[#1a365d] transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Saving...' : 'Save Working Hours'}
                    </button>
                </div>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Working Hours">
                <p className="text-slate-600 text-sm mb-6">
                    Remove <span className="font-bold text-slate-900">{deleteTarget?.label}</span> from this doctor's schedule?
                    Patients will no longer be able to book on this day.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600">
                        Remove
                    </button>
                </div>
            </Modal>
        </div>
    );
}