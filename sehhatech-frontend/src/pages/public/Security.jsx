import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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

export default function Security() {
    const pageRef = useScrollReveal();
    return (
        <div className="policy-page" ref={pageRef}>
            <PublicHeader />

            <main className="policy-main">
                <article className="policy-article">
                    <div className="policy-article__intro" data-reveal="fade-up">
                        <div className="policy-badge policy-badge--label">
                            Security Whitepaper
                        </div>
                        <h1 className="policy-title">Clinical Data Protection Standards</h1>
                        <p className="policy-subtitle policy-subtitle--italic">
                            A comprehensive overview of the technical and administrative
                            safeguards protecting clinic and patient data at SehhaTech.
                        </p>
                    </div>

                    <hr className="policy-divider" />

                    <h2 className="policy-h2">1. Authentication &amp; Access Control</h2>
                    <p className="policy-p">
                        SehhaTech uses a JWT Bearer authentication system with
                        role-based access control. Every user session is issued a signed
                        token containing their identity, role, and clinic association.
                        Tokens expire after 7 days and must be renewed via
                        re-authentication.
                    </p>
                    <h3 className="policy-h3">Role-Based Isolation</h3>
                    <p className="policy-p">
                        The platform enforces strict role separation across four user
                        types: SuperAdmin, ClinicAdmin, Doctor, and Receptionist. Each
                        role is limited to only the data and actions relevant to their
                        function. SuperAdmins operate across the entire platform, while
                        all other roles are confined to their own clinic's data.
                    </p>
                    <div className="policy-info-box" data-reveal="fade-up">
                        <h4>Access Control Highlights:</h4>
                        <ul className="policy-list policy-list--bullet">
                            <li>
                                JWT tokens signed with HS256 and validated on every request.
                            </li>
                            <li>
                                All protected endpoints require <code>[Authorize]</code>{" "}
                                attribute.
                            </li>
                            <li>
                                Passwords hashed with BCrypt before storage — never stored in
                                plain text.
                            </li>
                            <li>
                                New users are forced to reset their password on first login (
                                <code>MustResetPassword = true</code>).
                            </li>
                        </ul>
                    </div>

                    <h2 className="policy-h2">2. Multi-Tenant Data Isolation</h2>
                    <p className="policy-p">
                        Every clinic operates in a fully isolated data environment. A
                        custom <code>TenantMiddleware</code> runs on every authenticated
                        request, extracting the <code>TenantId</code> from the JWT token
                        and injecting it into the request context. All database queries
                        are automatically scoped to that clinic's data.
                    </p>
                    <h3 className="policy-h3">Subscription Enforcement</h3>
                    <p className="policy-p">
                        The middleware also verifies that a clinic's subscription is
                        active before allowing access. Clinics with expired or inactive
                        subscriptions receive a 403 Forbidden response and cannot access
                        any system data until their subscription is renewed.
                    </p>

                    <h2 className="policy-h2">3. Data Encryption</h2>
                    <p className="policy-p">
                        All sensitive data is protected both in transit and at rest.
                        SehhaTech enforces HTTPS for all API communication, ensuring no
                        data is transmitted over unencrypted connections.
                    </p>
                    <ul className="policy-feature-list" data-reveal="fade-up">
                        <li>
                            <svg
                                className="icon icon-sm policy-feature-list__icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <div>
                                <strong>Encryption in Transit:</strong> TLS encryption for all
                                data moving between client devices and the SehhaTech API
                                server.
                            </div>
                        </li>
                        <li>
                            <svg
                                className="icon icon-sm policy-feature-list__icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <div>
                                <strong>Password Security:</strong> BCrypt hashing with salt
                                ensures passwords cannot be reversed even if the database is
                                compromised.
                            </div>
                        </li>
                        <li>
                            <svg
                                className="icon icon-sm policy-feature-list__icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <div>
                                <strong>Image Storage:</strong> All clinic and patient images
                                are stored on Cloudinary with secure HTTPS URLs. Original
                                files are never stored on the application server.
                            </div>
                        </li>
                    </ul>

                    <h2 className="policy-h2">4. Payment Security</h2>
                    <p className="policy-p">
                        SehhaTech does not store any payment card information. All
                        payment processing is handled entirely by Paymob, a PCI-DSS
                        compliant payment gateway. SehhaTech only stores the resulting
                        order ID and subscription status after a successful transaction.
                    </p>
                    <div className="policy-stat-grid" data-reveal="fade-up">
                        <div className="policy-stat policy-stat--dark">
                            <div className="policy-stat__value">0</div>
                            <div className="policy-stat__label">Card Data Stored</div>
                        </div>
                        <div className="policy-stat">
                            <div className="policy-stat__value">PCI</div>
                            <div className="policy-stat__label">DSS Compliant Gateway</div>
                        </div>
                    </div>

                    <h2 className="policy-h2">5. Regulatory Compliance</h2>
                    <p className="policy-p">
                        SehhaTech is built with healthcare data privacy requirements in
                        mind. The platform's architecture — including tenant isolation,
                        role-based access, forced password resets, and audit-ready data
                        models — is designed to align with HIPAA administrative and
                        technical safeguard requirements.
                    </p>
                    <div className="policy-info-box" data-reveal="fade-up">
                        <h4>Compliance Highlights:</h4>
                        <ul className="policy-list policy-list--bullet">
                            <li>Complete data isolation per clinic (Multi-Tenant architecture).</li>
                            <li>Role-based access ensures minimum necessary access principle.</li>
                            <li>Forced password change on first login for all new users.</li>
                            <li>No payment data stored on SehhaTech servers.</li>
                        </ul>
                    </div>

                    <footer className="policy-article__footer" data-reveal="fade-up">
                        <p>
                            Have questions about our security architecture? We're happy to
                            provide more details.
                        </p>
                        <div className="policy-article__footer-actions">
                            <Link to="/" className="btn btn--primary">
                                Back to Home
                            </Link>
                            <Link to="/register" className="btn btn--outline">
                                Get Started
                            </Link>
                        </div>
                    </footer>
                </article>
            </main>

            <PublicFooter activePage="security" />
        </div>
    );
}