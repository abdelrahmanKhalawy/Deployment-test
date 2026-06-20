export default function Footer() {
    return (
        <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-1">
                <span className="font-bold text-[20px] text-primary">SehhaTech</span>
                <span className="text-label-md text-secondary ml-3">
                    © 2026 SehhaTech Medical Systems. All rights reserved.
                </span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-label-md">
                <a className="text-secondary hover:text-primary transition-colors" href="#">Privacy Policy</a>
                <a className="text-secondary hover:text-primary transition-colors" href="#">Terms of Service</a>
                <a className="text-secondary hover:text-primary transition-colors" href="#">Contact Support</a>
            </nav>
        </footer>
    )
}