import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore, useToastStore } from "../store/dataStore";
import { fetchLocks } from "../services/api";
import Modal from "../components/shared/Modal";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { brands, families, variants, assets, loading, loadAll, removeVariant, updateVariant, saveDataset } = useDataStore();
  const { addToast } = useToastStore();
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterFamily, setFilterFamily] = useState("");
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

  const sortedBrands = [...brands].sort(
    (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name?.localeCompare(b.name)
  );

  // Families filtered to the selected brand
  const visibleFamilies = filterBrand
    ? families.filter((f) => f.brandId === filterBrand)
    : families;
  const sortedFamilies = [...visibleFamilies].sort(
    (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name?.localeCompare(b.name)
  );

  function matchesFilters(v) {
    const matchSearch =
      !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.id?.toLowerCase().includes(search.toLowerCase()) ||
      brandMap[v.brandId]?.toLowerCase().includes(search.toLowerCase()) ||
      familyMap[v.familyId]?.toLowerCase().includes(search.toLowerCase());
    const matchBrand = !filterBrand || v.brandId === filterBrand;
    const matchFamily = !filterFamily || v.familyId === filterFamily;
    return matchSearch && matchBrand && matchFamily;
  }

  // Group variants: brand → family → sorted products
  function buildGrouped() {
    const brandsToShow = filterBrand
      ? sortedBrands.filter((b) => b.id === filterBrand)
      : sortedBrands;

    const groups = [];
    for (const brand of brandsToShow) {
      const brandFamilies = sortedFamilies.filter((f) => f.brandId === brand.id);
      // Also collect products with no family, or an unrecognised family
      const familyIds = new Set(brandFamilies.map((f) => f.id));

      const brandRows = [];
      for (const family of brandFamilies) {
        if (filterFamily && family.id !== filterFamily) continue;
        const prods = variants
          .filter((v) => v.brandId === brand.id && v.familyId === family.id)
          .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.name?.localeCompare(b.name));
        const visible = prods.filter(matchesFilters);
        if (visible.length > 0 || (!search && !filterFamily)) {
          brandRows.push({ family, prods, visible });
        }
      }

      // Products belonging to this brand but no known family
      if (!filterFamily) {
        const orphans = variants
          .filter((v) => v.brandId === brand.id && (!v.familyId || !familyIds.has(v.familyId)))
          .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.name?.localeCompare(b.name));
        const visibleOrphans = orphans.filter(matchesFilters);
        if (visibleOrphans.length > 0) {
          brandRows.push({ family: null, prods: orphans, visible: visibleOrphans });
        }
      }

      if (brandRows.length > 0) {
        groups.push({ brand, rows: brandRows });
      }
    }

    // Brands with no known brand ID (orphaned products)
    if (!filterBrand) {
      const knownBrandIds = new Set(brands.map((b) => b.id));
      const orphans = variants
        .filter((v) => !v.brandId || !knownBrandIds.has(v.brandId))
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
        .filter(matchesFilters);
      if (orphans.length > 0) {
        groups.push({ brand: null, rows: [{ family: null, prods: orphans, visible: orphans }] });
      }
    }

    return groups;
  }

  const grouped = buildGrouped();
  const totalVisible = grouped.reduce(
    (sum, g) => sum + g.rows.reduce((s, r) => s + r.visible.length, 0),
    0
  );

  // ── Reorder ───────────────────────────────────────────────────────────────────

  async function moveProduct(variantId, familyId, brandId, direction) {
    // Get the full sorted list for this group (same family + brand)
    const group = variants
      .filter((v) => v.familyId === familyId && v.brandId === brandId)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.name?.localeCompare(b.name));

    const idx = group.findIndex((v) => v.id === variantId);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= group.length) return;

    const reordered = [...group];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];

    reordered.forEach((v, i) => updateVariant(v.id, { sortOrder: i + 1 }));
    await saveDataset("variants");
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function getHeroUrl(variantId) {
    const { assetBaseUrl } = useDataStore.getState();
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

  function formatPrice(v) {
    if (v.askForPricing) return "Ask for Pricing";
    const p = v.propanePrice ? Number(v.propanePrice) : null;
    const ng = v.naturalGasPrice ? Number(v.naturalGasPrice) : null;
    if (p && ng && p !== ng) return `From $${Math.min(p, ng).toLocaleString()}`;
    const single = p || ng || (v.price ? Number(v.price) : null);
    return single ? `$${single.toLocaleString()}` : "—";
  }

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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Products</h1>
          <p style={{ color: "rgba(180,200,240,0.6)", marginTop: 6, fontSize: 14 }}>
            {variants.length} total · {totalVisible} shown
          </p>
        </div>
        <button onClick={() => navigate("/products/new")} className="btn-primary">+ Add Product</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input"
          style={{ flex: 1, maxWidth: 280 }}
        />
        <select
          value={filterBrand}
          onChange={(e) => { setFilterBrand(e.target.value); setFilterFamily(""); }}
          className="field-input"
          style={{ width: "auto" }}
        >
          <option value="">All Brands</option>
          {sortedBrands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={filterFamily}
          onChange={(e) => setFilterFamily(e.target.value)}
          className="field-input"
          style={{ width: "auto" }}
          disabled={sortedFamilies.length === 0}
        >
          <option value="">All Families</option>
          {sortedFamilies.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: "rgba(180,200,240,0.5)" }}>Loading…</div>
      ) : grouped.length === 0 ? (
        <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14, padding: "20px 0" }}>No products found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {grouped.map(({ brand, rows }) => (
            <div key={brand?.id ?? "__no_brand"}>
              {/* Brand header */}
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
                color: "rgba(117,163,255,0.7)", marginBottom: 10, paddingLeft: 2,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {brand?.name ?? "No Brand"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {rows.map(({ family, prods, visible }) => (
                  <div key={family?.id ?? "__no_family"}>
                    {/* Family header */}
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: "rgba(180,200,240,0.55)",
                      marginBottom: 6, paddingLeft: 4,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ color: "rgba(117,163,255,0.4)", fontSize: 10 }}>▸</span>
                      {family?.name ?? "No Family"}
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(180,200,240,0.3)" }}>
                        {prods.length} {prods.length === 1 ? "product" : "products"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {visible.map((variant, visIdx) => {
                        // Position within the full (unfiltered) group for ↑↓ logic
                        const groupIdx = prods.findIndex((p) => p.id === variant.id);
                        const isFirst = groupIdx === 0;
                        const isLast = groupIdx === prods.length - 1;
                        const heroUrl = getHeroUrl(variant.id);

                        return (
                          <div key={variant.id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            background: "linear-gradient(180deg, rgba(15,23,36,0.6), rgba(9,14,24,0.7))",
                            border: "1px solid rgba(117,163,255,0.1)",
                            borderRadius: 10,
                            padding: "10px 14px",
                          }}>
                            {/* Sort controls */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                              <button
                                onClick={() => moveProduct(variant.id, variant.familyId, variant.brandId, -1)}
                                disabled={isFirst}
                                title="Move up"
                                style={{
                                  width: 24, height: 22, borderRadius: 4, border: "1px solid rgba(117,163,255,0.15)",
                                  background: isFirst ? "transparent" : "rgba(117,163,255,0.08)",
                                  color: isFirst ? "rgba(180,200,240,0.2)" : "rgba(117,163,255,0.8)",
                                  cursor: isFirst ? "default" : "pointer",
                                  fontSize: 10, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => moveProduct(variant.id, variant.familyId, variant.brandId, 1)}
                                disabled={isLast}
                                title="Move down"
                                style={{
                                  width: 24, height: 22, borderRadius: 4, border: "1px solid rgba(117,163,255,0.15)",
                                  background: isLast ? "transparent" : "rgba(117,163,255,0.08)",
                                  color: isLast ? "rgba(180,200,240,0.2)" : "rgba(117,163,255,0.8)",
                                  cursor: isLast ? "default" : "pointer",
                                  fontSize: 10, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                ▼
                              </button>
                            </div>

                            {/* Position badge */}
                            <div style={{
                              width: 22, textAlign: "center", flexShrink: 0,
                              fontSize: 12, fontWeight: 700, color: "rgba(180,200,240,0.35)",
                            }}>
                              {groupIdx + 1}
                            </div>

                            {/* Thumbnail */}
                            <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(9,13,20,0.8)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {heroUrl ? (
                                <img src={heroUrl} alt={variant.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              ) : (
                                <span style={{ color: "rgba(180,200,240,0.4)", fontSize: 20 }}>▦</span>
                              )}
                            </div>

                            {/* Name / ID */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 15, color: "#f3f7ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {variant.name}
                              </div>
                              <div style={{ fontSize: 12, color: "rgba(180,200,240,0.4)", marginTop: 2 }}>
                                {variant.id}
                              </div>
                            </div>

                            {/* Price */}
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#e7edf7", marginRight: 4, whiteSpace: "nowrap" }}>
                              {formatPrice(variant)}
                            </div>

                            {/* Active toggle */}
                            <button
                              title={variant.isActive !== false ? "Click to deactivate" : "Click to activate"}
                              onClick={async () => {
                                updateVariant(variant.id, { isActive: variant.isActive === false });
                                await saveDataset("variants");
                                addToast(variant.isActive === false ? `${variant.name} activated` : `${variant.name} deactivated`);
                              }}
                              style={{
                                display: "flex", alignItems: "center", gap: 5,
                                background: variant.isActive !== false ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.1)",
                                border: `1px solid ${variant.isActive !== false ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.25)"}`,
                                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                                fontSize: 12, fontWeight: 600,
                                color: variant.isActive !== false ? "#3fb950" : "#f85149",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span style={{ fontSize: 9, lineHeight: 1 }}>{variant.isActive !== false ? "●" : "○"}</span>
                              {variant.isActive !== false ? "Active" : "Inactive"}
                            </button>

                            {locks[variant.id] && (
                              <div style={{ fontSize: 11, color: "#f0883e", fontWeight: 600, background: "rgba(240,136,62,0.12)", border: "1px solid rgba(240,136,62,0.3)", borderRadius: 5, padding: "3px 8px", whiteSpace: "nowrap" }}>
                                ✎ {locks[variant.id].username}
                              </div>
                            )}

                            <button
                              onClick={() => navigate(`/products/${variant.id}`)}
                              className="btn-ghost"
                              style={{ padding: "7px 14px", fontSize: 13, whiteSpace: "nowrap" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(variant)}
                              className="btn-danger"
                              style={{ padding: "7px 14px", fontSize: 13 }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <Modal title="Remove Product" onClose={() => setConfirmDelete(null)} width={420}>
          <p style={{ color: "#e7edf7", fontSize: 14, marginTop: 0 }}>
            Remove <strong>{confirmDelete.name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Cancel</button>
            <button onClick={() => handleDelete(confirmDelete)} className="btn-danger">Remove</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
