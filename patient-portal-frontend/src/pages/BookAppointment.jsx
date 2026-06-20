import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// عدد الأيام المعروضة للاختيار (النهارده + 13 يوم جاي = أسبوعين)
const DAYS_AHEAD = 14

function toDateKey(d) {
    // YYYY-MM-DD بدون تأثير timezone
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export default function BookAppointment() {
    const navigate = useNavigate()

    const clinicId = sessionStorage.getItem('selectedClinicId')
    const clinicName = sessionStorage.getItem('selectedClinicName') || 'Clinic'

    const [doctors, setDoctors] = useState([])
    const [doctorId, setDoctorId] = useState('')
    const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))
    const [slots, setSlots] = useState([])
    const [slotTime, setSlotTime] = useState('')   // "HH:mm:ss" المختار
    const [loadingDoctors, setLoadingDoctors] = useState(false)
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [booking, setBooking] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    /* redirect if no clinic selected */
    useEffect(() => {
        if (!clinicId) navigate('/clinics')
    }, [clinicId, navigate])

    /* load doctors */
    useEffect(() => {
        if (!clinicId) return
        setLoadingDoctors(true)
        api.get(`/api/portal/clinics/${clinicId}/doctors`)
            .then(r => setDoctors(Array.isArray(r.data) ? r.data : []))
            .catch(() => setError('Failed to load doctors.'))
            .finally(() => setLoadingDoctors(false))
    }, [clinicId])

    /* load slots whenever doctor OR date changes */
    useEffect(() => {
        if (!doctorId || !selectedDate) { setSlots([]); setSlotTime(''); return }
        setLoadingSlots(true)
        setError('')
        api.get(`/api/portal/doctors/${doctorId}/slots`, {
            params: { tenantId: clinicId, date: selectedDate }
        })
            .then(r => setSlots(Array.isArray(r.data) ? r.data : []))
            .catch(() => setError('Failed to load slots.'))
            .finally(() => setLoadingSlots(false))
    }, [doctorId, selectedDate, clinicId])

    /* خيارات الأيام القادمة - يبني array من النهارده لحد DAYS_AHEAD يوم جاي */
    const dayOptions = Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return {
            key: toDateKey(d),
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            isToday: i === 0,
        }
    })

    const handleBook = async () => {
        if (!slotTime || !doctorId) return
        setBooking(true); setError('')
        try {
            await api.post('/api/portal/bookings', {
                doctorId: Number(doctorId),
                tenantId: Number(clinicId),
                slotDate: selectedDate,        // "YYYY-MM-DD" - الباك إند بيحوله لـ DateTime
                slotTime: slotTime,            // "HH:mm:ss" - بيتطابق مع TimeSpan في C#
                notes: null,
                idempotencyKey: crypto.randomUUID(),   // ✅ لازم Guid فريد لكل محاولة حجز جديدة
            })
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.')
        } finally {
            setBooking(false)
        }
    }

    if (success) return (
        <div className="bg-background min-h-screen flex flex-col text-on-surface">
            <Navbar />
            <main className="flex-grow flex items-center justify-center px-4 md:px-8 py-16">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center max-w-md w-full fade-up">
                    <div className="w-16 h-16 bg-[#e6f4ea] rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-[#137333] text-[32px]">check_circle</span>
                    </div>
                    <h2 className="font-semibold text-headline-md text-on-surface mb-1">Booking Confirmed!</h2>
                    <p className="text-body-md text-on-surface-variant mb-10">Your appointment has been booked successfully.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => navigate('/my-bookings')}
                            className="bg-primary text-on-primary font-medium text-label-md px-6 py-3 rounded-lg hover:bg-primary-container transition-colors">
                            View My Bookings
                        </button>
                        <button onClick={() => navigate('/clinics')}
                            className="bg-surface-container text-on-surface font-medium text-label-md px-6 py-3 rounded-lg hover:bg-surface-container-high transition-colors">
                            Back to Clinics
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )

    return (
        <div className="bg-background min-h-screen flex flex-col text-on-surface">
            <Navbar />

            <main className="flex-grow w-full max-w-2xl mx-auto px-4 md:px-8 py-16">
                {/* Back */}
                <button onClick={() => navigate('/clinics')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-label-md font-medium mb-10">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>Back to Clinics
                </button>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-10 fade-up">
                    {/* Clinic header */}
                    <div className="flex items-center gap-3 mb-10 pb-6 border-b border-outline-variant">
                        <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[24px]">local_hospital</span>
                        </div>
                        <div>
                            <h1 className="font-semibold text-headline-md text-on-surface">{clinicName}</h1>
                            <p className="text-label-md text-on-surface-variant">Book an appointment</p>
                        </div>
                    </div>

                    {loadingDoctors ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-outline text-[48px] block mb-3">hourglass_empty</span>
                            <p className="text-body-md text-on-surface-variant">Loading doctors...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* Doctor select */}
                            <div className="flex flex-col gap-1">
                                <label className="font-medium text-label-md text-on-surface">Select Doctor <span className="text-error">*</span></label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">stethoscope</span>
                                    <select value={doctorId} onChange={e => { setDoctorId(e.target.value); setSlotTime('') }}
                                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-10 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none">
                                        <option value="">Choose a doctor...</option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>{d.fullName || d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {/* Date picker - الحل الصحيح: المستخدم يختار يوم الحجز */}
                            {doctorId && (
                                <div className="flex flex-col gap-1">
                                    <label className="font-medium text-label-md text-on-surface">Select Date <span className="text-error">*</span></label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                        {dayOptions.map(day => (
                                            <button
                                                key={day.key}
                                                onClick={() => { setSelectedDate(day.key); setSlotTime('') }}
                                                className={`flex-shrink-0 px-4 py-2 rounded-xl border text-center transition-all whitespace-nowrap ${selectedDate === day.key
                                                        ? 'border-primary bg-primary-container text-on-primary'
                                                        : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low'
                                                    }`}
                                            >
                                                <span className="text-label-md font-medium">{day.label}</span>
                                                {day.isToday && <span className="block text-label-sm opacity-80">Today</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Slot select */}
                            {doctorId && selectedDate && (
                                <div className="flex flex-col gap-1">
                                    <label className="font-medium text-label-md text-on-surface">Select Time <span className="text-error">*</span></label>

                                    {loadingSlots ? (
                                        <div className="border border-outline-variant rounded-xl p-6 text-center">
                                            <span className="material-symbols-outlined text-outline text-[32px] block mb-1 animate-pulse">hourglass_empty</span>
                                            <p className="text-body-md text-on-surface-variant">Loading available times...</p>
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className="border border-outline-variant rounded-xl p-6 text-center">
                                            <span className="material-symbols-outlined text-outline text-[32px] block mb-1">event_busy</span>
                                            <p className="text-body-md text-on-surface-variant">No available slots for this date. Try another day.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {slots.map((s, i) => {
                                                const timeStr = typeof s.time === 'string' ? s.time : `${s.time}`
                                                const displayTime = timeStr.substring(0, 5) // "HH:mm"
                                                const disabled = s.isAvailable === false
                                                return (
                                                    <button
                                                        key={`${timeStr}-${i}`}
                                                        onClick={() => !disabled && setSlotTime(timeStr)}
                                                        disabled={disabled}
                                                        className={`p-3 rounded-xl border text-center transition-all ${disabled
                                                                ? 'border-outline-variant bg-surface-container text-outline cursor-not-allowed opacity-50'
                                                                : slotTime === timeStr
                                                                    ? 'border-primary bg-primary-container text-on-primary'
                                                                    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low'
                                                            }`}
                                                    >
                                                        <p className="font-medium text-label-md">{displayTime}</p>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && <p className="text-label-sm text-error">{error}</p>}

                            <button
                                onClick={handleBook}
                                disabled={!slotTime || booking}
                                className="w-full bg-primary text-on-primary font-medium text-label-md py-3 rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                            >
                                {booking ? 'Booking...' : 'Confirm Appointment'}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}