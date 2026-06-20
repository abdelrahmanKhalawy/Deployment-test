import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col text-on-surface" style={{
            background: 'linear-gradient(-45deg,#f8f9ff,#eaf1ff,#d1e4ff,#e6eeff)',
            backgroundSize: '400% 400%',
            animation: 'grad 15s ease infinite',
        }}>
            <style>{`
        @keyframes grad {
          0%   { background-position: 0% 50% }
          50%  { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>

            {/* Header */}
            <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-50">
                <div className="flex justify-between items-center w-full px-8 max-w-7xl mx-auto h-16">
                    <div className="flex items-center gap-3">
                        <span
                            className="material-symbols-outlined text-primary text-[28px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >monitor_heart</span>
                        <span className="font-bold text-headline-md text-primary">SehhaTech</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="font-medium text-label-md text-primary hover:underline">Login</Link>
                        <Link
                            to="/register"
                            className="bg-primary-container text-on-primary font-medium text-label-md px-6 py-3 rounded-xl hover:bg-primary transition-colors"
                        >Get Started</Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="flex-grow flex items-center justify-center py-16 px-4 md:px-8">
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full mb-6 fade-up" style={{ animationDelay: '.1s' }}>
                        <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                        <span className="font-semibold text-label-sm text-primary">Trusted by clinics across Egypt</span>
                    </div>
                    <h1 className="font-bold text-display-lg text-on-surface mb-6 fade-up" style={{ animationDelay: '.2s' }}>
                        Your Health, <br /><span className="text-primary">Simplified</span>
                    </h1>
                    <p className="text-body-lg text-on-surface-variant mb-10 fade-up max-w-xl mx-auto" style={{ animationDelay: '.3s' }}>
                        Find clinics, book appointments, and manage your healthcare journey — all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center fade-up" style={{ animationDelay: '.4s' }}>
                        <Link
                            to="/register"
                            className="bg-primary text-on-primary font-medium text-label-md px-10 py-3 rounded-xl hover:bg-primary-container transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">person_add</span>Create Free Account
                        </Link>
                        <Link
                            to="/clinics"
                            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-medium text-label-md px-10 py-3 rounded-xl hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">search</span>Browse Clinics
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-4 md:px-8 bg-surface-container-lowest">
                <div className="max-w-5xl mx-auto">
                    <h2 className="font-semibold text-headline-lg text-center text-on-surface mb-10">Everything You Need</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: 'local_hospital', title: 'Find a Clinic', desc: 'Search and filter clinics by specialty, city, and availability.' },
                            { icon: 'calendar_month', title: 'Book Appointment', desc: 'Choose your preferred doctor and time slot in seconds.' },
                            { icon: 'event_available', title: 'Manage Bookings', desc: 'View, track, and cancel your appointments anytime.' },
                        ].map((f, i) => (
                            <div key={i} className="bg-surface-container-low border border-outline-variant rounded-xl p-6 text-center fade-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                                <div className="w-14 h-14 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-on-primary text-[28px]">{f.icon}</span>
                                </div>
                                <h3 className="font-semibold text-headline-md text-on-surface mb-1">{f.title}</h3>
                                <p className="text-body-md text-on-surface-variant">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-semibold text-headline-lg text-center text-on-surface mb-10">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { n: '1', title: 'Create Account', desc: 'Register with your phone number and verify with OTP.' },
                            { n: '2', title: 'Find & Book', desc: 'Browse clinics and book your preferred appointment slot.' },
                            { n: '3', title: 'Get Care', desc: 'Attend your appointment and track your health history.' },
                        ].map((s) => (
                            <div key={s.n} className="text-center">
                                <div className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-headline-md">{s.n}</div>
                                <h3 className="font-semibold text-headline-md text-on-surface mb-1">{s.title}</h3>
                                <p className="text-body-md text-on-surface-variant">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4 md:px-8 bg-primary">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="font-semibold text-headline-lg text-on-primary mb-6">Ready to take control of your health?</h2>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 bg-on-primary text-primary font-medium text-label-md px-10 py-3 rounded-xl hover:bg-surface-container-low transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>Get Started for Free
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    )
}