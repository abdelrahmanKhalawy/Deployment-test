import { useEffect } from "react";

export default function PaymobModal({ iframeUrl, onClose, onSuccess }) {
  useEffect(() => {
    function handleMessage(e) {
      if (e.data && (e.data.type === "PAYMOB_SUCCESS" || e.data.success === true)) {
        onSuccess();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  if (!iframeUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4">
      <div className="relative w-full max-w-[540px]">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white border-none rounded-full w-9 h-9 text-xl cursor-pointer shadow-lg z-10 flex items-center justify-center"
        >
          ✕
        </button>
        <iframe
          title="Paymob Payment"
          src={iframeUrl}
          className="w-full max-w-[540px] h-[650px] rounded-xl border-none bg-white"
        />
      </div>
    </div>
  );
}