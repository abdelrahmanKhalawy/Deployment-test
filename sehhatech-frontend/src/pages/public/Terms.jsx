import { useEffect, useRef } from "react";
import PublicHeader from "../../components/public/PublicHeader";
import PublicFooter from "../../components/public/PublicFooter";

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

export default function Terms() {
    const pageRef = useScrollReveal();
    return (
        <div className="policy-page" ref={pageRef}>
            <PublicHeader />

            <main className="policy-main">
                <header className="policy-header" data-reveal="fade-up">
                    <div className="policy-badge">Legal Documentation</div>
                    <h1 className="policy-title">Terms of Service</h1>
                    <p className="policy-subtitle">
                        Last updated: 2026. Please read these terms carefully before
                        accessing or using the SehhaTech platform.
                    </p>
                </header>

                <article className="policy-sections">
                    <section className="policy-section" id="introduction" data-reveal="fade-up">
                        <h2 className="policy-section__title">
                            <span className="policy-section__num">01</span> Agreement to
                            Terms
                        </h2>
                        <div className="policy-section__body">
                            <p>
                                By registering or using SehhaTech, you agree to be bound by
                                these Terms of Service. These terms form a legally binding
                                agreement between you and SehhaTech Clinical Systems
                                regarding your use of our clinic management platform.
                            </p>
                            <p>
                                If you are registering on behalf of a clinic or healthcare
                                facility, you confirm that you have the authority to bind
                                that entity to these terms.
                            </p>
                        </div>
                    </section>

                    <section className="policy-section" id="account-usage" data-reveal="fade-up">
                        <h2 className="policy-section__title">
                            <span className="policy-section__num">02</span> Account Usage
                            &amp; Security
                        </h2>
                        <div className="policy-section__body">
                            <p>
                                Each user must register with accurate information and
                                maintain the security of their own credentials. Every team
                                member (doctors, receptionists, admins) must have their own
                                individual account — credential sharing is strictly
                                prohibited.
                            </p>
                            <div className="policy-quote">
                                "New users added by a Clinic Admin are required to reset
                                their password on first login. This ensures every account
                                holder has a private, personal credential."
                            </div>
                            <p>
                                SehhaTech reserves the right to suspend any account suspected
                                of unauthorized access or credential sharing.
                            </p>
                        </div>
                    </section>

                    <section className="policy-section" id="subscriptions" data-reveal="fade-up">
                        <h2 className="policy-section__title">
                            <span className="policy-section__num">03</span> Subscriptions
                            &amp; Billing
                        </h2>
                        <div className="policy-section__body">
                            <ul className="policy-checklist">
                                <li>
                                    <svg
                                        className="icon icon-sm policy-check-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <path d="M22 4L12 14.01l-3-3" />
                                    </svg>
                                    <div>
                                        <strong>Annual Subscription</strong>
                                        SehhaTech operates on a fixed annual subscription of 500
                                        EGP per clinic. Access to all platform features is
                                        granted upon successful payment confirmation.
                                    </div>
                                </li>
                                <li>
                                    <svg
                                        className="icon icon-sm policy-check-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <path d="M22 4L12 14.01l-3-3" />
                                    </svg>
                                    <div>
                                        <strong>Payment Processing</strong>
                                        All payments are processed securely through Paymob.
                                        SehhaTech does not store any card or payment details on
                                        its servers.
                                    </div>
                                </li>
                                <li>
                                    <svg
                                        className="icon icon-sm policy-check-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <path d="M22 4L12 14.01l-3-3" />
                                    </svg>
                                    <div>
                                        <strong>Clinic Activation</strong>
                                        Your clinic account will be activated automatically after
                                        a successful payment. An inactive subscription means no
                                        access to the platform until renewed.
                                    </div>
                                </li>
                            </ul>
                            <p className="policy-section__footnote">
                                SehhaTech reserves the right to modify subscription pricing
                                with a minimum 30-day notice to all active account holders.
                            </p>
                        </div>
                    </section>

                    <section className="policy-section" id="liability" data-reveal="fade-up">
                        <h2 className="policy-section__title">
                            <span className="policy-section__num">04</span> Liability
                            &amp; Medical Disclaimer
                        </h2>
                        <div className="policy-disclaimer">
                            <p className="policy-disclaimer__label">
                                <svg
                                    className="icon icon-sm"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <path d="M12 9v4" />
                                    <path d="M12 17h.01" />
                                </svg>
                                Critical Disclaimer
                            </p>
                            <p className="policy-disclaimer__text">
                                SehhaTech is a software platform designed to support
                                administrative and clinical workflows. It is NOT a
                                substitute for professional medical judgment, diagnosis, or
                                treatment.
                            </p>
                        </div>
                        <div className="policy-section__body">
                            <p>
                                To the maximum extent permitted by law, SehhaTech shall not
                                be liable for any damages resulting from:
                            </p>
                            <ul className="policy-list">
                                <li>Inaccuracies in patient data entered by clinic staff.</li>
                                <li>
                                    Service interruptions due to scheduled maintenance or
                                    infrastructure issues.
                                </li>
                                <li>
                                    Clinical decisions made based on information managed within
                                    the platform.
                                </li>
                                <li>
                                    Unauthorized access resulting from user credential
                                    mismanagement.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="policy-section" id="data" data-reveal="fade-up">
                        <h2 className="policy-section__title">
                            <span className="policy-section__num">05</span> Data Ownership
                            &amp; Privacy
                        </h2>
                        <div className="policy-section__body">
                            <p>
                                All clinic and patient data entered into SehhaTech remains
                                the property of the respective clinic. SehhaTech does not
                                sell, share, or use your data for any purpose beyond
                                operating the platform.
                            </p>
                            <p>
                                Each clinic's data is fully isolated from other clinics
                                through our Multi-Tenant architecture. No clinic can access
                                another clinic's data under any circumstances.
                            </p>
                        </div>
                    </section>
                </article>
            </main>

            <PublicFooter activePage="terms" />
        </div>
    );
}