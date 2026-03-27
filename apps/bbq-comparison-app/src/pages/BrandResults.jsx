import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";
import { getState, subscribe, removeItem, addItem, isSelected } from "../state/comparisonStore";
import AboutModal from "../components/AboutModal";
import useIdleReset from "../hooks/useIdleReset";

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function getVariantRouteValue(record) {
  return String(
    pickFirst(
      record?.slug,
      record?.variantSlug,
      record?.variant_slug,
      record?.id,
      record?.variantId,
      record?.variant_id
    )
  ).trim();
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

function getVariantName(variant, familyMap, brandMap) {
  const family = familyMap.get(getFamilyId(variant));
  const brandId = getBrandId(variant) || getBrandId(family);
  const brand = brandMap.get(brandId);

  const brandName = cleanLabel(
    pickFirst(brand?.name, brand?.brandName, brand?.brand_name)
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

  const fallbackName = cleanLabel(
    pickFirst(
      variantName,
      family?.name,
      family?.familyName,
      family?.family_name,
      variant?.id,
      variant?.variant_id,
      "Unnamed Product"
    )
  );

  if (!brandName && !fallbackName) return "Unnamed Product";
  if (!brandName) return fallbackName;
  if (!fallbackName) return brandName;

  return `${brandName} - ${fallbackName}`;
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
    asset?.path,
    asset?.imageUrl,
    asset?.image_url,
    asset?.sourceUrl,
    asset?.source_url
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
    return formatPriceDisplay(directPrice);
  }

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  for (const key of ["price", "msrp", "base_price", "sale_price", "starting_price"]) {
    const match = specs.find((spec) => getSpecKey(spec) === key);
    if (!match) continue;
    return formatPriceDisplay(getSpecValue(match));
  }

  return "";
}

function parsePriceNumber(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;
  if (/[a-zA-Z]/.test(raw)) return null;

  const numeric = Number(raw.replace(/[$,]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

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

function findVariantInstallation(variant, specMap) {
  const directInstall = cleanLabel(
    pickFirst(
      variant?.installType,
      variant?.install_type,
      variant?.installation,
      variant?.defaultInstallation,
      variant?.default_installation
    )
  );

  if (directInstall) {
    const normalized = normalizeId(directInstall);
    if (normalized.includes("built")) return "Built-In";
    if (normalized.includes("free")) return "Freestanding";
    return formatTitle(directInstall);
  }

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  for (const key of ["install_type", "installation", "default_installation"]) {
    const match = specs.find((spec) => getSpecKey(spec) === key);
    if (!match) continue;
    const value = cleanLabel(getSpecValue(match));
    if (!value) continue;
    const normalized = normalizeId(value);
    if (normalized.includes("built")) return "Built-In";
    if (normalized.includes("free")) return "Freestanding";
    return formatTitle(value);
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

  if (normalizedFuel.includes("pellet")) return ["Pellet"];
  if (normalizedFuel.includes("charcoal") && normalizedFuel.includes("wood")) {
    return ["Charcoal", "Wood"];
  }
  if (normalizedFuel.includes("charcoal")) return ["Charcoal"];
  if (normalizedFuel.includes("wood")) return ["Wood"];
  if (normalizedFuel.includes("griddle")) return ["Griddle"];
  if (normalizedFuel.includes("pizza")) return ["Pizza Oven"];

  if (normalizedFuel.includes("gas")) {
    return ["Propane"];
  }

  if (rawFuel) return [rawFuel];

  return [];
}

function findVariantCategory(variant, familyMap, specMap) {
  const directCategory = cleanLabel(
    pickFirst(
      variant?.category,
      variant?.cookingCategory,
      variant?.cooking_category,
      variant?.productCategory,
      variant?.product_category
    )
  );

  if (directCategory) return normalizeId(directCategory);

  const family = familyMap.get(getFamilyId(variant));
  const familyCategory = cleanLabel(
    pickFirst(
      family?.category,
      family?.cookingCategory,
      family?.cooking_category,
      family?.productCategory,
      family?.product_category
    )
  );

  if (familyCategory) return normalizeId(familyCategory);

  const variantId = getVariantId(variant);
  const specs = specMap.get(variantId) || [];

  for (const key of ["category", "cooking_category", "product_category"]) {
    const match = specs.find((spec) => getSpecKey(spec) === key);
    if (!match) continue;
    const value = cleanLabel(getSpecValue(match));
    if (value) return normalizeId(value);
  }

  return "";
}

function getFuelFilterFromQuery(searchParams) {
  const fuel = normalizeId(searchParams.get("fuel"));

  if (fuel === "pellet") return "Pellet";
  if (fuel === "charcoal" || fuel === "wood" || fuel === "charcoal-wood") {
    return "Charcoal";
  }
  if (fuel === "gas") return "Gas";
  if (fuel === "propane") return "Propane";
  if (fuel === "natural-gas" || fuel === "naturalgas" || fuel === "natural_gas") {
    return "Natural Gas";
  }

  return "All";
}

function getInstallationFilterFromQuery(searchParams) {
  const installation = normalizeId(searchParams.get("installation"));

  if (installation.includes("built")) return "Built-In";
  if (installation.includes("free")) return "Freestanding";

  return "All";
}

function getCollectionMeta({ routeBrandId, brandSlug, selectedBrand, searchParams }) {
  const normalizedFuel = normalizeId(searchParams.get("fuel"));
  const normalizedCategory = normalizeId(searchParams.get("category"));
  const normalizedInstallation = normalizeId(searchParams.get("installation"));

  if (normalizedFuel === "pellet") {
    return {
      title: "All Pellet Grills & Smokers",
      subtitle: "Browse every pellet grill and smoker in the showroom.",
    };
  }

  if (
    normalizedFuel === "gas" ||
    normalizedFuel === "propane" ||
    normalizedFuel === "natural-gas" ||
    normalizedFuel === "naturalgas" ||
    normalizedFuel === "natural_gas"
  ) {
    return {
      title: "All Natural Gas & Propane Grills",
      subtitle: "Browse every gas grill and compare propane and natural gas options.",
    };
  }

  if (
    normalizedFuel === "charcoal" ||
    normalizedFuel === "wood" ||
    normalizedFuel === "charcoal-wood"
  ) {
    return {
      title: "All Charcoal & Wood Grills & Smokers",
      subtitle: "Browse traditional charcoal and wood-fired grills and smokers.",
    };
  }

  if (normalizedCategory === "griddle" || normalizedCategory === "griddles") {
    return {
      title: "All Griddles",
      subtitle: "Browse flat top cooking options across the catalog.",
    };
  }

  if (
    normalizedCategory === "pizza-oven" ||
    normalizedCategory === "pizza-ovens" ||
    normalizedCategory === "pizza"
  ) {
    return {
      title: "All Pizza Ovens",
      subtitle: "Browse gas and wood-fired pizza ovens.",
    };
  }

  if (
    normalizedInstallation.includes("built") ||
    normalizedCategory === "outdoor-kitchen" ||
    normalizedCategory === "built-in"
  ) {
    return {
      title: "All Built-In Grills",
      subtitle: "Browse built-in grills for outdoor kitchen projects.",
    };
  }

  const isAllBrands = !routeBrandId || routeBrandId === "all";
  if (isAllBrands) {
    return {
      title: "All Brands",
      subtitle: "Browse the full live catalog across every brand.",
    };
  }

  return {
    title: pickFirst(
      selectedBrand?.name,
      selectedBrand?.brandName,
      selectedBrand?.brand_name,
      routeBrandId ? formatTitle(brandSlug) : "All Brands"
    ),
    subtitle: "Browse this brand and narrow the results with filters.",
  };
}

function BrandResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isIdleFading } = useIdleReset(60000, 5000);
  const { brandSlug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const routeBrandId = normalizeId(brandSlug);

  const {
    brands = [],
    families = [],
    variants = [],
    assets = [],
    specs = [],
    loading,
    error,
  } = useCatalog();

  const [selectedFuel, setSelectedFuel] = useState(() =>
    getFuelFilterFromQuery(searchParams)
  );
  const [selectedInstallation, setSelectedInstallation] = useState(() =>
    getInstallationFilterFromQuery(searchParams)
  );
  const [selectedSize, setSelectedSize] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("All");
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [compareState, setCompareState] = useState(getState());

  const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL || "";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [routeBrandId, location.key]);

  useEffect(() => {
    return subscribe(setCompareState);
  }, []);

  useEffect(() => {
    setSelectedFuel(getFuelFilterFromQuery(searchParams));
    setSelectedInstallation(getInstallationFilterFromQuery(searchParams));
    setSelectedSize("All");
    setSelectedPrice("All");
    setSelectedBrandFilter("All");
  }, [searchParams]);

  const familyMap = useMemo(() => {
    const map = new Map();

    families.forEach((family) => {
      const id = getRecordId(family);
      if (!id) return;
      map.set(id, family);
    });

    return map;
  }, [families]);

  const brandMap = useMemo(() => {
    const map = new Map();

    brands.forEach((brand) => {
      const id = getRecordId(brand);
      if (!id) return;
      map.set(id, brand);
    });

    return map;
  }, [brands]);

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
    return (
      brands.find(
        (brand) =>
          getRecordId(brand) === routeBrandId ||
          normalizeId(pickFirst(brand?.brandSlug, brand?.brand_slug, brand?.slug)) === routeBrandId
      ) || null
    );
  }, [brands, routeBrandId]);

  const collectionMeta = useMemo(() => {
    return getCollectionMeta({
      routeBrandId,
      brandSlug,
      selectedBrand,
      searchParams,
    });
  }, [routeBrandId, brandSlug, selectedBrand, searchParams]);

  const brandLogoUrl = useMemo(() => {
    const isAllBrands = !routeBrandId || routeBrandId === "all";
    if (!selectedBrand || isAllBrands) return "";

    const directLogo = pickFirst(
      selectedBrand?.logoUrl,
      selectedBrand?.logo_url,
      selectedBrand?.brandLogoUrl,
      selectedBrand?.brand_logo_url
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

    const filePath = getAssetFilePath(assetLogo);
    if (!filePath) return "";

    if (/^https?:\/\//i.test(filePath)) return filePath;
    const cleanBase = String(assetBaseUrl || "").replace(/\/+$/, "");
    const cleanPath = String(filePath || "").replace(/^\/+/, "");
    return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
  }, [selectedBrand, assets, assetBaseUrl, routeBrandId]);

  const filteredVariants = useMemo(() => {
    const isAllBrands = !routeBrandId || routeBrandId === "all";

    return variants.filter((variant) => {
      if (!isActiveRecord(variant)) return false;

      if (isAllBrands) return true;

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

      let imageUrl = "";
      if (filePath) {
        if (/^https?:\/\//i.test(filePath)) {
          imageUrl = filePath;
        } else {
          const cleanBase = String(assetBaseUrl || "").replace(/\/+$/, "");
          const cleanPath = String(filePath || "").replace(/^\/+/, "");
          imageUrl = cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
        }
      }

      const cookingArea = findVariantCookingArea(variant, specMap);
      const fuelOptions = findVariantFuelOptions(variant, specMap);
      const category = findVariantCategory(variant, familyMap, specMap);
      const family = familyMap.get(getFamilyId(variant));
      const resolvedBrandId = getBrandId(variant) || getBrandId(family);
      const resolvedBrand =
        brands.find((brand) => getRecordId(brand) === resolvedBrandId) || null;
      const resolvedBrandName = cleanLabel(
        pickFirst(
          resolvedBrand?.name,
          resolvedBrand?.brandName,
          resolvedBrand?.brand_name,
          formatTitle(resolvedBrandId)
        )
      );

      return {
        id: variantId || getRecordId(variant),
        routeValue: getVariantRouteValue(variant),
        name: getVariantName(variant, familyMap, brandMap),
        imageUrl,
        price: findVariantPrice(variant, specMap),
        priceNumber: findVariantPriceNumber(variant, specMap),
        brandId: resolvedBrandId,
        brandName: resolvedBrandName,
        fuelOptions,
        fuelSummary:
          fuelOptions.includes("Propane") && fuelOptions.includes("Natural Gas")
            ? "Propane / Natural Gas"
            : fuelOptions.join(" / "),
        installation: findVariantInstallation(variant, specMap),
        size: findVariantSize(variant, specMap),
        sizeBucket: getSizeBucket(cookingArea),
        category,
      };
    });
  }, [filteredVariants, assets, assetBaseUrl, familyMap, brandMap, specMap, brands]);

  const fuelOptions = useMemo(() => {
    const values = Array.from(
      new Set(productCards.flatMap((product) => product.fuelOptions).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const ordered = [
      "All",
      "Gas",
      "Pellet",
      "Charcoal",
      "Wood",
      "Propane",
      "Natural Gas",
    ];

    const existing = ordered.filter(
      (value) => value === "All" || value === "Gas" || values.includes(value)
    );
    const extras = values.filter((value) => !existing.includes(value));

    return [...existing, ...extras];
  }, [productCards]);


  const brandFilterOptions = useMemo(() => {
    const isAllBrands = !routeBrandId || routeBrandId === "all";
    if (!isAllBrands) return ["All"];

    const brandMap = new Map();

    productCards.forEach((product) => {
      const productBrandId = normalizeId(product.brandId);
      const productBrandName = cleanLabel(product.brandName);

      if (!productBrandId || !productBrandName) return;
      if (!brandMap.has(productBrandId)) {
        brandMap.set(productBrandId, productBrandName);
      }
    });

    const sorted = Array.from(brandMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));

    return ["All", ...sorted.map((brand) => brand.id)];
  }, [productCards, routeBrandId]);

  const brandFilterLabelMap = useMemo(() => {
    const map = new Map();
    map.set("All", "All Brands");

    productCards.forEach((product) => {
      const productBrandId = normalizeId(product.brandId);
      const productBrandName = cleanLabel(product.brandName);
      if (!productBrandId || !productBrandName) return;
      if (!map.has(productBrandId)) {
        map.set(productBrandId, productBrandName);
      }
    });

    return map;
  }, [productCards]);

  const installationOptions = useMemo(() => {
    const values = Array.from(
      new Set(productCards.map((product) => product.installation).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return values.length ? ["All", ...values] : ["All"];
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
    const quizResults = location.state?.quizResults || null;

    let baseProducts = productCards;

    if (Array.isArray(quizResults) && quizResults.length > 0) {
      const normalizedQuizIds = new Set(
        quizResults
          .map((id) => normalizeId(id))
          .filter(Boolean)
      );

      baseProducts = productCards.filter((product) => {
        const productId = normalizeId(product.id);
        const productRouteValue = normalizeId(product.routeValue);
        return (
          normalizedQuizIds.has(productId) ||
          normalizedQuizIds.has(productRouteValue)
        );
      });
    }

    const normalizedFuel = normalizeId(searchParams.get("fuel"));
    const normalizedCategory = normalizeId(searchParams.get("category"));
    const normalizedInstallation = normalizeId(searchParams.get("installation"));

    return baseProducts.filter((product) => {
      if (normalizedFuel) {
        if (normalizedFuel === "pellet" && !product.fuelOptions.includes("Pellet")) {
          return false;
        }

        if (
          (normalizedFuel === "charcoal" || normalizedFuel === "wood" || normalizedFuel === "charcoal-wood") &&
          !product.fuelOptions.some((option) => option === "Charcoal" || option === "Wood")
        ) {
          return false;
        }

        if (normalizedFuel === "gas") {
          const hasGas =
            product.fuelOptions.includes("Propane") ||
            product.fuelOptions.includes("Natural Gas");
          if (!hasGas) return false;
        }

        if (normalizedFuel === "propane" && !product.fuelOptions.includes("Propane")) {
          return false;
        }

        if (
          (normalizedFuel === "natural-gas" ||
            normalizedFuel === "naturalgas" ||
            normalizedFuel === "natural_gas") &&
          !product.fuelOptions.includes("Natural Gas")
        ) {
          return false;
        }
      }

      if (normalizedInstallation) {
        if (normalizedInstallation.includes("built") && product.installation !== "Built-In") {
          return false;
        }

        if (normalizedInstallation.includes("free") && product.installation !== "Freestanding") {
          return false;
        }
      }

      if (normalizedCategory) {
        const isBuiltInCategory =
          normalizedCategory === "outdoor-kitchen" || normalizedCategory === "built-in";

        const isGriddleCategory =
          normalizedCategory === "griddle" || normalizedCategory === "griddles";

        const isPizzaCategory =
          normalizedCategory === "pizza-oven" ||
          normalizedCategory === "pizza-ovens" ||
          normalizedCategory === "pizza";

        if (isBuiltInCategory && product.installation !== "Built-In") {
          return false;
        }

        if (isGriddleCategory && !product.category.includes("griddle")) {
          return false;
        }

        if (isPizzaCategory && !product.category.includes("pizza")) {
          return false;
        }
      }

      if (selectedFuel !== "All") {
        if (selectedFuel === "Gas") {
          const hasGas =
            product.fuelOptions.includes("Propane") ||
            product.fuelOptions.includes("Natural Gas");

          if (!hasGas) return false;
        } else if (!product.fuelOptions.includes(selectedFuel)) {
          return false;
        }
      }

      if (
        selectedBrandFilter !== "All" &&
        normalizeId(product.brandId) !== normalizeId(selectedBrandFilter)
      ) {
        return false;
      }

      if (
        selectedInstallation !== "All" &&
        product.installation !== selectedInstallation
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
  }, [
    productCards,
    searchParams,
    selectedFuel,
    selectedBrandFilter,
    selectedInstallation,
    selectedSize,
    selectedPrice,
    location.state,
  ]);

  const compareIds = compareState.items || [];

  const compareItems = useMemo(() => {
    return compareIds
      .map((id) => {
        const variant =
          (variants || []).find((v) => v.id === id) ||
          (variants || []).find((v) => v.slug === id);

        if (!variant) return null;

        const variantId = getVariantId(variant);
        const bestAsset = pickBestAssetForVariant(variantId, assets);
        const filePath = getAssetFilePath(bestAsset);

        let imageUrl = "";

        if (filePath) {
          if (/^https?:\/\//i.test(filePath)) {
            imageUrl = filePath;
          } else {
            const cleanBase = String(assetBaseUrl || "").replace(/\/+$/, "");
            const cleanPath = String(filePath || "").replace(/^\/+/, "");
            imageUrl = cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
          }
        }

        return {
          id: variantId,
          slug: getVariantRouteValue(variant),
          name: getVariantName(variant, familyMap, brandMap),
          imageUrl,
        };
      })
      .filter(Boolean);
  }, [compareIds, variants, assets, assetBaseUrl, familyMap, brandMap]);

  const canCompare = compareItems.length >= 2;

  return (
    <main className="brand-results-screen">
      <div className={`brand-results-page-fade ${isIdleFading ? "is-idle-fading" : ""}`}>
      <div className="ambient-light ambient-light-1" />
      <div className="ambient-light ambient-light-2" />
      <div className="ambient-light ambient-light-3" />

      <section className="brand-results-shell">
        <div className="brand-results-topbar brand-results-sticky-topbar">
  <div
    style={{
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
    }}
  >
    <button
      type="button"
      className="other-button interactive-button"
      onClick={() => navigate("/")}
    >
      <span className="button-sheen" />
      Start Over
    </button>

    <button
      type="button"
      className="other-button interactive-button"
      onClick={() => navigate("/brands")}
    >
      <span className="button-sheen" />
      Brands
    </button>

    <button
      type="button"
      className="other-button interactive-button"
      onClick={() => setIsAboutOpen(true)}
    >
      <span className="button-sheen" />
      About
    </button>

    <button
      type="button"
      className="back-button interactive-button"
      onClick={() => navigate(-1)}
    >
      <span className="button-sheen" />
      Back
    </button>
  </div>
</div>

        <header className="brand-results-header interactive-panel">
          <div className="brand-results-header-content">
            {brandLogoUrl ? (
              <div className="brand-results-logo-wrap">
                <img
                  src={brandLogoUrl}
                  alt={`${collectionMeta.title} logo`}
                  className="brand-results-logo"
                />
              </div>
            ) : null}

            <h1 className="brand-results-title">{collectionMeta.title}</h1>
            <p className="brand-results-subtitle">{collectionMeta.subtitle}</p>
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

            {(!routeBrandId || routeBrandId === "all") && (
              <div className="filter-group">
                <label className="filter-label" htmlFor="brand-filter">
                  Brand
                </label>
                <select
                  id="brand-filter"
                  className="filter-select"
                  value={selectedBrandFilter}
                  onChange={(event) => setSelectedBrandFilter(event.target.value)}
                >
                  {brandFilterOptions.map((option) => (
                    <option key={option} value={option}>
                      {brandFilterLabelMap.get(option) || option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-group">
              <label className="filter-label" htmlFor="installation-filter">
                Installation
              </label>
              <select
                id="installation-filter"
                className="filter-select"
                value={selectedInstallation}
                onChange={(event) => setSelectedInstallation(event.target.value)}
              >
                {installationOptions.map((option) => (
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
                  setSelectedFuel(getFuelFilterFromQuery(searchParams));
                  setSelectedInstallation(getInstallationFilterFromQuery(searchParams));
                  setSelectedSize("All");
                  setSelectedPrice("All");
                  setSelectedBrandFilter("All");
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
              {typeof error === "string" ? error : error?.message || "Failed to load data"}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="brand-results-grid-placeholder">
              {location.state?.quizResults ? "No quiz-matched products were found for those answers." : "No products match the current filters."}
            </div>
          ) : (
            <div className="brand-results-grid">
              {visibleProducts.map((product) => {
                const inCompare =
                  isSelected(product.routeValue) || isSelected(product.id);
                const compareCount = compareState?.items?.length || 0;
                const isCompareFull = compareCount >= 4;

                return (
                  <article
                    key={product.id}
                    className={`product-card interactive-button ${inCompare ? "product-card-selected" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/product/${product.routeValue}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/product/${product.routeValue}`);
                      }
                    }}
                  >
                    <span className="button-sheen" />
                    {inCompare ? (
                      <div className="product-selected-badge">✓ In Compare</div>
                    ) : null}

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

                        {product.installation ? (
                          <span className="product-badge">{product.installation}</span>
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

                            if (inCompare) {
                              removeItem(product.routeValue);
                              removeItem(product.id);
                              return;
                            }

                            if (isCompareFull) return;

                            addItem(product.routeValue || product.id);
                          }}
                          disabled={!inCompare && isCompareFull}
                          style={{
                            opacity: !inCompare && isCompareFull ? 0.5 : 1,
                            cursor: !inCompare && isCompareFull ? "not-allowed" : "pointer",
                          }}
                        >
                          <span className="button-sheen" />
                          {inCompare
                            ? "Remove"
                            : isCompareFull
                            ? "Compare Full"
                            : "Add to Compare"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .brand-results-screen {
          scroll-padding-bottom: 220px;
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          overflow-y: visible;
          background:
            radial-gradient(circle at 18% 14%, rgba(76, 110, 168, 0.09), transparent 28%),
            radial-gradient(circle at 82% 88%, rgba(76, 110, 168, 0.08), transparent 32%),
            linear-gradient(180deg, #0a0d12 0%, #0f141b 48%, #090c11 100%);
          color: #e6edf7;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .brand-results-page-fade {
          min-height: 100vh;
          transition: opacity 500ms ease;
        }

        .brand-results-page-fade.is-idle-fading {
          opacity: 0;
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
          padding: 22px 28px 220px;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: auto auto auto 1fr;
          gap: 16px;
        }

        .brand-results-sticky-topbar {
          position: sticky;
          top: 0;
          z-index: 220;
          padding: 10px 0 6px;
          background:
            linear-gradient(180deg, rgba(10,13,18,0.96) 0%, rgba(10,13,18,0.88) 72%, rgba(10,13,18,0) 100%);
          backdrop-filter: blur(14px);
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

        

        .interactive-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 120ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 160ms ease,
            filter 120ms ease;
          -webkit-tap-highlight-color: transparent;
          will-change: transform;
        }

        .interactive-button:active {
          transform: scale(0.965);
          filter: brightness(1.08);
        }

        .interactive-button:focus-visible {
          outline: 2px solid rgba(122, 157, 219, 0.5);
          outline-offset: 2px;
        }

        .interactive-button::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(122,157,219,0.25) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 180ms ease;
          pointer-events: none;
        }

        .interactive-button:active::after {
          opacity: 1;
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

        

        .back-button {
          min-width: 0;
          height: 56px;
          padding: 0 150px;
          border: none;
          border-radius: 30px;
          background: linear-gradient(180deg, #5a78a8 0%, #435d83 100%);
          color: #f7fbff;
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 16px 34px rgba(67, 93, 131, 0.32);
          cursor: pointer;
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .other-button {
          min-width: 0;
          height: 56px;
          padding: 0 42px;
          border: none;
          border-radius: 30px;
          background: linear-gradient(180deg, #5a78a8 0%, #435d83 100%);
          color: #f7fbff;
          font-size: 0.92rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 16px 34px rgba(67, 93, 131, 0.32);
          cursor: pointer;
          white-space: nowrap;
          flex: 0 0 auto;
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

        .brand-results-subtitle {
          margin: 0;
          max-width: 700px;
          font-size: 1rem;
          line-height: 1.6;
          color: rgba(230, 237, 247, 0.78);
        }

        .brand-results-filters {
          padding: 20px 22px;
          box-sizing: border-box;
        }

        .brand-results-grid-section {
          padding: 20px 22px 120px;
          box-sizing: border-box;
        }

        .filter-section {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
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
          object-position: center;
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


        .compare-bar-shell {
          animation: compareBarSlideUp 240ms cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: bottom center;
        }

        .compare-bar-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 20px;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.06),
            rgba(255,255,255,0.01)
          );
        }

        .compare-bar-ready {
          box-shadow:
            0 22px 60px rgba(0,0,0,0.38),
            0 0 0 1px rgba(76,117,219,0.16),
            0 0 28px rgba(76,117,219,0.14);
        }

        .compare-bar-ready button:last-child {
          animation: compareButtonPulse 1.8s ease-in-out infinite;
        }

        .compare-bar-shell > div > div {
          animation: compareChipPopIn 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .compare-bar-shell button:last-child:active {
          transform: scale(0.97);
        }

        @keyframes compareBarSlideUp {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes compareChipPopIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes compareButtonPulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(76,117,219,0),
              0 10px 24px rgba(0,0,0,0.22);
            transform: scale(1);
          }
          50% {
            box-shadow:
              0 0 0 8px rgba(76,117,219,0.08),
              0 14px 28px rgba(0,0,0,0.28);
            transform: scale(1.02);
          }
        }

        @media (max-width: 1400px) {
          .filter-section {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

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

        .product-card-selected {
          border-color: rgba(122, 157, 219, 0.58);
          box-shadow:
            0 28px 60px rgba(0, 0, 0, 0.42),
            0 0 0 1px rgba(122, 157, 219, 0.22),
            0 0 28px rgba(76, 117, 219, 0.22);
          transform: translateY(-6px);
          transition: all 180ms ease;
        }

        .product-card-selected::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 22px;
          pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(159, 195, 255, 0.16);
        }

        .product-selected-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(132, 178, 255, 0.38);
          background: rgba(34, 55, 97, 0.88);
          color: #eef5ff;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
          backdrop-filter: blur(8px);
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

          .product-action {
            min-height: 64px;
            transition:
              transform 120ms ease,
              box-shadow 160ms ease,
              filter 120ms ease;
          }

          .product-action:active {
            transform: scale(0.96);
            box-shadow: 0 10px 20px rgba(0,0,0,0.25);
          }
        }
      `}</style>

      {compareItems.length >= 1 && (
        <div
          className={`compare-bar-shell ${canCompare ? "compare-bar-ready" : ""}`}
          style={{
            position: "fixed",
            left: 20,
            right: 20,
            bottom: 20,
            minHeight: 76,
            borderRadius: 20,
            border: "1px solid rgba(117,163,255,0.14)",
            background: "rgba(8,16,30,0.94)",
            boxShadow: "0 22px 60px rgba(0,0,0,0.38)",
            backdropFilter: "blur(16px)",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 14,
            padding: "12px 14px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              minWidth: 0,
            }}
          >
            {compareItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  minWidth: 240,
                  maxWidth: 260,
                  padding: 12,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/product/${item.slug || item.id}`)}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: 10, opacity: 0.5 }}>No Image</div>
                      )}
                    </div>
                  </button>

                  <div
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#eef5ff",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {item.name}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    removeItem(item.id);
                    if (item.slug && item.slug !== item.id) removeItem(item.slug);
                  }}
                  style={{
                    height: 40,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(10,18,32,0.85)",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!canCompare) return;
              navigate("/compare");
            }}
            disabled={!canCompare}
            style={{
              minHeight: 52,
              padding: "0 20px",
              borderRadius: 14,
              border: "none",
              background: canCompare
                ? "linear-gradient(135deg,#4c75db,#2f57bc)"
                : "linear-gradient(135deg,rgba(76,117,219,0.45),rgba(47,87,188,0.45))",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: canCompare ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              opacity: canCompare ? 1 : 0.72,
              transition: "transform 140ms ease, box-shadow 180ms ease, opacity 140ms ease",
            }}
          >
            Compare ({compareItems.length})
          </button>
        </div>
      )}

      </div>

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </main>
  );
}

export default BrandResults;
