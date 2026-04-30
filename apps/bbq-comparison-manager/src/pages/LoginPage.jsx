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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "linear-gradient(180deg, rgba(15,23,36,0.92), rgba(9,14,24,0.96))",
        border: "1px solid rgba(117,163,255,0.18)",
        borderRadius: 22,
        padding: "40px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(117,163,255,0.06) inset",
        backdropFilter: "blur(16px)",
      }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#7aa3f5",
            marginBottom: 10,
          }}>
            BBQ Compare
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#f3f7ff",
            letterSpacing: "-0.04em",
            marginBottom: 6,
          }}>
            Admin Login
          </h1>
          <p style={{ color: "rgba(180,200,240,0.6)", fontSize: 14 }}>
            Sign in to manage your catalog
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 11, fontWeight: 700,
              color: "rgba(180,200,240,0.7)", marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              required
              className="field-input"
              style={{ fontSize: 15 }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{
              display: "block", fontSize: 11, fontWeight: 700,
              color: "rgba(180,200,240,0.7)", marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="field-input"
              style={{ fontSize: 15 }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(248,81,73,0.1)",
              border: "1px solid rgba(248,81,73,0.28)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "#f85149",
              marginBottom: 18,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "13px 0", fontSize: 15 }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
