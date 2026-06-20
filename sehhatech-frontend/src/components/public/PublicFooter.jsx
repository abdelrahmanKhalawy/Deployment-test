import { Link } from "react-router-dom";

export default function PublicFooter({ activePage }) {
    const links = [
        { to: "/privacy", label: "Privacy Policy", key: "privacy" },
        { to: "/terms", label: "Terms of Service", key: "terms" },
        { to: "/security", label: "Security", key: "security" },
        { to: "/status", label: "Status", key: "status" },
    ];

    return (
        <footer className="public-footer">
            <div className="public-footer__inner">
                <div className="public-footer__brand">
                    <div className="public-footer__logo">SehhaTech</div>
                    <p className="public-footer__copy">
                        © 2026 SehhaTech Clinical Systems. Helping clinics care for patients.
                    </p>
                </div>
                <div className="public-footer__links">
                    {links.map((link) => (
                        <Link
                            key={link.key}
                            to={link.to}
                            className={
                                activePage === link.key
                                    ? "public-footer__link public-footer__link--active"
                                    : "public-footer__link"
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
}