import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axios";

const STRENGTH_CONFIG = [
    { width: "0%", color: "", text: "—" },
    { width: "25%", color: "var(--color-error)", text: "Weak" },
    { width: "50%", color: "#f59e0b", text: "Fair" },
    { width: "75%", color: "var(--color-secondary)", text: "Good" },
    { width: "100%", color: "var(--color-primary-container)", text: "Strong" },
];

/**
 * Adds `.is-visible` to any element with [data-reveal] once it scrolls
 * into view. Same pattern used on Landing.jsx, Register.jsx, Payment.jsx.
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
        <svg className="icon icon-sm" viewBox="0 0 24 24" fill="currentColor">
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

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");
    const pageRef = useScrollReveal();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);

    const strength = useMemo(() => {
        const val = newPassword;
        const checks = {
            length: val.length >= 8,
            number: /\d/.test(val),
            upper: /[A-Z]/.test(val),
            symbol: /[^a-zA-Z0-9]/.test(val),
        };
        const score = Object.values(checks).filter(Boolean).length;
        return { checks, ...STRENGTH_CONFIG[score] };
    }, [newPassword]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleReset = async () => {
        if (!newPassword || !confirmPassword) {
            showToast("Please fill in all fields.", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }
        if (newPassword.length < 8) {
            showToast("Password must be at least 8 characters.", "error");
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post("/api/auth/reset-password", {
                email,
                newPassword,
                confirmPassword,
            });
            showToast("Password updated successfully! Redirecting to login...", "success");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            const message =
                err.response?.data?.message || "Failed to reset password.";
            showToast(message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="reset-page" ref={pageRef}>
            {toast && (
                <div className={`toast toast--${toast.type}`}>{toast.message}</div>
            )}

            <div className="reset-bg" />

            <header className="reset-header">
                <div className="reset-header__inner">
                    <div className="reset-brand">SehhaTech</div>
                    <button className="reset-help" aria-label="Help">
                        <svg
                            className="icon icon-sm"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12" y2="17" />
                        </svg>
                    </button>
                </div>
            </header>

            <main className="reset-main">
                <div className="reset-card" data-reveal="fade-up">
                    <div className="reset-card__head">
                        <div className="reset-card__icon">
                            <svg
                                className="icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0110 0v1" />
                                <path d="M16 16l2 2 4-4" />
                            </svg>
                        </div>
                        <h1>Reset Password</h1>
                        <p>Secure your account by creating a new high-entropy password.</p>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="reset-form">
                        {/* New Password */}
                        <div className="reset-field">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="reset-input-wrap">
                                <span className="reset-input-icon reset-input-icon--left">
                                    <svg
                                        className="icon icon-sm"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="newPassword"
                                    type={showNew ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="reset-input-icon reset-input-icon--right"
                                    onClick={() => setShowNew((v) => !v)}
                                    aria-label="Toggle new password visibility"
                                >
                                    <EyeIcon visible={showNew} />
                                </button>
                            </div>
                        </div>

                        {/* Strength Indicator */}
                        <div className="reset-strength">
                            <div className="reset-strength__head">
                                <span>Security Strength</span>
                                <span style={{ color: strength.color || undefined }}>
                                    {strength.text}
                                </span>
                            </div>
                            <div className="reset-strength__track">
                                <div
                                    className="reset-strength__fill"
                                    style={{
                                        width: strength.width,
                                        background: strength.color || "transparent",
                                    }}
                                />
                            </div>
                            <ul className="reset-requirements">
                                <li
                                    className={
                                        strength.checks.length
                                            ? "reset-requirements__item reset-requirements__item--active"
                                            : "reset-requirements__item"
                                    }
                                >
                                    <CheckCircleIcon active={strength.checks.length} />
                                    8+ Characters
                                </li>
                                <li
                                    className={
                                        strength.checks.symbol
                                            ? "reset-requirements__item reset-requirements__item--active"
                                            : "reset-requirements__item"
                                    }
                                >
                                    <CheckCircleIcon active={strength.checks.symbol} />
                                    One Symbol
                                </li>
                                <li
                                    className={
                                        strength.checks.number
                                            ? "reset-requirements__item reset-requirements__item--active"
                                            : "reset-requirements__item"
                                    }
                                >
                                    <CheckCircleIcon active={strength.checks.number} />
                                    One Number
                                </li>
                                <li
                                    className={
                                        strength.checks.upper
                                            ? "reset-requirements__item reset-requirements__item--active"
                                            : "reset-requirements__item"
                                    }
                                >
                                    <CheckCircleIcon active={strength.checks.upper} />
                                    Upper Case
                                </li>
                            </ul>
                        </div>

                        {/* Confirm Password */}
                        <div className="reset-field">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <div className="reset-input-wrap">
                                <span className="reset-input-icon reset-input-icon--left">
                                    <svg
                                        className="icon icon-sm"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                        <path d="M9 12l2 2 4-4" />
                                    </svg>
                                </span>
                                <input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="reset-input-icon reset-input-icon--right"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    aria-label="Toggle confirm password visibility"
                                >
                                    <EyeIcon visible={showConfirm} />
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="button"
                            className="reset-submit"
                            disabled={isLoading}
                            onClick={handleReset}
                        >
                            <span>{isLoading ? "Please wait..." : "Update Password"}</span>
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

                        {/* Back to Login */}
                        <div className="reset-back-wrap">
                            <Link to="/login" className="reset-back-link">
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
                                Back to Login
                            </Link>
                        </div>
                    </form>

                    {/* Trust Badges */}
                    <div className="reset-trust">
                        <div className="reset-trust__item">
                            <svg
                                className="icon icon-sm"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                            <span>HIPAA Compliant</span>
                        </div>
                        <div className="reset-trust__item">
                            <svg
                                className="icon icon-sm"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <span>AES-256 Auth</span>
                        </div>
                        <div className="reset-trust__item">
                            <svg
                                className="icon icon-sm"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>Secure Node</span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="reset-footer">
                <div className="reset-footer__inner">
                    <div className="reset-footer__copy">
                        © 2026 SehhaTech Clinical Systems.
                    </div>
                    <div className="reset-footer__links">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}