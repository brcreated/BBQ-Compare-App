import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function joinUrl(base, path) {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function resolveAssetUrl(base, path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (isAbsoluteUrl(value)) return value;
  return joinUrl(base, value);
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function cleanLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanLabel(value).toLowerCase();
}

function formatTitle(value) {
  return cleanLabel(value).replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function isTruthyFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "1", "yes", "y"].includes(normalized);
}

function isActiveRecord(record) {
  const value = record?.isActive ?? record?.active ?? true;

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  return !["false", "0", "no", "inactive"].includes(normalized);
}

function getRecordId(record) {
  return normalizeId(
    pickFirst(
      record?.id,
      record?.variant_id,
      record?.family_id,
      record?.brand_id,
      record?.entity_id
    )
  );
}

function getBrandId(record) {
  return normalizeId(
    pickFirst(
      record?.brandId,
      record?.brand_id,
      record?.brand,
      record?.brandSlug,
      record?.brand_slug
    )
  );
}

function getFamilyId(record) {
  return normalizeId(
    pickFirst(
      record?.familyId,
      record?.family_id,
      record?.family,
      record?.familySlug,
      record?.family_slug
    )
  );
}

function getVariantId(record) {
  return normalizeId(
    pickFirst(
      record?.variantId,
      record?.variant_id,
      record?.id,
      record?.entity_id
    )
  );
}

function getVariantName(variant, familyMap) {
  const family = familyMap.get(getFamilyId(variant));

  const familyName = cleanLabel(
    pickFirst(family?.name, family?.familyName, family?.family_name)
  );

  const variantName = cleanLabel(
    pickFirst(
      variant?.name,
      variant?.variantName,
      variant?.variant_name,
      variant?.title,
      variant?.label
    )
  );

  if (!familyName && !variantName) {
    return cleanLabel(
      pickFirst(variant?.id, variant?.variant_id, "Unnamed Product")
    );
  }

  if (!familyName) return variantName;
  if (!variantName) return familyName;

  const familyNorm = normalizeText(familyName);
  const variantNorm = normalizeText(variantName);

  if (
    variantNorm === familyNorm ||
    variantNorm.startsWith(`${familyNorm} `)
  ) {
    return variantName;
  }

  return `${familyName} ${variantName}`;
}

function getAssetType(asset) {
  return normalizeId(
    pickFirst(
      asset?.image_type,
      asset?.imageType,
      asset?.assetType,
      asset?.type
    )
  );
}

function getAssetEntityType(asset) {
  return normalizeId(pickFirst(asset?.entity_type, asset?.entityType));
}

function getAssetEntityId(asset) {
  return normalizeId(
    pickFirst(
      asset?.entity_id,
      asset?.entityId,
      asset?.variant_id,
      asset?.variantId,
      asset?.brand_id,
      asset?.brandId
    )
  );
}

function getAssetSortOrder(asset) {
  const raw = pickFirst(asset?.sort_order, asset?.sortOrder, 999999);
  const num = Number(raw);
  return Number.isFinite(num) ? num : 999999;
}

function getAssetFilePath(asset) {
  return pickFirst(
    asset?.file_path,
    asset?.filePath,
    asset?.url,
    asset?.src,
    asset?.path
  );
}

function getSpecEntityId(spec) {
  return normalizeId(
    pickFirst(
      spec?.entityId,
      spec?.entity_id,
      spec?.variantId,
      spec?.variant_id
    )
  );
}

function getSpecKey(spec) {
  return normalizeId(
    pickFirst(spec?.key, spec?.specKey, spec?.spec_key, spec?.label)
  );
}

function getSpecValue(spec) {
  return pickFirst(
    spec?.value,
    spec?.specValue,
    spec?.spec_value,
    spec?.displayValue,
    spec?.display_value
  );
}

function pickBestAssetForVariant(variantId, assets) {
  const matching = assets.filter((asset) => {
    if (!isActiveRecord(asset)) return false;

    const entityType = getAssetEntityType(asset);
    const entityId = getAssetEntityId(asset);

    if (entityType && entityType !== "variant") return false;

    return entityId === variantId;
  });

  if (matching.length === 0) return null;

  const heroAssets = matching
    .filter((asset) => getAssetType(asset) === "hero")
    .sort((a, b) => getAssetSortOrder(a) - getAssetSortOrder(b));

  if (heroAssets.length > 0) return heroAssets[0];

  return [...matching].sort(
    (a, b) => getAssetSortOrder(a) - getAssetSortOrder(b)
  )[0];
}

function formatPrice(value) {
  const amount = Number(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function numericPrice(value) {
  const amount = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function findVariantPrice(variant, specMap) {
  const directPrice = pickFirst(
    variant?.price,
    variant?.msrp,
    variant?.basePrice,
    variant?.base_price
  );

  if (directPrice !== "") {
    const formatted = formatPrice(directPrice);
    if (formatted) return formatted;
  }

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  for (const key of ["price", "msrp", "base_price", "sale_price", "starting_price"]) {
    const match = specs.find((spec) => getSpecKey(spec) === key);
    if (!match) continue;
    const formatted = formatPrice(getSpecValue(match));
    if (formatted) return formatted;
  }

  return "";
}

function findVariantPriceNumber(variant, specMap) {
  const directPrice = pickFirst(
    variant?.price,
    variant?.msrp,
    variant?.basePrice,
    variant?.base_price
  );

  if (directPrice !== "") {
    const parsed = numericPrice(directPrice);
    if (parsed !== null) return parsed;
  }

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  for (const key of ["price", "msrp", "base_price", "sale_price", "starting_price"]) {
    const match = specs.find((spec) => getSpecKey(spec) === key);
    if (!match) continue;
    const parsed = numericPrice(getSpecValue(match));
    if (parsed !== null) return parsed;
  }

  return null;
}

function findVariantCookingArea(variant, specMap) {
  const directArea = pickFirst(
    variant?.primaryCookingArea,
    variant?.primary_cooking_area,
    variant?.totalCookingArea,
    variant?.total_cooking_area
  );

  if (directArea !== "") {
    const num = Number(String(directArea).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(num)) return num;
  }

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  for (const key of ["primary_cooking_area", "total_cooking_area"]) {
    const match = specs.find((spec) => getSpecKey(spec) === key);
    if (!match) continue;
    const value = Number(String(getSpecValue(match)).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(value)) return value;
  }

  return null;
}

function findVariantSize(variant, specMap) {
  const directSize = cleanLabel(
    pickFirst(variant?.size, variant?.sizeLabel, variant?.size_label)
  );
  if (directSize) return directSize;

  const cookingArea = findVariantCookingArea(variant, specMap);
  if (cookingArea !== null) return `${cookingArea} sq in`;

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  for (const key of ["product_width", "width"]) {
    const match = specs.find((spec) => getSpecKey(spec) === key);
    if (!match) continue;
    const value = getSpecValue(match);
    if (value !== "") return `${value}" Wide`;
  }

  return "";
}

function getSizeBucket(area) {
  if (area === null) return "Unknown";
  if (area < 500) return "Small";
  if (area < 900) return "Medium";
  return "Large";
}

function findVariantFuelOptions(variant, specMap) {
  const rawFuel = cleanLabel(
    pickFirst(variant?.fuelType, variant?.fuel_type, variant?.fuel)
  );

  const normalizedFuel = rawFuel.toLowerCase();
  const supportsLpDirect = isTruthyFlag(
    pickFirst(variant?.supportsLP, variant?.supportsLp, variant?.supports_lp)
  );
  const supportsNgDirect = isTruthyFlag(
    pickFirst(
      variant?.supportsNaturalGas,
      variant?.supportsNaturalgas,
      variant?.supports_natural_gas,
      variant?.supportsNg,
      variant?.supports_ng
    )
  );

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  const supportsLpSpec = specs.find((spec) =>
    ["supportslp", "supports_lp", "lp_supported", "supports_propane"].includes(
      getSpecKey(spec)
    )
  );

  const supportsNgSpec = specs.find((spec) =>
    [
      "supportsnaturalgas",
      "supports_natural_gas",
      "supports_ng",
      "natural_gas_supported",
    ].includes(getSpecKey(spec))
  );

  const supportsLp =
    supportsLpDirect || isTruthyFlag(getSpecValue(supportsLpSpec));
  const supportsNg =
    supportsNgDirect || isTruthyFlag(getSpecValue(supportsNgSpec));

  if (supportsLp && supportsNg) return ["Propane", "Natural Gas"];
  if (supportsLp) return ["Propane"];
  if (supportsNg) return ["Natural Gas"];

  if (
    normalizedFuel.includes("natural gas") ||
    normalizedFuel === "ng" ||
    normalizedFuel.includes("naturalgas")
  ) {
    return ["Natural Gas"];
  }

  if (
    normalizedFuel.includes("propane") ||
    normalizedFuel === "lp" ||
    normalizedFuel.includes("liquid propane")
  ) {
    return ["Propane"];
  }

  if (normalizedFuel.includes("gas")) {
    return ["Propane"];
  }

  if (rawFuel) return [rawFuel];

  return [];
}

function BrandResults() {
  const navigate = useNavigate();
  const { brandId = "" } = useParams();

  const [brands, setBrands] = useState([]);
  const [families, setFamilies] = useState([]);
  const [variants, setVariants] = useState([]);
  const [assets, setAssets] = useState([]);
  const [specs, setSpecs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFuel, setSelectedFuel] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");

  const dataBaseUrl = import.meta.env.VITE_DATA_BASE_URL || "";
  const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL || "";
  const routeBrandId = normalizeId(brandId);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        if (!dataBaseUrl) {
          throw new Error("Missing VITE_DATA_BASE_URL");
        }

        const [
          brandsResponse,
          familiesResponse,
          variantsResponse,
          assetsResponse,
          specsResponse,
        ] = await Promise.all([
          fetch(joinUrl(dataBaseUrl, "brands.json")),
          fetch(joinUrl(dataBaseUrl, "families.json")),
          fetch(joinUrl(dataBaseUrl, "variants.json")),
          fetch(joinUrl(dataBaseUrl, "assets.json")),
          fetch(joinUrl(dataBaseUrl, "specs.json")),
        ]);

        const failedResponse = [
          brandsResponse,
          familiesResponse,
          variantsResponse,
          assetsResponse,
          specsResponse,
        ].find((response) => !response.ok);

        if (failedResponse) {
          throw new Error(`Failed to fetch ${failedResponse.url}`);
        }

        const [
          brandsJson,
          familiesJson,
          variantsJson,
          assetsJson,
          specsJson,
        ] = await Promise.all([
          brandsResponse.json(),
          familiesResponse.json(),
          variantsResponse.json(),
          assetsResponse.json(),
          specsResponse.json(),
        ]);

        if (cancelled) return;

        setBrands(Array.isArray(brandsJson) ? brandsJson : []);
        setFamilies(Array.isArray(familiesJson) ? familiesJson : []);
        setVariants(Array.isArray(variantsJson) ? variantsJson : []);
        setAssets(Array.isArray(assetsJson) ? assetsJson : []);
        setSpecs(Array.isArray(specsJson) ? specsJson : []);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load data"
        );
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [dataBaseUrl]);

  const familyMap = useMemo(() => {
    const map = new Map();

    families.forEach((family) => {
      const id = getRecordId(family);
      if (!id) return;
      map.set(id, family);
    });

    return map;
  }, [families]);

  const specMap = useMemo(() => {
    const map = new Map();

    specs.forEach((spec) => {
      const entityId = getSpecEntityId(spec);
      if (!entityId) return;

      if (!map.has(entityId)) {
        map.set(entityId, []);
      }

      map.get(entityId).push(spec);
    });

    return map;
  }, [specs]);

  const selectedBrand = useMemo(() => {
    return brands.find((brand) => getRecordId(brand) === routeBrandId) || null;
  }, [brands, routeBrandId]);

  const brandLogoUrl = useMemo(() => {
    if (!selectedBrand) return "";

    const directLogo = resolveAssetUrl(
      assetBaseUrl,
      pickFirst(
        selectedBrand?.logoUrl,
        selectedBrand?.logo_url,
        selectedBrand?.brandLogoUrl,
        selectedBrand?.brand_logo_url
      )
    );

    if (directLogo) return directLogo;

    const assetLogo = assets
      .filter((asset) => {
        if (!isActiveRecord(asset)) return false;

        const entityType = getAssetEntityType(asset);
        const entityId = getAssetEntityId(asset);
        const assetType = getAssetType(asset);

        return (
          entityType === "brand" &&
          entityId === routeBrandId &&
          ["logo", "brand-logo", "brand-logo-url", "brand-logo-image", "brand-logo-asset", "brand_logo"].includes(assetType)
        );
      })
      .sort((a, b) => getAssetSortOrder(a) - getAssetSortOrder(b))[0];

    if (!assetLogo) return "";

    return resolveAssetUrl(assetBaseUrl, getAssetFilePath(assetLogo));
  }, [selectedBrand, assets, assetBaseUrl, routeBrandId]);

  const filteredVariants = useMemo(() => {
    if (!routeBrandId) return [];

    return variants.filter((variant) => {
      if (!isActiveRecord(variant)) return false;

      const directBrandId = getBrandId(variant);
      if (directBrandId && directBrandId === routeBrandId) return true;

      const family = familyMap.get(getFamilyId(variant));
      if (!family || !isActiveRecord(family)) return false;

      return getBrandId(family) === routeBrandId;
    });
  }, [variants, familyMap, routeBrandId]);

  const productCards = useMemo(() => {
    return filteredVariants.map((variant) => {
      const variantId = getVariantId(variant);
      const bestAsset = pickBestAssetForVariant(variantId, assets);
      const filePath = getAssetFilePath(bestAsset);
      const imageUrl = filePath ? resolveAssetUrl(assetBaseUrl, filePath) : "";
      const cookingArea = findVariantCookingArea(variant, specMap);
      const fuelOptions = findVariantFuelOptions(variant, specMap);

      return {
        id: variantId || getRecordId(variant),
        name: getVariantName(variant, familyMap),
        imageUrl,
        price: findVariantPrice(variant, specMap),
        priceNumber: findVariantPriceNumber(variant, specMap),
        fuelOptions,
        fuelSummary:
          fuelOptions.length === 2
            ? "Propane / Natural Gas"
            : fuelOptions[0] || "",
        size: findVariantSize(variant, specMap),
        sizeBucket: getSizeBucket(cookingArea),
      };
    });
  }, [filteredVariants, assets, assetBaseUrl, familyMap, specMap]);

  const fuelOptions = useMemo(() => {
    const values = Array.from(
      new Set(productCards.flatMap((product) => product.fuelOptions))
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...values];
  }, [productCards]);

  const sizeOptions = useMemo(() => {
    const ordered = ["Small", "Medium", "Large"];
    const present = ordered.filter((value) =>
      productCards.some((product) => product.sizeBucket === value)
    );
    return ["All", ...present];
  }, [productCards]);

  const priceOptions = ["All", "Under $2,000", "$2,000–$4,999", "$5,000+"];

  const visibleProducts = useMemo(() => {
    return productCards.filter((product) => {
      if (
        selectedFuel !== "All" &&
        !product.fuelOptions.includes(selectedFuel)
      ) {
        return false;
      }

      if (selectedSize !== "All" && product.sizeBucket !== selectedSize) {
        return false;
      }

      if (selectedPrice !== "All") {
        if (product.priceNumber === null) return false;

        if (selectedPrice === "Under $2,000" && !(product.priceNumber < 2000)) {
          return false;
        }

        if (
          selectedPrice === "$2,000–$4,999" &&
          !(product.priceNumber >= 2000 && product.priceNumber < 5000)
        ) {
          return false;
        }

        if (selectedPrice === "$5,000+" && !(product.priceNumber >= 5000)) {
          return false;
        }
      }

      return true;
    });
  }, [productCards, selectedFuel, selectedSize, selectedPrice]);

  const brandLabel = pickFirst(
    selectedBrand?.name,
    selectedBrand?.brandName,
    selectedBrand?.brand_name,
    formatTitle(brandId)
  );

  return (
    <main className="brand-results-screen">
      <div className="ambient-light ambient-light-1" />
      <div className="ambient-light ambient-light-2" />
      <div className="ambient-light ambient-light-3" />

      <section className="brand-results-shell">
        <div className="brand-results-topbar">
          <button
            type="button"
            className="back-button interactive-button"
            onClick={() => navigate("/discover")}
          >
            <span className="button-sheen" />
            Back to Home
          </button>
        </div>

        <header className="brand-results-header interactive-panel">
          <div className="brand-results-header-content">
            {brandLogoUrl ? (
              <div className="brand-results-logo-wrap">
                <img
                  src={brandLogoUrl}
                  alt={`${brandLabel} logo`}
                  className="brand-results-logo"
                />
              </div>
            ) : null}

            <h1 className="brand-results-title">{brandLabel}</h1>
          </div>
        </header>

        <section className="brand-results-filters interactive-panel" aria-label="Product filters">
          <div className="filter-section">
            <div className="filter-group">
              <label className="filter-label" htmlFor="fuel-filter">
                Fuel Type
              </label>
              <select
                id="fuel-filter"
                className="filter-select"
                value={selectedFuel}
                onChange={(event) => setSelectedFuel(event.target.value)}
              >
                {fuelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label" htmlFor="size-filter">
                Cooking Size
              </label>
              <select
                id="size-filter"
                className="filter-select"
                value={selectedSize}
                onChange={(event) => setSelectedSize(event.target.value)}
              >
                {sizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label" htmlFor="price-filter">
                Price
              </label>
              <select
                id="price-filter"
                className="filter-select"
                value={selectedPrice}
                onChange={(event) => setSelectedPrice(event.target.value)}
              >
                {priceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group filter-group-reset">
              <button
                type="button"
                className="reset-button interactive-button"
                onClick={() => {
                  setSelectedFuel("All");
                  setSelectedSize("All");
                  setSelectedPrice("All");
                }}
              >
                <span className="button-sheen" />
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        <section className="brand-results-grid-section interactive-panel" aria-label="Products">
          {loading ? (
            <div className="brand-results-grid-placeholder">Loading...</div>
          ) : error ? (
            <div className="brand-results-grid-placeholder brand-results-error">
              {error}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="brand-results-grid-placeholder">
              No products match the current filters.
            </div>
          ) : (
            <div className="brand-results-grid">
              {visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="product-card interactive-button"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/product/${product.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/product/${product.id}`);
                    }
                  }}
                >
                  <span className="button-sheen" />

                  <div className="product-image-wrap">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="product-image-fallback">No Image</div>
                    )}
                  </div>

                  <div className="product-info">
                    <div className="product-top">
                      <h3 className="product-title">{product.name}</h3>
                    </div>

                    <div className="product-spec-row">
                      {product.fuelSummary ? (
                        <span className="product-badge">{product.fuelSummary}</span>
                      ) : null}

                      {product.size ? (
                        <span className="product-badge">{product.size}</span>
                      ) : null}
                    </div>

                    <div className="product-bottom">
                      <div className="product-price">
                        {product.price || "View Details"}
                      </div>

                      <button
                        type="button"
                        className="product-action interactive-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        <span className="button-sheen" />
                        View Product
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .brand-results-screen {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 14%, rgba(76, 110, 168, 0.09), transparent 28%),
            radial-gradient(circle at 82% 88%, rgba(76, 110, 168, 0.08), transparent 32%),
            linear-gradient(180deg, #0a0d12 0%, #0f141b 48%, #090c11 100%);
          color: #e6edf7;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

        .brand-results-shell {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          width: 100%;
          padding: 22px 28px 24px;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: auto auto auto 1fr;
          gap: 16px;
        }

        .brand-results-topbar {
          display: flex;
          justify-content: flex-start;
        }

        .interactive-panel {
          position: relative;
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.018));
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(18px);
          overflow: hidden;
          transition:
            transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 260ms ease,
            box-shadow 260ms ease,
            background 260ms ease;
        }

        .interactive-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 35%),
            radial-gradient(circle at top center, rgba(90, 120, 180, 0.06), transparent 42%);
        }

        .interactive-panel:hover {
          transform: translateY(-2px);
          border-color: rgba(110, 145, 210, 0.17);
          box-shadow:
            0 30px 74px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .interactive-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 220ms ease,
            border-color 220ms ease,
            filter 220ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .interactive-button:hover {
          filter: brightness(1.03);
        }

        .interactive-button:active {
          transform: scale(0.985);
        }

        .interactive-button:focus-visible {
          outline: 2px solid rgba(122, 157, 219, 0.5);
          outline-offset: 2px;
        }

        .button-sheen {
          position: absolute;
          inset: -120% auto auto -40%;
          width: 38%;
          height: 260%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(20deg);
          pointer-events: none;
          opacity: 0;
          transition: opacity 220ms ease;
        }

        .interactive-button:hover .button-sheen {
          opacity: 1;
          animation: sheenSweep 900ms cubic-bezier(0.22, 1, 0.36, 1) 1;
        }

        .back-button {
          min-width: 220px;
          height: 64px;
          padding: 0 22px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(180deg, #5a78a8 0%, #435d83 100%);
          color: #f7fbff;
          font-size: 0.96rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 16px 34px rgba(67, 93, 131, 0.32);
          cursor: pointer;
        }

        .back-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 40px rgba(67, 93, 131, 0.38);
        }

        .brand-results-header {
          min-height: 220px;
          padding: 34px 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .brand-results-header-content {
          position: relative;
          z-index: 1;
          display: grid;
          justify-items: center;
          gap: 18px;
          max-width: 860px;
        }

        .brand-results-logo-wrap {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-results-logo {
          max-height: 72px;
          max-width: 320px;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .brand-results-title {
          margin: 0;
          font-size: clamp(2.6rem, 4vw, 4.3rem);
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f2f6fb;
        }

        .brand-results-filters,
        .brand-results-grid-section {
          padding: 20px 22px;
          box-sizing: border-box;
        }

        .filter-section {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          align-items: end;
        }

        .filter-group {
          display: grid;
          gap: 10px;
        }

        .filter-label {
          font-size: 0.86rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(230, 237, 247, 0.8);
        }

        .filter-select {
          width: 100%;
          height: 60px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(15, 22, 32, 0.82);
          color: #f4f7fc;
          font-size: 1rem;
          font-weight: 700;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
          outline: none;
        }

        .filter-select:focus {
          border-color: rgba(110, 145, 210, 0.28);
        }

        .reset-button {
          width: 100%;
          height: 60px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(180deg, #5a78a8 0%, #435d83 100%);
          color: #f7fbff;
          font-size: 0.96rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 16px 34px rgba(67, 93, 131, 0.32);
          cursor: pointer;
        }

        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 40px rgba(67, 93, 131, 0.38);
        }

        .brand-results-grid-placeholder {
          min-height: 140px;
          border: 2px dashed rgba(148, 163, 184, 0.22);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(203, 213, 225, 0.72);
          font-weight: 700;
          padding: 24px;
          position: relative;
          z-index: 1;
        }

        .brand-results-error {
          color: #fecaca;
          border-color: rgba(248, 113, 113, 0.35);
          background: rgba(127, 29, 29, 0.16);
        }

        .brand-results-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .product-card {
          min-height: 470px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(18, 24, 33, 0.96);
          box-shadow:
            0 22px 42px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }

        .product-card:hover {
          transform: translateY(-4px);
          border-color: rgba(110, 145, 210, 0.24);
          box-shadow: 0 24px 44px rgba(0, 0, 0, 0.32);
        }

        .product-image-wrap {
          height: 280px;
          padding: 18px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at top center, rgba(76, 110, 168, 0.08), transparent 46%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
        }

        .product-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .product-image-fallback {
          font-size: 1rem;
          font-weight: 800;
          color: rgba(230, 237, 247, 0.42);
        }

        .product-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px;
        }

        .product-top {
          min-height: 72px;
        }

        .product-title {
          margin: 0;
          font-size: 1.38rem;
          line-height: 1.18;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #f4f7fc;
        }

        .product-spec-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          min-height: 40px;
        }

        .product-badge {
          display: inline-flex;
          align-items: center;
          min-height: 36px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(230, 237, 247, 0.9);
          font-size: 0.88rem;
          font-weight: 700;
        }

        .product-bottom {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .product-price {
          font-size: 1.32rem;
          line-height: 1.1;
          font-weight: 900;
          color: #f7fbff;
        }

        .product-action {
          min-width: 170px;
          height: 56px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(180deg, #5a78a8 0%, #435d83 100%);
          color: #f7fbff;
          font-size: 0.92rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 16px 34px rgba(67, 93, 131, 0.32);
          cursor: pointer;
        }

        .product-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 40px rgba(67, 93, 131, 0.38);
        }

        @keyframes ambientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(18px, -12px, 0) scale(1.04);
          }
        }

        @keyframes sheenSweep {
          0% {
            transform: translateX(-180%) rotate(20deg);
          }
          100% {
            transform: translateX(480%) rotate(20deg);
          }
        }

        @media (max-width: 1400px) {
          .filter-section,
          .brand-results-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 1024px) {
          .brand-results-shell {
            padding: 18px 20px 20px;
          }

          .filter-section,
          .brand-results-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .filter-section,
          .brand-results-grid {
            grid-template-columns: 1fr;
          }

          .product-bottom {
            flex-direction: column;
            align-items: stretch;
          }

          .product-action,
          .back-button,
          .reset-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

export default BrandResults;