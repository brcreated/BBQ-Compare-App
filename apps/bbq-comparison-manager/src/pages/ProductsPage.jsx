import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore, useToastStore } from "../store/dataStore";
import { fetchLocks } from "../services/api";
import Modal from "../components/shared/Modal";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { brands, families, variants, assets, loading, loadAll, removeVariant, saveDataset } = useDataStore();
  const { addToast } = useToastStore();
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [locks, setLocks] = useState({});

  useEffect(() => {
    if (!variants.length && !loading) loadAll();
  }, []);

  useEffect(() => {
    fetchLocks().then(setLocks).catch(() => {});
    const interval = setInterval(() => fetchLocks().then(setLocks).catch(() => {}), 15000);
    return () => clearInterval(interval);
  }, []);

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));
  const familyMap = Object.fromEntries(families.map((f) => [f.id, f.name]));
  const assetMap = {};
  assets.forEach((a) => {
    if (!assetMap[a.variantId || a.entityId]) assetMap[a.variantId || a.entityId] = a;
  });

  const filtered = variants.filter((v) => {
    const matchSearch =
      !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.id?.toLowerCase().includes(search.toLowerCase()) ||
      brandMap[v.brandId]?.toLowerCase().includes(search.toLowerCase());
    const matchBrand = !filterBrand || v.brandId === filterBrand;
    return matchSearch && matchBrand;
  });

  async function handleDelete(variant) {
    try {
      removeVariant(variant.id);
      await saveDataset("variants");
      addToast(`${variant.name} removed`);
      setConfirmDelete(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  function getHeroUrl(variantId, assetBaseUrl) {
    const asset = assets.find(
      (a) =>
        (a.variantId === variantId || a.entityId === variantId) &&
        (a.imageType === "hero" || a.imageType === "main" || a.imageType === "gallery")
    );
    if (!asset) return null;
    if (asset.url) return asset.url;
    const base = assetBaseUrl || "https://bbqcompareassets.brcreated.app/assets";
    const fp = asset.filePath || asset.file_path || "";
    return fp ? `${base}/${fp}` : null;
  }

  const { assetBaseUrl } = useDataStore.getState();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Products</h1>
          <p style={{ color: "#8b949e", marginTop: 6, fontSize: 14 }}>
            {variants.length} total · {filtered.length} shown
          </p>
        </div>
        <button
          onClick={() => navigate("/products/new")}
          style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#4c75db", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          + Add Product
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 320, background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", color: "#e6edf3", fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", color: "#e6edf3", fontSize: 14, outline: "none" }}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: "#8b949e" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((variant) => {
            const heroUrl = getHeroUrl(variant.id, assetBaseUrl);
            return (
              <div key={variant.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#161b22",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "12px 16px",
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 8, background: "#0d1117", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {heroUrl ? (
                    <img src={heroUrl} alt={variant.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ color: "#8b949e", fontSize: 22 }}>▦</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {variant.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>
                    {brandMap[variant.brandId] || variant.brandId} · {familyMap[variant.familyId] || variant.familyId} · {variant.id}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3", marginRight: 8, whiteSpace: "nowrap" }}>
                  {variant.price ? `$${Number(variant.price).toLocaleString()}` : "—"}
                </div>
                <div style={{ fontSize: 12, color: variant.isActive !== false ? "#3fb950" : "#f85149", fontWeight: 600, marginRight: 8 }}>
                  {variant.isActive !== false ? "Active" : "Inactive"}
                </div>
                {locks[variant.id] && (
                  <div style={{ fontSize: 11, color: "#f0883e", fontWeight: 600, background: "rgba(240,136,62,0.12)", border: "1px solid rgba(240,136,62,0.3)", borderRadius: 5, padding: "3px 8px", whiteSpace: "nowrap" }}>
                    ✎ {locks[variant.id].username}
                  </div>
                )}
                <button
                  onClick={() => navigate(`/products/${variant.id}`)}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#e6edf3", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(variant)}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(248,81,73,0.3)", background: "transparent", color: "#f85149", fontSize: 13, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ color: "#8b949e", fontSize: 14, padding: "20px 0" }}>No products found.</div>
          )}
        </div>
      )}

      {confirmDelete && (
        <Modal title="Remove Product" onClose={() => setConfirmDelete(null)} width={420}>
          <p style={{ color: "#e6edf3", fontSize: 14, marginTop: 0 }}>
            Remove <strong>{confirmDelete.name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmDelete(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#8b949e", fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => handleDelete(confirmDelete)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#da3633", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
