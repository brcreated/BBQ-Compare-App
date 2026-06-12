import { useEffect, useState } from "react";
import { useDataStore, useToastStore } from "../store/dataStore";
import Modal from "../components/shared/Modal";

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(180,200,240,0.7)", marginBottom: 5,
  textTransform: "uppercase", letterSpacing: "0.1em",
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function Field({ label, value, onChange, type = "text", placeholder = "", disabled = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="field-input"
        style={{ opacity: disabled ? 0.5 : 1 }}
      />
    </div>
  );
}

// ── Brand form (modal) ────────────────────────────────────────────────────────

const EMPTY_BRAND = { id: "", name: "", logoUrl: "", brandBackgroundUrl: "", description: "", websiteUrl: "", sortOrder: null, isActive: true };

function BrandForm({ initial, isNew, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <Field
        label="Brand Name"
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v, ...(isNew ? { id: slugify(v) } : {}) }))}
        placeholder="e.g. Weber"
      />
      <Field
        label="Brand ID (auto-generated)"
        value={form.id}
        onChange={(v) => set("id", v.toLowerCase().replace(/\s+/g, "-"))}
        disabled={!isNew}
        placeholder="e.g. weber"
      />
      <Field label="Website URL" value={form.websiteUrl} onChange={(v) => set("websiteUrl", v)} placeholder="https://..." />
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="field-input"
          style={{ resize: "vertical" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <input type="checkbox" checked={!!form.isActive} onChange={(e) => set("isActive", e.target.checked)} id="brand-active" />
        <label htmlFor="brand-active" style={{ fontSize: 14, color: "#e7edf7" }}>Active</label>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button onClick={() => onSave(form)} className="btn-primary">Save Brand</button>
      </div>
    </div>
  );
}

// ── Inline family row ─────────────────────────────────────────────────────────

function FamilyAddRow({ brandId, onSave, onCancel }) {
  const [name, setName] = useState("");
  const generatedId = name ? `${brandId}_${slugify(name)}` : "";

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id: generatedId, brandId, name: name.trim(), description: "", sortOrder: null, isActive: true });
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px",
      background: "rgba(76,117,219,0.07)",
      border: "1px solid rgba(76,117,219,0.25)",
      borderRadius: 8,
      marginTop: 6,
    }}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
        placeholder="Family name (e.g. Rogue, YS640S…)"
        className="field-input"
        style={{ flex: 1, fontSize: 13 }}
      />
      {generatedId && (
        <div style={{ fontSize: 11, color: "rgba(180,200,240,0.4)", whiteSpace: "nowrap" }}>
          ID: {generatedId}
        </div>
      )}
      <button onClick={handleSave} className="btn-primary" style={{ padding: "7px 14px", fontSize: 13, whiteSpace: "nowrap" }}>
        Add
      </button>
      <button onClick={onCancel} className="btn-ghost" style={{ padding: "7px 10px", fontSize: 13 }}>
        ✕
      </button>
    </div>
  );
}

function FamilyEditRow({ family, onSave, onCancel }) {
  const [name, setName] = useState(family.name);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px",
      background: "rgba(76,117,219,0.07)",
      border: "1px solid rgba(76,117,219,0.25)",
      borderRadius: 8,
    }}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave({ ...family, name }); if (e.key === "Escape") onCancel(); }}
        className="field-input"
        style={{ flex: 1, fontSize: 13 }}
      />
      <div style={{ fontSize: 11, color: "rgba(180,200,240,0.4)", whiteSpace: "nowrap" }}>
        ID: {family.id}
      </div>
      <button onClick={() => onSave({ ...family, name })} className="btn-primary" style={{ padding: "7px 14px", fontSize: 13 }}>
        Save
      </button>
      <button onClick={onCancel} className="btn-ghost" style={{ padding: "7px 10px", fontSize: 13 }}>
        ✕
      </button>
    </div>
  );
}

// ── Asset logo helper ─────────────────────────────────────────────────────────

const ASSET_BASE = "https://bbqcompareassets.brcreated.app/assets";

function getBrandLogoUrl(brand, assets, assetBaseUrl) {
  if (brand.logoUrl) return brand.logoUrl;
  const base = assetBaseUrl || ASSET_BASE;
  const logo = assets.find((a) =>
    (a.entityId === brand.id || a.brandId === brand.id) &&
    a.entityType === "brand" &&
    ["logo", "brand-logo", "brand_logo"].includes(a.imageType)
  );
  if (!logo) return null;
  const fp = logo.filePath || logo.file_path || "";
  if (!fp) return logo.url || null;
  return `${base}/${fp}`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const {
    brands, families, assets, variants, assetBaseUrl, loading, loadAll,
    addBrand, updateBrand, removeBrand,
    addFamily, updateFamily, removeFamily,
    saveDataset,
  } = useDataStore();
  const { addToast } = useToastStore();

  const [modal, setModal] = useState(null); // null | "new" | brand object
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: "brand"|"family", item }
  const [expanded, setExpanded] = useState({}); // brandId → bool
  const [addingFamilyFor, setAddingFamilyFor] = useState(null); // brandId
  const [editingFamily, setEditingFamily] = useState(null); // family id
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!brands.length && !loading) loadAll();
  }, []);

  const filtered = brands
    .filter((b) => b.name?.toLowerCase().includes(search.toLowerCase()) || b.id?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name?.localeCompare(b.name));

  function familiesFor(brandId) {
    return families
      .filter((f) => f.brandId === brandId)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name?.localeCompare(b.name));
  }

  function productCountFor(familyId) {
    return variants.filter((v) => v.familyId === familyId).length;
  }

  function toggleExpand(brandId) {
    setExpanded((e) => ({ ...e, [brandId]: !e[brandId] }));
  }

  // ── Brand handlers ──

  async function handleSaveBrand(form) {
    try {
      if (modal === "new") {
        if (!form.id) { addToast("Brand name is required", "error"); return; }
        if (brands.find((b) => b.id === form.id)) { addToast("Brand ID already exists", "error"); return; }
        addBrand(form);
        setExpanded((e) => ({ ...e, [form.id]: true })); // auto-expand new brand
      } else {
        updateBrand(form.id, form);
      }
      await saveDataset("brands");
      addToast(modal === "new" ? "Brand added — now add its families below" : "Brand updated");
      setModal(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  async function handleDeleteBrand(brand) {
    try {
      removeBrand(brand.id);
      await saveDataset("brands");
      addToast("Brand removed");
      setConfirmDelete(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  // ── Family handlers ──

  async function handleAddFamily(family) {
    try {
      if (families.find((f) => f.id === family.id)) { addToast("Family ID already exists", "error"); return; }
      addFamily(family);
      await saveDataset("families");
      addToast(`Family "${family.name}" added`);
      setAddingFamilyFor(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  async function handleUpdateFamily(family) {
    try {
      updateFamily(family.id, family);
      await saveDataset("families");
      addToast("Family updated");
      setEditingFamily(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  async function handleDeleteFamily(family) {
    try {
      removeFamily(family.id);
      await saveDataset("families");
      addToast("Family removed");
      setConfirmDelete(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Brands & Families</h1>
          <p style={{ color: "rgba(180,200,240,0.6)", marginTop: 6, fontSize: 14 }}>
            {brands.length} brands · {families.length} families
          </p>
        </div>
        <button onClick={() => setModal("new")} className="btn-primary">+ Add Brand</button>
      </div>

      <input
        placeholder="Search brands…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="field-input"
        style={{ maxWidth: 360, marginBottom: 20 }}
      />

      {loading ? (
        <div style={{ color: "rgba(180,200,240,0.5)" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((brand) => {
            const logoUrl = getBrandLogoUrl(brand, assets, assetBaseUrl);
            const isExpanded = !!expanded[brand.id];
            const brandFamilies = familiesFor(brand.id);
            const isAddingFamily = addingFamilyFor === brand.id;

            return (
              <div key={brand.id} style={{
                background: "linear-gradient(180deg, rgba(15,23,36,0.6), rgba(9,14,24,0.7))",
                border: `1px solid ${isExpanded ? "rgba(117,163,255,0.2)" : "rgba(117,163,255,0.1)"}`,
                borderRadius: 12,
                overflow: "hidden",
              }}>
                {/* Brand row */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
                  {/* Logo */}
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(9,13,20,0.8)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {logoUrl
                      ? <img src={logoUrl} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                      : <span style={{ color: "rgba(180,200,240,0.4)", fontSize: 20 }}>◈</span>
                    }
                  </div>

                  {/* Name / id */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#f3f7ff" }}>{brand.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "rgba(180,200,240,0.4)", marginTop: 2 }}>
                      {brand.id} · {brandFamilies.length} {brandFamilies.length === 1 ? "family" : "families"}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ fontSize: 12, color: brand.isActive ? "#3fb950" : "#f85149", fontWeight: 600, marginRight: 4 }}>
                    {brand.isActive ? "Active" : "Inactive"}
                  </div>

                  {/* Actions */}
                  <button onClick={() => setModal(brand)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>Edit</button>
                  <button onClick={() => setConfirmDelete({ type: "brand", item: brand })} className="btn-danger" style={{ padding: "7px 12px", fontSize: 13 }}>✕</button>

                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleExpand(brand.id)}
                    style={{
                      background: isExpanded ? "rgba(76,117,219,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isExpanded ? "rgba(117,163,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 8, padding: "7px 12px", cursor: "pointer",
                      color: isExpanded ? "#7aa3f5" : "rgba(180,200,240,0.5)",
                      fontSize: 13, fontWeight: 700, transition: "all 150ms",
                    }}
                  >
                    {isExpanded ? "▲" : "▼"} Families
                  </button>
                </div>

                {/* Families panel */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid rgba(117,163,255,0.1)",
                    padding: "12px 18px 16px",
                    background: "rgba(0,0,0,0.2)",
                  }}>
                    {brandFamilies.length === 0 && !isAddingFamily && (
                      <div style={{ fontSize: 13, color: "rgba(180,200,240,0.4)", marginBottom: 10 }}>
                        No families yet — add one below to get started.
                      </div>
                    )}

                    {/* Family rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {brandFamilies.map((fam) => (
                        editingFamily === fam.id ? (
                          <FamilyEditRow
                            key={fam.id}
                            family={fam}
                            onSave={handleUpdateFamily}
                            onCancel={() => setEditingFamily(null)}
                          />
                        ) : (
                          <div key={fam.id} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 14px",
                            background: "rgba(117,163,255,0.04)",
                            border: "1px solid rgba(117,163,255,0.1)",
                            borderRadius: 8,
                          }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#e7edf7" }}>{fam.name}</span>
                              <span style={{ fontSize: 12, color: "rgba(180,200,240,0.4)", marginLeft: 10 }}>{fam.id}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(180,200,240,0.5)", marginRight: 6 }}>
                              {productCountFor(fam.id)} products
                            </div>
                            <button
                              onClick={() => setEditingFamily(fam.id)}
                              className="btn-ghost"
                              style={{ padding: "5px 12px", fontSize: 12 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: "family", item: fam })}
                              className="btn-danger"
                              style={{ padding: "5px 10px", fontSize: 12 }}
                            >
                              ✕
                            </button>
                          </div>
                        )
                      ))}

                      {/* Add family row */}
                      {isAddingFamily ? (
                        <FamilyAddRow
                          brandId={brand.id}
                          onSave={handleAddFamily}
                          onCancel={() => setAddingFamilyFor(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setAddingFamilyFor(brand.id)}
                          style={{
                            marginTop: 4, padding: "9px 14px", borderRadius: 8, cursor: "pointer",
                            background: "transparent",
                            border: "1px dashed rgba(117,163,255,0.25)",
                            color: "rgba(117,163,255,0.7)", fontSize: 13, fontWeight: 600,
                            textAlign: "left", transition: "border-color 150ms, color 150ms",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(117,163,255,0.5)"; e.currentTarget.style.color = "#7aa3f5"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(117,163,255,0.25)"; e.currentTarget.style.color = "rgba(117,163,255,0.7)"; }}
                        >
                          + Add Family
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14, padding: "20px 0" }}>No brands found.</div>
          )}
        </div>
      )}

      {/* Brand modal */}
      {modal && (
        <Modal
          title={modal === "new" ? "Add Brand" : `Edit: ${modal.name}`}
          onClose={() => setModal(null)}
        >
          <BrandForm
            initial={modal === "new" ? { ...EMPTY_BRAND } : { ...modal }}
            isNew={modal === "new"}
            onSave={handleSaveBrand}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Modal
          title={`Remove ${confirmDelete.type === "brand" ? "Brand" : "Family"}`}
          onClose={() => setConfirmDelete(null)}
          width={420}
        >
          <p style={{ color: "#e7edf7", fontSize: 14, marginTop: 0 }}>
            Remove <strong>{confirmDelete.item.name}</strong>?
            {confirmDelete.type === "brand" && (
              <span style={{ color: "rgba(248,81,73,0.9)" }}> This will not delete its products, but they will lose their brand association.</span>
            )}
            {confirmDelete.type === "family" && productCountFor(confirmDelete.item.id) > 0 && (
              <span style={{ color: "rgba(248,81,73,0.9)" }}> {productCountFor(confirmDelete.item.id)} products use this family and will lose their family association.</span>
            )}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Cancel</button>
            <button
              onClick={() => confirmDelete.type === "brand" ? handleDeleteBrand(confirmDelete.item) : handleDeleteFamily(confirmDelete.item)}
              className="btn-danger"
            >
              Remove
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
