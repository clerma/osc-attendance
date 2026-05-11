import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto fade-up flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm shadow-lg"
        style={{
          backgroundColor: isError ? "#FEF2EC" : "#1F568C",
          color: isError ? "#9C4221" : "white",
          border: isError ? "1px solid #F4D7C6" : "none",
        }}
      >
        {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        <span>{toast.message}</span>
        <button
          onClick={onDismiss}
          className="opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
