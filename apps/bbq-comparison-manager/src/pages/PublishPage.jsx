import { useState } from "react";
import { useDataStore, useToastStore } from "../store/dataStore";

const DATASET_LABELS = {
  brands: "Brands",
  families: "Families",
  variants: "Products",
  specs: "Specs",
  assets: "Images",
  colors: "Colors",
  variantColors: "Variant Colors",
};

export default function PublishPage() {
  const { brands, families, variants, specs, assets, colors, variantColors, dirtyDatasets, lastPublishedAt, publish, saveAll } = useDataStore();
  const { addToast } = useToastStore();
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  const counts = { brands: brands.length, families: families.length, variants: variants.length, specs: specs.length, assets: assets.length, colors: colors.length, variantColors: variantColors.length };

  async function handleSaveAll() {
    setSaving(true);
    try {
      await saveAll();
      addToast("All changes saved locally");
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishResult(null);
    try {
      const result = await publish();
      setPublishResult(result);
      addToast(`Published ${result.published?.length ?? 0} datasets to R2`);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Publish</h1>
        <p style={{ color: "#8b949e", marginTop: 6, fontSize: 14 }}>
          Save changes locally and push to Cloudflare R2 to update the live site.
        </p>
      </div>

      {/* Status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {Object.entries(DATASET_LABELS).map(([key, label]) => {
          const isDirty = dirtyDatasets.has(key);
          return (
            <div key={key} style={{
              background: "#161b22",
              border: `1px solid ${isDirty ? "rgba(240,136,62,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#e6edf3" }}>{counts[key]}</div>
              <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>{label}</div>
              {isDirty && (
                <div style={{ fontSize: 11, color: "#f0883e", marginTop: 6, fontWeight: 600 }}>Unsaved changes</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Last published */}
      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 22px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Status
        </div>
        <div style={{ fontSize: 14, color: "#e6edf3", display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <span style={{ color: "#8b949e" }}>Last published this session: </span>
            {lastPublishedAt ? new Date(lastPublishedAt).toLocaleString() : "Not yet"}
          </div>
          <div>
            <span style={{ color: "#8b949e" }}>Unsaved datasets: </span>
            {dirtyDatasets.size === 0 ? (
              <span style={{ color: "#3fb950", fontWeight: 600 }}>All saved</span>
            ) : (
              <span style={{ color: "#f0883e", fontWeight: 600 }}>
                {[...dirtyDatasets].map((d) => DATASET_LABELS[d] || d).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <button
          onClick={handleSaveAll}
          disabled={saving || dirtyDatasets.size === 0}
          style={{
            padding: "12px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent", color: dirtyDatasets.size > 0 ? "#e6edf3" : "#8b949e",
            fontSize: 14, fontWeight: 600, cursor: dirtyDatasets.size > 0 && !saving ? "pointer" : "not-allowed",
            opacity: dirtyDatasets.size === 0 ? 0.5 : 1,
          }}
        >
          {saving ? "Saving…" : "Save Local Changes"}
        </button>

        <button
          onClick={handlePublish}
          disabled={publishing}
          style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: publishing ? "rgba(76,117,219,0.5)" : "#4c75db",
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: publishing ? "not-allowed" : "pointer",
            boxShadow: "0 4px 18px rgba(76,117,219,0.3)",
          }}
        >
          {publishing ? "Publishing…" : "↑ Publish to Live Site"}
        </button>
      </div>

      {/* Publish result */}
      {publishResult && (
        <div style={{ background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.3)", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#3fb950", marginBottom: 8 }}>
            ✓ Published successfully
          </div>
          <div style={{ fontSize: 13, color: "#e6edf3" }}>
            Uploaded: {publishResult.published?.map((d) => DATASET_LABELS[d] || d).join(", ")}
          </div>
          {publishResult.errors?.length > 0 && (
            <div style={{ fontSize: 13, color: "#f85149", marginTop: 6 }}>
              Errors: {publishResult.errors.map((e) => `${e.dataset}: ${e.error}`).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{ marginTop: 32, background: "#161b22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 22px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>How it works</div>
        <ol style={{ color: "#8b949e", fontSize: 13, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>Make your edits on the Brands and Products pages.</li>
          <li>Changes are held in memory until you save — click <strong style={{ color: "#e6edf3" }}>Save Local Changes</strong> to write them to disk.</li>
          <li>Click <strong style={{ color: "#e6edf3" }}>Publish to Live Site</strong> to upload all JSON files to Cloudflare R2.</li>
          <li>The live site will reflect your changes immediately (no cache, no rebuild needed).</li>
        </ol>
      </div>
    </div>
  );
}
