import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";

const SPECIALIZATIONS = [
    "General Practice",
    "Cardiology",
    "Pediatrics",
    "Dermatology",
    "Other Specialization",
];

const STRENGTH_CONFIG = [
    { width: "0%", color: "", text: "—" },
    { width: "25%", color: "var(--color-error)", text: "Weak" },
    { width: "50%", color: "#f59e0b", text: "Fair" },
    { width: "75%", color: "var(--color-secondary)", text: "Good" },
    { width: "100%", color: "var(--color-primary)", text: "Strong" },
];

/**
 * Adds `.is-visible` to any element with [data-reveal] once it scrolls
 * into view. Same pattern used on Landing.jsx — pure CSS handles the
 * actual transition (see public-pages.css).
 */
function useScrollReveal() {
    const rootRef = useRef(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const targets = root.querySelectorAll("[data-reveal]");
        if (!targets.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
        );

        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return rootRef;
}

function CheckCircleIcon({ active }) {
    return active ? (
        <svg
            className="icon icon-sm"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1.2 14.6l-4-4 1.4-1.4 2.6 2.6 6-6 1.4 1.4z" />
        </svg>
    ) : (
        <svg className="icon icon-sm" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="9" />
        </svg>
    );
}

function EyeIcon({ visible }) {
    return visible ? (
        <svg
            className="icon icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
        </svg>
    ) : (
        <svg
            className="icon icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export default function Register() {
    const navigate = useNavigate();
    const pageRef = useScrollReveal();

    const [form, setForm] = useState({
        clinicName: "",
        specialization: SPECIALIZATIONS[0],
        clinicAddress: "",
        clinicPhone: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }

    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm((prev) => ({ ...prev, [id]: value }));
    };

    const strength = useMemo(() => {
        const val = form.password;
        const checks = {
            length: val.length >= 8,
            number: /\d/.test(val),
            upper: /[A-Z]/.test(val),
            symbol: /[^a-zA-Z0-9]/.test(val),
        };
        const score = Object.values(checks).filter(Boolean).length;
        return { checks, ...STRENGTH_CONFIG[score] };
    }, [form.password]);

    const isFormReady = useMemo(() => {
        const requiredFilled = [
            "clinicName",
            "clinicAddress",
            "clinicPhone",
            "fullName",
            "email",
            "password",
            "confirmPassword",
        ].every((key) => form[key].trim().length > 0);
        return (
            requiredFilled &&
            form.password === form.confirmPassword &&
            strength.checks.length
        );
    }, [form, strength]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const validate = () => {
        const required = [
            "clinicName",
            "clinicAddress",
            "clinicPhone",
            "fullName",
            "email",
            "password",
            "confirmPassword",
        ];
        for (const key of required) {
            if (!form[key].trim()) {
                showToast("Please fill in all required fields.", "error");
                return false;
            }
        }
        if (form.password !== form.confirmPassword) {
            showToast("Passwords do not match.", "error");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            showToast("Please enter a valid email address.", "error");
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            const res = await axiosInstance.post("/api/auth/register", {
                clinicName: form.clinicName.trim(),
                specialization: form.specialization,
                address: form.clinicAddress.trim(),
                phone: form.clinicPhone.trim(),
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                password: form.password,
            });

            const data = res.data;
            sessionStorage.setItem("tenantId", data.tenantId);
            sessionStorage.setItem("token", data.token);
            showToast("Account created successfully! Redirecting to payment...", "success");
            setTimeout(() => navigate("/payment"), 1500);
        } catch (err) {
            const message =
                err.response?.data?.message ||
                "Registration failed. Please try again.";
            showToast(message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page" ref={pageRef}>
            {toast && (
                <div className={`toast toast--${toast.type}`}>{toast.message}</div>
            )}

            <header className="register-header">
                <div className="register-header__inner">
                    <div className="register-header__left">
                        <button onClick={() => navigate(-1)} className="register-back">
                            <svg
                                className="icon icon-sm"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M19 12H5" />
                                <path d="M12 19l-7-7 7-7" />
                            </svg>
                            <span>Back</span>
                        </button>
                        <div className="register-brand">SehhaTech</div>
                    </div>
                </div>
            </header>

            <main className="register-main">
                <div className="register-container">
                    {/* Step Indicator */}
                    <div className="register-steps" data-reveal="fade-up">
                        <div className="register-steps__circle register-steps__circle--active">
                            1
                        </div>
                        <div className="register-steps__bar">
                            <div
                                className="register-steps__bar-fill"
                                style={{ width: isFormReady ? "100%" : "0%" }}
                            />
                        </div>
                        <div
                            className={
                                isFormReady
                                    ? "register-steps__circle register-steps__circle--done"
                                    : "register-steps__circle"
                            }
                        >
                            2
                        </div>
                    </div>
                    <h1 className="register-title">Create Your SehhaTech Workspace</h1>
                    <p className="register-subtitle">
                        Step 1: Clinic &amp; Admin Details
                    </p>

                    <div className="register-card">
                        <form
                            className="register-form"
                            onSubmit={(e) => e.preventDefault()}
                        >
                            {/* Clinic Information */}
                            <section
                                className="register-section"
                                data-reveal="fade-up"
                            >
                                <div className="register-section__header">
                                    <svg
                                        className="icon icon-sm register-section__icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M19 8h-2V6a3 3 0 00-3-3H10a3 3 0 00-3 3v2H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2zm-8-2a1 1 0 011-1h4a1 1 0 011 1v2h-6zm2 7h2v2h2v2h-2v2h-2v-2H9v-2h2z" />
                                    </svg>
                                    <h2 className="register-section__title">
                                        Clinic Information
                                    </h2>
                                </div>
                                <div className="register-grid">
                                    <div className="register-field">
                                        <label htmlFor="clinicName">Clinic Name</label>
                                        <input
                                            id="clinicName"
                                            type="text"
                                            placeholder="e.g. Wellness Medical Center"
                                            value={form.clinicName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="register-field">
                                        <label htmlFor="specialization">Specialization</label>
                                        <select
                                            id="specialization"
                                            value={form.specialization}
                                            onChange={handleChange}
                                        >
                                            {SPECIALIZATIONS.map((spec) => (
                                                <option key={spec} value={spec}>
                                                    {spec}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="register-field register-field--full">
                                        <label htmlFor="clinicAddress">Clinic Address</label>
                                        <input
                                            id="clinicAddress"
                                            type="text"
                                            placeholder="e.g. 12 Tahrir St, Cairo, Egypt"
                                            value={form.clinicAddress}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="register-field register-field--full">
                                        <label htmlFor="clinicPhone">Clinic Phone</label>
                                        <input
                                            id="clinicPhone"
                                            type="tel"
                                            placeholder="e.g. +20 100 000 0000"
                                            value={form.clinicPhone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Administrator Account */}
                            <section
                                className="register-section register-section--bordered"
                                data-reveal="fade-up"
                                style={{ "--reveal-delay": "120ms" }}
                            >
                                <div className="register-section__header">
                                    <svg
                                        className="icon icon-sm register-section__icon"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 12a5 5 0 10-5-5 5 5 0 005 5zm0 2c-4 0-8 2-8 5v2h11.09A6 6 0 0114 16a6 6 0 016-2.45c-1.06-1.07-4.18-3.55-8-3.55zm9 1v2h-2v2h-2v-2h-2v-2h2V13h2v2z" />
                                    </svg>
                                    <h2 className="register-section__title">
                                        Administrator Account
                                    </h2>
                                </div>
                                <div className="register-grid">
                                    <div className="register-field register-field--full">
                                        <label htmlFor="fullName">Full Name</label>
                                        <input
                                            id="fullName"
                                            type="text"
                                            placeholder="e.g. Dr. Ahmed Mohamed"
                                            value={form.fullName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="register-field register-field--full">
                                        <label htmlFor="email">Professional Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="e.g. ahmed@yourclinic.com"
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="register-field">
                                        <label htmlFor="password">Password</label>
                                        <div className="register-input-wrap">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={form.password}
                                                onChange={handleChange}
                                            />
                                            <button
                                                type="button"
                                                className="register-input-icon"
                                                onClick={() => setShowPassword((v) => !v)}
                                                aria-label="Toggle password visibility"
                                            >
                                                <EyeIcon visible={showPassword} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="register-field">
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        <div className="register-input-wrap">
                                            <input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={form.confirmPassword}
                                                onChange={handleChange}
                                            />
                                            <button
                                                type="button"
                                                className="register-input-icon"
                                                onClick={() => setShowConfirmPassword((v) => !v)}
                                                aria-label="Toggle confirm password visibility"
                                            >
                                                <EyeIcon visible={showConfirmPassword} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Strength Indicator */}
                                    <div className="register-strength register-field--full">
                                        <div className="register-strength__head">
                                            <span>Security Strength</span>
                                            <span style={{ color: strength.color || undefined }}>
                                                {strength.text}
                                            </span>
                                        </div>
                                        <div className="register-strength__track">
                                            <div
                                                className="register-strength__fill"
                                                style={{
                                                    width: strength.width,
                                                    background: strength.color || "transparent",
                                                }}
                                            />
                                        </div>
                                        <ul className="register-requirements">
                                            <li
                                                className={
                                                    strength.checks.length
                                                        ? "register-requirements__item register-requirements__item--active"
                                                        : "register-requirements__item"
                                                }
                                            >
                                                <CheckCircleIcon active={strength.checks.length} />
                                                8+ Characters
                                            </li>
                                            <li
                                                className={
                                                    strength.checks.symbol
                                                        ? "register-requirements__item register-requirements__item--active"
                                                        : "register-requirements__item"
                                                }
                                            >
                                                <CheckCircleIcon active={strength.checks.symbol} />
                                                One Symbol
                                            </li>
                                            <li
                                                className={
                                                    strength.checks.number
                                                        ? "register-requirements__item register-requirements__item--active"
                                                        : "register-requirements__item"
                                                }
                                            >
                                                <CheckCircleIcon active={strength.checks.number} />
                                                One Number
                                            </li>
                                            <li
                                                className={
                                                    strength.checks.upper
                                                        ? "register-requirements__item register-requirements__item--active"
                                                        : "register-requirements__item"
                                                }
                                            >
                                                <CheckCircleIcon active={strength.checks.upper} />
                                                Upper Case
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Submit */}
                            <div
                                className="register-submit"
                                data-reveal="fade-up"
                                style={{ "--reveal-delay": "220ms" }}
                            >
                                <button
                                    type="button"
                                    className="register-submit__btn"
                                    disabled={isLoading}
                                    onClick={handleRegister}
                                >
                                    <span>
                                        {isLoading ? "Please wait..." : "Continue to Plan Selection"}
                                    </span>
                                    {isLoading ? (
                                        <svg
                                            className="icon icon-sm register-spin"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M21 12a9 9 0 11-9-9" />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="icon icon-sm"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <path d="M12 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                                <p className="register-signin">
                                    Already have an account?{" "}
                                    <Link to="/login" className="register-signin__link">
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Trust Badges */}
                    <div
                        className="register-trust"
                        data-reveal="fade-up"
                        style={{ "--reveal-delay": "150ms" }}
                    >
                        <div className="register-trust__item">
                            <svg
                                className="icon icon-sm"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                            <span>HIPAA Compliant</span>
                        </div>
                        <div className="register-trust__item">
                            <svg
                                className="icon icon-sm"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 1a5 5 0 00-5 5v3H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-2V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3z" />
                            </svg>
                            <span>SSL Secure Encryption</span>
                        </div>
                        <div className="register-trust__item">
                            <svg
                                className="icon icon-sm"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1.2 14.6l-4-4 1.4-1.4 2.6 2.6 6-6 1.4 1.4z" />
                            </svg>
                            <span>GDPR Ready</span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="register-footer">
                <div className="register-footer__inner">
                    <p className="register-footer__copy">
                        © 2026 SehhaTech Medical Systems
                    </p>
                    <div className="register-footer__links">
                        <Link to="/security">Security</Link>
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/terms">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}