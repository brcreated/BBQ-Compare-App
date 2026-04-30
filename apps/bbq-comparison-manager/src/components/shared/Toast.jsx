import { useToastStore } from "../../store/dataStore";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          style={{
            padding: "13px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            maxWidth: 360,
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
            background:
              t.type === "error"
                ? "rgba(180,30,40,0.92)"
                : t.type === "warning"
                ? "rgba(160,110,0,0.92)"
                : "rgba(30,120,60,0.92)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
