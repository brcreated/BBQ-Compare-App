import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDataStore } from "../store/dataStore";

function StatCard({ label, value, to }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <div
        className="glass-card"
        style={{ padding: "22px 26px", cursor: "pointer", transition: "border-color 150ms, transform 150ms" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(76,117,219,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(117,163,255,0.14)"; e.currentTarget.style.transform = "none"; }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: "#f3f7ff", letterSpacing: "-0.03em" }}>{value}</div>
        <div style={{ fontSize: 13, color: "rgba(180,200,240,0.6)", marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { brands, families, variants, specs, assets, loading, loadAll, dirtyDatasets, lastPublishedAt } = useDataStore();

  useEffect(() => {
    if (!brands.length && !loading) loadAll();
  }, []);

  const activeVariants = variants.filter((v) => v.isActive !== false);
  const activeAssets = assets.filter((a) => a.isActive !== false);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "rgba(180,200,240,0.6)", marginTop: 6, fontSize: 14 }}>
          Overview of your BBQ Compare catalog.
        </p>
      </div>

      {loading ? (
        <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14 }}>Loading catalog…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Brands" value={brands.length} to="/brands" />
            <StatCard label="Families" value={families.length} to="/products" />
            <StatCard label="Products" value={activeVariants.length} to="/products" />
            <StatCard label="Specs" value={specs.length} to="/products" />
            <StatCard label="Images" value={activeAssets.length} to="/products" />
          </div>

          {dirtyDatasets.size > 0 && (
            <div style={{
              background: "rgba(76,117,219,0.12)",
              border: "1px solid rgba(76,117,219,0.35)",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 20,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ color: "#a5b8f5" }}>
                You have unsaved changes in: <strong>{[...dirtyDatasets].join(", ")}</strong>
              </span>
              <Link to="/publish" style={{ color: "#7aa3f5", fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
                Go to Publish →
              </Link>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="glass-card" style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(180,200,240,0.6)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>
                Quick Links
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { to: "/brands", label: "Manage Brands" },
                  { to: "/products", label: "Manage Products" },
                  { to: "/products/new", label: "Add New Product" },
                  { to: "/publish", label: "Publish to Live Site" },
                ].map(({ to, label }) => (
                  <Link key={to} to={to} style={{ color: "#7aa3f5", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
                    → {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(180,200,240,0.6)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>
                Status
              </div>
              <div style={{ fontSize: 14, color: "#e7edf7", display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <span style={{ color: "rgba(180,200,240,0.6)" }}>Last published: </span>
                  {lastPublishedAt ? new Date(lastPublishedAt).toLocaleString() : "Not yet this session"}
                </div>
                <div>
                  <span style={{ color: "rgba(180,200,240,0.6)" }}>Unsaved datasets: </span>
                  {dirtyDatasets.size === 0 ? (
                    <span style={{ color: "#3fb950" }}>All saved</span>
                  ) : (
                    <span style={{ color: "#f0883e" }}>{dirtyDatasets.size} pending</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
