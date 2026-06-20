import { useState, useEffect, useCallback } from 'react';

let toastFn = null;

export function showToast(message, type = 'info') {
  if (toastFn) toastFn(message, type);
}

export default function Toast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => { toastFn = show; return () => { toastFn = null; }; }, [show]);

  if (!toast) return null;

  const colors = {
    error: 'bg-red-600',
    success: 'bg-emerald-600',
    info: 'bg-slate-700',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[999] px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all ${colors[toast.type] ?? colors.info}`}
    >
      {toast.message}
    </div>
  );
}
