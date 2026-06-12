import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";
import BrandResults from "./BrandResults";
import { getBrandNavigator, buildBreadcrumb } from "../config/brandNavigators";

const ASSET_BASE = import.meta.env.VITE_ASSET_BASE_URL || "";

function nid(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function resolveAsset(fp) {
  if (!fp) return "";
  if (/^https?:\/\//i.test(fp)) return fp;
  const base = ASSET_BASE.replace(/\/+$/, "");
  return base ? `${base}/${fp.replace(/^\/+/, "")}` : `/${fp.replace(/^\/+/, "")}`;
}

// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({ option, logoUrl, layout, onClick }) {
  const [hovered, setHovered] = useState(false);

  const isLogo = layout === "logos";

  const base = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: isLogo ? "flex-start" : "center",
    gap: isLogo ? 14 : 16,
    padding: isLogo ? "28px 20px 20px" : "44px 32px",
    borderRadius: 24,
    border: `1px solid ${hovered ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.1)"}`,
    background: hovered
      ? "linear-gradient(145deg, rgba(245,158,11,0.12) 0%, rgba(255,255,255,0.04) 100%)"
      : "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 100%)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: hovered ? "0 8px 32px rgba(245,158,11,0.12)" : "0 4px 20px rgba(0,0,0,0.2)",
    cursor: "pointer",
    transition: "border-color 0.18s, background 0.18s, box-shadow 0.18s",
    minHeight: isLogo ? 160 : 200,
    textAlign: "center",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={base}
    >
      {isLogo ? (
        <>
          <div style={{ width: "100%", height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {logoUrl ? (
              <img src={logoUrl} alt={option.label} style={{ maxHeight: 72, maxWidth: "90%", objectFit: "contain" }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 14,
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, color: "rgba(245,158,11,0.8)",
              }}>
                {option.icon || "◆"}
              </div>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: hovered ? "#f5c06a" : "#e8edf5", lineHeight: 1.2 }}>
            {option.label}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 52, lineHeight: 1 }}>{option.icon || "▶"}</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: hovered ? "#f5c06a" : "#ffffff", letterSpacing: "-0.02em", marginBottom: option.description ? 6 : 0 }}>
              {option.label}
            </div>
            {option.description && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                {option.description}
              </div>
            )}
          </div>
        </>
      )}
    </button>
  );
}

// ── Main navigator ────────────────────────────────────────────────────────────

export default function BrandNavigatorPage() {
  // All hooks must be called unconditionally before any early returns
  const { brandSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { brands, families, variants, assets } = useCatalog();

  const brandId = nid(brandSlug);
  const config = getBrandNavigator(brandSlug);

  const brand = useMemo(() => (
    brands.find((b) =>
      nid(b.id || b.brandId || b.brand_id) === brandId ||
      nid(b.slug || b.brandSlug || b.brand_slug) === brandId ||
      nid(b.name) === brandId
    ) || null
  ), [brands, brandId]);

  const brandLogo = useMemo(() => {
    if (!brand) return "";
    const direct = brand.logoUrl || brand.logo_url || brand.brandLogoUrl || brand.brand_logo_url;
    if (direct) return direct;
    const logAsset = assets.find((a) => {
      const et = a.entityType || a.entity_type;
      const eid = a.entityId || a.entity_id;
      const type = a.imageType || a.image_type;
      return et === "brand" && eid === (brand.id || brand.brandId) &&
        ["logo", "brand-logo", "brand_logo"].includes(type);
    });
    return logAsset ? resolveAsset(logAsset.filePath || logAsset.file_path) : "";
  }, [brand, assets]);

  const params = Object.fromEntries(searchParams);
  const currentStep = config ? config.getNextStep(params) : null;

  // For "dynamic_families" steps: derive the option list live from catalog variants.
  // This means adding a new product in admin automatically makes it appear here.
  const dynamicFamilyOptions = useMemo(() => {
    if (!currentStep || currentStep.type !== "dynamic_families" || !brand) return null;

    const brandActualId = brand.id || brand.brandId || brand.brand_id;

    let matching = variants.filter((v) => {
      const vBrand = v.brandId || v.brand_id;
      return vBrand === brandActualId && v.isActive !== false;
    });

    // Filter by fuel — handle both old field names (supportsLP) and new (supportsPropane)
    if (currentStep.fuelFilter) {
      const ff = nid(currentStep.fuelFilter);
      matching = matching.filter((v) => {
        const ft = nid(v.fuelType || v.fuel_type || v.fuel || "");
        if (ff === "gas") {
          return v.supportsPropane || v.supportsNaturalGas ||
                 v.supportsLP || v.supportsLp || v.supports_lp ||
                 ft.includes("gas") || ft === "propane" || ft === "lp";
        }
        if (ff === "charcoal") return !!v.supportsCharcoal || ft.includes("charcoal");
        if (ff === "pellet")   return !!v.supportsPellet   || ft.includes("pellet");
        return true;
      });
    }

    // Filter by install type — handle old (installType string) and new (boolean flags)
    if (currentStep.installFilter) {
      const inst = nid(currentStep.installFilter);
      matching = matching.filter((v) => {
        const it = nid(v.installType || v.install_type || "");
        if (inst === "freestanding") {
          return !!v.supportsFreestanding || it === "freestanding" || it === "both";
        }
        if (inst === "built_in") {
          return !!v.supportsBuiltIn || it === "built_in" || it === "both";
        }
        return true;
      });
    }

    // Get unique familyIds and look up names
    const seen = new Set();
    const options = [];
    for (const v of matching) {
      const fid = v.familyId || v.family_id;
      if (!fid || seen.has(fid)) continue;
      seen.add(fid);
      const fam = families.find((f) => (f.id || f.familyId || f.family_id) === fid);
      options.push({
        value: fid,
        label: fam?.name || fid,
        familyMatch: fid,
      });
    }

    // Sort alphabetically by label
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [currentStep, brand, variants, families]);

  // Use dynamically computed options for dynamic_families, otherwise use step's static options
  const resolvedOptions = currentStep?.type === "dynamic_families"
    ? (dynamicFamilyOptions ?? [])
    : (currentStep?.options ?? []);

  // Build logo map for logo-layout steps
  const familyLogoMap = useMemo(() => {
    if (!currentStep || currentStep.layout !== "logos") return {};
    const map = {};
    for (const opt of resolvedOptions) {
      const match = nid(opt.familyMatch || opt.value);
      const family = families.find((f) => {
        const fid = nid(f.id || f.familyId || f.family_id);
        const slug = nid(f.slug || f.familySlug || f.name);
        return fid === match || slug === match || fid.includes(match) || slug.includes(match);
      });
      if (!family) continue;
      const fid = family.id || family.familyId || family.family_id;
      const fa = assets.find((a) => {
        const et = a.entityType || a.entity_type;
        const eid = a.entityId || a.entity_id;
        return et === "family" && eid === fid &&
          ["logo", "hero", "main"].includes(a.imageType || a.image_type || "");
      });
      if (fa) map[opt.value] = resolveAsset(fa.filePath || fa.file_path);
    }
    return map;
  }, [currentStep, resolvedOptions, families, assets]);

  const crumbs = config ? buildBreadcrumb(config, params) : [];

  function handleSelect(option) {
    const next = new URLSearchParams(searchParams);
    next.set(currentStep.param, option.value);
    navigate(`/brand/${brandSlug}?${next.toString()}`);
  }

  // Early returns AFTER all hooks
  if (!config) return <BrandResults />;
  if (!currentStep) return <BrandResults />;

  // If dynamic step has no matching products, skip straight to results
  if (currentStep.type === "dynamic_families" && dynamicFamilyOptions !== null && dynamicFamilyOptions.length === 0) {
    return <BrandResults />;
  }

  const cols = currentStep.layout === "logos"
    ? Math.min(resolvedOptions.length, 3)
    : Math.min(resolvedOptions.length, 2);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #070a11 0%, #0e1423 100%)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Brand name + breadcrumb */}
      <div style={{ padding: "56px 40px 0", textAlign: "center" }}>
        {crumbs.length > 0 && (
          <div style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            {(brand?.name || brandSlug).toUpperCase()}
            {crumbs.map((c, i) => (
              <span key={i}><span style={{ margin: "0 8px", opacity: 0.4 }}>›</span>{c}</span>
            ))}
          </div>
        )}

        <h1 style={{
          fontSize: 38,
          fontWeight: 800,
          color: "#ffffff",
          margin: 0,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
        }}>
          {currentStep.question}
        </h1>
      </div>

      {/* Options */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "52px 40px 60px",
      }}>
        {resolvedOptions.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Loading…</div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 20,
            maxWidth: currentStep.layout === "logos" ? 940 : 680,
            width: "100%",
          }}>
            {resolvedOptions.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                layout={currentStep.layout}
                logoUrl={familyLogoMap[option.value]}
                onClick={() => handleSelect(option)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
