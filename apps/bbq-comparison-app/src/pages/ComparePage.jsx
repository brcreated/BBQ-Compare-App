// src/pages/ComparePage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  subscribe,
  getState,
  removeItem,
  clearAll,
} from "../state/comparisonStore";
import { useCatalog } from "../context/CatalogContext";
import useIdleReset from "../hooks/useIdleReset";

function formatPriceDisplay(value) {
  if (value === null || value === undefined) return "Request Pricing";

  const raw = String(value).trim();
  if (!raw) return "Request Pricing";

  // If it contains letters, keep the original text
  if (/[a-zA-Z]/.test(raw)) {
    return raw;
  }

  // Strip common formatting chars and try numeric conversion
  const numeric = Number(raw.replace(/[$,]/g, ""));
  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(numeric);
  }

  // Fallback: preserve original text
  return raw;
}
const PAGE_FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageShellStyle = {
  minHeight: "100%",
  height: "auto",
  position: "relative",
  overflowX: "hidden",
  overflowY: "visible",
  background:
    "radial-gradient(circle at 18% 14%, rgba(76, 110, 168, 0.10), transparent 28%), radial-gradient(circle at 82% 88%, rgba(76, 110, 168, 0.08), transparent 32%), linear-gradient(180deg, #0a0d12 0%, #0f141b 48%, #090c11 100%)",
  color: "#f3f7ff",
  fontFamily: PAGE_FONT,
};

const containerStyle = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: "none",
  margin: "0 auto",
  padding: "18px 28px 40px",
  boxSizing: "border-box",
};

const panelStyle = {
  position: "relative",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow:
    "0 28px 70px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255,255,255,0.05)",
  borderRadius: 28,
  backdropFilter: "blur(18px)",
  overflow: "visible",
};

const softButtonStyle = {
  border: "none",
  background: "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
  color: "#f7fbff",
  borderRadius: 18,
  padding: "0 22px",
  minHeight: 56,
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  boxShadow: "0 16px 34px rgba(67, 93, 131, 0.32)",
};

const primaryButtonStyle = {
  border: "none",
  background: "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
  color: "#f7fbff",
  borderRadius: 18,
  padding: "0 22px",
  minHeight: 56,
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  boxShadow: "0 16px 34px rgba(67, 93, 131, 0.32)",
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function cleanText(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return cleanText(value).replace(/\b\w/g, (char) => char.toUpperCase());
}

function prettifyBoolean(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "true") return "Yes";
  if (normalized === "false") return "No";

  return null;
}

function normalizeValueForDisplay(value) {
  if (value === null || value === undefined) return "";

  const raw = String(value).trim();
  if (!raw) return "";

  const booleanText = prettifyBoolean(raw);
  if (booleanText) return booleanText;

  const lower = raw.toLowerCase();

  if (lower === "yes") return "Yes";
  if (lower === "no") return "No";
  if (lower === "n/a" || lower === "na") return "N/A";

  let output = raw;

  output = output.replace(/\bsupports\s*lp\b/gi, "Supports Propane");
  output = output.replace(/\bsupports\s*ng\b/gi, "Supports Natural Gas");
  output = output.replace(/\blp\b/gi, "Propane");
  output = output.replace(/\bng\b/gi, "Natural Gas");

  if (/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i.test(output)) {
    output = titleCase(output);
  }

  if (/^[a-z\s]+$/i.test(output) && output === output.toLowerCase()) {
    output = titleCase(output);
  }

  output = output
    .replace(/\bPropane Gas\b/gi, "Propane")
    .replace(/\bNatural Gas Gas\b/gi, "Natural Gas")
    .replace(/\bBtu\b/g, "BTU")
    .replace(/\bWifi\b/g, "WiFi")
    .replace(/\bBuilt In\b/g, "Built-In");

  return output.trim();
}

function prettifyLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = titleCase(raw)
    .replace(/\bLp\b/g, "Propane")
    .replace(/\bNg\b/g, "Natural Gas")
    .replace(/\bSupports Propane\b/g, "Supports Propane")
    .replace(/\bSupports Natural Gas\b/g, "Supports Natural Gas")
    .replace(/\bBtu\b/g, "BTU")
    .replace(/\bWifi\b/g, "WiFi")
    .replace(/\bBuilt In\b/g, "Built-In");

  return normalized;
}

function toCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "Request Pricing";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function parseNumericValue(value) {
  if (value === null || value === undefined) return null;
  const match = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function formatSpecValue(spec) {
  if (!spec) return "—";
  if (spec.displayValue) {
    const value = normalizeValueForDisplay(spec.displayValue);
    return value || "—";
  }

  const rawValue =
    spec.value ??
    spec.specValue ??
    spec.spec_value ??
    spec.rawValue ??
    spec.raw_value ??
    "";

  const unit = String(spec.unit || spec.specUnit || spec.spec_unit || "").trim();
  const cleanValue = normalizeValueForDisplay(rawValue);

  if (!cleanValue && !unit) return "—";
  if (!unit) return cleanValue || "—";
  if (!cleanValue) return unit;

  return `${cleanValue} ${unit}`.trim();
}

function getVariantId(variant) {
  return (
    variant?.id ||
    variant?.variantId ||
    variant?.variant_id ||
    variant?.slug ||
    variant?.productId ||
    ""
  );
}

function getVariantSlug(variant) {
  return variant?.slug || variant?.id || "";
}

function getVariantName(variant) {
  return variant?.name || variant?.variantName || variant?.variant_name || "";
}

function getBrandName(variant, brandsById) {
  const brandId = normalizeText(variant?.brandId || variant?.brand_id || "");
  return brandsById.get(brandId)?.name || titleCase(brandId) || "";
}

function getVariantPrice(variant, specsForVariant = []) {
  const direct =
    variant?.salePrice ??
    variant?.sale_price ??
    variant?.price ??
    variant?.mapPrice ??
    variant?.map_price ??
    variant?.msrp;

  if (direct !== null && direct !== undefined && String(direct).trim() !== "") {
    return direct;
  }

  const priceSpec = specsForVariant.find((spec) => {
    const key = String(spec.key || spec.specKey || spec.spec_key || "")
      .trim()
      .toLowerCase();

    return ["price", "sale_price", "map_price", "msrp", "starting_price"].includes(key);
  });

  if (!priceSpec) return "";

  return priceSpec.value ?? priceSpec.specValue ?? priceSpec.spec_value ?? "";
}

function getAssetUrl(asset) {
  if (!asset) return "";

  if (asset.url) return asset.url;
  if (asset.imageUrl) return asset.imageUrl;
  if (asset.sourceUrl) return asset.sourceUrl;
  if (asset.source_url) return asset.source_url;

  const base = String(import.meta.env.VITE_ASSET_BASE_URL || "").replace(
    /\/$/,
    ""
  );
  const filePath = String(asset.filePath || asset.file_path || "").replace(
    /^\//,
    ""
  );

  if (!filePath) return "";
  if (!base) return `/${filePath}`;

  return `${base}/${filePath}`;
}

function getHeroAsset(variantId, assets = []) {
  const normalizedId = normalizeText(variantId);

  const candidates = assets
    .filter((asset) => {
      const entityType = String(
        asset.entityType || asset.entity_type || ""
      ).toLowerCase();
      const entityId = normalizeText(asset.entityId || asset.entity_id || "");
      return entityType === "variant" && entityId === normalizedId;
    })
    .sort((a, b) => {
      const aOrder = Number(a.sortOrder ?? a.sort_order ?? 9999);
      const bOrder = Number(b.sortOrder ?? b.sort_order ?? 9999);
      return aOrder - bOrder;
    });

  const hero =
    candidates.find((asset) => {
      const imageType = String(
        asset.imageType || asset.image_type || ""
      ).toLowerCase();
      return ["hero", "main", "primary", "gallery-1", "gallery_1"].includes(
        imageType
      );
    }) || candidates[0];

  return hero || null;
}

function buildSpecsByVariant(specs = []) {
  const map = new Map();

  specs.forEach((spec) => {
    const entityType = String(
      spec.entityType || spec.entity_type || ""
    ).toLowerCase();
    if (entityType !== "variant") return;

    const entityId = normalizeText(
      spec.entityId ||
        spec.entity_id ||
        spec.variantId ||
        spec.variant_id ||
        ""
    );
    if (!entityId) return;

    if (!map.has(entityId)) {
      map.set(entityId, []);
    }

    map.get(entityId).push(spec);
  });

  return map;
}

function buildSpecGroupsForProducts(products) {
  const labelMap = new Map();

  products.forEach((product) => {
    product.specs.forEach((spec) => {
      const rawKey = String(
        spec.key || spec.specKey || spec.spec_key || spec.label || ""
      ).trim();
      if (!rawKey) return;

      const normalizedKey = normalizeText(rawKey);
      const group =
        spec.group ||
        spec.specGroup ||
        spec.spec_group ||
        "Highlights";
      const label =
        spec.label ||
        spec.specLabel ||
        spec.spec_label ||
        rawKey;

      if (!labelMap.has(normalizedKey)) {
        labelMap.set(normalizedKey, {
          key: normalizedKey,
          rawKey,
          label: prettifyLabel(label),
          group: prettifyLabel(group),
        });
      }
    });
  });

  const groups = new Map();

  Array.from(labelMap.values()).forEach((entry) => {
    if (!groups.has(entry.group)) {
      groups.set(entry.group, []);
    }
    groups.get(entry.group).push(entry);
  });

  const preferredOrder = [
    "Highlights",
    "Cooking",
    "Performance",
    "Size",
    "Capacity",
    "Build",
    "Features",
    "Installation",
    "Fuel",
    "Details",
  ];

  return Array.from(groups.entries())
    .map(([groupName, specs]) => ({
      groupName,
      specs: specs.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.groupName);
      const bIndex = preferredOrder.indexOf(b.groupName);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      }
      return a.groupName.localeCompare(b.groupName);
    });
}

function getSpecForProduct(product, specKey) {
  return (
    product.specs.find((spec) => {
      const key = String(
        spec.key || spec.specKey || spec.spec_key || spec.label || ""
      ).trim();
      return normalizeText(key) === specKey;
    }) || null
  );
}

function normalizeComparableValue(value) {
  const formatted = normalizeValueForDisplay(value);
  if (!formatted) return "";

  return formatted.trim().toLowerCase();
}

function getComparableSpecValue(spec) {
  if (!spec) return "";

  const rawValue =
    spec.displayValue ??
    spec.value ??
    spec.specValue ??
    spec.spec_value ??
    spec.rawValue ??
    spec.raw_value ??
    "";

  const unit = String(spec.unit || spec.specUnit || spec.spec_unit || "").trim();
  const normalizedValue = normalizeComparableValue(rawValue);

  if (!normalizedValue && !unit) return "";
  if (!unit) return normalizedValue;

  return `${normalizedValue} ${unit.trim().toLowerCase()}`.trim();
}

function areValuesDifferent(values) {
  const normalized = values
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  if (normalized.length <= 1) return false;

  return new Set(normalized).size > 1;
}

function CompareHeaderCard({ product, onOpen }) {
  return (
    <div
      className="compare-header-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      style={{
        ...panelStyle,
        display: "flex",
        flexDirection: "column",
        minHeight: 470,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 290,
          background:
            "radial-gradient(circle at top center, rgba(76, 110, 168, 0.12), transparent 52%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(9,14,24,0.92))",
          display: "grid",
          placeItems: "center",
          padding: 28,
          borderBottom: "1px solid rgba(117, 163, 255, 0.12)",
        }}
      >
        {product.heroUrl ? (
          <img
            src={product.heroUrl}
            alt={product.name}
            style={{
              maxWidth: "100%",
              maxHeight: 240,
              objectFit: "contain",
              filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.34))",
            }}
          />
        ) : (
          <div
            style={{
              color: "rgba(215,225,255,0.6)",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            No image available
          </div>
        )}
      </div>

      <div
        style={{
          padding: 24,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#8ea8e8",
            fontWeight: 900,
          }}
        >
          {product.brand}
        </div>

        <div
          style={{
            fontSize: 20,
            lineHeight: 1.16,
            fontWeight: 800,
            color: "#f6f8ff",
            letterSpacing: "-0.03em",
            minHeight: 48,
          }}
        >
          {product.name}
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#9ec0ff",
          }}
        >
          {product.priceLabel}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#eef5ff",
            marginTop: 2,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          View Product
        </div>
      </div>
    </div>
  );
}

function CompareRemoveCard({ onRemove }) {
  return (
    <button
      onClick={onRemove}
      className="compare-action-button"
      style={{
        ...softButtonStyle,
        width: "100%",
        minHeight: 58,
      }}
    >
      Remove
    </button>
  );
}

export default function ComparePage() {
  const navigate = useNavigate();

  useIdleReset(60000, 5000, () => {
    clearAll();
    navigate("/", { replace: true });
  });

  const { brands, variants, specs, assets, loading, error } = useCatalog();

  const [compareIds, setCompareIds] = useState(getState().items || []);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    document.body.classList.add("compare-page-active");
    return () => {
      document.body.classList.remove("compare-page-active");
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe((nextState) => {
      setCompareIds(nextState.items || []);
    });

    return unsubscribe;
  }, []);

  const brandsById = useMemo(() => {
    const map = new Map();
    (brands || []).forEach((brand) => {
      const key = normalizeText(brand.id || brand.brandId || brand.brand_id);
      if (key) {
        map.set(key, brand);
      }
    });
    return map;
  }, [brands]);

  const specsByVariant = useMemo(() => {
    return buildSpecsByVariant(specs || []);
  }, [specs]);

  const products = useMemo(() => {
    const allVariants = variants || [];
    const allAssets = assets || [];

    return compareIds
      .map((selectedId) => {
        const normalizedSelected = normalizeText(selectedId);

        const variant =
          allVariants.find(
            (item) => normalizeText(getVariantId(item)) === normalizedSelected
          ) ||
          allVariants.find(
            (item) => normalizeText(getVariantSlug(item)) === normalizedSelected
          );

        if (!variant) return null;

        const variantId = getVariantId(variant);
        const normalizedVariantId = normalizeText(variantId);
        const heroAsset = getHeroAsset(variantId, allAssets);
        const variantSpecs = specsByVariant.get(normalizedVariantId) || [];
        const price = getVariantPrice(variant, variantSpecs);

        return {
          id: variantId,
          slug: getVariantSlug(variant),
          brand: getBrandName(variant, brandsById),
          name: getVariantName(variant),
          price,
          priceLabel: formatPriceDisplay(price),
          heroUrl: getAssetUrl(heroAsset),
          specs: variantSpecs,
        };
      })
      .filter(Boolean);
  }, [variants, assets, compareIds, specsByVariant, brandsById]);

  const specGroups = useMemo(
    () => buildSpecGroupsForProducts(products),
    [products]
  );

  const visibleSpecGroups = useMemo(() => {
    if (!showDifferencesOnly) return specGroups;

    return specGroups
      .map((group) => ({
        ...group,
        specs: group.specs.filter((entry) => {
          const values = products.map((product) =>
            getComparableSpecValue(getSpecForProduct(product, entry.key))
          );
          return areValuesDifferent(values);
        }),
      }))
      .filter((group) => group.specs.length > 0);
  }, [products, showDifferencesOnly, specGroups]);

  const hasProducts = products.length > 0;
  const canCompare = products.length >= 2;

  if (loading) {
    return (
      <main style={{ ...pageShellStyle, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ fontSize: 18, color: "#d7e3ff", letterSpacing: "-0.02em" }}>
          Loading comparison...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ ...pageShellStyle, display: "grid", placeItems: "center", padding: 24 }}>
        <div
          style={{
            ...panelStyle,
            width: "min(720px, 100%)",
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "rgba(230, 237, 247, 0.72)",
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            Compare Grills
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Unable to Load Comparison
          </div>
          <div style={{ fontSize: 16, color: "#c7d5f5", marginBottom: 24 }}>
            {typeof error === "string" ? error : "Unable to load comparison catalog."}
          </div>
          <button onClick={() => navigate("/discover")} className="compare-top-button"
            style={primaryButtonStyle}>
            Home
          </button>
        </div>
      </main>
    );
  }

  if (!hasProducts) {
    return (
      <main style={{ ...pageShellStyle, padding: 24, display: "grid", placeItems: "center" }}>
        <div
          style={{
            ...panelStyle,
            width: "min(900px, 100%)",
            padding: "46px 34px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#8da9e6",
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Compare Grills
          </div>

          <div
            style={{
              fontSize: "clamp(2rem, 3vw, 3.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            No grills selected yet
          </div>

          <div
            style={{
              fontSize: 17,
              color: "#c6d3f0",
              lineHeight: 1.7,
              maxWidth: 620,
              margin: "0 auto 30px",
            }}
          >
            Add products from the product detail page, then come back here for a
            full side-by-side comparison with grouped specs, pricing, and a clean customer-friendly layout.
          </div>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/discover")} className="compare-top-button"
              style={{ ...primaryButtonStyle, minWidth: 180 }}>
              Home
            </button>

            <button onClick={() => navigate("/brands")} className="compare-top-button"
              style={{ ...softButtonStyle, minWidth: 180 }}>
              Brands
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageShellStyle}>
      <div className="ambient-light ambient-light-1" />
      <div className="ambient-light ambient-light-2" />
      <div className="ambient-light ambient-light-3" />

      <div style={containerStyle}>
        <section
          style={{
            ...panelStyle,
            padding: 18,
            marginBottom: 18,
            position: "sticky",
            top: 0,
            zIndex: 200,
            background:
              "linear-gradient(180deg, rgba(10,13,18,0.96) 0%, rgba(10,13,18,0.90) 72%, rgba(10,13,18,0.84) 100%)",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => navigate("/discover")} className="compare-top-button"
              style={softButtonStyle}>
              Home
            </button>

            <button onClick={() => navigate("/brands")} className="compare-top-button"
              style={softButtonStyle}>
              Brands
            </button>

            <button onClick={() => navigate(-1)} className="compare-top-button"
              style={softButtonStyle}>
              Back
            </button>
          </div>
        </section>

        <section
          style={{
            ...panelStyle,
            padding: 30,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#8da9e6",
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            Side-by-Side Showroom Comparison
          </div>

          <h1
            style={{
              fontSize: "clamp(3.8rem, 6vw, 5.8rem)",
              fontWeight: 800,
              textAlign: "center",
              margin: "0 0 14px",
              letterSpacing: "-0.05em",
              lineHeight: 0.96,
            }}
          >
            Compare Grills
          </h1>

          <div
            style={{
              maxWidth: 760,
              margin: "0 auto 22px",
              color: "rgba(230,237,247,0.72)",
              lineHeight: 1.7,
              fontSize: 16,
            }}
          >
            Customers can review the most important differences clearly, from cooking area and build details to installation and feature set.
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => setShowDifferencesOnly((current) => !current)}
              className="compare-action-button"
              style={
                showDifferencesOnly
                  ? {
                      ...softButtonStyle,
                      boxShadow: "0 0 0 1px rgba(122,157,219,0.22), 0 16px 34px rgba(67, 93, 131, 0.32)",
                      filter: "brightness(1.05)",
                    }
                  : softButtonStyle
              }
            >
              {showDifferencesOnly ? "Showing Differences Only" : "Show Differences Only"}
            </button>

            <button
              onClick={() => clearAll()}
              className="compare-action-button"
              style={{
                ...softButtonStyle,
                background: "linear-gradient(180deg, rgba(120,34,44,0.95) 0%, rgba(92,24,32,0.95) 100%)",
                color: "#ffe5e8",
                boxShadow: "0 16px 34px rgba(92,24,32,0.30)",
              }}
            >
              Clear All
            </button>
          </div>
        </section>

        <div className="compare-grid-shell">
          <div className="compare-side-column">
            <div className="compare-side-card">
              <div className="compare-side-title">Compared Products</div>
              <div className="compare-side-meta">
                {products.length} selected
              </div>
            </div>

            <div className="compare-remove-label">Actions</div>

            {visibleSpecGroups.map((group) => (
              <div key={group.groupName} className="compare-side-card compare-side-sticky">
                <div className="compare-side-title">{group.groupName}</div>
                <div className="compare-side-meta">
                  {group.specs.length} {group.specs.length === 1 ? "spec" : "specs"}
                </div>
              </div>
            ))}
          </div>

          <div className="compare-main-column">
            <div
              className="compare-products-grid"
              style={{
                gridTemplateColumns: `repeat(${products.length}, 1fr)`,
              }}
            >
              {products.map((product) => (
                <CompareHeaderCard
                  key={product.id}
                  product={product}
                  onOpen={() => navigate(`/product/${product.slug || product.id}`)}
                />
              ))}
            </div>

            <div
              className="compare-products-grid"
              style={{
                gridTemplateColumns: `repeat(${products.length}, 1fr)`,
                marginTop: 16,
              }}
            >
              {products.map((product) => (
                <CompareRemoveCard
                  key={`${product.id}-remove`}
                  onRemove={() => removeItem(product.id)}
                />
              ))}
            </div>

            {visibleSpecGroups.map((group) => (
              <div key={group.groupName} className="compare-group-block">
                <div
                  className="compare-group-grid"
                  style={{
                    gridTemplateColumns: `repeat(${products.length}, 1fr)`,
                  }}
                >
                  {group.specs.map((entry) => {
                    const comparableValues = products.map((product) =>
                      getComparableSpecValue(getSpecForProduct(product, entry.key))
                    );
                    const isDifferent = areValuesDifferent(comparableValues);

                    return products.map((product) => {
                      const spec = getSpecForProduct(product, entry.key);
                      const formatted = formatSpecValue(spec);

                      return (
                        <div
                          key={`${product.id}-${entry.key}`}
                          className="compare-spec-card"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            navigate(`/product/${product.slug || product.id}`)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigate(`/product/${product.slug || product.id}`);
                            }
                          }}
                          style={{
                            background: isDifferent
                              ? "linear-gradient(180deg, rgba(28,43,78,0.92) 0%, rgba(10,15,24,0.98) 100%)"
                              : "linear-gradient(180deg, rgba(15,23,36,0.92), rgba(9,14,24,0.92))",
                            border: isDifferent
                              ? "1px solid rgba(98,144,255,0.38)"
                              : "1px solid rgba(117, 163, 255, 0.14)",
                          }}
                        >
                          <div className="compare-spec-label">{entry.label}</div>
                          <div className="compare-spec-value">{formatted}</div>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        html, body {
          overflow-y: auto !important;
        }

        body.compare-page-active {
          overflow: auto !important;
        }

        main {
          overflow: visible !important;
        }

        .ambient-light {
          position: absolute;
          border-radius: 999px;
          filter: blur(130px);
          pointer-events: none;
          opacity: 0.1;
          animation: ambientFloat 14s ease-in-out infinite;
        }

        .ambient-light-1 {
          width: 520px;
          height: 520px;
          top: -180px;
          left: -120px;
          background: #4f6691;
          animation-delay: 0s;
        }

        .ambient-light-2 {
          width: 560px;
          height: 560px;
          right: -180px;
          bottom: -180px;
          background: #3d5377;
          animation-delay: 3s;
        }

        .ambient-light-3 {
          width: 420px;
          height: 420px;
          top: 28%;
          left: 42%;
          background: #324661;
          opacity: 0.06;
          animation-delay: 6s;
        }

        .compare-grid-shell {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .compare-side-column {
          display: grid;
          gap: 16px;
          align-self: start;
        }

        .compare-side-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 18px 44px rgba(0,0,0,0.22),
            inset 0 1px 0 rgba(255,255,255,0.05);
          border-radius: 22px;
          padding: 18px;
          backdrop-filter: blur(16px);
        }

        .compare-side-sticky {
          position: sticky;
          top: 92px;
        }

        .compare-side-title {
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8aa5e4;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .compare-side-meta {
          font-size: 16px;
          color: #f7f9ff;
          font-weight: 700;
          line-height: 1.4;
        }

        .compare-remove-label {
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(230,237,247,0.46);
          font-weight: 900;
          padding: 0 8px;
        }

        .compare-main-column {
          min-width: 0;
          display: grid;
          gap: 16px;
        }

        .compare-products-grid,
        .compare-group-grid {
          display: grid;
          gap: 18px;
        }

        .compare-group-block {
          display: grid;
          gap: 14px;
        }

        .compare-header-card,
        .compare-spec-card {
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 180ms ease,
            border-color 180ms ease,
            filter 120ms ease;
          -webkit-tap-highlight-color: transparent;
          will-change: transform;
        }

        .compare-header-card:active,
        .compare-spec-card:active {
          transform: scale(0.985);
          filter: brightness(1.03);
        }

        .compare-header-card:focus-visible,
        .compare-spec-card:focus-visible {
          outline: 2px solid rgba(122,162,255,0.55);
          outline-offset: 3px;
        }

        .compare-spec-card {
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 14px 34px rgba(0,0,0,0.24);
          cursor: pointer;
        }

        .compare-spec-label {
          font-size: 12px;
          color: #88a3e0;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .compare-spec-value {
          font-size: 20px;
          color: #f7f9ff;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: -0.02em;
        }


        .compare-top-button,
        .compare-action-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 120ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 160ms ease,
            filter 120ms ease;
          -webkit-tap-highlight-color: transparent;
          will-change: transform;
        }

        .compare-top-button:active,
        .compare-action-button:active {
          transform: scale(0.965);
          filter: brightness(1.08);
        }

        .compare-top-button:focus-visible,
        .compare-action-button:focus-visible {
          outline: 2px solid rgba(122, 157, 219, 0.5);
          outline-offset: 2px;
        }

                body.compare-page-active div[style*="position: fixed"][style*="z-index: 1000"][style*="bottom: 20px"] {
          display: none !important;
        }

        @keyframes ambientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(18px, -12px, 0) scale(1.04);
          }
        }

        @media (max-width: 1480px) {
          .compare-grid-shell {
            grid-template-columns: 220px minmax(0, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .compare-products-grid,
          .compare-group-grid {
            gap: 14px;
          }
        }

        @media (max-width: 1180px) {
          .compare-grid-shell {
            grid-template-columns: 1fr;
          }

          .compare-side-column {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: start;
          }

          .compare-side-sticky {
            position: static;
          }
        }
          * {
          overscroll-behavior: none;
        }

        .compare-main-column,
        .compare-grid-shell,
        .compare-products-grid,
        .compare-group-grid {
          overflow: visible !important;
        }

        @media (max-width: 768px) {
          .compare-side-column {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
