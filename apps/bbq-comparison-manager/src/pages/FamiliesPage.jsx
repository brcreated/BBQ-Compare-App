import { useState } from "react";
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

const EMPTY_FAMILY = { id: "", brandId: "", name: "", description: "", sortOrder: null, isActive: true };

function FamilyForm({ initial, isNew, brands, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const generatedId = form.brandId && form.name ? `${form.brandId}_${slugify(form.name)}` : "";

  function handleNameChange(v) {
    setForm((f) => ({
      ...f,
      name: v,
      ...(isNew ? { id: f.brandId ? `${f.brandId}_${slugify(v)}` : slugify(v) } : {}),
    }));
  }

  function handleBrandChange(v) {
    setForm((f) => ({
      ...f,
      brandId: v,
      ...(isNew ? { id: v && f.name ? `${v}_${slugify(f.name)}` : slugify(f.name || "") } : {}),
    }));
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Brand</label>
        <select
          value={form.brandId}
          onChange={(e) => handleBrandChange(e.target.value)}
          className="field-input"
          disabled={!isNew}
          style={{ opacity: !isNew ? 0.5 : 1 }}
        >
          <option value="">— Select a brand —</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <Field
        label="Family Name"
        value={form.name}
        onChange={handleNameChange}
        placeholder="e.g. Rogue, Deck Boss, YS640S…"
      />
      <Field
        label="Family ID (auto-generated)"
        value={isNew ? (generatedId || form.id) : form.id}
        onChange={(v) => set("id", v)}
        disabled={!isNew}
        placeholder="e.g. napoleon_rogue"
      />
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description (optional)</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="field-input"
          style={{ resize: "vertical" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <input type="checkbox" checked={!!form.isActive} onChange={(e) => set("isActive", e.target.checked)} id="fam-active" />
        <label htmlFor="fam-active" style={{ fontSize: 14, color: "#e7edf7" }}>Active</label>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button
          onClick={() => onSave({ ...form, id: isNew ? (generatedId || form.id) : form.id })}
          className="btn-primary"
        >
          {isNew ? "Add Family" : "Save Family"}
        </button>
      </div>
    </div>
  );
}

export default function FamiliesPage() {
  const {
    brands, families, variants, loading, loadAll,
    addFamily, updateFamily, removeFamily,
    saveDataset,
  } = useDataStore();
  const { addToast } = useToastStore();

  const [modal, setModal] = useState(null); // null | "new" | family object
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  function productCountFor(familyId) {
    return variants.filter((v) => v.familyId === familyId).length;
  }

  async function moveFamily(familyId, brandId, direction) {
    const group = [...families]
      .filter((f) => f.brandId === brandId)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name?.localeCompare(b.name));
    const idx = group.findIndex((f) => f.id === familyId);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= group.length) return;
    const reordered = [...group];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
    reordered.forEach((f, i) => updateFamily(f.id, { sortOrder: i + 1 }));
    await saveDataset("families");
  }

  function brandName(brandId) {
    return brands.find((b) => b.id === brandId)?.name || brandId;
  }

  const sortedBrands = [...brands].sort((a, b) =>
    (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name?.localeCompare(b.name)
  );

  const filtered = families
    .filter((f) => {
      const matchSearch = !search ||
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.id?.toLowerCase().includes(search.toLowerCase());
      const matchBrand = !brandFilter || f.brandId === brandFilter;
      return matchSearch && matchBrand;
    })
    .sort((a, b) => {
      const ba = brandName(a.brandId);
      const bb = brandName(b.brandId);
      if (ba !== bb) return ba.localeCompare(bb);
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name?.localeCompare(b.name);
    });

  // Group filtered families by brand
  const grouped = filtered.reduce((acc, fam) => {
    if (!acc[fam.brandId]) acc[fam.brandId] = [];
    acc[fam.brandId].push(fam);
    return acc;
  }, {});

  async function handleSave(form) {
    try {
      if (!form.brandId) { addToast("Please select a brand", "error"); return; }
      if (!form.name?.trim()) { addToast("Family name is required", "error"); return; }
      if (!form.id) { addToast("Family ID could not be generated", "error"); return; }
      if (modal === "new") {
        if (families.find((f) => f.id === form.id)) { addToast("Family ID already exists", "error"); return; }
        addFamily(form);
        addToast(`Family "${form.name}" added`);
      } else {
        updateFamily(form.id, form);
        addToast("Family updated");
      }
      await saveDataset("families");
      setModal(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  async function handleDelete(family) {
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
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Families</h1>
          <p style={{ color: "rgba(180,200,240,0.6)", marginTop: 6, fontSize: 14 }}>
            {families.length} families across {brands.length} brands
          </p>
        </div>
        <button onClick={() => setModal("new")} className="btn-primary">+ Add Family</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Search families…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input"
          style={{ maxWidth: 280 }}
        />
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="field-input"
          style={{ maxWidth: 220 }}
        >
          <option value="">All brands</option>
          {sortedBrands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: "rgba(180,200,240,0.5)" }}>Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14, padding: "20px 0" }}>
          {families.length === 0
            ? "No families yet. Add brands first, then create families here."
            : "No families match your search."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sortedBrands
            .filter((b) => grouped[b.id])
            .map((brand) => (
              <div key={brand.id}>
                {/* Brand section header */}
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "rgba(117,163,255,0.7)", marginBottom: 8, paddingLeft: 2,
                }}>
                  {brand.name}
                  <span style={{ color: "rgba(180,200,240,0.35)", fontWeight: 600, marginLeft: 8 }}>
                    {grouped[brand.id].length} {grouped[brand.id].length === 1 ? "family" : "families"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {grouped[brand.id].map((fam) => {
                    const prodCount = productCountFor(fam.id);
                    return (
                      <div key={fam.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 18px",
                        background: "linear-gradient(180deg, rgba(15,23,36,0.6), rgba(9,14,24,0.7))",
                        border: "1px solid rgba(117,163,255,0.1)",
                        borderRadius: 10,
                      }}>
                        {/* Sort controls */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                          <button onClick={() => moveFamily(fam.id, fam.brandId, -1)} disabled={grouped[fam.brandId]?.indexOf(fam) === 0} style={{ width: 24, height: 20, borderRadius: 4, border: "1px solid rgba(117,163,255,0.15)", background: "rgba(117,163,255,0.08)", color: grouped[fam.brandId]?.indexOf(fam) === 0 ? "rgba(180,200,240,0.2)" : "rgba(117,163,255,0.8)", cursor: grouped[fam.brandId]?.indexOf(fam) === 0 ? "default" : "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>▲</button>
                          <button onClick={() => moveFamily(fam.id, fam.brandId, 1)} disabled={grouped[fam.brandId]?.indexOf(fam) === grouped[fam.brandId]?.length - 1} style={{ width: 24, height: 20, borderRadius: 4, border: "1px solid rgba(117,163,255,0.15)", background: "rgba(117,163,255,0.08)", color: grouped[fam.brandId]?.indexOf(fam) === grouped[fam.brandId]?.length - 1 ? "rgba(180,200,240,0.2)" : "rgba(117,163,255,0.8)", cursor: grouped[fam.brandId]?.indexOf(fam) === grouped[fam.brandId]?.length - 1 ? "default" : "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>▼</button>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#f3f7ff" }}>{fam.name}</div>
                          <div style={{ fontSize: 12, color: "rgba(180,200,240,0.4)", marginTop: 2 }}>
                            {fam.id}
                            {fam.description && (
                              <span style={{ marginLeft: 10, color: "rgba(180,200,240,0.35)" }}>{fam.description}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: "rgba(180,200,240,0.5)", whiteSpace: "nowrap" }}>
                          {prodCount} {prodCount === 1 ? "product" : "products"}
                        </div>

                        <div style={{ fontSize: 12, color: fam.isActive ? "#3fb950" : "#f85149", fontWeight: 600 }}>
                          {fam.isActive ? "Active" : "Inactive"}
                        </div>

                        <button
                          onClick={() => setModal(fam)}
                          className="btn-ghost"
                          style={{ padding: "7px 14px", fontSize: 13 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(fam)}
                          className="btn-danger"
                          style={{ padding: "7px 12px", fontSize: 13 }}
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
      )}

      {/* Add / Edit modal */}
      {modal && (
        <Modal
          title={modal === "new" ? "Add Family" : `Edit: ${modal.name}`}
          onClose={() => setModal(null)}
        >
          <FamilyForm
            initial={modal === "new" ? { ...EMPTY_FAMILY } : { ...modal }}
            isNew={modal === "new"}
            brands={sortedBrands}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Modal
          title="Remove Family"
          onClose={() => setConfirmDelete(null)}
          width={420}
        >
          <p style={{ color: "#e7edf7", fontSize: 14, marginTop: 0 }}>
            Remove <strong>{confirmDelete.name}</strong>?
            {productCountFor(confirmDelete.id) > 0 && (
              <span style={{ color: "rgba(248,81,73,0.9)" }}>
                {" "}{productCountFor(confirmDelete.id)} products use this family and will lose their family association.
              </span>
            )}
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
