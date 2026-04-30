import { useEffect } from "react";

export default function Modal({ title, onClose, children, width = 560 }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, rgba(15,23,36,0.98), rgba(9,14,24,0.98))",
          border: "1px solid rgba(117,163,255,0.18)",
          borderRadius: 18,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(117,163,255,0.08) inset",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid rgba(117,163,255,0.1)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f3f7ff", letterSpacing: "-0.02em" }}>
            {title}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "rgba(180,200,240,0.5)",
            fontSize: 22, cursor: "pointer", padding: "0 4px", lineHeight: 1,
            transition: "color 150ms",
          }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
