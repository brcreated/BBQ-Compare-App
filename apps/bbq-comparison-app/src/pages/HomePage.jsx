import { useEffect, useMemo, useRef, useState } from "react";
import HomeHero from "../components/sections/HomeHero";
import ProductCard from "../components/ProductCard";
import ComparisonView from "../components/ComparisonView";
import { loadCatalogData, getRemoteAssetUrl } from "../lib/catalogApi";
import { addItem, subscribe, getState } from "../state/comparisonStore";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function toDisplayLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function getVariantFamilyId(variant) {
  return (
    variant?.family_id ||
    variant?.familyId ||
    variant?.family ||
    variant?.family_slug
  );
}

function getVariantBrandId(variant) {
  return (
    variant?.brand_id ||
    variant?.brandId ||
    variant?.brand ||
    variant?.brand_slug
  );
}

function getVariantBrandName(variant) {
  return variant?.brand_name || variant?.brandName || variant?.brand || "";
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
  return brand?.brand_name || brand?.name || brand?.brand || "";
}

function getFamilyId(family) {
  return family?.family_id || family?.id || family?.slug || family?.family_slug;
}

function getFamilyName(family) {
  return family?.family_name || family?.name || family?.family || "";
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

function getSpecEntityType(spec) {
  return normalizeText(spec?.entity_type || spec?.entityType);
}

function getSpecEntityId(spec) {
  return spec?.entity_id || spec?.entityId || spec?.variantId || spec?.variant_id;
}

function getSpecKey(spec) {
  return normalizeText(
    spec?.spec_key ||
      spec?.specKey ||
      spec?.key ||
      spec?.spec_label ||
      spec?.specLabel ||
      spec?.label
  );
}

function getSpecValue(spec) {
  return String(spec?.spec_value || spec?.specValue || spec?.value || "").trim();
}

function normalizeResolverKey(key) {
  return normalizeText(key).replace(/\s+/g, "_");
}

function getVariantValue(variant, key) {
  if (!variant || !key) return "";

  const normalizedKey = normalizeResolverKey(key);

  const candidates = [
    normalizedKey,
    normalizedKey.replace(/_([a-z])/g, (_, char) => char.toUpperCase()),
    normalizedKey
      .split("_")
      .map((part, index) =>
        index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(""),
    normalizedKey
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(""),
    normalizedKey.replace(/_/g, " "),
  ];

  for (const candidate of candidates) {
    if (candidate in variant && variant[candidate] != null && variant[candidate] !== "") {
      return variant[candidate];
    }
  }

  return "";
}

function getEntityType(asset) {
  if (asset?.entityType || asset?.entity_type) {
    return normalizeText(asset?.entityType || asset?.entity_type);
  }

  if (asset?.variantId || asset?.variant_id) return "variant";
  if (asset?.familyId || asset?.family_id) return "family";
  if (asset?.brandId || asset?.brand_id) return "brand";

  return "";
}

function getImageType(asset) {
  return normalizeText(
    asset?.image_type ||
      asset?.imageType ||
      asset?.asset_type ||
      asset?.assetType ||
      asset?.type
  );
}

function getEntityId(asset) {
  return (
    asset?.entity_id ||
    asset?.entityId ||
    asset?.variantId ||
    asset?.variant_id ||
    asset?.familyId ||
    asset?.family_id ||
    asset?.brandId ||
    asset?.brand_id
  );
}

function getSortOrder(item) {
  const value = item?.sort_order ?? item?.sortOrder ?? 9999;
  return Number.isFinite(Number(value)) ? Number(value) : 9999;
}

export default function HomePage() {
  const [store, setStore] = useState(getState());
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [catalog, setCatalog] = useState({
    brands: [],
    families: [],
    variants: [],
    colors: [],
    assets: [],
    specs: [],
    recommendationRules: [],
    manifest: null,
  });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const feedbackTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribe(setStore);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      try {
        setCatalogLoading(true);
        setCatalogError("");

        const data = await loadCatalogData();

        if (!isMounted) return;
        setCatalog(data);
      } catch (error) {
        if (!isMounted) return;
        setCatalogError(error?.message || "Failed to load catalog data.");
      } finally {
        if (isMounted) {
          setCatalogLoading(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const { brands, families, variants, assets, specs } = catalog;

  function getFamilyForVariant(variant) {
    const familyId = getVariantFamilyId(variant);

    return (
      families.find((family) => String(getFamilyId(family)) === String(familyId)) ||
      families.find(
        (family) =>
          normalizeText(getFamilyName(family)) ===
          normalizeText(variant?.family_name || variant?.familyName || "")
      ) ||
      null
    );
  }

  function getBrandForVariant(variant, familyOverride = null) {
    const family = familyOverride || getFamilyForVariant(variant);

    const directBrandId = getVariantBrandId(variant);
    const familyBrandId = getFamilyBrandId(family);
    const directBrandName = getVariantBrandName(variant);

    const byId =
      brands.find((brand) => String(getBrandId(brand)) === String(directBrandId)) ||
      brands.find((brand) => String(getBrandId(brand)) === String(familyBrandId)) ||
      null;

    if (byId) return byId;

    const byName =
      brands.find(
        (brand) => normalizeText(getBrandName(brand)) === normalizeText(directBrandName)
      ) ||
      brands.find(
        (brand) =>
          normalizeText(getBrandName(brand)) ===
          normalizeText(family?.brand_name || family?.brandName || family?.brand || "")
      ) ||
      null;

    return byName;
  }

  function getSpecsForVariant(variant) {
    const variantId = getVariantId(variant);
    if (!variantId) return [];

    return specs.filter((spec) => {
      return (
        getSpecEntityType(spec) === "variant" &&
        String(getSpecEntityId(spec)) === String(variantId)
      );
    });
  }

  function getSpecValueForVariant(variant, key) {
    const normalizedKey = normalizeResolverKey(key);

    const matchingKeys = new Set([normalizedKey, normalizedKey.replace(/_/g, " ")]);

    const match = getSpecsForVariant(variant).find((spec) =>
      matchingKeys.has(getSpecKey(spec))
    );

    return match ? getSpecValue(match) : "";
  }

  function getResolvedValue(variant, key) {
    const variantValue = getVariantValue(variant, key);

    if (variantValue != null && String(variantValue).trim() !== "") {
      return variantValue;
    }

    const specValue = getSpecValueForVariant(variant, key);

    if (specValue != null && String(specValue).trim() !== "") {
      return specValue;
    }

    return "";
  }

  function getResolvedFuel(variant) {
    const aliases = ["fuel_type", "fuel", "primary_fuel", "default_fuel", "fuel_group"];

    for (const key of aliases) {
      const value = getResolvedValue(variant, key);
      if (String(value || "").trim()) {
        return String(value).trim();
      }
    }

    return "";
  }

  function getResolvedCategory(variant) {
    const aliases = ["category", "cooking_category", "cooking_style", "use_case"];

    for (const key of aliases) {
      const value = getResolvedValue(variant, key);
      if (String(value || "").trim()) {
        return String(value).trim();
      }
    }

    return "";
  }

  function buildSearchIndexValue(variant, brandName, familyName) {
    return [
      getVariantName(variant),
      getResolvedFuel(variant),
      getResolvedCategory(variant),
      getResolvedValue(variant, "sku"),
      getResolvedValue(variant, "model_number"),
      brandName || "",
      familyName || "",
    ]
      .join(" ")
      .toLowerCase();
  }

  function getAssetUrl(asset) {
    return getRemoteAssetUrl(asset);
  }

  function getHeroImageForVariant(variant) {
    const variantId = getVariantId(variant);
    if (!variantId) return "";

    const matchingAssets = assets
      .filter((asset) => {
        return (
          getEntityType(asset) === "variant" &&
          String(getEntityId(asset)) === String(variantId)
        );
      })
      .sort((a, b) => getSortOrder(a) - getSortOrder(b));

    const heroAsset =
      matchingAssets.find((asset) =>
        ["hero", "primary", "main"].includes(getImageType(asset))
      ) ||
      matchingAssets.find((asset) =>
        ["gallery", "image"].includes(getImageType(asset))
      ) ||
      matchingAssets[0];

    return heroAsset ? getAssetUrl(heroAsset) : "";
  }

  function getTopSpecsForVariant(variant) {
    const preferredResolvedKeys = [
      "fuel_type",
      "primary_cooking_area",
      "total_cooking_area",
      "product_width",
      "width",
      "temperature_range_max",
      "max_temp",
      "btu_output",
    ];

    const resolvedItems = preferredResolvedKeys
      .map((key) => {
        const value = getResolvedValue(variant, key);

        if (value == null || String(value).trim() === "") {
          return null;
        }

        return {
          spec_key: toDisplayLabel(key),
          spec_value: String(value).trim(),
        };
      })
      .filter(Boolean);

    const seenNormalized = new Set(
      resolvedItems.map((item) => normalizeResolverKey(item.spec_key))
    );

    const remainingSpecs = getSpecsForVariant(variant)
      .map((spec) => {
        const key =
          spec?.spec_label ||
          spec?.specLabel ||
          spec?.label ||
          spec?.spec_key ||
          spec?.specKey ||
          spec?.key ||
          "Spec";

        return {
          spec_key: String(key).trim(),
          spec_value: getSpecValue(spec) || "—",
          normalized_key: getSpecKey(spec),
          sort_order: getSortOrder(spec),
        };
      })
      .filter((item) => item.normalized_key && !seenNormalized.has(item.normalized_key))
      .sort((a, b) => a.sort_order - b.sort_order);

    return [...resolvedItems, ...remainingSpecs].slice(0, 3).map((item) => ({
      spec_key: item.spec_key,
      spec_value: item.spec_value,
    }));
  }

  const activeBrands = useMemo(() => {
    return [...brands]
      .filter(
        (brand) =>
          brand?.isActive !== false &&
          brand?.active !== false &&
          brand?.Active !== false
      )
      .sort((a, b) => String(getBrandName(a)).localeCompare(String(getBrandName(b))));
  }, [brands]);

  const fuelOptions = useMemo(() => {
    const fuelSet = new Set();

    variants.forEach((variant) => {
      const fuel = getResolvedFuel(variant);
      if (fuel) {
        fuelSet.add(fuel);
      }
    });

    return [...fuelSet].sort((a, b) => a.localeCompare(b));
  }, [variants, specs]);

  const filteredVariants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return variants.filter((variant) => {
      const family = getFamilyForVariant(variant);
      const brand = getBrandForVariant(variant, family);

      const familyName = getFamilyName(family);
      const brandName = getBrandName(brand);
      const variantFuel = getResolvedFuel(variant);
      const resolvedBrandId = getBrandId(brand);

      const matchesBrand =
        brandFilter === "all" ? true : String(resolvedBrandId) === String(brandFilter);

      const matchesFuel =
        fuelFilter === "all" ? true : String(variantFuel) === String(fuelFilter);

      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : buildSearchIndexValue(variant, brandName, familyName).includes(
              normalizedSearch
            );

      return matchesBrand && matchesFuel && matchesSearch;
    });
  }, [variants, brands, families, specs, searchTerm, brandFilter, fuelFilter]);

  function showFeedback(message) {
    setFeedbackMessage(message);

    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMessage("");
    }, 2200);
  }

  function handleCompareSelect(variantId) {
    const variant = variants.find(
      (item) => String(getVariantId(item)) === String(variantId)
    );

    if (!variant) {
      showFeedback("Unable to add this product to comparison.");
      return;
    }

    const result = addItem(getVariantId(variant));

    if (result.added) {
      showFeedback(`${getVariantName(variant)} added to comparison`);
      return;
    }

    if (result.reason === "duplicate") {
      showFeedback(`${getVariantName(variant)} is already in comparison`);
      return;
    }

    if (result.reason === "full") {
      showFeedback("Comparison tray is full. Remove one to add another.");
    }
  }

  return (
    <>
      <HomeHero />

      <main className="app-main product-browser-main">
        {catalogLoading ? (
          <section className="page-container product-browser-section">
            <div className="product-empty-state">
              <h3 className="product-empty-state-title">Loading catalog</h3>
              <p className="product-empty-state-text">
                Pulling the latest product data from R2.
              </p>
            </div>
          </section>
        ) : catalogError ? (
          <section className="page-container product-browser-section">
            <div className="product-empty-state">
              <h3 className="product-empty-state-title">Catalog failed to load</h3>
              <p className="product-empty-state-text">{catalogError}</p>
            </div>
          </section>
        ) : (
          <section className="page-container product-browser-section">
            <div className="product-browser-header">
              <div>
                <p className="product-browser-eyebrow">Product Lineup</p>
                <h2 className="product-browser-title">Browse Grills</h2>
              </div>

              <div className="product-browser-count">
                {filteredVariants.length} of {variants.length} products
              </div>
            </div>

            <div className="product-browser-controls">
              <div className="product-browser-control product-browser-control-search">
                <label className="product-browser-label" htmlFor="product-search">
                  Search
                </label>
                <input
                  id="product-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by brand, family, model, SKU..."
                  className="product-browser-input"
                />
              </div>

              <div className="product-browser-control">
                <label className="product-browser-label" htmlFor="brand-filter">
                  Brand
                </label>
                <select
                  id="brand-filter"
                  value={brandFilter}
                  onChange={(event) => setBrandFilter(event.target.value)}
                  className="product-browser-select"
                >
                  <option value="all">All Brands</option>
                  {activeBrands.map((brand) => (
                    <option key={getBrandId(brand)} value={getBrandId(brand)}>
                      {getBrandName(brand)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="product-browser-control">
                <label className="product-browser-label" htmlFor="fuel-filter">
                  Fuel
                </label>
                <select
                  id="fuel-filter"
                  value={fuelFilter}
                  onChange={(event) => setFuelFilter(event.target.value)}
                  className="product-browser-select"
                >
                  <option value="all">All Fuel Types</option>
                  {fuelOptions.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {feedbackMessage ? (
              <div className="compare-feedback-banner">{feedbackMessage}</div>
            ) : null}

            {filteredVariants.length > 0 ? (
              <div className="product-grid">
                {filteredVariants.map((variant) => {
                  
                  const variantId = getVariantId(variant);
                  const family = getFamilyForVariant(variant);
                  const brand = getBrandForVariant(variant, family);
                  const selected = store.items.includes(variantId);
  const heroImage = getHeroImageForVariant(variant);
  console.log("CARD DEBUG", {
    variantId,
    variantName: getVariantName(variant),
    heroImage,
  });
                  return (
                    <ProductCard
                      key={variantId}
                      variant={variant}
                      family={family}
                      brand={brand}
                      heroImage={heroImage}
                      topSpecs={getTopSpecsForVariant(variant)}
                      isSelected={selected}
                      onSelect={handleCompareSelect}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="product-empty-state">
                <h3 className="product-empty-state-title">No matching products</h3>
                <p className="product-empty-state-text">
                  Try changing your search or filter selections.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <ComparisonView
  brands={brands}
  families={families}
  variants={variants}
  assets={assets}
  specs={specs}
/>
    </>
  );
}