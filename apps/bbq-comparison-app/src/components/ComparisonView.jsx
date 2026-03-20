import { useEffect, useMemo, useRef, useState } from "react";
import {
  subscribe,
  getState,
  removeItem,
  clearAll,
} from "../state/comparisonStore";
import compareVariants from "../utils/compareVariants";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getVariantId(variant) {
  return (
    variant?.variant_id ||
    variant?.id ||
    variant?.sku ||
    variant?.handle ||
    variant?.variant_name ||
    variant?.name
  );
}

function getVariantName(variant) {
  return variant?.variant_name || variant?.name || "Unnamed Product";
}

function getVariantBrandId(variant) {
  return (
    variant?.brand_id ||
    variant?.brandId ||
    variant?.brand ||
    variant?.brand_slug
  );
}

function getVariantFamilyId(variant) {
  return (
    variant?.family_id ||
    variant?.familyId ||
    variant?.family ||
    variant?.family_slug
  );
}

function getFamilyId(family) {
  return family?.family_id || family?.id || family?.slug || family?.family_slug;
}

function getFamilyName(family) {
  return family?.family_name || family?.name || "";
}

function getFamilyBrandId(family) {
  return (
    family?.brand_id ||
    family?.brandId ||
    family?.brand ||
    family?.brand_slug ||
    family?.brand_key
  );
}

function getBrandId(brand) {
  return (
    brand?.brand_id ||
    brand?.brandId ||
    brand?.id ||
    brand?.slug ||
    brand?.brand_slug ||
    brand?.handle ||
    brand?.key
  );
}

function getBrandName(brand) {
  return brand?.brand_name || brand?.name || "";
}

export default function ComparisonView({
  brands = [],
  families = [],
  variants = [],
  assets = [],
  specs = [],
}) {
  const [store, setStore] = useState(getState());
  const [isOpen, setIsOpen] = useState(false);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  const prevCountRef = useRef(store.count);

  useEffect(() => {
    const unsubscribe = subscribe((nextState) => {
      const prevCount = prevCountRef.current;

      setStore(nextState);

      if (nextState.count >= 2 && prevCount < 2) {
        setIsOpen(true);
      }

      if (nextState.count === 0) {
        setIsOpen(false);
        setShowDifferencesOnly(false);
      }

      prevCountRef.current = nextState.count;
    });

    return unsubscribe;
  }, []);

  function getVariantById(id) {
    return (
      variants.find((variant) => String(getVariantId(variant)) === String(id)) ||
      null
    );
  }

  function getFamilyById(id) {
    return (
      families.find((family) => String(getFamilyId(family)) === String(id)) || null
    );
  }

  function getBrandById(id) {
    return brands.find((brand) => String(getBrandId(brand)) === String(id)) || null;
  }

  function getFamilyForVariant(variant) {
    if (!variant) return null;

    const familyId = getVariantFamilyId(variant);

    return (
      getFamilyById(familyId) ||
      families.find(
        (family) =>
          normalizeText(getFamilyName(family)) ===
          normalizeText(variant?.family_name || variant?.familyName || "")
      ) ||
      null
    );
  }

  function getBrandForVariant(variant, familyOverride = null) {
    if (!variant) return null;

    const family = familyOverride || getFamilyForVariant(variant);
    const directBrandId = getVariantBrandId(variant);
    const familyBrandId = getFamilyBrandId(family);

    const byId = getBrandById(directBrandId) || getBrandById(familyBrandId) || null;

    if (byId) return byId;

    return (
      brands.find(
        (brand) =>
          normalizeText(getBrandName(brand)) ===
          normalizeText(variant?.brand_name || variant?.brandName || "")
      ) || null
    );
  }

  function getVariantDisplayName(variant) {
    if (!variant) return "";

    const family = getFamilyForVariant(variant);
    const familyName = getFamilyName(family);
    const variantName = getVariantName(variant);

    if (!familyName) return variantName;

    const normalizedFamily = normalizeText(familyName);
    const normalizedVariant = normalizeText(variantName);

    if (
      normalizedVariant === normalizedFamily ||
      normalizedVariant.startsWith(`${normalizedFamily} `)
    ) {
      return variantName;
    }

    return `${familyName} — ${variantName}`;
  }

  function getVariantBrandName(variant) {
    const family = getFamilyForVariant(variant);
    const brand = getBrandForVariant(variant, family);

    return getBrandName(brand) || variant?.brand_name || variant?.brandName || "";
  }

  const selectedVariants = useMemo(() => {
    return store.items.map((id) => getVariantById(id)).filter(Boolean);
  }, [store.items, variants]);

  const selectedVariantIds = useMemo(() => {
    return selectedVariants.map((variant) => getVariantId(variant));
  }, [selectedVariants]);

  const comparison = useMemo(() => {
    try {
      return compareVariants({
        variants: selectedVariants,
        variantIds: selectedVariantIds,
        specs,
      });
    } catch {
      return compareVariants(selectedVariantIds, specs);
    }
  }, [selectedVariants, selectedVariantIds, specs]);

  if (!store.items.length) return null;

  return (
    <div className="comparison-shell">
      <div className="comparison-bar">
        <div className="comparison-bar-left">
          <div className="comparison-bar-badge">{store.count}</div>
          <div>
            <div className="comparison-bar-title">Comparison Tray</div>
            <div className="comparison-bar-subtitle">{store.count} selected</div>
          </div>
        </div>

        <div className="comparison-bar-items">
          {selectedVariants.map((variant) => {
            const variantId = getVariantId(variant);

            return (
              <div key={variantId} className="comparison-pill">
                <span className="comparison-pill-text">
                  {getVariantName(variant)}
                </span>
                <button
                  type="button"
                  className="comparison-pill-remove"
                  onClick={() => removeItem(variantId)}
                  aria-label={`Remove ${getVariantName(variant)} from comparison`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="comparison-bar-actions">
          <button
            type="button"
            className="comparison-secondary-button"
            onClick={clearAll}
          >
            Clear
          </button>

          <button
            type="button"
            className="comparison-primary-button"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? "Hide" : "Compare"}
          </button>
        </div>
      </div>

      {isOpen && store.count >= 2 && comparison?.groups?.length ? (
        <div className="comparison-panel">
          <div className="comparison-panel-header">
            <div>
              <p className="comparison-panel-eyebrow">Comparison</p>
              <h2 className="comparison-panel-title">Side-by-Side Comparison</h2>
            </div>

            <button
              type="button"
              className={`comparison-toggle-button ${
                showDifferencesOnly ? "comparison-toggle-button-active" : ""
              }`}
              onClick={() => setShowDifferencesOnly((prev) => !prev)}
            >
              {showDifferencesOnly ? "Showing Differences" : "Show Differences"}
            </button>
          </div>

          <div className="comparison-table-wrap">
            <div
              className="comparison-table"
              style={{
                gridTemplateColumns: `260px repeat(${selectedVariants.length}, minmax(240px, 1fr))`,
              }}
            >
              <div className="comparison-header-cell">
                <div className="comparison-header-label">Spec</div>
              </div>

              {selectedVariants.map((variant) => {
                const variantId = getVariantId(variant);

                return (
                  <div key={variantId} className="comparison-header-cell">
                    <div className="comparison-column-brand">
                      {getVariantBrandName(variant)}
                    </div>
                    <div className="comparison-column-title">
                      {getVariantDisplayName(variant)}
                    </div>
                    <button
                      type="button"
                      className="comparison-column-remove"
                      onClick={() => removeItem(variantId)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              {comparison.groups.map((group) => {
                const rows = showDifferencesOnly
                  ? group.items.filter((item) => item.isDifferent)
                  : group.items;

                if (!rows.length) return null;

                return (
                  <div key={group.group} className="comparison-group-block">
                    <div
                      className="comparison-group-title"
                      style={{
                        gridColumn: `1 / span ${selectedVariants.length + 1}`,
                      }}
                    >
                      {group.group}
                    </div>

                    {rows.map((row) => (
                      <div
                        key={row.specKey}
                        className={`comparison-data-row ${
                          row.isDifferent ? "comparison-data-row-different" : ""
                        }`}
                      >
                        <div className="comparison-label-cell">{row.specLabel}</div>

                        {selectedVariants.map((variant) => {
                          const variantId = getVariantId(variant);

                          return (
                            <div key={variantId} className="comparison-value-cell">
                              {row.values?.[variantId]?.displayValue || "—"}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}