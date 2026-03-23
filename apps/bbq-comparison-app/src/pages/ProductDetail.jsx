import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/showroom.css";

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function buildDataUrl(baseUrl, fileName) {
  return `${baseUrl}/${fileName}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.json();
}

function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function readFirst(obj, keys, fallback = "") {
  if (!obj || typeof obj !== "object") return fallback;

  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function matchesId(value, target) {
  return normalizeId(value) === normalizeId(target);
}

function getVariantCandidateIds(variant) {
  return [
    variant?.id,
    variant?.variant_id,
    variant?.variantId,
    variant?.sku,
    variant?.handle,
    variant?.slug,
    variant?.productId,
    variant?.product_id,
    variant?.entityId,
    variant?.entity_id,
    variant?.name,
    variant?.variant_name,
    variant?.variantName,
    variant?.title,
    variant?.label,
  ].filter(Boolean);
}

function findVariantByProductId(variants, productId) {
  const normalizedTarget = normalizeId(productId);

  if (!normalizedTarget) return null;

  const exactMatch =
    variants.find((variant) =>
      getVariantCandidateIds(variant).some(
        (candidate) => normalizeId(candidate) === normalizedTarget
      )
    ) || null;

  if (exactMatch) return exactMatch;

  const looseMatch =
    variants.find((variant) =>
      getVariantCandidateIds(variant).some((candidate) => {
        const normalizedCandidate = normalizeId(candidate);
        return (
          normalizedCandidate.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedCandidate)
        );
      })
    ) || null;

  return looseMatch;
}

function getVariantId(variant) {
  return readFirst(variant, [
    "id",
    "variant_id",
    "variantId",
    "sku",
    "handle",
    "slug",
    "productId",
    "product_id",
  ]);
}

function getFamilyId(variant) {
  return readFirst(variant, ["familyId", "family_id", "family"]);
}

function getBrandId(variant) {
  return readFirst(variant, ["brandId", "brand_id", "brand"]);
}

function findFamily(families, familyId) {
  return (
    families.find((family) =>
      [family?.id, family?.family_id, family?.familyId].some((value) =>
        matchesId(value, familyId)
      )
    ) || null
  );
}

function findBrand(brands, brandId, family) {
  const familyBrandId = readFirst(family, ["brandId", "brand_id", "brand"]);
  const resolvedBrandId = brandId || familyBrandId;

  return (
    brands.find((brand) =>
      [brand?.id, brand?.brand_id, brand?.brandId].some((value) =>
        matchesId(value, resolvedBrandId)
      )
    ) || null
  );
}

function filterVariantSpecs(specs, variantId) {
  return specs.filter((spec) => {
    const entityType = normalizeId(readFirst(spec, ["entityType", "entity_type"]));
    const entityId = readFirst(spec, ["entityId", "entity_id"]);
    const linkedVariantId = readFirst(spec, ["variantId", "variant_id"]);

    if (matchesId(linkedVariantId, variantId)) return true;
    if (entityType === "variant" && matchesId(entityId, variantId)) return true;
    if (!entityType && matchesId(entityId, variantId)) return true;

    return false;
  });
}

function filterVariantAssets(assets, variantId) {
  return assets.filter((asset) => {
    const entityType = normalizeId(readFirst(asset, ["entityType", "entity_type"]));
    const entityId = readFirst(asset, ["entityId", "entity_id"]);
    const linkedVariantId = readFirst(asset, ["variantId", "variant_id"]);

    if (matchesId(linkedVariantId, variantId)) return true;
    if (entityType === "variant" && matchesId(entityId, variantId)) return true;
    if (!entityType && matchesId(entityId, variantId)) return true;

    return false;
  });
}

function filterVariantColors(colors, variantId) {
  return colors.filter((color) => {
    const entityType = normalizeId(readFirst(color, ["entityType", "entity_type"]));
    const entityId = readFirst(color, ["entityId", "entity_id"]);
    const linkedVariantId = readFirst(color, ["variantId", "variant_id"]);

    if (matchesId(linkedVariantId, variantId)) return true;
    if (entityType === "variant" && matchesId(entityId, variantId)) return true;
    if (!entityType && matchesId(entityId, variantId)) return true;

    return false;
  });
}

function filterBrandAssets(assets, brandId) {
  return assets.filter((asset) => {
    const entityType = normalizeId(readFirst(asset, ["entityType", "entity_type"]));
    const entityId = readFirst(asset, ["entityId", "entity_id"]);
    const linkedBrandId = readFirst(asset, ["brandId", "brand_id"]);

    if (matchesId(linkedBrandId, brandId)) return true;
    if (entityType === "brand" && matchesId(entityId, brandId)) return true;
    if (!entityType && matchesId(entityId, brandId)) return true;

    return false;
  });
}

function getVariantName(variant) {
  return readFirst(
    variant,
    ["name", "variantName", "variant_name", "title", "label"],
    "Unknown Product"
  );
}

function getFamilyName(family) {
  return readFirst(family, ["name", "familyName", "family_name", "title"], "");
}

function getBrandName(brand) {
  return readFirst(brand, ["name", "brandName", "brand_name", "title"], "");
}

function getBrandLogoField(brand) {
  return readFirst(brand, [
    "logoUrl",
    "logo_url",
    "brandLogoUrl",
    "brand_logo_url",
    "image",
    "imageUrl",
  ]);
}

function getBrandFullName(brand) {
  return (
    readFirst(brand, ["displayName", "display_name", "fullName", "full_name"], "") ||
    getBrandName(brand)
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "";

  const numberValue =
    typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));

  if (Number.isNaN(numberValue)) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function findSpecValueByKeys(specs, keys) {
  const normalizedKeys = keys.map((key) => normalizeId(key));

  const matched = specs.find((spec) => {
    const specKey = normalizeId(readFirst(spec, ["key", "label", "name"]));
    return normalizedKeys.some(
      (key) => specKey === key || specKey.includes(key) || key.includes(specKey)
    );
  });

  if (!matched) return "";

  const value = readFirst(matched, ["displayValue", "display_value", "value"]);
  const unit = readFirst(matched, ["unit"], "");

  return [value, unit].filter(Boolean).join(" ");
}

function findVariantPrice(variant, specs) {
  const directPrice = readFirst(variant, [
    "price",
    "msrp",
    "basePrice",
    "base_price",
    "salePrice",
    "sale_price",
  ]);

  if (directPrice !== "") {
    const formatted = formatCurrency(directPrice);
    if (formatted) return formatted;
  }

  const priceSpec = specs.find((spec) => {
    const key = normalizeId(readFirst(spec, ["key", "label", "name"]));
    return key.includes("price") || key.includes("msrp");
  });

  if (priceSpec) {
    const formatted = formatCurrency(
      readFirst(priceSpec, ["value", "displayValue", "display_value"])
    );
    if (formatted) return formatted;
  }

  return "Call for Price";
}

function findFuelSummary(variant, specs) {
  const directFuel = readFirst(variant, ["fuelType", "fuel_type", "fuel"]);
  const supportsLP = readFirst(variant, ["supportsLP", "supportsLp", "supports_lp"]);
  const supportsNG = readFirst(variant, [
    "supportsNaturalGas",
    "supports_natural_gas",
    "supportsNg",
  ]);

  const specFuel =
    findSpecValueByKeys(specs, ["fuel_type", "fuel", "fuel type"]) ||
    findSpecValueByKeys(specs, ["gas_type", "gas type"]);

  const lpSpec = findSpecValueByKeys(specs, ["supports_lp", "supportslp"]);
  const ngSpec = findSpecValueByKeys(
    specs,
    ["supports_natural_gas", "supportsnaturalgas", "supports_ng", "supportsng"]
  );

  const normalizedFuel = String(directFuel || specFuel || "").trim();

  const lpEnabled =
    String(supportsLP || lpSpec).toLowerCase() === "true" ||
    String(supportsLP || lpSpec).toLowerCase() === "yes";

  const ngEnabled =
    String(supportsNG || ngSpec).toLowerCase() === "true" ||
    String(supportsNG || ngSpec).toLowerCase() === "yes";

  if (lpEnabled && ngEnabled) return "Propane / Natural Gas";
  if (lpEnabled) return "Propane";
  if (ngEnabled) return "Natural Gas";
  if (normalizedFuel) return normalizedFuel;

  return "Fuel Info Available";
}

function findCookingSizeSummary(variant, specs) {
  const directSize = readFirst(variant, ["size", "sizeLabel", "size_label"]);
  if (directSize) return directSize;

  const totalArea =
    readFirst(variant, ["totalCookingArea", "total_cooking_area"]) ||
    findSpecValueByKeys(specs, ["total_cooking_area", "total cooking area"]);

  const primaryArea =
    readFirst(variant, ["primaryCookingArea", "primary_cooking_area"]) ||
    findSpecValueByKeys(specs, ["primary_cooking_area", "primary cooking area"]);

  const width =
    readFirst(variant, ["productWidth", "product_width", "width"]) ||
    findSpecValueByKeys(specs, ["product_width", "width"]);

  if (totalArea) return `${totalArea} sq in total`;
  if (primaryArea) return `${primaryArea} sq in primary`;
  if (width) return `${width} in wide`;

  return "See Specs";
}

function findInstallSummary(variant, specs) {
  const directInstall = readFirst(variant, [
    "installType",
    "install_type",
    "installationType",
    "installation_type",
  ]);

  if (directInstall) return directInstall;

  return (
    findSpecValueByKeys(specs, ["install_type", "installation_type", "installation"]) ||
    "Installation Info"
  );
}

function findFactValue(variant, specs, variantKeys, specKeys, fallback = "—") {
  const direct = readFirst(variant, variantKeys, "");
  if (direct !== "") return String(direct);

  const specValue = findSpecValueByKeys(specs, specKeys);
  if (specValue) return specValue;

  return fallback;
}

function getAssetType(asset) {
  return normalizeId(
    readFirst(asset, ["imageType", "image_type", "assetType", "asset_type", "type"])
  );
}

function getAssetSortOrder(asset) {
  const raw = readFirst(asset, ["sortOrder", "sort_order"], 9999);
  const num = Number(raw);
  return Number.isFinite(num) ? num : 9999;
}

function isAssetActive(asset) {
  const value = readFirst(asset, ["active", "isActive", "is_active"], true);

  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return true;

  return !["false", "0", "no", "inactive"].includes(normalized);
}

function resolveAssetUrl(assetLikeValue, assetBaseUrl) {
  const raw = String(assetLikeValue || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;
  if (!assetBaseUrl) return raw.replace(/^\/+/, "");

  return `${assetBaseUrl}/${raw.replace(/^\/+/, "")}`;
}

function resolveAssetRecordUrl(asset, assetBaseUrl) {
  const raw =
    readFirst(asset, ["url", "src", "sourceUrl", "source_url"]) ||
    readFirst(asset, ["filePath", "file_path", "path"]);

  return resolveAssetUrl(raw, assetBaseUrl);
}

function getAssetAlt(asset, fallbackTitle) {
  return (
    readFirst(asset, ["altText", "alt_text", "title", "name"], "") ||
    fallbackTitle ||
    "Product image"
  );
}

function getColorId(color) {
  return readFirst(color, ["id", "colorId", "color_id", "name", "label"]);
}

function getColorName(color) {
  return readFirst(color, ["name", "label", "title", "displayName", "display_name"], "Color");
}

function getColorSwatch(color) {
  return readFirst(
    color,
    ["hex", "hexCode", "hex_code", "swatchHex", "swatch_hex", "value"],
    ""
  );
}

function buildGalleryAssets(assets, assetBaseUrl, fallbackTitle) {
  const activeAssets = assets.filter(isAssetActive);

  const normalized = activeAssets
    .map((asset, index) => {
      const url = resolveAssetRecordUrl(asset, assetBaseUrl);

      return {
        key: `${readFirst(asset, ["id", "asset_id", "fileName", "file_name"], "asset")}-${index}`,
        url,
        alt: getAssetAlt(asset, fallbackTitle),
        type: getAssetType(asset),
        sortOrder: getAssetSortOrder(asset),
        colorId: normalizeId(readFirst(asset, ["colorId", "color_id"])),
      };
    })
    .filter((asset) => Boolean(asset.url));

  const typeRank = (type) => {
    if (type === "hero") return 0;
    if (type === "main") return 1;
    if (type === "gallery") return 2;
    if (type === "logo") return 0;
    return 3;
  };

  const sorted = normalized.sort((a, b) => {
    const rankDiff = typeRank(a.type) - typeRank(b.type);
    if (rankDiff !== 0) return rankDiff;

    const sortDiff = a.sortOrder - b.sortOrder;
    if (sortDiff !== 0) return sortDiff;

    return a.url.localeCompare(b.url);
  });

  const deduped = [];
  const seen = new Set();

  for (const asset of sorted) {
    if (seen.has(asset.url)) continue;
    seen.add(asset.url);
    deduped.push(asset);
  }

  return deduped;
}

function normalizeTruth(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return "Yes";
  if (["false", "no", "0"].includes(normalized)) return "No";
  return String(value || "");
}

function buildKeyFacts(variant, specs) {
  const facts = [
    {
      label: "Primary Cooking Area",
      value: findFactValue(
        variant,
        specs,
        ["primaryCookingArea", "primary_cooking_area"],
        ["primary_cooking_area", "primary cooking area"]
      ),
    },
    {
      label: "Total Cooking Area",
      value: findFactValue(
        variant,
        specs,
        ["totalCookingArea", "total_cooking_area"],
        ["total_cooking_area", "total cooking area"]
      ),
    },
    {
      label: "Width",
      value: findFactValue(
        variant,
        specs,
        ["productWidth", "product_width", "width"],
        ["product_width", "width"]
      ),
    },
    {
      label: "Installation",
      value: findInstallSummary(variant, specs),
    },
  ];

  return facts.filter((fact) => fact.value && fact.value !== "—").slice(0, 4);
}

function buildDisplayTitle(variant, family, selectedColorName) {
  const familyName = getFamilyName(family).trim();
  const variantName = getVariantName(variant).trim();
  const colorName = String(selectedColorName || "").trim();

  const normFamily = normalizeId(familyName);
  const normVariant = normalizeId(variantName);
  const normColor = normalizeId(colorName);

  if (familyName && colorName) {
    const familyAlreadyHasColor = normFamily.includes(normColor);
    const variantLooksLikeColorOnly =
      !!variantName &&
      !normVariant.includes(normFamily) &&
      (normVariant === normColor || normColor.includes(normVariant) || normVariant.includes(normColor));

    if (!familyAlreadyHasColor) {
      return `${familyName} ${colorName}`;
    }

    if (variantLooksLikeColorOnly) {
      return `${familyName} ${colorName}`;
    }
  }

  if (familyName && variantName) {
    if (normVariant === normFamily) return familyName;
    if (normVariant.includes(normFamily)) return variantName;
    if (normFamily.includes(normVariant)) return familyName;
    return `${familyName} ${variantName}`;
  }

  return familyName || variantName || "Unknown Product";
}

function resolveBrandLogo(brand, brandAssets, assetBaseUrl) {
  const directLogo = getBrandLogoField(brand);
  if (directLogo) {
    return resolveAssetUrl(directLogo, assetBaseUrl);
  }

  const activeAssets = brandAssets.filter(isAssetActive);

  const preferred =
    activeAssets.find((asset) => {
      const type = getAssetType(asset);
      return type === "logo" || type === "brand-logo" || type === "main";
    }) || activeAssets[0];

  if (!preferred) return "";

  return resolveAssetRecordUrl(preferred, assetBaseUrl);
}

export default function ProductDetail() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const dataBaseUrl = useMemo(
    () => normalizeBaseUrl(import.meta.env.VITE_DATA_BASE_URL),
    []
  );

  const assetBaseUrl = useMemo(
    () => normalizeBaseUrl(import.meta.env.VITE_ASSET_BASE_URL),
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState("");

  const [datasets, setDatasets] = useState({
    variants: [],
    families: [],
    brands: [],
    specs: [],
    assets: [],
    colors: [],
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadDatasets() {
      try {
        setLoading(true);
        setError("");

        if (!dataBaseUrl) {
          throw new Error("VITE_DATA_BASE_URL is missing.");
        }

        const [
          variantsRaw,
          familiesRaw,
          brandsRaw,
          specsRaw,
          assetsRaw,
          colorsRaw,
        ] = await Promise.all([
          fetchJson(buildDataUrl(dataBaseUrl, "variants.json")),
          fetchJson(buildDataUrl(dataBaseUrl, "families.json")),
          fetchJson(buildDataUrl(dataBaseUrl, "brands.json")),
          fetchJson(buildDataUrl(dataBaseUrl, "specs.json")),
          fetchJson(buildDataUrl(dataBaseUrl, "assets.json")),
          fetchJson(buildDataUrl(dataBaseUrl, "colors.json")),
        ]);

        if (isCancelled) return;

        setDatasets({
          variants: ensureArray(variantsRaw),
          families: ensureArray(familiesRaw),
          brands: ensureArray(brandsRaw),
          specs: ensureArray(specsRaw),
          assets: ensureArray(assetsRaw),
          colors: ensureArray(colorsRaw),
        });
      } catch (err) {
        if (isCancelled) return;
        setError(err?.message || "Failed to load product datasets.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDatasets();

    return () => {
      isCancelled = true;
    };
  }, [dataBaseUrl]);

  const resolvedProduct = useMemo(() => {
    const variant = findVariantByProductId(datasets.variants, productId);
    const variantId = getVariantId(variant);
    const family = findFamily(datasets.families, getFamilyId(variant));
    const brand = findBrand(datasets.brands, getBrandId(variant), family);
    const brandId = readFirst(brand, ["id", "brandId", "brand_id"]);
    const variantSpecs = variantId ? filterVariantSpecs(datasets.specs, variantId) : [];
    const variantAssets = variantId ? filterVariantAssets(datasets.assets, variantId) : [];
    const variantColors = variantId ? filterVariantColors(datasets.colors, variantId) : [];
    const brandAssets = brandId ? filterBrandAssets(datasets.assets, brandId) : [];

    return {
      variant,
      variantId,
      family,
      brand,
      variantSpecs,
      variantAssets,
      variantColors,
      brandAssets,
    };
  }, [datasets, productId]);

  const productNotFound = !loading && !error && !resolvedProduct.variant;

  const normalizedColors = useMemo(() => {
    return resolvedProduct.variantColors.map((color, index) => ({
      key: `${getColorId(color) || "color"}-${index}`,
      id: normalizeId(getColorId(color)),
      name: getColorName(color),
      swatch: getColorSwatch(color),
    }));
  }, [resolvedProduct.variantColors]);

  useEffect(() => {
    if (!normalizedColors.length) {
      setSelectedColorId("");
      return;
    }

    setSelectedColorId((current) => {
      if (current && normalizedColors.some((color) => color.id === current)) {
        return current;
      }
      return normalizedColors[0].id;
    });
  }, [normalizedColors]);

  const selectedColorName = useMemo(() => {
    const selected = normalizedColors.find((color) => color.id === selectedColorId);
    return selected?.name || "";
  }, [normalizedColors, selectedColorId]);

  const displayTitle = useMemo(() => {
    if (!resolvedProduct.variant) return productId || "Unknown Product";
    return buildDisplayTitle(
      resolvedProduct.variant,
      resolvedProduct.family,
      selectedColorName
    );
  }, [resolvedProduct, productId, selectedColorName]);

  const displayPrice = useMemo(() => {
    if (!resolvedProduct.variant) return "Call for Price";
    return findVariantPrice(resolvedProduct.variant, resolvedProduct.variantSpecs);
  }, [resolvedProduct]);

  const headerBadges = useMemo(() => {
    if (!resolvedProduct.variant) return ["Fuel Type", "Cooking Size", "Installation"];
    return [
      findFuelSummary(resolvedProduct.variant, resolvedProduct.variantSpecs),
      findCookingSizeSummary(resolvedProduct.variant, resolvedProduct.variantSpecs),
      findInstallSummary(resolvedProduct.variant, resolvedProduct.variantSpecs),
    ];
  }, [resolvedProduct]);

  const brandLogoUrl = useMemo(() => {
    return resolveBrandLogo(
      resolvedProduct.brand,
      resolvedProduct.brandAssets,
      assetBaseUrl
    );
  }, [resolvedProduct.brand, resolvedProduct.brandAssets, assetBaseUrl]);

  const allGalleryAssets = useMemo(() => {
    return buildGalleryAssets(
      resolvedProduct.variantAssets,
      assetBaseUrl,
      displayTitle
    );
  }, [resolvedProduct.variantAssets, assetBaseUrl, displayTitle]);

  const galleryAssets = useMemo(() => {
    if (!selectedColorId) return allGalleryAssets;

    const matchingColorAssets = allGalleryAssets.filter(
      (asset) => asset.colorId && asset.colorId === selectedColorId
    );

    return matchingColorAssets.length > 0 ? matchingColorAssets : allGalleryAssets;
  }, [allGalleryAssets, selectedColorId]);

  const selectedGalleryImage =
    galleryAssets[selectedImageIndex] || galleryAssets[0] || null;

  const keyFacts = useMemo(() => {
    if (!resolvedProduct.variant) return [];
    return buildKeyFacts(resolvedProduct.variant, resolvedProduct.variantSpecs);
  }, [resolvedProduct]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId, selectedColorId]);

  useEffect(() => {
    if (selectedImageIndex > galleryAssets.length - 1) {
      setSelectedImageIndex(0);
    }
  }, [galleryAssets, selectedImageIndex]);

  function goToPreviousImage() {
    if (galleryAssets.length <= 1) return;

    setSelectedImageIndex((currentIndex) => {
      if (currentIndex <= 0) return galleryAssets.length - 1;
      return currentIndex - 1;
    });
  }

  function goToNextImage() {
    if (galleryAssets.length <= 1) return;

    setSelectedImageIndex((currentIndex) => {
      if (currentIndex >= galleryAssets.length - 1) return 0;
      return currentIndex + 1;
    });
  }

  return (
    <div className="showroom-page">
      <div className="showroom-ambient showroom-ambient-1" />
      <div className="showroom-ambient showroom-ambient-2" />
      <div className="showroom-ambient showroom-ambient-3" />

      <div className="showroom-shell">
        <section className="showroom-panel" style={heroPanelStyles}>
          {loading ? (
            <div style={stateWrapStyles}>
              <div className="showroom-card" style={stateCardStyles}>
                <div className="showroom-sheen" />
                <div style={stateEyebrowStyles}>Loading</div>
                <h1 className="showroom-title" style={stateTitleStyles}>
                  Loading Product Data
                </h1>
                <div style={stateTextStyles}>
                  Fetching the selected product and related records.
                </div>
              </div>
            </div>
          ) : error ? (
            <div style={stateWrapStyles}>
              <div className="showroom-card" style={stateCardStyles}>
                <div className="showroom-sheen" />
                <div style={stateEyebrowStyles}>Error</div>
                <h1 className="showroom-title" style={stateTitleStyles}>
                  Failed to Load Product Data
                </h1>
                <div style={stateTextStyles}>{error}</div>
              </div>
            </div>
          ) : productNotFound ? (
            <div style={stateWrapStyles}>
              <div className="showroom-card" style={stateCardStyles}>
                <div className="showroom-sheen" />
                <div style={stateEyebrowStyles}>Not Found</div>
                <h1 className="showroom-title" style={stateTitleStyles}>
                  Product Not Found
                </h1>
                <div style={stateTextStyles}>
                  No variant matched this route product ID.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="showroom-card" style={heroImageCardStyles}>
                <div className="showroom-sheen" />

                {selectedGalleryImage ? (
                  <>
                    <button
                      type="button"
                      style={{
                        ...galleryArrowStyles,
                        ...galleryArrowLeftStyles,
                        ...(galleryAssets.length <= 1 ? galleryArrowDisabledStyles : {}),
                      }}
                      onClick={goToPreviousImage}
                      disabled={galleryAssets.length <= 1}
                      aria-label="Previous product image"
                    >
                      ‹
                    </button>

                    <img
                      src={selectedGalleryImage.url}
                      alt={selectedGalleryImage.alt}
                      style={heroImageStyles}
                    />

                    <button
                      type="button"
                      style={{
                        ...galleryArrowStyles,
                        ...galleryArrowRightStyles,
                        ...(galleryAssets.length <= 1 ? galleryArrowDisabledStyles : {}),
                      }}
                      onClick={goToNextImage}
                      disabled={galleryAssets.length <= 1}
                      aria-label="Next product image"
                    >
                      ›
                    </button>

                    {galleryAssets.length > 1 ? (
                      <div style={galleryCounterStyles}>
                        {selectedImageIndex + 1} / {galleryAssets.length}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div style={heroImagePlaceholderStyles}>No Product Image</div>
                )}
              </div>

              <div style={productIdentityBlockStyles}>
                {brandLogoUrl ? (
                  <div style={brandLogoWrapStyles}>
                    <img
                      src={brandLogoUrl}
                      alt={getBrandFullName(resolvedProduct.brand) || "Brand logo"}
                      style={brandLogoStyles}
                    />
                  </div>
                ) : null}

                <h1 className="showroom-title" style={productTitleStyles}>
                  {displayTitle}
                </h1>

                <div style={priceStyles}>{displayPrice}</div>

                {normalizedColors.length > 1 ? (
                  <div style={colorSelectorWrapStyles}>
                    <div style={colorSelectorLabelStyles}>Available Colors</div>

                    <div style={colorSelectorRowStyles}>
                      {normalizedColors.map((color) => {
                        const isActive = color.id === selectedColorId;

                        return (
                          <button
                            key={color.key}
                            type="button"
                            onClick={() => setSelectedColorId(color.id)}
                            className="showroom-button-secondary"
                            style={{
                              ...colorChipStyles,
                              ...(isActive ? colorChipActiveStyles : {}),
                            }}
                          >
                            {color.swatch ? (
                              <span
                                style={{
                                  ...colorSwatchStyles,
                                  background: color.swatch,
                                }}
                              />
                            ) : (
                              <span style={colorSwatchFallbackStyles} />
                            )}

                            <span>{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div style={badgeRowStyles}>
                  {headerBadges.map((badge, index) => (
                    <div key={`${badge}-${index}`} style={badgeStyles}>
                      {badge}
                    </div>
                  ))}
                </div>
              </div>

              {keyFacts.length > 0 ? (
                <div style={keyFactsGridStyles}>
                  {keyFacts.map((fact) => (
                    <div
                      key={fact.label}
                      className="showroom-card"
                      style={factCardStyles}
                    >
                      <div className="showroom-sheen" />
                      <div style={factLabelStyles}>{fact.label}</div>
                      <div style={factValueStyles}>{fact.value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="showroom-panel" style={actionsPanelStyles}>
          <div style={actionsRowStyles}>
            <button
              type="button"
              className="showroom-button-secondary"
              style={actionSecondaryStyles}
              onClick={() => navigate(-1)}
            >
              Back to Results
            </button>

            <button
              type="button"
              className="showroom-button"
              style={actionPrimaryStyles}
            >
              <span className="showroom-sheen" />
              Add to Compare
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const heroPanelStyles = {
  padding: "26px",
  display: "flex",
  flexDirection: "column",
  gap: "22px",
};

const stateWrapStyles = {
  display: "flex",
};

const stateCardStyles = {
  width: "100%",
  padding: "26px",
  minHeight: "220px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "10px",
};

const stateEyebrowStyles = {
  fontSize: "0.82rem",
  fontWeight: 800,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(230, 237, 247, 0.62)",
};

const stateTitleStyles = {
  margin: 0,
};

const stateTextStyles = {
  fontSize: "1rem",
  lineHeight: 1.6,
  color: "rgba(230, 237, 247, 0.78)",
};

const heroImageCardStyles = {
  minHeight: "640px",
  padding: "22px",
  overflow: "hidden",
  position: "relative",
};

const heroImageStyles = {
  width: "100%",
  height: "596px",
  borderRadius: "24px",
  objectFit: "contain",
  background:
    "linear-gradient(180deg, rgba(20, 28, 40, 0.95) 0%, rgba(15, 21, 30, 0.98) 100%)",
  display: "block",
};

const heroImagePlaceholderStyles = {
  width: "100%",
  height: "596px",
  borderRadius: "24px",
  border: "1px dashed rgba(255,255,255,0.10)",
  background:
    "linear-gradient(180deg, rgba(20, 28, 40, 0.95) 0%, rgba(15, 21, 30, 0.98) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(230, 237, 247, 0.56)",
  fontSize: "1.35rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const galleryArrowStyles = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: "60px",
  height: "60px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(8, 15, 29, 0.78)",
  color: "#f2f6fb",
  fontSize: "2.2rem",
  lineHeight: 1,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  zIndex: 2,
  backdropFilter: "blur(8px)",
  boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
};

const galleryArrowLeftStyles = {
  left: "34px",
};

const galleryArrowRightStyles = {
  right: "34px",
};

const galleryArrowDisabledStyles = {
  opacity: 0.45,
  cursor: "default",
};

const galleryCounterStyles = {
  position: "absolute",
  bottom: "34px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(8, 15, 29, 0.76)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#f2f6fb",
  fontSize: "0.9rem",
  fontWeight: 700,
  zIndex: 2,
  backdropFilter: "blur(8px)",
};

const productIdentityBlockStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: "14px",
  padding: "4px 16px 0",
};

const brandLogoWrapStyles = {
  width: "220px",
  height: "88px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const brandLogoStyles = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  display: "block",
};

const productTitleStyles = {
  margin: 0,
  maxWidth: "980px",
};

const priceStyles = {
  fontSize: "2.7rem",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  color: "#f2f6fb",
};

const colorSelectorWrapStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
};

const colorSelectorLabelStyles = {
  fontSize: "0.78rem",
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(230, 237, 247, 0.58)",
};

const colorSelectorRowStyles = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  justifyContent: "center",
};

const colorChipStyles = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "46px",
  padding: "10px 16px",
};

const colorChipActiveStyles = {
  border: "1px solid rgba(112, 160, 255, 0.9)",
  boxShadow: "0 0 0 2px rgba(96, 146, 255, 0.18)",
};

const colorSwatchStyles = {
  width: "16px",
  height: "16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.24)",
  display: "inline-block",
  flexShrink: 0,
};

const colorSwatchFallbackStyles = {
  width: "16px",
  height: "16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.24)",
  background: "linear-gradient(135deg, #64748b 0%, #cbd5e1 100%)",
  display: "inline-block",
  flexShrink: 0,
};

const badgeRowStyles = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  justifyContent: "center",
};

const badgeStyles = {
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(18, 24, 33, 0.9)",
  color: "rgba(242, 246, 251, 0.92)",
  padding: "10px 14px",
  fontSize: "0.92rem",
  fontWeight: 700,
};

const keyFactsGridStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
};

const factCardStyles = {
  padding: "16px",
  minHeight: "112px",
};

const factLabelStyles = {
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(230, 237, 247, 0.54)",
  marginBottom: "8px",
};

const factValueStyles = {
  fontSize: "1.2rem",
  fontWeight: 800,
  color: "#f2f6fb",
  wordBreak: "break-word",
};

const actionsPanelStyles = {
  padding: "18px 22px",
};

const actionsRowStyles = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
};

const actionSecondaryStyles = {
  minWidth: "220px",
};

const actionPrimaryStyles = {
  minWidth: "240px",
};