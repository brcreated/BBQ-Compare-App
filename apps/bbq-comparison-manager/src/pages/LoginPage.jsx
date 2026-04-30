import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "#161b22",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: "36px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4c75db", marginBottom: 6 }}>
            BBQ Compare
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3", letterSpacing: "-0.03em" }}>
            Admin Login
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              required
              style={{ width: "100%", background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 13px", color: "#e6edf3", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ width: "100%", background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 13px", color: "#e6edf3", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(248,81,73,0.12)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: 7, padding: "9px 13px", fontSize: 13, color: "#f85149", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "11px 0", borderRadius: 9, border: "none", background: "#4c75db", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
