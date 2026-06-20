import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState({ message: "", type: "success", show: false });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  }, []);

  return { toast, showToast };
}