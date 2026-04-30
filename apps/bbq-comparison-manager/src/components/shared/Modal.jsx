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
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#161b22",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e6edf3" }}>{title}</div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#8b949e",
            fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}
