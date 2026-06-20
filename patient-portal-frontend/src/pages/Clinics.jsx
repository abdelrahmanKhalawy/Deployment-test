import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const SPECIALTIES = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General', 'Dental']
const CITIES = ['Cairo', 'Alexandria', 'Giza']

export default function Clinics() {
    const navigate = useNavigate()
    const [clinics, setClinics] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [specialty, setSpecialty] = useState('')
    const [city, setCity] = useState('')

    const load = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const params = new URLSearchParams()
            if (search) params.append('name', search)
            if (specialty) params.append('specialty', specialty)
            if (city) params.append('city', city)
            const res = await api.get(`/api/portal/clinics?${params}`)
            setClinics(Array.isArray(res.data) ? res.data : [])
        } catch {
            setError('Failed to load clinics. Please make sure the server is running.')
        } finally {
            setLoading(false)
        }
    }, [search, specialty, city])

    /* debounce search */
    useEffect(() => {
        const t = setTimeout(load, search ? 400 : 0)
        return () => clearTimeout(t)
    }, [load, search])

    useEffect(() => { load() }, [specialty, city]) // eslint-disable-line

    const viewClinic = (id, name) => {
        sessionStorage.setItem('selectedClinicId', id)
        sessionStorage.setItem('selectedClinicName', name)
        navigate('/book-appointment')
    }

    return (
        <div className="bg-background min-h-screen flex flex-col text-on-surface relative overflow-x-hidden">
            {/* decorative floating icons */}
            {[{ top: '10%', left: '5%', delay: '0s' }, { top: '40%', right: '10%', delay: '-5s' }, { bottom: '20%', left: '15%', delay: '-10s' }].map((s, i) => (
                <span key={i} className="material-symbols-outlined fixed z-0 pointer-events-none select-none"
                    style={{ ...s, fontSize: `${[120, 180, 150][i]}px`, color: 'rgba(46,117,182,0.05)', animation: `float 20s infinite ease-in-out alternate`, animationDelay: s.delay }}>
                    medical_services
                </span>
            ))}
            <style>{`@keyframes float{0%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-30px) rotate(15deg) scale(1.05)}100%{transform:translateY(20px) rotate(-10deg) scale(.95)}}`}</style>

            <Navbar />

            <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-16 relative z-10">
                {/* Title */}
                <div className="text-center mb-16 fade-up" style={{ animationDelay: '.1s' }}>
                    <h1 className="font-bold text-display-lg text-on-surface mb-3">Find a Clinic</h1>
                    <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                        Explore and connect with top clinics and medical centers in the SehhaTech network.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl p-6 mb-16 shadow-[0_4px_12px_rgba(0,0,0,0.05)] fade-up" style={{ animationDelay: '.2s' }}>
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        {/* Search */}
                        <div className="relative w-full md:flex-grow">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search by clinic name..."
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-3 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline"
                            />
                        </div>
                        {/* Specialty */}
                        <div className="relative w-full md:w-48">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">stethoscope</span>
                            <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-10 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none">
                                <option value="">Specialty</option>
                                {SPECIALTIES.map(s => <option key={s} value={s}>{s === 'General' ? 'General Practice' : s}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                        </div>
                        {/* City */}
                        <div className="relative w-full md:w-48">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">location_on</span>
                            <select value={city} onChange={e => setCity(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-10 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none">
                                <option value="">City</option>
                                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-outline text-[64px] block mb-3">hourglass_empty</span>
                        <p className="text-body-lg text-on-surface-variant">Loading clinics...</p>
                    </div>
                ) : error ? (
                    <p className="text-error text-body-md text-center py-16">{error}</p>
                ) : clinics.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-outline text-[64px] block mb-3">search_off</span>
                        <p className="text-body-lg text-on-surface-variant">No clinics found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clinics.map((c, i) => (
                            <div
                                key={c.id}
                                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] fade-up"
                                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-[24px]">local_hospital</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg font-semibold text-label-sm flex items-center gap-1 ${c.isActive ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-[#137333]' : 'bg-outline'}`} />
                                        {c.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-headline-md text-on-surface mb-1">{c.name || 'Clinic'}</h3>
                                <p className="text-body-md text-on-surface-variant mb-6">{c.specialty || ''}</p>
                                <div className="space-y-2 mb-10">
                                    <div className="flex items-center text-on-surface-variant text-label-md">
                                        <span className="material-symbols-outlined text-outline mr-2 text-[16px]">location_on</span>{c.city || ''}
                                    </div>
                                    <div className="flex items-center text-on-surface-variant text-label-md">
                                        <span className="material-symbols-outlined text-outline mr-2 text-[16px]">call</span>{c.phone || ''}
                                    </div>
                                </div>
                                <button
                                    onClick={() => viewClinic(c.id, c.name)}
                                    disabled={!c.isActive}
                                    className={`w-full font-medium text-label-md py-2 rounded-lg transition-colors ${c.isActive
                                            ? 'bg-primary-container text-on-primary hover:bg-primary'
                                            : 'bg-surface-container text-outline cursor-not-allowed opacity-70'
                                        }`}
                                >
                                    View Clinic
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}