export default function ReceptionTopbar({ title, subtitle, onMenuClick, children }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 min-h-16 px-4 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-blue-600 font-manrope whitespace-nowrap">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 font-semibold">{subtitle}</p>}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
          {children}
        </div>
      </div>
    </header>
  );
}