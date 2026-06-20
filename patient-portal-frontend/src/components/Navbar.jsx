import { Link } from 'react-router-dom'

export default function Navbar() {
    const name = localStorage.getItem('patientName')
    const token = localStorage.getItem('accessToken')

    const handleLogout = () => {
        localStorage.clear()
        window.location.href = '/'
    }

    return (
        <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-50">
            <div className="flex justify-between items-center px-8 max-w-7xl mx-auto h-16">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3">
                    <span
                        className="material-symbols-outlined text-primary text-[28px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        monitor_heart
                    </span>
                    <span className="font-bold text-headline-md text-primary">SehhaTech</span>
                </Link>

                {/* Nav links – hidden on mobile */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        to="/clinics"
                        className="text-on-surface-variant hover:text-primary transition-colors text-body-md"
                    >
                        Find Clinic
                    </Link>
                    <Link
                        to="/my-bookings"
                        className="text-on-surface-variant hover:text-primary transition-colors text-body-md"
                    >
                        My Bookings
                    </Link>
                </nav>

                {/* Auth area */}
                <div className="flex items-center gap-3">
                    {token && name ? (
                        <>
                            <span className="text-label-md font-medium text-on-surface-variant hidden md:block">
                                Hi, {name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-error text-on-error text-label-md font-medium px-3 py-1 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-primary-container text-on-primary text-label-md font-medium px-3 py-1 rounded-lg hover:bg-primary transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>

            </div>
        </header>
    )
}