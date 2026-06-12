import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDataStore, useToastStore } from "../store/dataStore";
import { fetchLocks } from "../services/api";
import Modal from "../components/shared/Modal";

// Fields used to calculate spec completeness
const KEY_FIELDS = [
  "primaryCookingArea", "productWidth", "productDepth", "productHeight",
  "grateMaterial", "bodyMaterial", "madeIn", "temperatureRangeMax",
];

function specCompleteness(variant) {
  const filled = KEY_FIELDS.filter((f) => {
    const v = variant?.[f];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  return Math.round((filled / KEY_FIELDS.length) * 100);
}

function CompletenessDot({ pct }) {
  const color = pct >= 80 ? "#3fb950" : pct >= 40 ? "#f0883e" : "#f85149";
  return (
    <div title={`${pct}% of key specs filled`} style={{
      width: 10, height: 10, borderRadius: "50%",
      background: color, flexShrink: 0,
      boxShadow: `0 0 6px ${color}80`,
    }} />
  );
}

// Auto-suggest a config label from the product name
// "32" Built-In | Standard" → "Built-In | Standard"
// "32" Gas Grill | Cart"    → "Cart"
// "Napoleon 500 Built-In"   → "Napoleon 500 Built-In"
function guessLabel(name) {
  if (!name) return "";
  const parts = name.split("|").map((s) => s.trim());
  if (parts.length >= 2) return parts.slice(1).join(" | ");
  return "";
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { brands, families, variants, assets, loading, loadAll, removeVariant, updateVariant, addVariant, saveDataset } = useDataStore();
  const { addToast } = useToastStore();
  const [search, setSearch] = useState("");
  const filterBrand = searchParams.get("brand") || "";
  const filterFamily = searchParams.get("family") || "";

  function setFilterBrand(val) {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (val) next.set("brand", val); else next.delete("brand");
      next.delete("family");
      return next;
    }, { replace: true });
  }

  function setFilterFamily(val) {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (val) next.set("family", val); else next.delete("family");
      return next;
    }, { replace: true });
  }

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [locks, setLocks] = useState({});

  // ── Bulk selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [bulkGroupId, setBulkGroupId] = useState("");
  const [bulkLabels, setBulkLabels] = useState({}); // variantId → label
  const [bulkPrimaryId, setBulkPrimaryId] = useState("");

  // All existing configGroupIds for the datalist
  const existingGroupIds = useMemo(() => {
    const ids = new Set(variants.map((v) => v.configGroupId).filter(Boolean));
    return Array.from(ids).sort();
  }, [variants]);

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids) {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function openGroupModal() {
    const selected = variants.filter((v) => selectedIds.has(v.id));
    // Pre-fill: if all share the same existing groupId, use it
    const existingGroups = new Set(selected.map((v) => v.configGroupId).filter(Boolean));
    const sharedGroup = existingGroups.size === 1 ? [...existingGroups][0] : "";
    setBulkGroupId(sharedGroup);
    // Pre-fill labels from existing configLabel or guess from name
    const labels = {};
    let primaryId = "";
    for (const v of selected) {
      labels[v.id] = v.configLabel || guessLabel(v.name) || v.name || "";
      if (v.isConfigPrimary && !primaryId) primaryId = v.id;
    }
    setBulkLabels(labels);
    setBulkPrimaryId(primaryId || selected[0]?.id || "");
    setGroupModalOpen(true);
  }

  async function applyGrouping() {
    if (!bulkGroupId.trim()) return;
    const groupId = bulkGroupId.trim();
    for (const id of selectedIds) {
      updateVariant(id, {
        configGroupId: groupId,
        configLabel: bulkLabels[id] || "",
        isConfigPrimary: id === bulkPrimaryId,
      });
    }
    await saveDataset("variants");
    addToast(`Config group "${groupId}" applied to ${selectedIds.size} products`);
    setGroupModalOpen(false);
    clearSelection();
  }

  async function clearGrouping() {
    for (const id of selectedIds) {
      updateVariant(id, { configGroupId: "", configLabel: "", isConfigPrimary: false });
    }
    await saveDataset("variants");
    addToast(`Removed config group from ${selectedIds.size} products`);
    setGroupModalOpen(false);
    clearSelection();
  }

  // ── Data setup ────────────────────────────────────────────────────────────────

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

  function buildGrouped() {
    const brandsToShow = filterBrand
      ? sortedBrands.filter((b) => b.id === filterBrand)
      : sortedBrands;

    const groups = [];
    for (const brand of brandsToShow) {
      const brandFamilies = sortedFamilies.filter((f) => f.brandId === brand.id);
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

      if (!filterFamily) {
        const orphans = variants
          .filter((v) => v.brandId === brand.id && (!v.familyId || !familyIds.has(v.familyId)))
          .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.name?.localeCompare(b.name));
        const visibleOrphans = orphans.filter(matchesFilters);
        if (visibleOrphans.length > 0) {
          brandRows.push({ family: null, prods: orphans, visible: visibleOrphans });
        }
      }

      if (brandRows.length > 0) groups.push({ brand, rows: brandRows });
    }

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

  async function handleDuplicate(variant) {
    const timestamp = Date.now().toString(36);
    const newId = `${variant.id}_copy_${timestamp}`;
    const copy = {
      ...variant,
      id: newId,
      slug: newId,
      name: `${variant.name} (Copy)`,
      sortOrder: null,
      isActive: false,
    };
    try {
      addVariant(copy);
      await saveDataset("variants");
      addToast(`Duplicated as "${copy.name}" — click Edit to update it`);
      navigate(`/products/${newId}`);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const selectedVariants = variants.filter((v) => selectedIds.has(v.id));

  return (
    <div style={{ paddingBottom: selectedIds.size > 0 ? 80 : 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Products</h1>
          <p style={{ color: "rgba(180,200,240,0.6)", marginTop: 6, fontSize: 14 }}>
            {variants.length} total · {totalVisible} shown
            {selectedIds.size > 0 && (
              <span style={{ color: "#6ea8f7", marginLeft: 10, fontWeight: 700 }}>
                · {selectedIds.size} selected
              </span>
            )}
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
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="field-input" style={{ width: "auto" }}>
          <option value="">All Brands</option>
          {sortedBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterFamily} onChange={(e) => setFilterFamily(e.target.value)} className="field-input" style={{ width: "auto" }} disabled={sortedFamilies.length === 0}>
          <option value="">All Families</option>
          {sortedFamilies.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
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
              }}>
                {brand?.name ?? "No Brand"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {rows.map(({ family, prods, visible }) => {
                  const familyVisibleIds = visible.map((v) => v.id);
                  const allFamilySelected = familyVisibleIds.length > 0 && familyVisibleIds.every((id) => selectedIds.has(id));

                  return (
                    <div key={family?.id ?? "__no_family"}>
                      {/* Family header with select-all checkbox */}
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: "rgba(180,200,240,0.55)",
                        marginBottom: 6, paddingLeft: 4,
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <input
                          type="checkbox"
                          checked={allFamilySelected}
                          onChange={() => toggleSelectAll(familyVisibleIds)}
                          style={{ accentColor: "#4c75db", cursor: "pointer", width: 14, height: 14, flexShrink: 0 }}
                          title="Select all in this family"
                        />
                        <span style={{ color: "rgba(117,163,255,0.4)", fontSize: 10 }}>▸</span>
                        {family?.name ?? "No Family"}
                        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(180,200,240,0.3)" }}>
                          {prods.length} {prods.length === 1 ? "product" : "products"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {visible.map((variant) => {
                          const groupIdx = prods.findIndex((p) => p.id === variant.id);
                          const isFirst = groupIdx === 0;
                          const isLast = groupIdx === prods.length - 1;
                          const heroUrl = getHeroUrl(variant.id);
                          const isChecked = selectedIds.has(variant.id);

                          return (
                            <div key={variant.id} style={{
                              display: "flex", alignItems: "center", gap: 12,
                              background: isChecked
                                ? "linear-gradient(180deg, rgba(76,117,219,0.14), rgba(76,117,219,0.08))"
                                : "linear-gradient(180deg, rgba(15,23,36,0.6), rgba(9,14,24,0.7))",
                              border: `1px solid ${isChecked ? "rgba(76,117,219,0.4)" : "rgba(117,163,255,0.1)"}`,
                              borderRadius: 10,
                              padding: "10px 14px",
                              transition: "background 0.12s, border-color 0.12s",
                            }}>
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelect(variant.id)}
                                style={{ accentColor: "#4c75db", cursor: "pointer", width: 15, height: 15, flexShrink: 0 }}
                              />

                              {/* Sort controls */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                                <button onClick={() => moveProduct(variant.id, variant.familyId, variant.brandId, -1)} disabled={isFirst} title="Move up" style={{ width: 24, height: 22, borderRadius: 4, border: "1px solid rgba(117,163,255,0.15)", background: isFirst ? "transparent" : "rgba(117,163,255,0.08)", color: isFirst ? "rgba(180,200,240,0.2)" : "rgba(117,163,255,0.8)", cursor: isFirst ? "default" : "pointer", fontSize: 10, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>▲</button>
                                <button onClick={() => moveProduct(variant.id, variant.familyId, variant.brandId, 1)} disabled={isLast} title="Move down" style={{ width: 24, height: 22, borderRadius: 4, border: "1px solid rgba(117,163,255,0.15)", background: isLast ? "transparent" : "rgba(117,163,255,0.08)", color: isLast ? "rgba(180,200,240,0.2)" : "rgba(117,163,255,0.8)", cursor: isLast ? "default" : "pointer", fontSize: 10, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>▼</button>
                              </div>

                              {/* Position badge */}
                              <div style={{ width: 22, textAlign: "center", flexShrink: 0, fontSize: 12, fontWeight: 700, color: "rgba(180,200,240,0.35)" }}>
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

                              {/* Name / ID / group badge */}
                              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                <CompletenessDot pct={specCompleteness(variant)} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, fontSize: 15, color: "#f3f7ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {variant.name}
                                  </div>
                                  <div style={{ fontSize: 12, color: "rgba(180,200,240,0.4)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <span>{variant.id}</span>
                                    {variant.configGroupId && (
                                      <span style={{ color: variant.isConfigPrimary ? "#6ea8f7" : "rgba(110,168,247,0.5)", fontWeight: 600 }}>
                                        ⧉ {variant.configGroupId}{variant.configLabel ? ` · ${variant.configLabel}` : ""}{variant.isConfigPrimary ? " (primary)" : ""}
                                      </span>
                                    )}
                                  </div>
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
                                <span style={{ fontSize: 9 }}>{variant.isActive !== false ? "●" : "○"}</span>
                                {variant.isActive !== false ? "Active" : "Inactive"}
                              </button>

                              {locks[variant.id] && (
                                <div style={{ fontSize: 11, color: "#f0883e", fontWeight: 600, background: "rgba(240,136,62,0.12)", border: "1px solid rgba(240,136,62,0.3)", borderRadius: 5, padding: "3px 8px", whiteSpace: "nowrap" }}>
                                  ✎ {locks[variant.id].username}
                                </div>
                              )}

                              <button onClick={() => handleDuplicate(variant)} className="btn-ghost" style={{ padding: "7px 12px", fontSize: 12, whiteSpace: "nowrap", opacity: 0.75 }} title="Duplicate">⧉ Copy</button>
                              <button onClick={() => navigate(`/products/${variant.id}`)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13, whiteSpace: "nowrap" }}>Edit</button>
                              <button onClick={() => setConfirmDelete(variant)} className="btn-danger" style={{ padding: "7px 14px", fontSize: 13 }}>✕</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Floating bulk action bar ─────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 12,
          background: "linear-gradient(180deg, rgba(20,32,52,0.97), rgba(12,19,32,0.98))",
          border: "1px solid rgba(76,117,219,0.45)",
          borderRadius: 16, padding: "12px 20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(76,117,219,0.15)",
          backdropFilter: "blur(16px)",
          zIndex: 100, whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#6ea8f7" }}>
            {selectedIds.size} product{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ width: 1, height: 20, background: "rgba(117,163,255,0.2)" }} />
          <button
            onClick={openGroupModal}
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 18px" }}
          >
            ⧉ Set Config Group
          </button>
          <button
            onClick={clearSelection}
            className="btn-ghost"
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Config group modal ───────────────────────────────────────────────── */}
      {groupModalOpen && (
        <Modal title="Set Config Group" onClose={() => setGroupModalOpen(false)} width={640}>
          <div style={{ fontSize: 13, color: "rgba(180,200,240,0.55)", marginTop: 0, marginBottom: 18, lineHeight: 1.5 }}>
            Products in the same group show as one card in listings. Customers toggle between configs on the detail page.
          </div>

          {/* Group ID */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(180,200,240,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              Config Group ID
            </label>
            <input
              list="bulk-group-datalist"
              value={bulkGroupId}
              onChange={(e) => setBulkGroupId(e.target.value)}
              placeholder="e.g. delta_heat_32_gas  (same value on all related products)"
              className="field-input"
              style={{ width: "100%", boxSizing: "border-box", fontSize: 13 }}
              autoFocus
              autoComplete="off"
            />
            <datalist id="bulk-group-datalist">
              {existingGroupIds.map((id) => <option key={id} value={id} />)}
            </datalist>
            <div style={{ fontSize: 11, color: "rgba(180,200,240,0.35)", marginTop: 5 }}>
              Type a new ID or pick an existing one from the list to add these products to that group.
            </div>
          </div>

          {/* Per-product labels + primary */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 80px", gap: 8, padding: "0 4px", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,200,240,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Product</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,200,240,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Config Label</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,200,240,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Primary</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {selectedVariants.map((v) => (
                <div key={v.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 180px 80px", gap: 8, alignItems: "center",
                  padding: "8px 10px", borderRadius: 8,
                  background: bulkPrimaryId === v.id ? "rgba(76,117,219,0.1)" : "rgba(9,13,20,0.5)",
                  border: `1px solid ${bulkPrimaryId === v.id ? "rgba(76,117,219,0.3)" : "rgba(117,163,255,0.08)"}`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e7edf7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(180,200,240,0.35)", marginTop: 1 }}>{v.id}</div>
                  </div>
                  <input
                    value={bulkLabels[v.id] || ""}
                    onChange={(e) => setBulkLabels((prev) => ({ ...prev, [v.id]: e.target.value }))}
                    placeholder="e.g. Built-In, Cart…"
                    className="field-input"
                    style={{ fontSize: 12, padding: "5px 10px", width: "100%", boxSizing: "border-box" }}
                  />
                  <div style={{ textAlign: "center" }}>
                    <input
                      type="radio"
                      name="bulk-primary"
                      checked={bulkPrimaryId === v.id}
                      onChange={() => setBulkPrimaryId(v.id)}
                      style={{ accentColor: "#4c75db", width: 16, height: 16, cursor: "pointer" }}
                      title="Show this product in listings"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: "rgba(180,200,240,0.35)", marginBottom: 20, paddingLeft: 4 }}>
            The Primary product is the one shown in browse/search. Others are accessible via the toggle on the detail page.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            <button onClick={clearGrouping} style={{ fontSize: 13, padding: "8px 14px", background: "none", border: "1px solid rgba(248,81,73,0.3)", borderRadius: 8, color: "rgba(248,81,73,0.7)", cursor: "pointer" }}>
              Remove grouping from selected
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setGroupModalOpen(false)} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>Cancel</button>
              <button
                onClick={applyGrouping}
                className="btn-primary"
                style={{ fontSize: 13, padding: "8px 20px" }}
                disabled={!bulkGroupId.trim()}
              >
                Apply to {selectedIds.size} products
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
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
