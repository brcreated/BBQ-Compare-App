import { useEffect, useState } from "react";
import { useDataStore, useToastStore } from "../store/dataStore";
import Modal from "../components/shared/Modal";

const EMPTY_BRAND = {
  id: "",
  name: "",
  logoUrl: "",
  brandBackgroundUrl: "",
  description: "",
  websiteUrl: "",
  sortOrder: null,
  isActive: true,
};

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(180,200,240,0.7)", marginBottom: 5,
  textTransform: "uppercase", letterSpacing: "0.1em",
};

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </div>
  );
}

function BrandForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <Field label="Brand ID (slug)" value={form.id} onChange={(v) => set("id", v.toLowerCase().replace(/\s+/g, "-"))} placeholder="e.g. weber" />
      <Field label="Brand Name" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Weber" />
      <Field label="Logo URL" value={form.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="https://..." />
      <Field label="Background Image URL" value={form.brandBackgroundUrl} onChange={(v) => set("brandBackgroundUrl", v)} placeholder="https://..." />
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
        <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} id="brand-active" />
        <label htmlFor="brand-active" style={{ fontSize: 14, color: "#e7edf7" }}>Active</label>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button onClick={() => onSave(form)} className="btn-primary">Save Brand</button>
      </div>
    </div>
  );
}

export default function BrandsPage() {
  const { brands, loading, loadAll, addBrand, updateBrand, removeBrand, saveDataset } = useDataStore();
  const { addToast } = useToastStore();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!brands.length && !loading) loadAll();
  }, []);

  const filtered = brands.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.id?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(form) {
    try {
      if (modal === "new") {
        if (!form.id) { addToast("Brand ID is required", "error"); return; }
        if (brands.find((b) => b.id === form.id)) { addToast("Brand ID already exists", "error"); return; }
        addBrand(form);
      } else {
        updateBrand(form.id, form);
      }
      await saveDataset("brands");
      addToast(modal === "new" ? "Brand added" : "Brand updated");
      setModal(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  async function handleDelete(id) {
    try {
      removeBrand(id);
      await saveDataset("brands");
      addToast("Brand removed");
      setConfirmDelete(null);
    } catch (e) {
      addToast(e.message, "error");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Brands</h1>
          <p style={{ color: "rgba(180,200,240,0.6)", marginTop: 6, fontSize: 14 }}>{brands.length} brands total</p>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((brand) => (
            <div key={brand.id} style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "linear-gradient(180deg, rgba(15,23,36,0.6), rgba(9,14,24,0.7))",
              border: "1px solid rgba(117,163,255,0.1)",
              borderRadius: 10,
              padding: "14px 18px",
            }}>
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.name} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6, background: "rgba(9,13,20,0.8)", padding: 4 }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 6, background: "rgba(9,13,20,0.8)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(180,200,240,0.4)", fontSize: 18 }}>◈</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#f3f7ff" }}>{brand.name || "—"}</div>
                <div style={{ fontSize: 12, color: "rgba(180,200,240,0.5)", marginTop: 2 }}>{brand.id}</div>
              </div>
              <div style={{ fontSize: 12, color: brand.isActive ? "#3fb950" : "#f85149", fontWeight: 600, marginRight: 8 }}>
                {brand.isActive ? "Active" : "Inactive"}
              </div>
              <button
                onClick={() => setModal(brand)}
                className="btn-ghost"
                style={{ padding: "7px 14px", fontSize: 13 }}
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(brand)}
                className="btn-danger"
                style={{ padding: "7px 14px", fontSize: 13 }}
              >
                Remove
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14, padding: "20px 0" }}>No brands found.</div>
          )}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "new" ? "Add Brand" : `Edit: ${modal.name}`}
          onClose={() => setModal(null)}
        >
          <BrandForm
            initial={modal === "new" ? EMPTY_BRAND : { ...modal }}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Remove Brand" onClose={() => setConfirmDelete(null)} width={420}>
          <p style={{ color: "#e7edf7", fontSize: 14, marginTop: 0 }}>
            Remove <strong>{confirmDelete.name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Cancel</button>
            <button onClick={() => handleDelete(confirmDelete.id)} className="btn-danger">Remove</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
