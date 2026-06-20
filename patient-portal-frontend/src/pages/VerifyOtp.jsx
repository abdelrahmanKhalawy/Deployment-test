import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Footer from '../components/Footer'

const TIMER_SECONDS = 120

export default function VerifyOtp() {
    const navigate = useNavigate()
    const phone = sessionStorage.getItem('registerPhone') || ''

    const [digits, setDigits] = useState(['', '', '', '', '', ''])
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
    const [canResend, setCanResend] = useState(false)
    const [msg, setMsg] = useState(null) // { text, type }
    const [loading, setLoading] = useState(false)
    const inputRefs = useRef([])

    /* redirect if no phone in session */
    useEffect(() => {
        if (!phone) navigate('/register')
    }, [phone, navigate])

    /* countdown */
    useEffect(() => {
        if (timeLeft <= 0) { setCanResend(true); return }
        const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
        return () => clearTimeout(id)
    }, [timeLeft])

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    const code = digits.join('')
    const complete = digits.every(d => d !== '')

    const handleInput = (i, val) => {
        const v = val.replace(/\D/g, '').slice(-1)
        const next = [...digits]
        next[i] = v
        setDigits(next)
        if (v && i < 5) {
            inputRefs.current[i + 1]?.focus()
        }
    }

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) {
            inputRefs.current[i - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length === 6) {
            setDigits(pasted.split(''))
            inputRefs.current[5]?.focus()
        }
        e.preventDefault()
    }

    const verify = async () => {
        if (!complete) return
        setLoading(true); setMsg(null)
        try {
            const res = await api.post('/api/portal/auth/verify-otp', { phone, code, purpose: 0 })
            const { accessToken, refreshToken, fullName, phone: p } = res.data.data
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            localStorage.setItem('patientName', fullName)
            localStorage.setItem('patientPhone', p)
            sessionStorage.removeItem('registerPhone')
            navigate('/clinics')
        } catch (err) {
            setMsg({ text: err.response?.data?.message || 'Invalid OTP.', type: 'error' })
            setLoading(false)
        }
    }

    const resend = async () => {
        if (!canResend) return
        try {
            await api.post('/api/portal/auth/resend-otp', { phone, purpose: 0 })
            setMsg({ text: 'OTP resent successfully!', type: 'success' })
            setTimeLeft(TIMER_SECONDS)
            setCanResend(false)
            setDigits(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } catch {
            setMsg({ text: 'Failed to resend OTP.', type: 'error' })
        }
    }

    return (
        <div className="bg-surface min-h-screen flex flex-col text-on-surface">
            {/* Header */}
            <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-50">
                <div className="flex justify-between items-center w-full px-8 max-w-7xl mx-auto h-16">
                    <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
                        <span className="font-bold text-headline-md text-primary">SehhaTech</span>
                    </Link>
                    <button className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant">
                        <span className="material-symbols-outlined">help</span>
                    </button>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-10 w-full max-w-md mx-auto text-center fade-up">
                    <span className="material-symbols-outlined text-primary mb-3 block mx-auto text-[48px]">dialpad</span>
                    <h1 className="font-semibold text-headline-md text-on-surface mb-1">Verify Your Number</h1>
                    <p className="text-body-md text-on-surface-variant mb-6">
                        We sent a 6-digit code to{' '}
                        <strong className="text-on-surface">{phone}</strong>
                    </p>

                    {/* OTP inputs */}
                    <div className="flex justify-center gap-1 md:gap-3 mb-6" onPaste={handlePaste}>
                        {digits.map((d, i) => (
                            <input
                                key={i}
                                ref={el => inputRefs.current[i] = el}
                                type="text" inputMode="numeric" maxLength={1} value={d}
                                onChange={e => handleInput(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                className="w-12 h-12 md:w-14 md:h-14 text-center font-semibold text-headline-md border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors bg-surface-container-lowest"
                            />
                        ))}
                    </div>

                    {/* Timer / resend */}
                    <div className="flex flex-col items-center gap-3 mb-6">
                        {!canResend ? (
                            <p className="text-label-md text-on-surface-variant">
                                Resend code in <span className="font-bold text-primary">{fmt(timeLeft)}</span>
                            </p>
                        ) : null}
                        <button
                            onClick={resend} disabled={!canResend}
                            className={`text-label-md transition-opacity ${canResend ? 'text-primary cursor-pointer hover:underline' : 'text-secondary cursor-not-allowed opacity-50'}`}
                        >
                            Resend OTP
                        </button>
                    </div>

                    {msg && (
                        <p className={`text-label-sm mb-6 ${msg.type === 'error' ? 'text-error' : 'text-primary'}`}>
                            {msg.text}
                        </p>
                    )}

                    <button
                        onClick={verify} disabled={!complete || loading}
                        className="w-full bg-primary-container hover:bg-primary text-on-primary font-medium text-label-md py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    )
}