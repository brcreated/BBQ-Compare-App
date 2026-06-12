import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDataStore, useToastStore } from "../store/dataStore";
import * as api from "../services/api";

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

// ── Layout helpers ───────────────────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(15,23,36,0.98), rgba(9,14,24,0.98))",
      border: "1px solid rgba(117,163,255,0.18)",
      borderRadius: 14,
      padding: "20px 24px",
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#c4d4f5", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid rgba(117,163,255,0.1)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid rgba(117,163,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", background: "rgba(9,13,20,0.6)", border: "none",
          color: "rgba(180,200,240,0.8)", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
      >
        {title}
        <span style={{ fontSize: 11, opacity: 0.6 }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div style={{ padding: "20px 24px", background: "linear-gradient(180deg, rgba(15,23,36,0.98), rgba(9,14,24,0.98))" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function CheckCard({ label, checked, onChange, icon }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
      borderRadius: 10,
      border: `1px solid ${checked ? "rgba(76,117,219,0.5)" : "rgba(117,163,255,0.12)"}`,
      background: checked ? "rgba(76,117,219,0.12)" : "rgba(9,13,20,0.4)",
      cursor: "pointer",
    }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: "none" }} />
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: checked ? "#b0ccff" : "rgba(180,200,240,0.7)" }}>{label}</span>
      <span style={{
        marginLeft: "auto", width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? "#4c75db" : "rgba(117,163,255,0.3)"}`,
        background: checked ? "#4c75db" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
      </span>
    </label>
  );
}

// ── Form sections ────────────────────────────────────────────────────────────

function BasicInfoSection({ form, setForm, brands, families, onCreateFamily }) {
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

  return (
    <div>
      <Grid>
        <Select
          label="Brand"
          value={form.brandId}
          onChange={(v) => { set("brandId", v); set("familyId", ""); }}
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
        />
        <Field
          label="Product Name"
          value={form.name}
          onChange={(v) => {
            const slug = v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
            setForm((f) => ({ ...f, name: v, ...(f._isExisting ? {} : { id: slug, slug }) }));
          }}
        />
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
        <Field label="Product ID" value={form.id} onChange={(v) => set("id", v)} disabled={form._isExisting} />
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
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>Product Type</label>
        <select
          value={form.productType ?? ""}
          onChange={(e) => set("productType", e.target.value)}
          className="field-input"
          style={{ fontSize: 13 }}
        >
          <option value="">— Select type —</option>
          <option value="grill">Grill</option>
          <option value="smoker">Smoker</option>
          <option value="griddle">Griddle</option>
          <option value="pizza-oven">Pizza Oven</option>
        </select>
      </div>
    </div>
  );
}

function FuelInstallSection({ form, setForm }) {
  function setWithInstallSync(key, val) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      const bi = key === "supportsBuiltIn" ? val : next.supportsBuiltIn;
      const fs = key === "supportsFreestanding" ? val : next.supportsFreestanding;
      next.installType = bi && fs ? "both" : bi ? "built_in" : fs ? "freestanding" : "";
      return next;
    });
  }

  const dualGas = form.supportsPropane && form.supportsNaturalGas;

  return (
    <div>
      <SectionHeader title="Fuel Type — select all that apply" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 4 }}>
        <CheckCard label="Pellet" icon="🪵" checked={!!form.supportsPellet} onChange={(v) => setWithInstallSync("supportsPellet", v)} />
        <CheckCard label="Propane" icon="🔥" checked={!!form.supportsPropane} onChange={(v) => setWithInstallSync("supportsPropane", v)} />
        <CheckCard label="Natural Gas" icon="⚡" checked={!!form.supportsNaturalGas} onChange={(v) => setWithInstallSync("supportsNaturalGas", v)} />
        <CheckCard label="Charcoal" icon="⚫" checked={!!form.supportsCharcoal} onChange={(v) => setWithInstallSync("supportsCharcoal", v)} />
      </div>

      <SectionHeader title="Installation" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        <CheckCard label="Freestanding" icon="🏠" checked={!!form.supportsFreestanding} onChange={(v) => setWithInstallSync("supportsFreestanding", v)} />
        <CheckCard label="Built-In" icon="🧱" checked={!!form.supportsBuiltIn} onChange={(v) => setWithInstallSync("supportsBuiltIn", v)} />
      </div>

      {dualGas && (
        <>
          <SectionHeader title="Gas Pricing" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { value: "same", label: "Same price for Propane & Natural Gas" },
              { value: "different", label: "Different prices for Propane and Natural Gas" },
            ].map((opt) => (
              <label key={opt.value} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${form.gasPricingMode === opt.value ? "rgba(76,117,219,0.5)" : "rgba(117,163,255,0.12)"}`,
                background: form.gasPricingMode === opt.value ? "rgba(76,117,219,0.12)" : "rgba(9,13,20,0.4)",
                cursor: "pointer",
              }}>
                <input
                  type="radio"
                  name="gasPricingMode"
                  value={opt.value}
                  checked={form.gasPricingMode === opt.value}
                  onChange={() => setForm((f) => ({ ...f, gasPricingMode: opt.value }))}
                  style={{ accentColor: "#4c75db" }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: form.gasPricingMode === opt.value ? "#b0ccff" : "rgba(180,200,240,0.7)" }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PricingSection({ form, setForm }) {
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const dualGasDiff = form.supportsPropane && form.supportsNaturalGas && form.gasPricingMode === "different";

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <CheckCard
          label="Ask for Pricing"
          icon="💬"
          checked={!!form.askForPricing}
          onChange={(v) => set("askForPricing", v)}
        />
        {form.askForPricing && (
          <div style={{ fontSize: 12, color: "rgba(180,200,240,0.5)", marginTop: 8, paddingLeft: 4 }}>
            Price fields are hidden from customers. The app will show "Ask for Pricing".
          </div>
        )}
      </div>

      {!form.askForPricing && (
        <>
          {dualGasDiff ? (
            <Grid cols={2}>
              <Field label="Propane Price ($)" value={form.propanePrice} onChange={(v) => set("propanePrice", v)} type="number" placeholder="0.00" />
              <Field label="Natural Gas Price ($)" value={form.naturalGasPrice} onChange={(v) => set("naturalGasPrice", v)} type="number" placeholder="0.00" />
            </Grid>
          ) : (
            <Field label="Price ($)" value={form.price} onChange={(v) => set("price", v)} type="number" placeholder="0.00" />
          )}
          <Grid cols={2}>
            <Field label="MSRP ($)" value={form.msrp} onChange={(v) => set("msrp", v)} type="number" />
            <Field label="Sale Price ($)" value={form.salePrice} onChange={(v) => set("salePrice", v)} type="number" />
          </Grid>
        </>
      )}
    </div>
  );
}

function KeySpecsSection({ form, setForm }) {
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <Grid cols={2}>
        <Field label="Min Temperature (°F)" value={form.temperatureRangeMin} onChange={(v) => set("temperatureRangeMin", v)} type="number" placeholder="e.g. 180" />
        <Field label="Max Temperature (°F)" value={form.temperatureRangeMax} onChange={(v) => set("temperatureRangeMax", v)} type="number" placeholder="e.g. 700" />
      </Grid>
      <Field label="Cooking Space (sq in)" value={form.primaryCookingArea} onChange={(v) => set("primaryCookingArea", v)} type="number" placeholder="e.g. 700" />
      <SectionHeader title="Dimensions" />
      <Grid cols={3}>
        <Field label="Width (in)" value={form.productWidth ?? form.width} onChange={(v) => { set("productWidth", v); set("width", v); }} type="number" />
        <Field label="Depth (in)" value={form.productDepth ?? form.depth} onChange={(v) => { set("productDepth", v); set("depth", v); }} type="number" />
        <Field label="Height (in)" value={form.productHeight ?? form.height} onChange={(v) => { set("productHeight", v); set("height", v); }} type="number" />
      </Grid>
      <Grid cols={2}>
        <Field label="Number of Grates" value={form.grateLevels} onChange={(v) => set("grateLevels", v)} type="number" placeholder="e.g. 2" />
        <Field label="Grate Material" value={form.grateMaterial} onChange={(v) => set("grateMaterial", v)} placeholder="e.g. Stainless Steel, Cast Iron" />
        <Field label="Body Material" value={form.bodyMaterial} onChange={(v) => set("bodyMaterial", v)} placeholder="e.g. 304 Stainless Steel" />
        <Field label="Made In" value={form.madeIn} onChange={(v) => set("madeIn", v)} placeholder="e.g. USA" />
      </Grid>
    </div>
  );
}

function AdvancedSection({ form, setForm }) {
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const CATEGORIES = ["offset_smoker", "pellet_grill", "gas_grill", "charcoal_grill", "kamado", "pizza_oven", "flat_top", "charcoal_smoker", "wood_smoker", "electric_smoker"].map((v) => ({ value: v, label: v }));
  const FUEL_TYPES = ["Charcoal", "Gas", "Pellet", "Wood", "Electric", "Dual Fuel"].map((v) => ({ value: v, label: v }));
  const SIZE_CLASSES = ["small", "medium", "large", "extra_large"].map((v) => ({ value: v, label: v }));
  const PRICE_TIERS = ["budget", "mid_range", "premium", "luxury"].map((v) => ({ value: v, label: v }));
  const SKILL_LEVELS = ["beginner", "intermediate", "advanced"].map((v) => ({ value: v, label: v }));
  const PORTABILITY = ["stationary", "portable", "semi_portable"].map((v) => ({ value: v, label: v }));

  return (
    <div>
      <SectionHeader title="Additional Identification" />
      <Grid>
        <Field label="Model Number" value={form.modelNumber} onChange={(v) => set("modelNumber", v)} />
        <Field label="SKU" value={form.sku} onChange={(v) => set("sku", v)} />
        <Field label="UPC" value={form.upc} onChange={(v) => set("upc", v)} />
        <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} />
      </Grid>
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>Notes</label>
        <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} className="field-input" style={{ fontSize: 13, resize: "vertical" }} />
      </div>

      <SectionHeader title="Classification" />
      <Grid>
        <Select label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
        <Select label="Fuel Type (legacy)" value={form.fuelType} onChange={(v) => set("fuelType", v)} options={FUEL_TYPES} />
        <Select label="Size Class" value={form.sizeClass} onChange={(v) => set("sizeClass", v)} options={SIZE_CLASSES} />
        <Select label="Price Tier" value={form.priceTier} onChange={(v) => set("priceTier", v)} options={PRICE_TIERS} />
        <Select label="Skill Level" value={form.skillLevel} onChange={(v) => set("skillLevel", v)} options={SKILL_LEVELS} />
        <Select label="Portability" value={form.portabilityClass} onChange={(v) => set("portabilityClass", v)} options={PORTABILITY} />
        <Select label="Use Case" value={form.useCase} onChange={(v) => set("useCase", v)} options={["grilling", "smoking", "baking", "multi"].map((v) => ({ value: v, label: v }))} />
        <Field label="Cooking Category" value={form.cookingCategory} onChange={(v) => set("cookingCategory", v)} />
      </Grid>

      <SectionHeader title="Pricing Detail" />
      <Grid>
        <Field label="MAP Price ($)" value={form.mapPrice} onChange={(v) => set("mapPrice", v)} type="number" />
        <Field label="Price Source" value={form.priceSource} onChange={(v) => set("priceSource", v)} />
      </Grid>

      <SectionHeader title="Additional Dimensions" />
      <Grid cols={3}>
        <Field label="Weight (lbs)" value={form.productWeight ?? form.weight} onChange={(v) => { set("productWeight", v); set("weight", v); }} type="number" />
        <Field label="Length (in)" value={form.productLength ?? form.length} onChange={(v) => { set("productLength", v); set("length", v); }} type="number" />
      </Grid>

      <SectionHeader title="Additional Cooking Area" />
      <Grid cols={3}>
        <Field label="Secondary (sq in)" value={form.secondaryCookingArea} onChange={(v) => set("secondaryCookingArea", v)} type="number" />
        <Field label="Total (sq in)" value={form.totalCookingArea} onChange={(v) => set("totalCookingArea", v)} type="number" />
        <Field label="Rack Width (in)" value={form.rackWidth} onChange={(v) => set("rackWidth", v)} type="number" />
        <Field label="Rack Depth (in)" value={form.rackDepth} onChange={(v) => set("rackDepth", v)} type="number" />
      </Grid>

      <SectionHeader title="Capacity" />
      <Grid cols={4}>
        <Field label="Burgers" value={form.burgerCapacity} onChange={(v) => set("burgerCapacity", v)} type="number" />
        <Field label="Briskets" value={form.brisketCapacity} onChange={(v) => set("brisketCapacity", v)} type="number" />
        <Field label="Rib Racks" value={form.ribRackCapacity} onChange={(v) => set("ribRackCapacity", v)} type="number" />
        <Field label="Pork Butts" value={form.porkButtCapacity} onChange={(v) => set("porkButtCapacity", v)} type="number" />
        <Field label="Chickens" value={form.chickenCapacity} onChange={(v) => set("chickenCapacity", v)} type="number" />
        <Field label="Burner Count" value={form.burnerCount} onChange={(v) => set("burnerCount", v)} type="number" />
        <Field label="Heat Zones" value={form.heatZones} onChange={(v) => set("heatZones", v)} type="number" />
        <Field label="Pellet Hopper (lbs)" value={form.pelletHopperCapacity} onChange={(v) => set("pelletHopperCapacity", v)} type="number" />
      </Grid>

      <SectionHeader title="Features" />
      <Grid cols={3}>
        <Toggle label="WiFi Enabled" value={form.wifiEnabled} onChange={(v) => set("wifiEnabled", v)} />
        <Toggle label="Rotisserie Compatible" value={form.rotisserieCompatible} onChange={(v) => set("rotisserieCompatible", v)} />
        <Toggle label="Direct Flame Access" value={form.directFlameAccess} onChange={(v) => set("directFlameAccess", v)} />
        <Toggle label="Side Burner" value={form.sideBurner} onChange={(v) => set("sideBurner", v)} />
        <Toggle label="Rear Infrared Rotisserie" value={form.rearInfraredRotisserie} onChange={(v) => set("rearInfraredRotisserie", v)} />
        <Toggle label="Supports Wood" value={form.supportsWood} onChange={(v) => set("supportsWood", v)} />
        <Toggle label="Fuel Conversion Supported" value={form.fuelConversionSupported} onChange={(v) => set("fuelConversionSupported", v)} />
      </Grid>
      <Field label="Compatible Conversion Kit" value={form.compatibleConversionKit} onChange={(v) => set("compatibleConversionKit", v)} />

      <SectionHeader title="Shopify" />
      <Grid cols={3}>
        <Field label="Shopify Product ID" value={form.shopifyProductId} onChange={(v) => set("shopifyProductId", v)} />
        <Field label="Shopify Variant ID" value={form.shopifyVariantId} onChange={(v) => set("shopifyVariantId", v)} />
        <Field label="Shopify Handle" value={form.shopifyHandle} onChange={(v) => set("shopifyHandle", v)} />
      </Grid>

      <SectionHeader title="Status" />
      <Grid cols={2}>
        <Field label="Sort Order" value={form.sortOrder} onChange={(v) => set("sortOrder", v)} type="number" />
        <Field label="Data Source" value={form.dataSource} onChange={(v) => set("dataSource", v)} />
      </Grid>
      <Toggle label="Active" value={form.isActive !== false} onChange={(v) => set("isActive", v)} />
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
  const allVariantAssets = assets.filter((a) => a.variantId === variantId || a.entityId === variantId);
  const heroAsset = allVariantAssets.find((a) => a.imageType === "hero" || a.imageType === "main");
  const galleryAssets = allVariantAssets
    .filter((a) => a.imageType !== "hero" && a.imageType !== "main")
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  const heroRef = useRef();
  const galleryRef = useRef();
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const { addToast } = useToastStore();

  function imgUrl(asset) {
    if (asset.url) return asset.url;
    const base = assetBaseUrl || "https://bbqcompareassets.brcreated.app/assets";
    const fp = asset.filePath || asset.file_path || "";
    return fp ? `${base}/${fp}` : null;
  }

  function makeAsset(result, imageType, sortOrder) {
    return {
      id: `${variantId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entityType: "variant",
      entityId: variantId,
      variantId,
      brandId: brandId || "",
      familyId: "",
      colorId: "",
      imageType,
      fileName: result.filename,
      filePath: result.filePath,
      sourceUrl: "",
      altText: "",
      sortOrder,
      isActive: true,
    };
  }

  async function handleHeroUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      // Remove existing hero first
      if (heroAsset) {
        if (heroAsset.filePath) await api.deleteImage(heroAsset.filePath);
        removeAsset(heroAsset.id);
      }
      const result = await api.uploadImage(file, brandId, variantId);
      addAsset(makeAsset(result, "hero", 0));
      addToast("Hero image uploaded");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  }

  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      let nextOrder = galleryAssets.length > 0
        ? Math.max(...galleryAssets.map((a) => a.sortOrder ?? 0)) + 1
        : 1;
      for (const file of files) {
        const result = await api.uploadImage(file, brandId, variantId);
        addAsset(makeAsset(result, "gallery", nextOrder++));
      }
      addToast(`${files.length} gallery image${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  }

  async function handleDelete(asset) {
    try {
      if (asset.filePath) await api.deleteImage(asset.filePath);
      removeAsset(asset.id);
      // Re-sequence gallery after deletion
      if (asset.imageType !== "hero" && asset.imageType !== "main") {
        const remaining = galleryAssets
          .filter((a) => a.id !== asset.id)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        remaining.forEach((a, i) => updateAsset(a.id, { sortOrder: i + 1 }));
      }
      addToast("Image removed");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Hero Image ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#7aa3f5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          Hero Image
        </div>
        <input type="file" ref={heroRef} accept="image/*" onChange={handleHeroUpload} style={{ display: "none" }} />
        {heroAsset ? (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 200, height: 150, borderRadius: 10, overflow: "hidden", background: "rgba(9,13,20,0.8)", border: "1px solid rgba(117,163,255,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {imgUrl(heroAsset)
                ? <img src={imgUrl(heroAsset)} alt="Hero" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ color: "rgba(180,200,240,0.3)", fontSize: 32 }}>▦</span>
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, color: "rgba(180,200,240,0.5)" }}>{heroAsset.fileName}</div>
              <input
                type="text"
                value={heroAsset.altText || ""}
                onChange={(e) => updateAsset(heroAsset.id, { altText: e.target.value })}
                placeholder="Alt text…"
                className="field-input"
                style={{ fontSize: 12, width: 240 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => heroRef.current?.click()}
                  disabled={uploadingHero}
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  {uploadingHero ? "Uploading…" : "Replace"}
                </button>
                <button onClick={() => handleDelete(heroAsset)} className="btn-danger" style={{ fontSize: 12, padding: "6px 12px" }}>✕ Remove</button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => heroRef.current?.click()}
            disabled={uploadingHero}
            style={{
              width: "100%", padding: "32px 20px", borderRadius: 12, cursor: "pointer",
              background: "rgba(76,117,219,0.05)", border: "2px dashed rgba(117,163,255,0.25)",
              color: "rgba(117,163,255,0.7)", fontSize: 14, fontWeight: 600,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 28 }}>+</span>
            {uploadingHero ? "Uploading…" : "Upload Hero Image"}
            <span style={{ fontSize: 11, color: "rgba(180,200,240,0.4)", fontWeight: 400 }}>The main product image shown on cards and at the top of the product page</span>
          </button>
        )}
      </div>

      {/* ── Gallery Images ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7aa3f5", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Gallery Images {galleryAssets.length > 0 && <span style={{ color: "rgba(180,200,240,0.4)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({galleryAssets.length})</span>}
          </div>
          <input type="file" ref={galleryRef} accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: "none" }} />
          <button
            onClick={() => galleryRef.current?.click()}
            disabled={uploadingGallery}
            className="btn-primary"
            style={{ fontSize: 12, padding: "7px 16px", opacity: uploadingGallery ? 0.6 : 1 }}
          >
            {uploadingGallery ? "Uploading…" : "+ Add Photos"}
          </button>
        </div>

        {galleryAssets.length === 0 ? (
          <div style={{ color: "rgba(180,200,240,0.4)", fontSize: 13, textAlign: "center", padding: "24px 0", border: "1px dashed rgba(117,163,255,0.15)", borderRadius: 10 }}>
            No gallery photos yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {galleryAssets.map((asset, index) => {
              const url = imgUrl(asset);
              return (
                <div key={asset.id} style={{ background: "rgba(9,13,20,0.8)", border: "1px solid rgba(117,163,255,0.14)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ background: "rgba(9,13,20,0.9)", height: 130, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {url
                        ? <img src={url} alt={asset.altText || asset.fileName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <span style={{ color: "rgba(180,200,240,0.3)", fontSize: 28 }}>▦</span>
                      }
                    </div>
                    <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.7)", borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                      #{index + 1}
                    </div>
                    <button
                      onClick={() => handleDelete(asset)}
                      style={{ position: "absolute", top: 6, right: 6, background: "rgba(248,81,73,0.85)", border: "none", borderRadius: 5, width: 24, height: 24, cursor: "pointer", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <input
                      type="text"
                      value={asset.altText || ""}
                      onChange={(e) => updateAsset(asset.id, { altText: e.target.value })}
                      placeholder="Alt text…"
                      className="field-input"
                      style={{ fontSize: 11, width: "100%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Colors section ───────────────────────────────────────────────────────────

function ColorsSection({ variantId, brandId, colors, variantColors, assets, addColor, addVariantColor, removeColor, removeVariantColor, addAsset, removeAsset, assetBaseUrl }) {
  const { addToast } = useToastStore();
  const productVCs = variantColors.filter((vc) => vc.variantId === variantId);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#8B4513");
  const fileRefs = useRef({});

  function handleAddColor() {
    const name = newName.trim();
    if (!name) return;
    const colorId = `${variantId}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
    addColor({ id: colorId, name, hex: newHex, isActive: true });
    addVariantColor({
      id: `vc_${variantId}_${colorId}_${Date.now()}`,
      variantId,
      colorId,
      isDefault: productVCs.length === 0,
      sortOrder: productVCs.length + 1,
      isActive: true,
    });
    setNewName("");
    setNewHex("#8B4513");
    setAdding(false);
  }

  async function handleUpload(e, colorId) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      for (const file of files) {
        const result = await api.uploadImage(file, brandId, variantId);
        addAsset({
          id: `${variantId}_${colorId}_${Date.now()}`,
          entityType: "variant",
          entityId: variantId,
          variantId,
          brandId: brandId || "",
          colorId,
          familyId: "",
          imageType: "gallery",
          fileName: result.filename,
          filePath: result.filePath,
          sourceUrl: "",
          sourcePage: "",
          altText: "",
          sortOrder: 0,
          isActive: true,
        });
      }
      addToast(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      e.target.value = "";
    }
  }

  async function handleDeleteAsset(asset) {
    try {
      if (asset.filePath) await api.deleteImage(asset.filePath);
      removeAsset(asset.id);
      addToast("Image removed");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  function handleRemoveColor(vc) {
    removeVariantColor(vc.id);
    removeColor(vc.colorId);
  }

  const base = assetBaseUrl || "https://bbqcompareassets.brcreated.app/assets";
  function imgUrl(asset) {
    if (asset.url) return asset.url;
    const fp = asset.filePath || asset.file_path || "";
    return fp ? `${base}/${fp}` : null;
  }

  return (
    <div>
      {productVCs.length === 0 && !adding && (
        <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 13, marginBottom: 16 }}>
          No color variants yet. Add one to upload color-specific photos.
        </div>
      )}

      {productVCs.map((vc) => {
        const color = colors.find((c) => c.id === vc.colorId);
        if (!color) return null;
        const colorAssets = assets.filter(
          (a) => (a.variantId === variantId || a.entityId === variantId) && a.colorId === vc.colorId
        );
        return (
          <div key={vc.id} style={{ marginBottom: 20, border: "1px solid rgba(117,163,255,0.14)", borderRadius: 12, overflow: "hidden" }}>
            {/* Color header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(9,13,20,0.6)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: color.hex, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#e7edf7", flex: 1 }}>{color.name}</span>
              <span style={{ fontSize: 11, color: "rgba(180,200,240,0.4)" }}>{color.hex}</span>
              <input
                type="file"
                ref={(el) => { fileRefs.current[vc.colorId] = el; }}
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e, vc.colorId)}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileRefs.current[vc.colorId]?.click()}
                className="btn-ghost"
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                + Photos
              </button>
              <button
                onClick={() => handleRemoveColor(vc)}
                style={{ background: "none", border: "none", color: "rgba(248,81,73,0.7)", fontSize: 16, cursor: "pointer", padding: "2px 6px" }}
                title="Remove this color"
              >
                ✕
              </button>
            </div>

            {/* Color photos */}
            {colorAssets.length > 0 ? (
              <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                {colorAssets.map((asset) => {
                  const url = imgUrl(asset);
                  return (
                    <div key={asset.id} style={{ position: "relative", width: 100, height: 100, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(117,163,255,0.1)" }}>
                      {url ? (
                        <img src={url} alt={asset.altText || asset.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "rgba(9,13,20,0.8)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(180,200,240,0.3)", fontSize: 24 }}>▦</div>
                      )}
                      <button
                        onClick={() => handleDeleteAsset(asset)}
                        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 5, background: "rgba(0,0,0,0.7)", border: "none", color: "#f85149", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "12px 16px", color: "rgba(180,200,240,0.4)", fontSize: 12 }}>
                No photos yet — click "+ Photos" to upload.
              </div>
            )}
          </div>
        );
      })}

      {/* Add color form */}
      {adding ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "1px solid rgba(76,117,219,0.3)", borderRadius: 10, background: "rgba(76,117,219,0.06)" }}>
          <input
            type="color"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", padding: 2, background: "transparent" }}
          />
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddColor(); if (e.key === "Escape") setAdding(false); }}
            placeholder="Color name (e.g. Matte Black)"
            className="field-input"
            style={{ fontSize: 13, flex: 1 }}
          />
          <button onClick={handleAddColor} className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>Add</button>
          <button onClick={() => setAdding(false)} className="btn-ghost" style={{ fontSize: 13, padding: "8px 12px" }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-ghost" style={{ fontSize: 13, padding: "9px 18px" }}>
          + Add Color Variant
        </button>
      )}
    </div>
  );
}

// ── Key spec definitions (synced to spec records on save) ────────────────────

const KEY_SPEC_DEFS = [
  { key: "min_temp",          label: "Minimum Temperature", unit: "°F",    group: "Temperature",  variantField: "temperatureRangeMin" },
  { key: "max_temp",          label: "Maximum Temperature", unit: "°F",    group: "Temperature",  variantField: "temperatureRangeMax" },
  { key: "cooking_space",     label: "Cooking Space",       unit: "sq in", group: "Cooking Area", variantField: "primaryCookingArea" },
  { key: "overall_width",     label: "Width",               unit: "in",    group: "Dimensions",   variantField: "productWidth" },
  { key: "overall_depth",     label: "Depth",               unit: "in",    group: "Dimensions",   variantField: "productDepth" },
  { key: "overall_height",    label: "Height",              unit: "in",    group: "Dimensions",   variantField: "productHeight" },
  { key: "grate_count",       label: "Number of Grates",    unit: "",      group: "Cooking Area", variantField: "grateLevels" },
  { key: "grate_material",    label: "Grate Material",      unit: "",      group: "Construction", variantField: "grateMaterial" },
  { key: "side_burner",              label: "Side Burner",                  unit: "", group: "Features", variantField: "sideBurner" },
  { key: "rear_infrared_rotisserie", label: "Rear Infrared Rotisserie",     unit: "", group: "Features", variantField: "rearInfraredRotisserie" },
  { key: "body_material",            label: "Body Material",                unit: "", group: "Construction", variantField: "bodyMaterial" },
  { key: "country_of_origin", label: "Made In",             unit: "",      group: "Construction", variantField: "madeIn" },
];

// ── BLANK_VARIANT ─────────────────────────────────────────────────────────────

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
  wifiEnabled: false, rotisserieCompatible: false, directFlameAccess: false, sideBurner: false, rearInfraredRotisserie: false,
  builtInCompatible: false, freestandingCompatible: true, supportsBuiltIn: false, supportsFreestanding: true,
  optionalBaseSupported: false, compatibleBase: "", burnerCount: null, heatZones: null,
  pelletHopperCapacity: null, supportsPropane: false, supportsNaturalGas: false,
  supportsCharcoal: false, supportsPellet: false, supportsWood: false,
  fuelConversionSupported: false, compatibleConversionKit: "",
  price: null, msrp: null, mapPrice: null, salePrice: null, priceSource: "",
  shopifyProductId: "", shopifyVariantId: "", shopifyHandle: "",
  dataSource: "", lastUpdatedAt: "", status: "active", sortOrder: null, isActive: true,
  grateMaterial: "", bodyMaterial: "", madeIn: "", gasPricingMode: "", propanePrice: null, naturalGasPrice: null,
  askForPricing: false, productType: "",
};

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const {
    brands, families, variants, specs, assets, colors, variantColors, assetBaseUrl,
    loading, loadAll, addVariant, updateVariant,
    addFamily,
    addSpec, updateSpec, removeSpec,
    addAsset, updateAsset, removeAsset,
    addColor, removeColor,
    addVariantColor, removeVariantColor,
    saveDataset,
  } = useDataStore();
  const { addToast } = useToastStore();

  const existing = variants.find((v) => v.id === id);
  const [form, setForm] = useState(null);
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
      setForm({ ...BLANK_VARIANT, ...existing, _isExisting: true });
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

  function syncKeySpecs(variantId, data) {
    KEY_SPEC_DEFS.forEach((def, i) => {
      const rawValue = data[def.variantField];
      if (rawValue === null || rawValue === undefined || rawValue === "") return;
      const value = String(rawValue);
      const existing = specs.find(
        (s) => (s.entityId === variantId || s.variantId === variantId) && s.key === def.key
      );
      if (existing) {
        updateSpec(existing.id, { ...existing, value, isActive: true });
      } else {
        addSpec({
          id: `spec_${def.key}_${variantId}`,
          entityType: "variant",
          entityId: variantId,
          variantId,
          key: def.key,
          label: def.label,
          value,
          unit: def.unit,
          group: def.group,
          sortOrder: i + 1,
          isActive: true,
        });
      }
    });
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const { _isExisting, ...data } = form;

      // Resolve price for dual-gas-different mode
      if (data.supportsPropane && data.supportsNaturalGas && data.gasPricingMode === "different") {
        if (!data.price && data.propanePrice) data.price = data.propanePrice;
      }

      if (isNew) {
        if (!data.id) { addToast("Product ID is required", "error"); setSaving(false); return; }
        if (variants.find((v) => v.id === data.id)) { addToast("Product ID already exists", "error"); setSaving(false); return; }
        addVariant(data);
        syncKeySpecs(data.id, data);
      } else {
        updateVariant(data.id, data);
        syncKeySpecs(data.id, data);
      }

      await saveDataset("variants");
      await saveDataset("specs");
      await saveDataset("assets");
      await saveDataset("colors");
      await saveDataset("variantColors");
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

  if (loading || !form) {
    return <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14 }}>Loading…</div>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "rgba(180,200,240,0.6)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 8 }}>
            ← Back
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
          {saving ? "Saving…" : "Save Product"}
        </button>
      </div>

      {/* Lock banners */}
      {isLocked && (
        <div style={{ background: "rgba(240,136,62,0.1)", border: "1px solid rgba(240,136,62,0.35)", borderRadius: 9, padding: "11px 16px", fontSize: 13, color: "#f0883e", display: "flex", alignItems: "center", gap: 8 }}>
          <span>🔒</span>
          <span><strong>{lockStatus.lockedBy}</strong> is currently editing this product. Saving is disabled until they finish.</span>
        </div>
      )}
      {lockStatus === "acquired" && !isNew && (
        <div style={{ background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.25)", borderRadius: 9, padding: "9px 16px", fontSize: 12, color: "#3fb950", display: "flex", alignItems: "center", gap: 8 }}>
          <span>✓</span> You have this product locked for editing.
        </div>
      )}

      {/* Two-column main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "grid", gap: 20 }}>
          <SectionCard title="Basic Info">
            <BasicInfoSection
              form={form}
              setForm={setForm}
              brands={brands}
              families={families}
              onCreateFamily={(family) => { addFamily(family); saveDataset("families"); }}
            />
          </SectionCard>

          <SectionCard title="Key Specs">
            <KeySpecsSection form={form} setForm={setForm} />
          </SectionCard>
        </div>

        {/* Right column */}
        <div style={{ display: "grid", gap: 20 }}>
          <SectionCard title="Fuel & Installation">
            <FuelInstallSection form={form} setForm={setForm} />
          </SectionCard>

          <SectionCard title="Pricing">
            <PricingSection form={form} setForm={setForm} />
          </SectionCard>
        </div>
      </div>

      {/* Full-width: Photos */}
      <SectionCard title="Photos">
        {isNew ? (
          <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            Save the product first, then come back to add photos.
          </div>
        ) : (
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
      </SectionCard>

      {/* Full-width: Color Variants */}
      <SectionCard title="Color Variants">
        {isNew ? (
          <div style={{ color: "rgba(180,200,240,0.5)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            Save the product first, then add color variants and photos.
          </div>
        ) : (
          <ColorsSection
            variantId={id}
            brandId={form.brandId}
            colors={colors}
            variantColors={variantColors}
            assets={assets}
            addColor={addColor}
            addVariantColor={addVariantColor}
            removeColor={removeColor}
            removeVariantColor={removeVariantColor}
            addAsset={addAsset}
            removeAsset={removeAsset}
            assetBaseUrl={assetBaseUrl}
          />
        )}
      </SectionCard>

      {/* Full-width: Advanced (collapsible) */}
      <Collapsible title="Advanced">
        <AdvancedSection form={form} setForm={setForm} />
        {!isNew && (
          <>
            <SectionHeader title="All Specs" />
            <SpecsTab
              variantId={id}
              specs={specs}
              addSpec={addSpec}
              updateSpec={updateSpec}
              removeSpec={removeSpec}
            />
          </>
        )}
      </Collapsible>

      {/* Bottom save button */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving || isLocked}
          className="btn-primary"
          style={{ opacity: (saving || isLocked) ? 0.5 : 1, cursor: (saving || isLocked) ? "not-allowed" : "pointer", padding: "12px 32px", fontSize: 15 }}
        >
          {saving ? "Saving…" : "Save Product"}
        </button>
      </div>
    </div>
  );
}
