//ComparePage.jsx

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

const PAGE_FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageShellStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(39,95,170,0.22) 0%, rgba(9,13,20,0.96) 38%, #04070c 100%)",
  color: "#f3f7ff",
  fontFamily: PAGE_FONT,
};

const containerStyle = {
  width: "min(1600px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "24px 0 72px",
};

const glassCardStyle = {
  background: "linear-gradient(180deg, rgba(15,23,36,0.92), rgba(9,14,24,0.92))",
  border: "1px solid rgba(117, 163, 255, 0.18)",
  boxShadow: "0 18px 60px rgba(0, 0, 0, 0.28)",
  borderRadius: 28,
  backdropFilter: "blur(12px)",
};

const softButtonStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(10,15,24,0.82)",
  color: "#e4ecff",
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
};

const primaryButtonStyle = {
  border: "none",
  background: "linear-gradient(135deg, #4c75db 0%, #2f57bc 100%)",
  color: "#fff",
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 800,
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
    variant?.salePrice ||
    variant?.sale_price ||
    variant?.price ||
    variant?.mapPrice ||
    variant?.map_price ||
    variant?.msrp;

  if (direct !== null && direct !== undefined && direct !== "") {
    return Number(direct) || 0;
  }

  const priceSpec = specsForVariant.find((spec) => {
    const key = String(spec.key || spec.specKey || spec.spec_key || "")
      .trim()
      .toLowerCase();

    return ["price", "sale_price", "map_price", "msrp"].includes(key);
  });

  if (!priceSpec) return 0;

  return parseNumericValue(priceSpec.value ?? priceSpec.specValue ?? "") || 0;
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

  return Array.from(groups.entries())
    .map(([groupName, specs]) => ({
      groupName,
      specs: specs.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
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
        ...glassCardStyle,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 390,
        cursor: "pointer",
        touchAction: "pan-y",
        transition:
          "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease, border-color 220ms ease",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          background:
            "radial-gradient(circle at top, rgba(73,122,255,0.16) 0%, rgba(12,17,27,1) 68%)",
          display: "grid",
          placeItems: "center",
          padding: 24,
          borderBottom: "1px solid rgba(117, 163, 255, 0.12)",
        }}
      >
        {product.heroUrl ? (
          <img
            src={product.heroUrl}
            alt={product.name}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
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
          padding: 22,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#8ea8e8",
            fontWeight: 800,
          }}
        >
          {product.brand}
        </div>

        <div
          style={{
            fontSize: 22,
            lineHeight: 1.15,
            fontWeight: 800,
            color: "#f6f8ff",
            letterSpacing: "-0.03em",
          }}
        >
          {product.name}
        </div>

        <div
          style={{
            fontSize: 20,
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
            color: "#d7e3ff",
            marginTop: 2,
          }}
        >
          View Product →
        </div>
      </div>
    </div>
  );
}

function RemoveRowButton({ onRemove }) {
  return (
    <button
      onClick={onRemove}
      style={{
        ...softButtonStyle,
        width: "100%",
        padding: "12px 14px",
        whiteSpace: "nowrap",
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
          priceLabel: toCurrency(price),
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
            ...glassCardStyle,
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
              color: "#8da9e6",
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            Compare Products
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Unable to Load Comparison
          </div>
          <div style={{ fontSize: 16, color: "#c7d5f5", marginBottom: 24 }}>
            {typeof error === "string" ? error : "Unable to load comparison catalog."}
          </div>
          <button onClick={() => navigate("/discover")} style={primaryButtonStyle}>
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
            ...glassCardStyle,
            width: "min(860px, 100%)",
            padding: "42px 32px",
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
            Compare Products
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
            full side-by-side comparison with images, pricing, and grouped specs.
          </div>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/discover")} style={{ ...primaryButtonStyle, minWidth: 180 }}>
              Home
            </button>

            <button onClick={() => navigate("/brands")} style={{ ...softButtonStyle, minWidth: 180 }}>
              Brands
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageShellStyle}>
      <div style={containerStyle}>
        <section
          style={{
            ...glassCardStyle,
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => navigate("/discover")} style={softButtonStyle}>
              Home
            </button>

            <button onClick={() => navigate("/brands")} style={softButtonStyle}>
              Go to Brands
            </button>

            <button onClick={() => navigate(-1)} style={softButtonStyle}>
              Back
            </button>
          </div>
        </section>

        <section
          style={{
            ...glassCardStyle,
            padding: 22,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 18,
              justifyItems: "center",
            }}
          >
            <h1
  style={{
    fontSize: "clamp(60px, 6vw, 80px)",
    fontWeight: 600,
    textAlign: "center",
    marginBottom: "20px",
    letterSpacing: "-0.02em",
  }}
>
  Compare Grills
</h1>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => setShowDifferencesOnly((current) => !current)}
                style={
                  showDifferencesOnly
                    ? {
                        ...softButtonStyle,
                        border: "1px solid rgba(98,144,255,0.55)",
                        background: "rgba(43,88,190,0.24)",
                      }
                    : softButtonStyle
                }
              >
                {showDifferencesOnly ? "Showing Differences Only" : "Show Differences Only"}
              </button>

              <button
                onClick={() => clearAll()}
                style={{
                  ...softButtonStyle,
                  background: "rgba(83,20,26,0.34)",
                  color: "#ffd5da",
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `280px repeat(${products.length}, minmax(240px, 1fr))`,
            gap: 18,
            alignItems: "start",
          }}
        >
          <div />

          {products.map((product) => (
            <CompareHeaderCard
              key={product.id}
              product={product}
              onOpen={() => navigate(`/product/${product.slug || product.id}`)}
            />
          ))}

          <div />

          {products.map((product) => (
            <RemoveRowButton
              key={`${product.id}-remove`}
              onRemove={() => removeItem(product.id)}
            />
          ))}

          {visibleSpecGroups.map((group) => (
            <React.Fragment key={group.groupName}>
              <div
                style={{
                  alignSelf: "stretch",
                  position: "sticky",
                  top: 18,
                }}
              >
                <div
                  style={{
                    ...glassCardStyle,
                    borderRadius: 20,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "#8aa5e4",
                      fontWeight: 800,
                    }}
                  >
                    {group.groupName}
                  </div>
                </div>
              </div>

              <div
                style={{
                  gridColumn: `span ${products.length}`,
                  display: "grid",
                  gap: 12,
                }}
              >
                {group.specs.map((entry) => {
                  const comparableValues = products.map((product) =>
                    getComparableSpecValue(getSpecForProduct(product, entry.key))
                  );
                  const isDifferent = areValuesDifferent(comparableValues);

                  return (
                    <div
                      key={entry.key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${products.length}, minmax(240px, 1fr))`,
                        gap: 18,
                      }}
                    >
                      {products.map((product) => {
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
                              borderRadius: 20,
                              padding: 18,
                              boxShadow: "0 12px 36px rgba(0,0,0,0.24)",
                              cursor: "pointer",
                              touchAction: "pan-y",
                              transition:
                                "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease, border-color 220ms ease",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                color: "#88a3e0",
                                textTransform: "uppercase",
                                letterSpacing: "0.12em",
                                fontWeight: 700,
                                marginBottom: 10,
                              }}
                            >
                              {entry.label}
                            </div>

                            <div
                              style={{
                                fontSize: 18,
                                color: "#f7f9ff",
                                fontWeight: 700,
                                lineHeight: 1.4,
                              }}
                            >
                              {formatted}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        .compare-header-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 26px 58px rgba(0,0,0,0.38);
          border-color: rgba(122,162,255,0.28);
        }

        .compare-header-card:focus-visible,
        .compare-spec-card:focus-visible {
          outline: 2px solid rgba(122,162,255,0.55);
          outline-offset: 3px;
        }

        .compare-spec-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 42px rgba(0,0,0,0.28);
          border-color: rgba(122,162,255,0.22);
        }

        body.compare-page-active div[style*="position: fixed"][style*="z-index: 1000"][style*="bottom: 20px"] {
          display: none !important;
        }

        @media (max-width: 1180px) {
          .compare-header-card {
            min-height: 340px;
          }
        }
      `}</style>
    </main>
  );
}
