import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/admin/doctors', icon: 'groups', label: 'Doctors' },
    { to: '/admin/receptionists', icon: 'support_agent', label: 'Receptionists' },
    { to: '/admin/settings', icon: 'settings', label: 'Settings' },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const name = localStorage.getItem('userName') || 'Admin';
    const clinicName = localStorage.getItem('clinicName') || 'SehhaTech';

    function handleLogout() {
        localStorage.clear();
        navigate('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 fixed left-0 top-0 h-screen bg-white border-r border-slate-100 flex flex-col py-6 z-50">
                {/* Logo */}
                <div className="px-6 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#002045] flex items-center justify-center">
                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: '"FILL" 1' }}>
                            medical_services
                        </span>
                    </div>
                    <div>
                        <div className="font-extrabold text-[#002045] text-sm leading-tight">{clinicName}</div>
                        <div className="text-[10px] text-slate-400 tracking-wide">Admin Panel</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 gap-3 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-blue-50 text-[#002045] font-semibold'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-4 pt-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 gap-3 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="ml-64 flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="fixed top-0 right-0 left-64 z-40 h-16 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center justify-between px-8">
                    <h2 className="text-lg font-bold text-[#002045]">Admin Panel</h2>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#002045] flex items-center justify-center text-white text-xs font-bold">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{name}</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="pt-20 pb-12 px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}