import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  subscribe,
  getState,
  removeItem,
  clearAll,
  closeComparison,
  toggleComparison,
} from "../state/comparisonStore";

const ASSET_BASE_URL = (import.meta.env.VITE_ASSET_BASE_URL || "").replace(/\/$/, "");

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toTitleCase(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildProductTitle(familyName, variantName) {
  const cleanFamily = String(familyName || "").trim();
  const cleanVariant = String(variantName || "").trim();

  if (!cleanFamily) return cleanVariant;
  if (!cleanVariant) return cleanFamily;

  const normalizedFamily = normalizeText(cleanFamily);
  const normalizedVariant = normalizeText(cleanVariant);

  if (
    normalizedVariant === normalizedFamily ||
    normalizedVariant.startsWith(`${normalizedFamily} `)
  ) {
    return cleanVariant;
  }

  return `${cleanFamily} ${cleanVariant}`;
}

function isTruthyActive(value) {
  if (value === true) return true;
  if (value === false) return false;

  const normalized = String(value || "").trim().toLowerCase();

  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "active"
  );
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value) {
  const amount = toNumber(value);
  if (amount === null) return null;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatDisplayText(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase();

  if (normalized === "true") return "Yes";
  if (normalized === "false") return "No";
  if (normalized === "null" || normalized === "undefined" || normalized === "n/a") return "—";

  if (/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i.test(raw)) {
    return raw
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  return raw;
}

function getVariantId(variant) {
  return (
    variant?.variant_id ||
    variant?.variantId ||
    variant?.id ||
    variant?.sku ||
    variant?.handle ||
    variant?.variant_name ||
    variant?.variantName ||
    variant?.name
  );
}

function getVariantName(variant) {
  return variant?.variant_name || variant?.variantName || variant?.name || "";
}

function getVariantFamilyId(variant) {
  return variant?.family_id || variant?.familyId || "";
}

function getVariantBrandId(variant) {
  return variant?.brand_id || variant?.brandId || "";
}

function getFamilyId(family) {
  return (
    family?.family_id ||
    family?.familyId ||
    family?.id ||
    family?.slug ||
    family?.family_name ||
    family?.name
  );
}

function getFamilyBrandId(family) {
  return family?.brand_id || family?.brandId || "";
}

function getFamilyName(family) {
  return family?.family_name || family?.familyName || family?.name || "";
}

function getBrandId(brand) {
  return (
    brand?.brand_id ||
    brand?.brandId ||
    brand?.id ||
    brand?.slug ||
    brand?.brand_name ||
    brand?.brandName ||
    brand?.name
  );
}

function getBrandName(brand) {
  return brand?.brand_name || brand?.brandName || brand?.name || "";
}

function getAssetEntityType(asset) {
  return String(asset?.entity_type || asset?.entityType || "").toLowerCase();
}

function getAssetEntityId(asset) {
  return String(asset?.entity_id || asset?.entityId || "");
}

function getAssetImageType(asset) {
  return String(asset?.image_type || asset?.imageType || "").toLowerCase();
}

function getAssetSortOrder(asset) {
  return Number(asset?.sort_order ?? asset?.sortOrder ?? 999);
}

function getAssetFilePath(asset) {
  return asset?.file_path || asset?.filePath || asset?.url || "";
}

function getAssetActive(asset) {
  if (asset?.active !== undefined) return isTruthyActive(asset.active);
  if (asset?.isActive !== undefined) return isTruthyActive(asset.isActive);
  return true;
}

function getSpecEntityType(spec) {
  return String(spec?.entity_type || spec?.entityType || "").toLowerCase();
}

function getSpecEntityId(spec) {
  return String(spec?.entity_id || spec?.entityId || "");
}

function getSpecKey(spec) {
  return String(spec?.spec_key || spec?.key || "").trim();
}

function getSpecLabel(spec) {
  return spec?.spec_label || spec?.label || getSpecKey(spec);
}

function getSpecValue(spec) {
  return spec?.spec_value ?? spec?.value ?? "";
}

function getSpecUnit(spec) {
  return spec?.spec_unit || spec?.unit || "";
}

function getSpecGroup(spec) {
  return spec?.spec_group || spec?.group || "General";
}

function getSpecSortOrder(spec) {
  return Number(spec?.spec_sort_order ?? spec?.sortOrder ?? 9999);
}

function getSpecComparisonPriority(spec) {
  return Number(spec?.comparison_priority ?? spec?.comparisonPriority ?? 9999);
}

function getSpecComparisonKey(spec) {
  if (spec?.is_comparison_key !== undefined) return isTruthyActive(spec.is_comparison_key);
  if (spec?.isComparisonKey !== undefined) return isTruthyActive(spec.isComparisonKey);
  return false;
}

function getSpecActive(spec) {
  if (spec?.active !== undefined) return isTruthyActive(spec.active);
  if (spec?.isActive !== undefined) return isTruthyActive(spec.isActive);
  return true;
}

function resolveAssetUrl(filePath, options = {}) {
  const value = String(filePath || "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.replace(/^\/+/, "");
  const withProductsPrefix = normalizedPath.startsWith("products/")
    ? normalizedPath
    : `products/${normalizedPath}`;

  if (options.preferProductsPrefix) {
    return `${ASSET_BASE_URL}/${withProductsPrefix}`;
  }

  return `${ASSET_BASE_URL}/${normalizedPath}`;
}

function getSelectedIdsFromStore(store) {
  if (!store) return [];

  const candidates = [
    store.items,
    store.variantIds,
    store.selectedIds,
    store.ids,
    store.selected,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") return String(item);
          if (item && typeof item === "object") {
            return String(item.variantId || item.variant_id || item.id || item.sku || "");
          }
          return "";
        })
        .filter(Boolean);
    }
  }

  return [];
}

function getBestHeroAsset(variantId, assets) {
  const filtered = assets
    .filter((asset) => {
      const entityType = getAssetEntityType(asset);
      const entityId = getAssetEntityId(asset);
      const imageType = getAssetImageType(asset);
      const active = getAssetActive(asset);

      if (!active) return false;
      if (entityType !== "variant") return false;
      if (entityId !== String(variantId)) return false;

      return ["hero", "primary", "main", "gallery"].includes(imageType);
    })
    .sort((a, b) => {
      const aType = getAssetImageType(a);
      const bType = getAssetImageType(b);
      const aHeroBoost = aType === "hero" ? -1000 : 0;
      const bHeroBoost = bType === "hero" ? -1000 : 0;
      const aOrder = getAssetSortOrder(a);
      const bOrder = getAssetSortOrder(b);
      return aHeroBoost + aOrder - (bHeroBoost + bOrder);
    });

  return filtered[0] || null;
}

function getMerchandisingValue(variant, family, specs, keys) {
  for (const key of keys) {
    const directValue = variant?.[key] ?? family?.[key];

    if (
      directValue !== null &&
      directValue !== undefined &&
      String(directValue).trim() !== ""
    ) {
      return String(directValue).trim();
    }
  }

  const camelCaseMap = {
    fuel_type: ["fuelType"],
    install_type: ["installType"],
    cooking_category: ["category", "cookingStyle"],
    default_installation: ["installType"],
  };

  for (const key of keys) {
    const alternates = camelCaseMap[key] || [];
    for (const alt of alternates) {
      const directValue = variant?.[alt] ?? family?.[alt];
      if (
        directValue !== null &&
        directValue !== undefined &&
        String(directValue).trim() !== ""
      ) {
        return String(directValue).trim();
      }
    }
  }

  const specMatch = specs.find((spec) => {
    const specKey = getSpecKey(spec).toLowerCase();
    return keys.includes(specKey);
  });

  const specValue = getSpecValue(specMatch);
  return specValue ? String(specValue).trim() : "";
}

function sortSpecsForDisplay(specs) {
  return [...specs].sort((a, b) => {
    const aPriority = getSpecComparisonPriority(a);
    const bPriority = getSpecComparisonPriority(b);
    if (aPriority !== bPriority) return aPriority - bPriority;

    const aOrder = getSpecSortOrder(a);
    const bOrder = getSpecSortOrder(b);
    if (aOrder !== bOrder) return aOrder - bOrder;

    return String(getSpecLabel(a) || getSpecKey(a)).localeCompare(
      String(getSpecLabel(b) || getSpecKey(b))
    );
  });
}

function formatDisplaySpecValue(spec) {
  const value = String(getSpecValue(spec) ?? "").trim();
  const unit = String(getSpecUnit(spec) ?? "").trim();

  if (!value) return "—";

  const formattedValue = formatDisplayText(value);

  if (!unit) return formattedValue;

  return `${formattedValue} ${unit}`;
}

function formatSpecValue(spec) {
  return formatDisplaySpecValue(spec);
}

function getAllSpecGroups(entries) {
  const groupMap = new Map();

  entries.forEach((entry) => {
    entry.specs.forEach((spec) => {
      const key = getSpecKey(spec);
      if (!key) return;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          spec_key: key,
          spec_label: getSpecLabel(spec) || key,
          spec_group: getSpecGroup(spec) || "General",
          comparison_priority: getSpecComparisonPriority(spec),
          spec_sort_order: getSpecSortOrder(spec),
          is_comparison_key: getSpecComparisonKey(spec),
        });
      } else {
        const existing = groupMap.get(key);
        existing.comparison_priority = Math.min(
          existing.comparison_priority,
          getSpecComparisonPriority(spec)
        );
        existing.spec_sort_order = Math.min(existing.spec_sort_order, getSpecSortOrder(spec));
        if (!existing.spec_label && getSpecLabel(spec)) existing.spec_label = getSpecLabel(spec);
        if (!existing.spec_group && getSpecGroup(spec)) existing.spec_group = getSpecGroup(spec);
        existing.is_comparison_key = existing.is_comparison_key || getSpecComparisonKey(spec);
      }
    });
  });

  const grouped = new Map();

  [...groupMap.values()]
    .sort((a, b) => {
      if (a.comparison_priority !== b.comparison_priority) {
        return a.comparison_priority - b.comparison_priority;
      }
      if (a.spec_sort_order !== b.spec_sort_order) {
        return a.spec_sort_order - b.spec_sort_order;
      }
      return String(a.spec_label || a.spec_key).localeCompare(String(a.spec_label || a.spec_key));
    })
    .forEach((spec) => {
      const groupName = spec.spec_group || "General";
      if (!grouped.has(groupName)) grouped.set(groupName, []);
      grouped.get(groupName).push(spec);
    });

  return [...grouped.entries()].map(([groupName, rows]) => ({
    groupName,
    rows,
  }));
}

function valuesAreDifferent(values) {
  const normalized = values
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  if (normalized.length <= 1) return false;
  return new Set(normalized).size > 1;
}

function inferBrandName(variant, family) {
  return (
    variant?.brand_name ||
    variant?.brandName ||
    family?.brand_name ||
    family?.brandName ||
    toTitleCase(getVariantBrandId(variant)) ||
    toTitleCase(getFamilyBrandId(family)) ||
    ""
  );
}

function inferFamilyName(variant, family) {
  return (
    getFamilyName(family) ||
    variant?.family_name ||
    variant?.familyName ||
    toTitleCase(getVariantFamilyId(variant)) ||
    ""
  );
}

function getEntrySpecs(variant, family, specs) {
  const variantId = String(getVariantId(variant) || "");
  const familyId = String(getVariantFamilyId(variant) || getFamilyId(family) || "");

  return sortSpecsForDisplay(
    specs.filter((spec) => {
      const entityType = getSpecEntityType(spec);
      const entityId = getSpecEntityId(spec);
      const active = getSpecActive(spec);

      if (!active) return false;
      if (entityType !== "variant") return false;

      return entityId === variantId || (familyId && entityId === familyId);
    })
  );
}

function buildEntry(variant, families, brands, assets, specs) {
  const variantId = String(getVariantId(variant) || "");

  const family =
    families.find((item) => String(getFamilyId(item)) === String(getVariantFamilyId(variant))) ||
    null;

  const brand =
    brands.find((item) => {
      const resolvedBrandId = getFamilyBrandId(family) || getVariantBrandId(variant);
      return String(getBrandId(item)) === String(resolvedBrandId);
    }) || null;

  const heroAsset = getBestHeroAsset(variantId, assets);
  const heroFilePath = getAssetFilePath(heroAsset);
  const heroImage = resolveAssetUrl(heroFilePath);

  const entrySpecs = getEntrySpecs(variant, family, specs);

  const cookingCategory = getMerchandisingValue(variant, family, entrySpecs, [
    "cooking_category",
  ]);
  const fuelType = getMerchandisingValue(variant, family, entrySpecs, ["fuel_type"]);
  const installType = getMerchandisingValue(variant, family, entrySpecs, [
    "install_type",
    "default_installation",
  ]);

  const familyName = inferFamilyName(variant, family);
  const brandName = getBrandName(brand) || inferBrandName(variant, family);
  const variantName = getVariantName(variant);
  const title = buildProductTitle(familyName, variantName) || variantName || familyName || variantId;

  return {
    variant,
    variantId,
    family,
    brand,
    specs: entrySpecs,
    title,
    familyName,
    brandName,
    heroImage,
    heroFilePath,
    cookingCategory,
    fuelType,
    installType,
    priceLabel:
      formatCurrency(
        variant?.sale_price ??
          variant?.salePrice ??
          variant?.map_price ??
          variant?.mapPrice ??
          variant?.price ??
          variant?.msrp
      ) || "View pricing",
  };
}

function ProductPreviewImage({ image, title, filePath = "" }) {
  const initialSrc = image || "";
  const [src, setSrc] = useState(initialSrc);
  const [didFallback, setDidFallback] = useState(false);
  const [didFailCompletely, setDidFailCompletely] = useState(false);

  function handleError() {
    if (!didFallback && filePath) {
      const fallbackSrc = resolveAssetUrl(filePath, { preferProductsPrefix: true });

      if (fallbackSrc && fallbackSrc !== src) {
        setSrc(fallbackSrc);
        setDidFallback(true);
        return;
      }
    }

    setDidFailCompletely(true);
  }

  if (src && !didFailCompletely) {
    return (
      <img
        src={src}
        alt={title}
        onError={handleError}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        padding: 12,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        No Image
      </div>
    </div>
  );
}

function buildComparisonMetrics(entries, specGroups) {
  let totalVisibleSpecs = 0;
  let differingSpecs = 0;
  let sharedSpecs = 0;
  let keySpecs = 0;

  specGroups.forEach((group) => {
    group.rows.forEach((row) => {
      const values = entries.map((entry) => {
        const match = entry.specs.find((spec) => getSpecKey(spec) === String(row.spec_key));
        return formatSpecValue(match);
      });

      totalVisibleSpecs += 1;

      if (row.is_comparison_key) {
        keySpecs += 1;
      }

      if (valuesAreDifferent(values)) {
        differingSpecs += 1;
      } else {
        sharedSpecs += 1;
      }
    });
  });

  return {
    totalVisibleSpecs,
    differingSpecs,
    sharedSpecs,
    keySpecs,
  };
}

function getStickySpecCellStyle(isHeader = false, isGroupRow = false) {
  return {
    position: "sticky",
    left: 0,
    zIndex: isHeader ? 4 : isGroupRow ? 3 : 2,
    background: isHeader
      ? "rgba(12,16,24,0.98)"
      : isGroupRow
      ? "rgba(22,28,38,0.98)"
      : "rgba(10,14,22,0.98)",
    boxShadow: "10px 0 24px rgba(0,0,0,0.22)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };
}

function buildGroupAnchorId(groupName) {
  return String(groupName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getEntrySummaryChips(entry) {
  return [entry.cookingCategory, entry.fuelType, entry.installType]
    .filter(Boolean)
    .slice(0, 3)
    .map((value) => formatDisplayText(value));
}

export default function ComparisonView({
  brands = [],
  families = [],
  variants = [],
  assets = [],
  specs = [],
}) {
  const [store, setStore] = useState(getState());
  const [isOpen, setIsOpen] = useState(Boolean(getState().isTrayOpen));
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [focusedVariantId, setFocusedVariantId] = useState("");
  const prevCountRef = useRef(store?.count || 0);
  const groupSectionRefs = useRef({});

  useEffect(() => {
    const unsubscribe = subscribe((nextState) => {
      setStore(nextState);
      setIsOpen(Boolean(nextState?.isTrayOpen));

      if ((nextState?.count || 0) === 0) {
        setShowDifferencesOnly(false);
        setFocusedVariantId("");
      }

      prevCountRef.current = nextState?.count || 0;
    });

    return unsubscribe;
  }, []);

  const selectedIds = useMemo(() => getSelectedIdsFromStore(store), [store]);

  const selectedEntries = useMemo(() => {
    return selectedIds
      .map((id) => {
        const variant = variants.find((item) => String(getVariantId(item)) === String(id)) || null;
        if (!variant) return null;
        return buildEntry(variant, families, brands, assets, specs);
      })
      .filter(Boolean);
  }, [selectedIds, variants, families, brands, assets, specs]);

  const compareReady = selectedEntries.length >= 2;
  const specGroups = useMemo(() => getAllSpecGroups(selectedEntries), [selectedEntries]);
  const visibleSpecGroups = useMemo(() => {
    if (!showDifferencesOnly) return specGroups;

    return specGroups
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => {
          const values = selectedEntries.map((entry) => {
            const match = entry.specs.find((spec) => getSpecKey(spec) === String(row.spec_key));
            return formatSpecValue(match);
          });

          return valuesAreDifferent(values);
        }),
      }))
      .filter((group) => group.rows.length > 0);
  }, [specGroups, selectedEntries, showDifferencesOnly]);

  const comparisonMetrics = useMemo(() => {
    return buildComparisonMetrics(selectedEntries, visibleSpecGroups);
  }, [selectedEntries, visibleSpecGroups]);

  const hasFocusedProduct = Boolean(focusedVariantId);

  function handleToggleOpen() {
    toggleComparison();
  }

  function handleCloseTray() {
    closeComparison();
  }

  function scrollToGroup(groupName) {
    const anchorId = buildGroupAnchorId(groupName);
    const node = groupSectionRefs.current[anchorId];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }

  if (selectedEntries.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 20,
        right: 20,
        bottom: 20,
        zIndex: 60,
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(10,14,22,0.94) 0%, rgba(7,10,17,0.98) 100%)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 20,
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: compareReady ? "1fr auto" : "1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div
                  style={{
                    color: "rgba(255,255,255,0.62)",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Showroom Comparison
                </div>

                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 22,
                    lineHeight: 1.1,
                    fontWeight: 800,
                  }}
                >
                  {selectedEntries.length === 1
                    ? "1 product added"
                    : `${selectedEntries.length} products added`}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseTray}
                aria-label="Close comparison tray"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {selectedEntries.map((entry) => (
                <div
                  key={entry.variantId}
                  style={{
                    borderRadius: 20,
                    border:
                      focusedVariantId === entry.variantId
                        ? "1px solid rgba(143,211,255,0.35)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      focusedVariantId === entry.variantId
                        ? "linear-gradient(180deg, rgba(143,211,255,0.12) 0%, rgba(255,255,255,0.04) 100%)"
                        : "rgba(255,255,255,0.04)",
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "92px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
                    }}
                  >
                    <ProductPreviewImage
                      image={entry.heroImage}
                      title={entry.title}
                      filePath={entry.heroFilePath}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.62)",
                        fontSize: 11,
                        lineHeight: 1.2,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {entry.brandName || "Product"}
                    </div>

                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: 15,
                        lineHeight: 1.3,
                        fontWeight: 700,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {entry.title}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {getEntrySummaryChips(entry).slice(0, 2).map((value) => (
                        <span
                          key={`${entry.variantId}-${value}`}
                          style={{
                            padding: "5px 8px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.8)",
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDisplayText(value)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(entry.variantId)}
                    aria-label={`Remove ${entry.title} from comparison`}
                    style={{
                      alignSelf: "start",
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      fontSize: 18,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {compareReady && (
            <div
              style={{
                display: "grid",
                gap: 10,
                alignSelf: "stretch",
                minWidth: 260,
              }}
            >
              <button
                type="button"
                onClick={handleToggleOpen}
                style={{
                  minHeight: 62,
                  borderRadius: 18,
                  border: "1px solid rgba(143,211,255,0.28)",
                  background:
                    "linear-gradient(135deg, rgba(143,211,255,0.22) 0%, rgba(255,255,255,0.1) 100%)",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  padding: "14px 18px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
                }}
              >
                {isOpen ? "Hide Full Comparison" : "Open Full Comparison"}
              </button>

              <button
                type="button"
                onClick={() => clearAll()}
                style={{
                  minHeight: 48,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "12px 16px",
                }}
              >
                Clear Comparison
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && compareReady && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            maxHeight: "65vh",
            overflow: "auto",
            padding: 20,
            display: "grid",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.62)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Showroom Comparison
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: 28,
                  lineHeight: 1.1,
                  fontWeight: 800,
                }}
              >
                Compare Product Specs Side by Side
              </h2>

              <div
                style={{
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Use this view to compare the selected products across shared spec rows.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => setShowDifferencesOnly((current) => !current)}
                style={{
                  minHeight: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: showDifferencesOnly
                    ? "rgba(143,211,255,0.18)"
                    : "rgba(255,255,255,0.04)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "10px 14px",
                }}
              >
                {showDifferencesOnly ? "Showing Differences Only" : "Show Differences Only"}
              </button>

              <button
                type="button"
                onClick={handleCloseTray}
                style={{
                  minHeight: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "10px 14px",
                }}
              >
                Close
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Specs: {comparisonMetrics.totalVisibleSpecs}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Differences: {comparisonMetrics.differingSpecs}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Key Specs: {comparisonMetrics.keySpecs}
            </div>
          </div>

          {visibleSpecGroups.length > 0 ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {visibleSpecGroups.map((group) => (
                  <button
                    key={group.groupName}
                    type="button"
                    onClick={() => scrollToGroup(group.groupName)}
                    style={{
                      minHeight: 38,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "8px 12px",
                    }}
                  >
                    {group.groupName}
                  </button>
                ))}
              </div>

              <div
                style={{
                  overflowX: "auto",
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: 1080,
                    borderCollapse: "separate",
                    borderSpacing: 0,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...getStickySpecCellStyle(true, false),
                          minWidth: 240,
                          padding: 18,
                          textAlign: "left",
                          color: "rgba(255,255,255,0.68)",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        Specs
                      </th>

                      {selectedEntries.map((entry) => (
                        <th
                          key={`head-${entry.variantId}`}
                          style={{
                            minWidth: 260,
                            padding: 18,
                            textAlign: "left",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            background:
                              focusedVariantId === entry.variantId
                                ? "rgba(143,211,255,0.1)"
                                : "transparent",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setFocusedVariantId((current) =>
                                current === entry.variantId ? "" : entry.variantId
                              )
                            }
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              cursor: "pointer",
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                color: "rgba(255,255,255,0.62)",
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                              }}
                            >
                              {entry.brandName}
                            </div>

                            <div
                              style={{
                                color: "#ffffff",
                                fontSize: 18,
                                lineHeight: 1.2,
                                fontWeight: 800,
                              }}
                            >
                              {entry.title}
                            </div>

                            <div
                              style={{
                                color: "rgba(255,255,255,0.82)",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {entry.priceLabel}
                            </div>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {visibleSpecGroups.map((group) => {
                      const anchorId = buildGroupAnchorId(group.groupName);

                      return (
                        <React.Fragment key={group.groupName}>
                          <tr ref={(node) => (groupSectionRefs.current[anchorId] = node)}>
                            <td
                              style={{
                                ...getStickySpecCellStyle(false, true),
                                padding: 16,
                                borderBottom: "1px solid rgba(255,255,255,0.08)",
                                color: "#ffffff",
                                fontSize: 15,
                                fontWeight: 800,
                              }}
                            >
                              {group.groupName}
                            </td>

                            {selectedEntries.map((entry) => (
                              <td
                                key={`${group.groupName}-${entry.variantId}`}
                                style={{
                                  padding: 16,
                                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                                  background:
                                    focusedVariantId === entry.variantId
                                      ? "rgba(143,211,255,0.06)"
                                      : "transparent",
                                }}
                              />
                            ))}
                          </tr>

                          {group.rows.map((row) => {
                            const values = selectedEntries.map((entry) => {
                              const match = entry.specs.find(
                                (spec) => getSpecKey(spec) === String(row.spec_key)
                              );
                              return formatSpecValue(match);
                            });

                            const isDifferent = valuesAreDifferent(values);

                            return (
                              <tr key={`${group.groupName}-${row.spec_key}`}>
                                <td
                                  style={{
                                    ...getStickySpecCellStyle(false, false),
                                    padding: 18,
                                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                                    verticalAlign: "top",
                                  }}
                                >
                                  <div style={{ display: "grid", gap: 6 }}>
                                    <div
                                      style={{
                                        color: "#ffffff",
                                        fontSize: 14,
                                        lineHeight: 1.35,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {row.spec_label}
                                    </div>

                                    <div
                                      style={{
                                        color: "rgba(255,255,255,0.48)",
                                        fontSize: 11,
                                        lineHeight: 1.3,
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      {row.is_comparison_key
                                        ? "Key comparison spec"
                                        : "Catalog spec"}
                                    </div>
                                  </div>
                                </td>

                                {values.map((value, index) => (
                                  <td
                                    key={`${row.spec_key}-${selectedEntries[index].variantId}`}
                                    style={{
                                      padding: 18,
                                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                                      verticalAlign: "top",
                                      background:
                                        focusedVariantId === selectedEntries[index].variantId
                                          ? "rgba(143,211,255,0.1)"
                                          : isDifferent
                                          ? "rgba(143,211,255,0.04)"
                                          : "transparent",
                                      opacity:
                                        hasFocusedProduct &&
                                        focusedVariantId !== selectedEntries[index].variantId
                                          ? 0.56
                                          : 1,
                                      transition:
                                        "opacity 180ms ease, background 180ms ease",
                                    }}
                                  >
                                    <div
                                      style={{
                                        color:
                                          value === "—" ? "rgba(255,255,255,0.38)" : "#ffffff",
                                        fontSize: 15,
                                        lineHeight: 1.45,
                                        fontWeight: isDifferent ? 700 : 600,
                                      }}
                                    >
                                      {formatDisplayText(value)}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                padding: 28,
                display: "grid",
                gap: 22,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 24,
                    lineHeight: 1.15,
                    fontWeight: 800,
                  }}
                >
                  Comparison specs are not available yet for these selections
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.68)",
                    fontSize: 15,
                    lineHeight: 1.5,
                    maxWidth: 820,
                  }}
                >
                  The products are selected correctly, but there are no active variant or
                  family-shared compare specs in the current JSON for this pair yet.
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                }}
              >
                {selectedEntries.map((entry) => (
                  <div
                    key={`empty-state-${entry.variantId}`}
                    style={{
                      borderRadius: 20,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 16,
                      display: "grid",
                      gridTemplateColumns: "84px 1fr",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
                      }}
                    >
                      <ProductPreviewImage
                        image={entry.heroImage}
                        title={entry.title}
                        filePath={entry.heroFilePath}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.62)",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {entry.brandName}
                      </div>

                      <div
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          lineHeight: 1.25,
                          fontWeight: 800,
                        }}
                      >
                        {entry.title}
                      </div>

                      <div
                        style={{
                          color: "rgba(255,255,255,0.74)",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {entry.priceLabel}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}