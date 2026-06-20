import { useEffect, useRef } from "react";
import PublicFooter from "../../components/public/PublicFooter";
import { Link } from "react-router-dom";

/**
 * Adds `.is-visible` to any element with [data-reveal] once it scrolls
 * into view. Same pattern used across Landing, Register, Payment, etc.
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
            { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
        );

        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return rootRef;
}

const services = [
    {
        name: "SehhaTech API",
        desc: "ASP.NET Core Web API (.NET 10) — Auth, Subscription, Upload",
    },
    {
        name: "SQL Server Database",
        desc: "Primary data store — Tenants, Users, Subscriptions, Appointments",
    },
    {
        name: "Cloudinary Image Storage",
        desc: "Image upload & delivery for doctors, patients, and clinics",
    },
    {
        name: "Paymob Payment Gateway",
        desc: "Subscription payments — 500 EGP/year per clinic",
    },
    {
        name: "JWT Authentication",
        desc: "Token-based auth with role isolation (SuperAdmin, ClinicAdmin, Doctor, Receptionist)",
    },
    {
        name: "Frontend Pages",
        desc: "Landing, Register, Payment, Login, Reset Password",
    },
];

export default function Status() {
    const pageRef = useScrollReveal();

    return (
        <div className="status-page" ref={pageRef}>
            <main className="status-main">
                <nav className="status-back">
                    <Link to="/" className="status-back__link">
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
                        Back to Home
                    </Link>
                </nav>

                <header className="status-header" data-reveal="fade-up">
                    <div className="status-indicator">
                        <span className="status-indicator__dot" />
                        <span className="status-indicator__label">
                            All Systems Operational
                        </span>
                    </div>
                    <h1 className="status-title">System Status</h1>
                    <p className="status-subtitle">
                        Current status of the SehhaTech platform services. All core
                        systems are running normally.
                    </p>
                </header>

                <section className="status-summary" data-reveal="fade-up">
                    <div>
                        <div className="status-summary__value">99.9%</div>
                        <div className="status-summary__label">Target Uptime</div>
                    </div>
                    <div>
                        <div className="status-summary__value">.NET 10</div>
                        <div className="status-summary__label">Backend Runtime</div>
                    </div>
                </section>

                <section className="status-services">
                    <h2 className="status-section-title">Service Status</h2>
                    {services.map((service, i) => (
                        <div
                            className="status-service-row"
                            key={service.name}
                            data-reveal="fade-up"
                            style={{ "--reveal-delay": `${i * 70}ms` }}
                        >
                            <div>
                                <span className="status-service-row__name">
                                    {service.name}
                                </span>
                                <p className="status-service-row__desc">{service.desc}</p>
                            </div>
                            <span className="status-service-row__badge">Operational</span>
                        </div>
                    ))}
                </section>

                <section className="status-incidents" data-reveal="fade-up">
                    <h2 className="status-section-title">Incident History</h2>
                    <article className="status-incident">
                        <time className="status-incident__date">2026</time>
                        <p className="status-incident__text">
                            No incidents reported. Platform launched successfully.
                        </p>
                    </article>
                </section>
            </main>

            <PublicFooter activePage="status" />
        </div>
    );
}