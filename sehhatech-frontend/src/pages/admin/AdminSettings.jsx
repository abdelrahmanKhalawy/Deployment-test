import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminSettings() {
    const [form, setForm] = useState({ name: '', phone: '', address: '', logoUrl: '' });
    const [sub, setSub] = useState({ plan: '—', expiry: '—' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { loadSettings(); }, []);

    async function loadSettings() {
        try {
            const res = await api.get('/api/admin/settings');
            const s = res.data.data ?? res.data;
            setForm({
                name: s.name || s.Name || '',
                phone: s.phone || s.Phone || '',
                address: s.address || s.Address || '',
                logoUrl: s.logoUrl || s.LogoUrl || '',
            });
            const expiry = s.subscriptionExpiry || s.SubscriptionExpiry;
            setSub({
                plan: s.subscriptionPlan || s.SubscriptionPlan || 'Standard',
                expiry: expiry ? new Date(expiry).toLocaleDateString('en-GB') : '—',
            });
            localStorage.setItem('clinicName', s.name || s.Name || 'SehhaTech');
        } catch {
            setError('Failed to load settings.');
        }
    }

    async function saveSettings() {
        setSaving(true);
        setMsg('');
        setError('');
        try {
            await api.put('/api/admin/settings', {
                name: form.name || null,
                phone: form.phone || null,
                address: form.address || null,
                logoUrl: form.logoUrl || null,
            });
            localStorage.setItem('clinicName', form.name || 'SehhaTech');
            setMsg('Settings saved successfully!');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-[#002045]">Clinic Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Update your clinic profile and view subscription details.</p>
            </div>

            {/* Clinic Profile */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
                <h3 className="font-bold text-[#002045] mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">business</span>
                    Clinic Profile
                </h3>
                <div className="space-y-4">
                    {[
                        { id: 'name', label: 'Clinic Name', placeholder: 'My Clinic' },
                        { id: 'phone', label: 'Phone', placeholder: '+20 1xx xxx xxxx' },
                        { id: 'address', label: 'Address', placeholder: '123 Street, Cairo, Egypt' },
                        { id: 'logoUrl', label: 'Logo URL', placeholder: 'https://...' },
                    ].map((f) => (
                        <div key={f.id}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                            <input
                                type="text"
                                placeholder={f.placeholder}
                                value={form[f.id]}
                                onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]"
                            />
                        </div>
                    ))}
                </div>

                {msg && <p className="mt-4 text-green-600 text-sm font-medium">{msg}</p>}
                {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="mt-6 px-6 py-2.5 bg-[#002045] text-white font-bold rounded-lg hover:bg-[#1a365d] transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-[#002045] mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Subscription
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Plan</p>
                        <p className="font-bold text-slate-900">{sub.plan}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Expires</p>
                        <p className="font-bold text-slate-900">{sub.expiry}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}