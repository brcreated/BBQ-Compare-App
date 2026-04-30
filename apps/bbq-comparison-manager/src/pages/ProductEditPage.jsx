import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDataStore, useToastStore } from "../store/dataStore";
import { useAuthStore } from "../store/authStore";
import * as api from "../services/api";
import Modal from "../components/shared/Modal";

// ── Shared field components ──────────────────────────────────────────────────

const fieldLabelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(180,200,240,0.7)", marginBottom: 4,
  textTransform: "uppercase", letterSpacing: "0.1em",
};

function Field({ label, value, onChange, type = "text", placeholder = "", disabled = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="field-input"
        style={{ fontSize: 13, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : undefined }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabelStyle}>{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
        style={{ fontSize: 13 }}
      >
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} id={`toggle-${label}`} />
      <label htmlFor={`toggle-${label}`} style={{ fontSize: 13, color: "#e7edf7" }}>{label}</label>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#7aa3f5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, marginTop: 20, paddingBottom: 6, borderBottom: "1px solid rgba(76,117,219,0.2)" }}>
      {title}
    </div>
  );
}

function Grid({ children, cols = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0 20px" }}>
      {children}
    </div>
  );
}

// ── Info tab ─────────────────────────────────────────────────────────────────

function InfoTab({ form, setForm, brands, families, onCreateFamily }) {
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const brandFamilies = families.filter((f) => f.brandId === form.brandId);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  function handleCreateFamily() {
    const name = newFamilyName.trim();
    if (!name || !form.brandId) return;
    const id = `${form.brandId}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
    onCreateFamily({ id, brandId: form.brandId, name, description: "", sortOrder: null, isActive: true });
    set("familyId", id);
    setNewFamilyName("");
    setCreatingFamily(false);
  }

  const FUEL_TYPES = ["Charcoal", "Gas", "Pellet", "Wood", "Electric", "Dual Fuel"].map((v) => ({ value: v, label: v }));
  const CATEGORIES = ["offset_smoker", "pellet_grill", "gas_grill", "charcoal_grill", "kamado", "pizza_oven", "flat_top", "charcoal_smoker", "wood_smoker", "electric_smoker"].map((v) => ({ value: v, label: v }));
  const SIZE_CLASSES = ["small", "medium", "large", "extra_large"].map((v) => ({ value: v, label: v }));
  const PRICE_TIERS = ["budget", "mid_range", "premium", "luxury"].map((v) => ({ value: v, label: v }));
  const SKILL_LEVELS = ["beginner", "intermediate", "advanced"].map((v) => ({ value: v, label: v }));
  const PORTABILITY = ["stationary", "portable", "semi_portable"].map((v) => ({ value: v, label: v }));

  return (
    <div>
      <SectionHeader title="Identification" />
      <Grid>
        <Field label="Product ID (slug)" value={form.id} onChange={(v) => set("id", v)} disabled={form._isExisting} />
        <Field label="Name" value={form.name} onChange={(v) => set("name", v)} />
        <Select label="Brand" value={form.brandId} onChange={(v) => { set("brandId", v); set("familyId", ""); }} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Family</label>
          {creatingFamily ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                autoFocus
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateFamily(); if (e.key === "Escape") setCreatingFamily(false); }}
                placeholder="Family name…"
                className="field-input"
                style={{ fontSize: 13, flex: 1 }}
              />
              <button onClick={handleCreateFamily} className="btn-primary" style={{ padding: "8px 14px", fontSize: 13 }}>Add</button>
              <button onClick={() => setCreatingFamily(false)} className="btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <select
                value={form.familyId ?? ""}
                onChange={(e) => set("familyId", e.target.value)}
                className="field-input"
                style={{ fontSize: 13, flex: 1 }}
              >
                <option value="">— Select —</option>
                {brandFamilies.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <button
                onClick={() => { if (!form.brandId) return; setCreatingFamily(true); }}
                title={form.brandId ? "Create new family" : "Select a brand first"}
                className="btn-ghost"
                style={{ padding: "8px 12px", fontSize: 13, opacity: form.brandId ? 1 : 0.4, cursor: form.brandId ? "pointer" : "not-allowed" }}
              >
                + New
              </button>
            </div>
          )}
        </div>
        <Field label="Model Number" value={form.modelNumber} onChange={(v) => set("modelNumber", v)} />
        <Field label="SKU" value={form.sku} onChange={(v) => set("sku", v)} />
        <Field label="UPC" value={form.upc} onChange={(v) => set("upc", v)} />
        <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} />
      </Grid>
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>Description</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="field-input"
          style={{ fontSize: 13, resize: "vertical" }}
        />
      </div>

      <SectionHeader title="Pricing" />
      <Grid cols={4}>
        <Field label="Price" value={form.price} onChange={(v) => set("price", v)} type="number" placeholder="0" />
        <Field label="MSRP" value={form.msrp} onChange={(v) => set("msrp", v)} type="number" />
        <Field label="MAP Price" value={form.mapPrice} onChange={(v) => set("mapPrice", v)} type="number" />
        <Field label="Sale Price" value={form.salePrice} onChange={(v) => set("salePrice", v)} type="number" />
      </Grid>
      <Field label="Price Source" value={form.priceSource} onChange={(v) => set("priceSource", v)} />

      <SectionHeader title="Classification" />
      <Grid>
        <Select label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
        <Select label="Fuel Type" value={form.fuelType} onChange={(v) => set("fuelType", v)} options={FUEL_TYPES} />
        <Select label="Install Type" value={form.installType} onChange={(v) => set("installType", v)} options={[{ value: "freestanding", label: "Freestanding" }, { value: "built_in", label: "Built-In" }, { value: "countertop", label: "Countertop" }]} />
        <Select label="Size Class" value={form.sizeClass} onChange={(v) => set("sizeClass", v)} options={SIZE_CLASSES} />
        <Select label="Price Tier" value={form.priceTier} onChange={(v) => set("priceTier", v)} options={PRICE_TIERS} />
        <Select label="Skill Level" value={form.skillLevel} onChange={(v) => set("skillLevel", v)} options={SKILL_LEVELS} />
        <Select label="Portability" value={form.portabilityClass} onChange={(v) => set("portabilityClass", v)} options={PORTABILITY} />
        <Select label="Use Case" value={form.useCase} onChange={(v) => set("useCase", v)} options={["grilling", "smoking", "baking", "multi"].map((v) => ({ value: v, label: v }))} />
      </Grid>

      <SectionHeader title="Dimensions & Weight" />
      <Grid cols={4}>
        <Field label="Width (in)" value={form.productWidth ?? form.width} onChange={(v) => { set("productWidth", v); set("width", v); }} type="number" />
        <Field label="Depth (in)" value={form.productDepth ?? form.depth} onChange={(v) => { set("productDepth", v); set("depth", v); }} type="number" />
        <Field label="Height (in)" value={form.productHeight ?? form.height} onChange={(v) => { set("productHeight", v); set("height", v); }} type="number" />
        <Field label="Weight (lbs)" value={form.productWeight ?? form.weight} onChange={(v) => { set("productWeight", v); set("weight", v); }} type="number" />
      </Grid>

      <SectionHeader title="Cooking Area" />
      <Grid cols={3}>
        <Field label="Primary (sq in)" value={form.primaryCookingArea} onChange={(v) => set("primaryCookingArea", v)} type="number" />
        <Field label="Secondary (sq in)" value={form.secondaryCookingArea} onChange={(v) => set("secondaryCookingArea", v)} type="number" />
        <Field label="Total (sq in)" value={form.totalCookingArea} onChange={(v) => set("totalCookingArea", v)} type="number" />
        <Field label="Grate Levels" value={form.grateLevels} onChange={(v) => set("grateLevels", v)} type="number" />
        <Field label="Rack Width (in)" value={form.rackWidth} onChange={(v) => set("rackWidth", v)} type="number" />
        <Field label="Rack Depth (in)" value={form.rackDepth} onChange={(v) => set("rackDepth", v)} type="number" />
      </Grid>

      <SectionHeader title="Capacity" />
      <Grid cols={4}>
        <Field label="Burgers" value={form.burgerCapacity} onChange={(v) => set("burgerCapacity", v)} type="number" />
        <Field label="Briskets" value={form.brisketCapacity} onChange={(v) => set("brisketCapacity", v)} type="number" />
        <Field label="Rib Racks" value={form.ribRackCapacity} onChange={(v) => set("ribRackCapacity", v)} type="number" />
        <Field label="Pork Butts" value={form.porkButtCapacity} onChange={(v) => set("porkButtCapacity", v)} type="number" />
      </Grid>
      <Grid cols={4}>
        <Field label="Chickens" value={form.chickenCapacity} onChange={(v) => set("chickenCapacity", v)} type="number" />
        <Field label="Temp Min (°F)" value={form.temperatureRangeMin} onChange={(v) => set("temperatureRangeMin", v)} type="number" />
        <Field label="Temp Max (°F)" value={form.temperatureRangeMax} onChange={(v) => set("temperatureRangeMax", v)} type="number" />
        <Field label="Burner Count" value={form.burnerCount} onChange={(v) => set("burnerCount", v)} type="number" />
      </Grid>
      <Grid cols={3}>
        <Field label="Heat Zones" value={form.heatZones} onChange={(v) => set("heatZones", v)} type="number" />
        <Field label="Pellet Hopper (lbs)" value={form.pelletHopperCapacity} onChange={(v) => set("pelletHopperCapacity", v)} type="number" />
      </Grid>

      <SectionHeader title="Features" />
      <Grid cols={3}>
        <Toggle label="WiFi Enabled" value={form.wifiEnabled} onChange={(v) => set("wifiEnabled", v)} />
        <Toggle label="Rotisserie Compatible" value={form.rotisserieCompatible} onChange={(v) => set("rotisserieCompatible", v)} />
        <Toggle label="Direct Flame Access" value={form.directFlameAccess} onChange={(v) => set("directFlameAccess", v)} />
        <Toggle label="Side Burner" value={form.sideBurner} onChange={(v) => set("sideBurner", v)} />
        <Toggle label="Supports Built-In" value={form.supportsBuiltIn} onChange={(v) => set("supportsBuiltIn", v)} />
        <Toggle label="Supports Freestanding" value={form.supportsFreestanding} onChange={(v) => set("supportsFreestanding", v)} />
        <Toggle label="Supports Propane" value={form.supportsPropane} onChange={(v) => set("supportsPropane", v)} />
        <Toggle label="Supports Natural Gas" value={form.supportsNaturalGas} onChange={(v) => set("supportsNaturalGas", v)} />
        <Toggle label="Supports Charcoal" value={form.supportsCharcoal} onChange={(v) => set("supportsCharcoal", v)} />
        <Toggle label="Supports Pellet" value={form.supportsPellet} onChange={(v) => set("supportsPellet", v)} />
        <Toggle label="Supports Wood" value={form.supportsWood} onChange={(v) => set("supportsWood", v)} />
        <Toggle label="Fuel Conversion Supported" value={form.fuelConversionSupported} onChange={(v) => set("fuelConversionSupported", v)} />
      </Grid>
      <Field label="Compatible Conversion Kit" value={form.compatibleConversionKit} onChange={(v) => set("compatibleConversionKit", v)} />

      <SectionHeader title="Status" />
      <Grid cols={2}>
        <Field label="Sort Order" value={form.sortOrder} onChange={(v) => set("sortOrder", v)} type="number" />
        <div style={{ marginBottom: 14, paddingTop: 20 }}>
          <Toggle label="Active" value={form.isActive !== false} onChange={(v) => set("isActive", v)} />
        </div>
      </Grid>
    </div>
  );
}

// ── Specs tab ────────────────────────────────────────────────────────────────

function SpecsTab({ variantId, specs, addSpec, updateSpec, removeSpec }) {
  const variantSpecs = specs.filter((s) => s.entityId === variantId || s.variantId === variantId);
  const [editingId, setEditingId] = useState(null);
  const [newSpec, setNewSpec] = useState(null);

  const EMPTY_SPEC = {
    id: `spec_${Date.now()}`,
    entityType: "variant",
    entityId: variantId,
    variantId,
    key: "",
    label: "",
    value: "",
    unit: "",
    group: "Features",
    sortOrder: null,
    isActive: true,
  };

  const th = { padding: "9px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(180,200,240,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(117,163,255,0.1)" };
  const td = { padding: "9px 12px", fontSize: 13, color: "#e7edf7", borderBottom: "1px solid rgba(117,163,255,0.06)", verticalAlign: "middle" };
  const inputStyle = { background: "rgba(9,13,20,0.8)", border: "1px solid rgba(117,163,255,0.16)", borderRadius: 5, padding: "5px 8px", color: "#e7edf7", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box" };
  const btnEdit = { padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(117,163,255,0.2)", background: "rgba(9,13,20,0.6)", color: "#c4d4f5", fontSize: 12, cursor: "pointer", marginRight: 4 };
  const btnDelete = { padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(248,81,73,0.3)", background: "transparent", color: "#f85149", fontSize: 12, cursor: "pointer" };
  const btnSave = { padding: "4px 10px", borderRadius: 5, border: "none", background: "linear-gradient(135deg, #4c75db, #2f57bc)", color: "#fff", fontSize: 12, cursor: "pointer", marginRight: 4 };
  const btnCancel = { padding: "4px 10px", borderRadius: 5, border: "1px solid rgba(117,163,255,0.2)", background: "rgba(9,13,20,0.6)", color: "rgba(180,200,240,0.7)", fontSize: 12, cursor: "pointer" };

  function SpecRow({ spec }) {
    const [form, setForm] = useState({ ...spec });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    if (editingId === spec.id) {
      return (
        <tr>
          <td style={td}><input value={form.group} onChange={(e) => set("group", e.target.value)} style={inputStyle} /></td>
          <td style={td}><input value={form.label} onChange={(e) => set("label", e.target.value)} style={inputStyle} /></td>
          <td style={td}><input value={form.key} onChange={(e) => set("key", e.target.value)} style={inputStyle} /></td>
          <td style={td}><input value={form.value} onChange={(e) => set("value", e.target.value)} style={inputStyle} /></td>
          <td style={td}><input value={form.unit} onChange={(e) => set("unit", e.target.value)} style={{ ...inputStyle, width: 60 }} /></td>
          <td style={{ ...td, whiteSpace: "nowrap" }}>
            <button onClick={() => { updateSpec(spec.id, form); setEditingId(null); }} style={btnSave}>Save</button>
            <button onClick={() => setEditingId(null)} style={btnCancel}>Cancel</button>
          </td>
        </tr>
      );
    }
    return (
      <tr>
        <td style={td}>{spec.group || "—"}</td>
        <td style={td}>{spec.label}</td>
        <td style={{ ...td, color: "rgba(180,200,240,0.5)", fontSize: 12 }}>{spec.key}</td>
        <td style={td}>{spec.value || "—"}</td>
        <td style={{ ...td, color: "rgba(180,200,240,0.5)" }}>{spec.unit || ""}</td>
        <td style={{ ...td, whiteSpace: "nowrap" }}>
          <button onClick={() => setEditingId(spec.id)} style={btnEdit}>Edit</button>
          <button onClick={() => removeSpec(spec.id)} style={btnDelete}>✕</button>
        </td>
      </tr>
    );
  }

  function NewSpecRow() {
    const [form, setForm] = useState({ ...EMPTY_SPEC, id: `spec_${Date.now()}` });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    return (
      <tr style={{ background: "rgba(76,117,219,0.08)" }}>
        <td style={td}><input value={form.group} onChange={(e) => set("group", e.target.value)} style={inputStyle} placeholder="Features" /></td>
        <td style={td}><input value={form.label} onChange={(e) => set("label", e.target.value)} style={inputStyle} placeholder="Label" /></td>
        <td style={td}><input value={form.key} onChange={(e) => set("key", e.target.value)} style={inputStyle} placeholder="key_name" /></td>
        <td style={td}><input value={form.value} onChange={(e) => set("value", e.target.value)} style={inputStyle} placeholder="Value" /></td>
        <td style={td}><input value={form.unit} onChange={(e) => set("unit", e.target.value)} style={{ ...inputStyle, width: 60 }} placeholder="BTU" /></td>
        <td style={{ ...td, whiteSpace: "nowrap" }}>
          <button onClick={() => { if (form.key && form.label) { addSpec(form); setNewSpec(null); } }} style={btnSave}>Add</button>
          <button onClick={() => setNewSpec(null)} style={btnCancel}>Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setNewSpec(true)} className="btn-primary" style={{ fontSize: 13 }}>+ Add Spec</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Group</th>
              <th style={th}>Label</th>
              <th style={th}>Key</th>
              <th style={th}>Value</th>
              <th style={th}>Unit</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {newSpec && <NewSpecRow />}
            {variantSpecs.length === 0 && !newSpec ? (
              <tr><td colSpan={6} style={{ ...td, color: "rgba(180,200,240,0.5)", textAlign: "center", padding: "24px 0" }}>No specs yet. Click "Add Spec" to add one.</td></tr>
            ) : (
              variantSpecs.map((spec) => <SpecRow key={spec.id} spec={spec} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Images tab ───────────────────────────────────────────────────────────────

function ImagesTab({ variantId, brandId, assets, addAsset, updateAsset, removeAsset, assetBaseUrl }) {
  const variantAssets = assets
    .filter((a) => a.variantId === variantId || a.entityId === variantId)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToastStore();

  function imgUrl(asset) {
    if (asset.url) return asset.url;
    const base = assetBaseUrl || "https://bbqcompareassets.brcreated.app/assets";
    const fp = asset.filePath || asset.file_path || "";
    return fp ? `${base}/${fp}` : null;
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const result = await api.uploadImage(file, brandId, variantId);
        const newAsset = {
          id: `${variantId}_${Date.now()}`,
          entityType: "variant",
          entityId: variantId,
          variantId,
          brandId: brandId || "",
          familyId: "",
          colorId: "",
          imageType: "gallery",
          fileName: result.filename,
          filePath: result.filePath,
          sourceUrl: "",
          sourcePage: "",
          altText: "",
          sortOrder: variantAssets.length + 1,
          isActive: true,
        };
        addAsset(newAsset);
      }
      addToast(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(asset) {
    try {
      if (asset.filePath) await api.deleteImage(asset.filePath);
      removeAsset(asset.id);
      addToast("Image removed");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  const IMAGE_TYPES = ["hero", "gallery", "main", "detail", "lifestyle"];
  const smallInput = { background: "rgba(9,13,20,0.8)", border: "1px solid rgba(117,163,255,0.16)", borderRadius: 5, padding: "5px 8px", color: "#e7edf7", fontSize: 11, outline: "none", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary"
          style={{ fontSize: 13, opacity: uploading ? 0.6 : 1, cursor: uploading ? "not-allowed" : "pointer" }}
        >
          {uploading ? "Uploading…" : "Upload Images"}
        </button>
      </div>

      {variantAssets.length === 0 ? (
        <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
          No images yet. Upload some above.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {variantAssets.map((asset) => {
            const url = imgUrl(asset);
            return (
              <div key={asset.id} style={{ background: "linear-gradient(180deg, rgba(15,23,36,0.88), rgba(9,14,24,0.92))", border: "1px solid rgba(117,163,255,0.14)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "rgba(9,13,20,0.8)", height: 160, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {url ? (
                    <img src={url} alt={asset.altText || asset.fileName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ color: "rgba(180,200,240,0.3)", fontSize: 32 }}>▦</span>
                  )}
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "rgba(180,200,240,0.5)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.fileName}</div>
                  <div style={{ marginBottom: 8 }}>
                    <select
                      value={asset.imageType || "gallery"}
                      onChange={(e) => updateAsset(asset.id, { imageType: e.target.value })}
                      style={{ ...smallInput, width: "100%" }}
                    >
                      {IMAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: "rgba(180,200,240,0.5)" }}>Order:</label>
                    <input
                      type="number"
                      value={asset.sortOrder ?? ""}
                      onChange={(e) => updateAsset(asset.id, { sortOrder: e.target.value === "" ? null : Number(e.target.value) })}
                      style={{ ...smallInput, width: 60 }}
                    />
                  </div>
                  <input
                    type="text"
                    value={asset.altText || ""}
                    onChange={(e) => updateAsset(asset.id, { altText: e.target.value })}
                    placeholder="Alt text…"
                    style={{ ...smallInput, width: "100%", marginBottom: 8 }}
                  />
                  <button
                    onClick={() => handleDelete(asset)}
                    className="btn-danger"
                    style={{ width: "100%", padding: "6px 0", fontSize: 12 }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const BLANK_VARIANT = {
  id: "", brandId: "", familyId: "", name: "", slug: "", modelNumber: "", sku: "", upc: "",
  description: "", notes: "", category: "", cookingCategory: "", fuelType: "", fuelGroup: "",
  defaultFuel: "", installType: "", defaultInstallation: "", cookingStyle: "", useCase: "",
  sizeClass: "", priceTier: "", skillLevel: "", portabilityClass: "",
  productWidth: null, productDepth: null, productHeight: null, productLength: null, productWeight: null,
  width: null, depth: null, height: null, length: null, weight: null,
  temperatureRangeMin: null, temperatureRangeMax: null,
  primaryCookingArea: null, secondaryCookingArea: null, totalCookingArea: null,
  grateLevels: null, rackWidth: null, rackDepth: null,
  burgerCapacity: null, brisketCapacity: null, ribRackCapacity: null, porkButtCapacity: null, chickenCapacity: null,
  wifiEnabled: false, rotisserieCompatible: false, directFlameAccess: false, sideBurner: false,
  builtInCompatible: false, freestandingCompatible: true, supportsBuiltIn: false, supportsFreestanding: true,
  optionalBaseSupported: false, compatibleBase: "", burnerCount: null, heatZones: null,
  pelletHopperCapacity: null, supportsPropane: false, supportsNaturalGas: false,
  supportsCharcoal: false, supportsPellet: false, supportsWood: false,
  fuelConversionSupported: false, compatibleConversionKit: "",
  price: null, msrp: null, mapPrice: null, salePrice: null, priceSource: "",
  shopifyProductId: "", shopifyVariantId: "", shopifyHandle: "",
  dataSource: "", lastUpdatedAt: "", status: "active", sortOrder: null, isActive: true,
};

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const {
    brands, families, variants, specs, assets, assetBaseUrl,
    loading, loadAll, addVariant, updateVariant,
    addFamily,
    addSpec, updateSpec, removeSpec,
    addAsset, updateAsset, removeAsset,
    saveDataset,
  } = useDataStore();
  const { addToast } = useToastStore();
  const { username } = useAuthStore();

  const existing = variants.find((v) => v.id === id);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
  const renewIntervalRef = useRef(null);

  useEffect(() => {
    if (!variants.length && !loading) loadAll();
  }, []);

  useEffect(() => {
    if (!variants.length) return;
    if (isNew) {
      setForm({ ...BLANK_VARIANT, _isExisting: false });
    } else if (existing) {
      setForm({ ...existing, _isExisting: true });
    }
  }, [variants, id]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;

    api.acquireLock(id)
      .then(() => {
        if (cancelled) { api.releaseLock(id).catch(() => {}); return; }
        setLockStatus("acquired");
        renewIntervalRef.current = setInterval(() => {
          api.renewLock(id).catch(() => {});
        }, 10 * 60 * 1000);
      })
      .catch((err) => {
        if (cancelled) return;
        const lockedBy = err.message.replace("Being edited by ", "");
        setLockStatus({ lockedBy });
      });

    return () => {
      cancelled = true;
      clearInterval(renewIntervalRef.current);
      api.releaseLock(id).catch(() => {});
    };
  }, [id, isNew]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const { _isExisting, ...data } = form;
      if (isNew) {
        if (!data.id) { addToast("Product ID is required", "error"); setSaving(false); return; }
        if (variants.find((v) => v.id === data.id)) { addToast("Product ID already exists", "error"); setSaving(false); return; }
        addVariant(data);
      } else {
        updateVariant(data.id, data);
      }
      await saveDataset("variants");
      await saveDataset("specs");
      await saveDataset("assets");
      addToast(isNew ? "Product created" : "Product saved");
      if (isNew) navigate(`/products/${data.id}`);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const isLocked = lockStatus && lockStatus !== "acquired";
  const canEdit = isNew || lockStatus === "acquired";

  const TAB_STYLE = (active) => ({
    padding: "9px 20px", borderRadius: "8px 8px 0 0",
    border: "1px solid",
    borderColor: active ? "rgba(117,163,255,0.18)" : "transparent",
    borderBottom: active ? "1px solid rgba(9,14,24,0.98)" : "1px solid transparent",
    background: active ? "linear-gradient(180deg, rgba(15,23,36,0.98), rgba(9,14,24,0.98))" : "transparent",
    color: active ? "#f3f7ff" : "rgba(180,200,240,0.5)",
    fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: -1,
  });

  if (loading || !form) {
    return <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14 }}>Loading…</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <button onClick={() => navigate("/products")} style={{ background: "none", border: "none", color: "rgba(180,200,240,0.6)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 8 }}>
            ← Back to Products
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
            {isNew ? "New Product" : form.name || id}
          </h1>
          {!isNew && <div style={{ fontSize: 12, color: "rgba(180,200,240,0.5)", marginTop: 4 }}>{id}</div>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || isLocked}
          className="btn-primary"
          style={{ opacity: (saving || isLocked) ? 0.5 : 1, cursor: (saving || isLocked) ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Lock banner */}
      {isLocked && (
        <div style={{ background: "rgba(240,136,62,0.1)", border: "1px solid rgba(240,136,62,0.35)", borderRadius: 9, padding: "11px 16px", marginBottom: 18, fontSize: 13, color: "#f0883e", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <span><strong>{lockStatus.lockedBy}</strong> is currently editing this product. Saving is disabled until they finish.</span>
        </div>
      )}
      {lockStatus === "acquired" && !isNew && (
        <div style={{ background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.25)", borderRadius: 9, padding: "9px 16px", marginBottom: 18, fontSize: 12, color: "#3fb950", display: "flex", alignItems: "center", gap: 8 }}>
          <span>✓</span> You have this product locked for editing. Others can view but not save.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 0, borderBottom: "1px solid rgba(117,163,255,0.1)" }}>
        <button style={TAB_STYLE(tab === "info")} onClick={() => setTab("info")}>Info</button>
        {!isNew && <button style={TAB_STYLE(tab === "specs")} onClick={() => setTab("specs")}>Specs</button>}
        {!isNew && <button style={TAB_STYLE(tab === "images")} onClick={() => setTab("images")}>Images</button>}
      </div>

      <div style={{ background: "linear-gradient(180deg, rgba(15,23,36,0.98), rgba(9,14,24,0.98))", border: "1px solid rgba(117,163,255,0.18)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "22px 24px" }}>
        {tab === "info" && (
          <InfoTab
            form={form}
            setForm={setForm}
            brands={brands}
            families={families}
            onCreateFamily={(family) => { addFamily(family); saveDataset("families"); }}
          />
        )}
        {tab === "specs" && !isNew && (
          <SpecsTab
            variantId={id}
            specs={specs}
            addSpec={addSpec}
            updateSpec={updateSpec}
            removeSpec={removeSpec}
          />
        )}
        {tab === "images" && !isNew && (
          <ImagesTab
            variantId={id}
            brandId={form.brandId}
            assets={assets}
            addAsset={addAsset}
            updateAsset={updateAsset}
            removeAsset={removeAsset}
            assetBaseUrl={assetBaseUrl}
          />
        )}
      </div>
    </div>
  );
}
