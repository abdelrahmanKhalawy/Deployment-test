export default function Toast({ message, type, show }) {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-bold text-white transition-all duration-300
      ${show ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0 pointer-events-none"}
      ${type === "error" ? "bg-red-600" : "bg-slate-900"}`}
    >
      {message}
    </div>
  );
}