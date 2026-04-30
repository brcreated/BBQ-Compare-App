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
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 230,
        background: "linear-gradient(180deg, rgba(9,14,26,0.98) 0%, rgba(6,9,17,0.99) 100%)",
        borderRight: "1px solid rgba(117,163,255,0.1)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px 22px 18px",
          borderBottom: "1px solid rgba(117,163,255,0.08)",
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#7aa3f5",
            marginBottom: 4,
          }}>
            BBQ Compare
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#f3f7ff",
            letterSpacing: "-0.02em",
          }}>
            Admin Manager
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 12px" }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 3,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "#f3f7ff" : "rgba(180,200,240,0.6)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(76,117,219,0.22), rgba(47,87,188,0.14))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(117,163,255,0.2)"
                  : "1px solid transparent",
                transition: "all 150ms",
              })}
            >
              <span style={{ fontSize: 15, opacity: 0.8 }}>{icon}</span>
              {label}
              {label === "Publish" && hasDirty && (
                <span style={{
                  marginLeft: "auto",
                  background: "linear-gradient(135deg, #4c75db, #2f57bc)",
                  color: "#fff",
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  boxShadow: "0 4px 12px rgba(67,93,131,0.4)",
                }}>
                  {dirtyDatasets.size}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(117,163,255,0.08)",
        }}>
          {loading && (
            <div style={{ fontSize: 11, color: "rgba(180,200,240,0.5)", marginBottom: 8 }}>
              Loading data…
            </div>
          )}
          <div style={{
            fontSize: 12,
            color: "rgba(180,200,240,0.6)",
            marginBottom: 8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            Signed in as{" "}
            <span style={{ color: "#c4d4f5", fontWeight: 700 }}>{username || "—"}</span>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "8px 0",
              borderRadius: 8,
              border: "1px solid rgba(117,163,255,0.14)",
              background: "rgba(9,13,20,0.6)",
              color: "rgba(180,200,240,0.7)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "border-color 150ms",
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: "36px 40px" }}>
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  );
}
