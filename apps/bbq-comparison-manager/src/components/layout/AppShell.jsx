import { NavLink, Outlet } from "react-router-dom";
import { useDataStore } from "../../store/dataStore";
import { useAuthStore } from "../../store/authStore";
import ToastContainer from "../shared/Toast";

const NAV = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/brands", label: "Brands", icon: "◈" },
  { to: "/products", label: "Products", icon: "▦" },
  { to: "/publish", label: "Publish", icon: "↑" },
];

export default function AppShell() {
  const { dirtyDatasets, loading } = useDataStore();
  const { username, logout } = useAuthStore();
  const hasDirty = dirtyDatasets.size > 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: "#010409",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4c75db" }}>
            BBQ Compare
          </div>
          <div style={{ fontSize: 11, color: "#8b949e", marginTop: 3 }}>Admin Manager</div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                color: isActive ? "#e6edf3" : "#8b949e",
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                transition: "background 150ms, color 150ms",
              })}
            >
              <span style={{ fontSize: 16, opacity: 0.7 }}>{icon}</span>
              {label}
              {label === "Publish" && hasDirty && (
                <span style={{ marginLeft: "auto", background: "#4c75db", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>
                  {dirtyDatasets.size}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {loading && (
            <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 8 }}>Loading data…</div>
          )}
          <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Signed in as <span style={{ color: "#e6edf3", fontWeight: 600 }}>{username || "—"}</span>
          </div>
          <button
            onClick={logout}
            style={{ width: "100%", padding: "7px 0", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#8b949e", fontSize: 12, cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: "32px 36px" }}>
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  );
}
