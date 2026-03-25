//ProductDetails.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";
import { addItem, removeItem, isSelected, getState, subscribe } from "../state/comparisonStore";

const pageShellStyle = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 14%, rgba(76, 110, 168, 0.09), transparent 28%), radial-gradient(circle at 82% 88%, rgba(76, 110, 168, 0.08), transparent 32%), linear-gradient(180deg, #0a0d12 0%, #0f141b 48%, #090c11 100%)",
  color: "#f3f7ff",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: "none",
  margin: "0 auto",
  padding: "22px 28px 120px",
  boxSizing: "border-box",
};

const glassCardStyle = {
  position: "relative",
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  borderRadius: 28,
  backdropFilter: "blur(18px)",
  overflow: "hidden",
};

const miniPillStyle = {
  borderRadius: 999,
  border: "1px solid rgba(121, 161, 241, 0.22)",
  background: "rgba(67, 102, 165, 0.14)",
  padding: "8px 12px",
  fontSize: 12,
  color: "#dbe8ff",
};

const COLOR_SWATCH_MAP = {
  black: "#1a1a1a",
  matte_black: "#1a1a1a",
  gloss_black: "#111111",
  charcoal: "#3d434d",
  gray: "#7b818a",
  grey: "#7b818a",
  silver: "#b6bcc6",
  stainless: "#c7ccd3",
  stainless_steel: "#c7ccd3",
  white: "#f4f6fa",
  red: "#b5121b",
  antique_red: "#9c1c1f",
  ruby_red: "#b11e2f",
  blue: "#244fa3",
  cerulean_blue: "#2f6fa3",
  orange: "#dc6c18",
  yellow: "#d4ac18",
  green: "#486b43",
  military_green: "#556b4f",
  maroon: "#6b2435",
  purple: "#5c3d82",
  copper: "#b36b3d",
  bronze: "#8f633c",
  ardesia_grey: "#5f6670",
  anthracite_grey: "#4b5158",
  wrinkle_black: "#1a1a1a",
  white_stone: "#e7e3da",
};

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeId(value) {
  return normalizeText(value).toLowerCase().replace(/[_\s]+/g, "-");
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value) {
  const numeric = toNumber(value);
  if (numeric == null) return "";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

function formatInches(value) {
  const formatted = formatNumber(value);
  return formatted ? `${formatted} in` : "";
}

function titleize(value) {
  return normalizeText(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value) {
  const numeric = toNumber(value);
  if (numeric == null || numeric <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function specValue(specs, keys) {
  for (const key of keys) {
    const match = specs.find((spec) => normalizeLower(spec?.key) === normalizeLower(key));
    if (match && normalizeText(match?.value)) {
      return normalizeText(match.value);
    }
  }
  return "";
}

function parseBooleanLike(value) {
  const normalized = normalizeLower(value);
  if (["true", "yes", "1", "active", "y"].includes(normalized)) return true;
  if (["false", "no", "0", "inactive", "n"].includes(normalized)) return false;
  return null;
}

function formatTemperatureRange(minValue, maxValue) {
  const minFormatted = formatNumber(minValue);
  const maxFormatted = formatNumber(maxValue);
  if (minFormatted && maxFormatted) return `${minFormatted}°–${maxFormatted}°`;
  if (maxFormatted) return `Up to ${maxFormatted}°`;
  if (minFormatted) return `${minFormatted}°+`;
  return "";
}

function formatAreaValue(value) {
  const formatted = formatNumber(value);
  return formatted ? `${formatted} sq in` : "";
}

function formatMadeInUsaValue(value) {
  const booleanValue = parseBooleanLike(value);
  if (booleanValue === true) return "Yes";
  if (booleanValue === false) return "No";
  return normalizeText(value) ? titleize(value) : "—";
}

function normalizeFuelLabel(value) {
  const normalized = normalizeLower(value);
  if (!normalized) return "";
  if (["lp", "liquid propane", "propane"].includes(normalized)) return "Propane";
  if (["ng", "natural gas", "natural_gas", "naturalgas"].includes(normalized)) return "Natural Gas";
  if (normalized === "pellet") return "Pellet";
  if (normalized === "charcoal") return "Charcoal";
  if (normalized === "wood") return "Wood";
  if (normalized === "electric") return "Electric";
  if (normalized === "drum_smoker") return "Drum Smoker";
  return titleize(value);
}

function normalizeInstallationLabel(value) {
  const normalized = normalizeLower(value);
  if (!normalized) return "";
  if (normalized.includes("built")) return "Built-In";
  if (normalized.includes("free")) return "Freestanding";
  return titleize(value);
}

function formatDisplayValue(label, value) {
  const raw = normalizeText(value);
  if (!raw) return "";

  const booleanValue = parseBooleanLike(raw);
  if (booleanValue !== null) return booleanValue ? "Yes" : "No";

  const normalizedLabel = normalizeLower(label);
  if (normalizedLabel.includes("width") || normalizedLabel.includes("height") || normalizedLabel.includes("depth") || normalizedLabel.includes("cutout")) {
    const inches = formatInches(raw);
    if (inches) return inches;
  }

  if (normalizedLabel.includes("area") || normalizedLabel.includes("surface") || normalizedLabel.includes("grilling")) {
    const area = formatAreaValue(raw);
    if (area) return area;
  }

  if (normalizedLabel.includes("temperature")) {
    const numeric = formatNumber(raw);
    if (numeric) return `${numeric}°`;
  }

  if (normalizedLabel.includes("material")) {
    if (normalizeLower(raw) === "stainless_steel") return "Stainless Steel";
    return titleize(raw);
  }

  if (normalizedLabel.includes("fuel")) return normalizeFuelLabel(raw);
  if (normalizedLabel.includes("installation") || normalizedLabel.includes("install type")) return normalizeInstallationLabel(raw);
  if (normalizedLabel.includes("category") || normalizedLabel.includes("type")) return titleize(raw);

  return titleize(raw) === raw ? raw : titleize(raw);
}

function findPrice(product, specs) {
  const direct =
    product?.salePrice ||
    product?.sale_price ||
    product?.price ||
    product?.mapPrice ||
    product?.map_price ||
    product?.msrp;

  if (direct != null && direct !== "") {
    const formatted = formatCurrency(direct);
    if (formatted) return formatted;
  }

  for (const key of ["price", "sale_price", "map_price", "msrp"]) {
    const value = specValue(specs, [key]);
    const formatted = formatCurrency(value);
    if (formatted) return formatted;
  }

  return "Request Pricing";
}

function findHeroAsset(assets) {
  if (!Array.isArray(assets) || assets.length === 0) return null;

  const preferred = assets.find((asset) => {
    const imageType = normalizeLower(asset?.imageType || asset?.image_type);
    return ["hero", "primary", "main"].includes(imageType);
  });

  return preferred || assets[0] || null;
}

function assetUrl(asset) {
  if (!asset) return "";

  const directUrl = normalizeText(asset?.url || asset?.imageUrl || asset?.sourceUrl || asset?.source_url);
  if (directUrl) return directUrl;

  const filePath = normalizeText(asset?.filePath || asset?.file_path);
  if (!filePath) return "";

  if (/^https?:\/\//i.test(filePath)) return filePath;

  const rawBase = import.meta.env.VITE_ASSET_BASE_URL || "";
  const base = rawBase.replace(/\/$/, "");
  const path = filePath.replace(/^\//, "");
  return base ? `${base}/${path}` : `/${path}`;
}

function getAssetSearchText(asset) {
  return [
    asset?.id,
    asset?.assetId,
    asset?.asset_id,
    asset?.altText,
    asset?.alt_text,
    asset?.fileName,
    asset?.file_name,
    asset?.filePath,
    asset?.file_path,
    asset?.url,
    asset?.imageUrl,
  ]
    .map((value) => normalizeLower(value))
    .filter(Boolean)
    .join(" ");
}

function getColorSwatchHex(choiceName, rawHex) {
  const direct = normalizeText(rawHex);
  if (direct) return direct;

  const normalized = normalizeLower(choiceName).replace(/[^a-z0-9]+/g, "_");
  return COLOR_SWATCH_MAP[normalized] || COLOR_SWATCH_MAP[normalizeLower(choiceName)] || "#d9dde5";
}

function findColorAsset(choiceName, variantAssets) {
  const tokens = normalizeLower(choiceName)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return null;

  const directColorMatch = (Array.isArray(variantAssets) ? variantAssets : []).find((asset) => {
    const searchText = getAssetSearchText(asset);
    return tokens.every((token) => searchText.includes(token));
  });

  if (directColorMatch) return directColorMatch;

  const looseColorMatch = (Array.isArray(variantAssets) ? variantAssets : []).find((asset) => {
    const searchText = getAssetSearchText(asset);
    return tokens.some((token) => searchText.includes(token));
  });

  return looseColorMatch || null;
}

function buildColorChoices(variantColors, colorsById, variantAssets) {
  return (Array.isArray(variantColors) ? variantColors : []).map((item, index) => {
    const linkedColor =
      colorsById?.get?.(item?.colorId) ||
      colorsById?.get?.(item?.color_id) ||
      null;

    const name =
      normalizeText(item?.name) ||
      normalizeText(linkedColor?.name) ||
      `Color ${index + 1}`;

    const matchedAsset = findColorAsset(name, variantAssets);

    return {
      id: normalizeText(item?.id || item?.colorId || item?.color_id || linkedColor?.id || `color-${index}`),
      name,
      swatchHex: getColorSwatchHex(
        name,
        normalizeText(item?.swatchHex || item?.swatch_hex) ||
          normalizeText(linkedColor?.swatchHex || linkedColor?.swatch_hex)
      ),
      imageUrl:
        normalizeText(item?.imageUrl || item?.image_url) ||
        normalizeText(linkedColor?.imageUrl || linkedColor?.image_url) ||
        assetUrl(matchedAsset),
    };
  });
}

function buildHeroImages({ selectedColor, variantAssets }) {
  const colorImageUrl = normalizeText(selectedColor?.imageUrl);
  const heroAsset = findHeroAsset(variantAssets);
  const heroAssetUrl = assetUrl(heroAsset);

  const images = [];

  if (colorImageUrl) {
    images.push({
      id: `color-${selectedColor.id}`,
      url: colorImageUrl,
      alt: `${selectedColor.name} view`,
    });
  }

  for (const asset of Array.isArray(variantAssets) ? variantAssets : []) {
    const url = assetUrl(asset);
    if (!url) continue;
    if (images.some((entry) => entry.url === url)) continue;

    images.push({
      id: normalizeText(asset?.id || asset?.assetId || asset?.asset_id || url),
      url,
      alt: normalizeText(asset?.altText || asset?.alt_text) || "Product image",
    });
  }

  if (images.length === 0 && heroAssetUrl) {
    images.push({
      id: normalizeText(heroAsset?.id || heroAssetUrl),
      url: heroAssetUrl,
      alt: normalizeText(heroAsset?.altText || heroAsset?.alt_text) || "Product image",
    });
  }

  return images;
}

function buildTopCards(variant, specs) {
  const fuel =
    normalizeText(variant?.fuelType) ||
    normalizeText(variant?.fuel_type) ||
    normalizeText(variant?.defaultFuel) ||
    specValue(specs, ["fuel_type", "fuel", "primary_fuel"]);

  const width =
    specValue(specs, ["overall_width", "width", "product_width", "cutout_width"]);

  const installation =
    normalizeText(variant?.installType) ||
    normalizeText(variant?.install_type) ||
    normalizeText(variant?.defaultInstallation) ||
    specValue(specs, ["installation", "install_type", "default_installation"]);

  const temperatureRange = formatTemperatureRange(
    specValue(specs, ["temperature_range_min", "min_temp", "minimum_temperature"]),
    specValue(specs, ["temperature_range_max", "max_temp", "maximum_temperature"])
  );

  const primaryCookingArea = formatAreaValue(
    specValue(specs, ["primary_cooking_area", "main_cooking_area", "primary_grilling_area"])
  );

  const madeInUsa = formatMadeInUsaValue(
    specValue(specs, ["made_in_usa", "made_in_the_usa", "usa_made", "manufactured_in_usa"])
  );

  return [
    { label: "Fuel", value: fuel ? normalizeFuelLabel(fuel) : "—" },
    { label: "Width", value: width ? formatInches(width) || titleize(width) : "—" },
    { label: "Installation", value: installation ? normalizeInstallationLabel(installation) : "—" },
    { label: "Temp Range", value: temperatureRange || "—" },
    { label: "Primary Area", value: primaryCookingArea || "—" },
    { label: "Made in USA", value: madeInUsa || "—" },
  ];
}

function buildWhyThisIsGoodChoice(variant, specs) {
  const reasons = [];

  const totalArea = specValue(specs, ["total_cooking_area", "total_grilling_area"]);
  if (totalArea) reasons.push(`Generous cooking space with ${formatAreaValue(totalArea) || totalArea} total grilling area.`);

  const maxTemp = specValue(specs, ["max_temp", "temperature_range_max"]);
  if (maxTemp) reasons.push(`Built for strong heat performance with temperatures up to ${formatNumber(maxTemp) || maxTemp}°.`);

  const material = specValue(specs, ["material", "primary_material", "construction_material"]);
  if (material) reasons.push(`Premium build materials featuring ${formatDisplayValue("material", material)} construction.`);

  const category =
    normalizeText(variant?.cookingCategory) ||
    normalizeText(variant?.category) ||
    specValue(specs, ["cooking_category", "category"]);
  if (category) reasons.push(`A strong fit for shoppers focused on ${titleize(category)} cooking.`);

  return reasons.slice(0, 3);
}

function shouldHideSpecValue(key, value) {
  const normalizedKey = normalizeLower(key);
  const booleanValue = parseBooleanLike(value);

  if (booleanValue === false && !normalizedKey.includes("made_in_usa")) return true;
  return false;
}

function buildSpecGroups(specs) {
  const groups = new Map();

  for (const spec of Array.isArray(specs) ? specs : []) {
    const rawValue = normalizeText(spec?.value);
    if (!rawValue) continue;
    if (shouldHideSpecValue(spec?.key, rawValue)) continue;

    const groupName = normalizeText(spec?.group) || "Details";
    if (!groups.has(groupName)) groups.set(groupName, []);

    const label = normalizeText(spec?.label) || titleize(spec?.key || "Detail");
    const value = formatDisplayValue(label, rawValue);
    if (!value) continue;

    groups.get(groupName).push({
      id: normalizeText(spec?.id || `${groupName}-${spec?.key}`),
      label,
      value,
    });
  }

  return Array.from(groups.entries())
    .map(([groupName, items]) => ({
      groupName,
      items,
    }))
    .filter((group) => group.items.length > 0);
}

function scoreSimilarity(baseVariant, candidate, baseSpecs, candidateSpecs) {
  let score = 0;

  const baseCategory = normalizeLower(baseVariant?.cookingCategory || baseVariant?.category);
  const candidateCategory = normalizeLower(candidate?.cookingCategory || candidate?.category);
  if (baseCategory && candidateCategory && baseCategory === candidateCategory) score += 4;

  const baseFuel = normalizeLower(baseVariant?.fuelType || baseVariant?.fuel_type);
  const candidateFuel = normalizeLower(candidate?.fuelType || candidate?.fuel_type);
  if (baseFuel && candidateFuel && baseFuel === candidateFuel) score += 3;

  const baseWidth = toNumber(specValue(baseSpecs, ["overall_width", "width", "product_width"]));
  const candidateWidth = toNumber(specValue(candidateSpecs, ["overall_width", "width", "product_width"]));

  if (baseWidth != null && candidateWidth != null) {
    const diff = Math.abs(baseWidth - candidateWidth);
    if (diff <= 2) score += 5;
    else if (diff <= 4) score += 3;
    else if (diff <= 8) score += 1;
  }

  return score;
}

function buildBottomCompareItems(compareIds, variants, assetsByVariantId) {
  return (Array.isArray(compareIds) ? compareIds : [])
    .map((selectedId) => {
      const normalizedSelected = normalizeId(selectedId);

      const variant =
        (Array.isArray(variants) ? variants : []).find(
          (item) => normalizeId(item?.id || item?.variantId || item?.variant_id) === normalizedSelected
        ) ||
        (Array.isArray(variants) ? variants : []).find(
          (item) => normalizeId(item?.slug) === normalizedSelected
        );

      if (!variant) return null;

      const variantId = variant.id || variant.variantId || variant.variant_id || "";
      const variantAssets = assetsByVariantId.get(variantId) || [];
      const heroAsset = findHeroAsset(variantAssets);

      return {
        id: variantId,
        slug: variant.slug || variantId,
        name: variant.name || variant.variantName || variant.variant_name || "Product",
        imageUrl: assetUrl(heroAsset),
      };
    })
    .filter(Boolean);
}

function ProductCard({ product, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      style={{
        ...glassCardStyle,
        width: "100%",
        padding: 18,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          aspectRatio: "4 / 3",
          borderRadius: 20,
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
          marginBottom: 14,
          display: "grid",
          placeItems: "center",
        }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <div style={{ color: "rgba(220,230,255,0.55)", fontSize: 14 }}>
            No image
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, letterSpacing: "0.12em", opacity: 0.68, textTransform: "uppercase" }}>
        {product.brandName || "Brand"}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{product.name}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {product.fuel ? <span style={miniPillStyle}>{normalizeFuelLabel(product.fuel)}</span> : null}
        {product.width ? <span style={miniPillStyle}>{formatInches(product.width)}</span> : null}
      </div>
    </button>
  );
}

function findBrandLogo(brand, assetsByBrandId) {
  if (!brand) return "";

  const directLogo = normalizeText(
    brand?.logoUrl || brand?.logo_url || brand?.brandLogoUrl || brand?.brand_logo_url
  );
  if (directLogo) return directLogo;

  const brandAssets = assetsByBrandId.get(brand.id) || [];
  const logoAsset = brandAssets.find((asset) => {
    const imageType = normalizeLower(asset?.imageType || asset?.image_type || asset?.type || asset?.assetType);
    return ["logo", "brand-logo", "brand_logo"].includes(imageType);
  }) || brandAssets[0];

  return assetUrl(logoAsset);
}

export default function ProductDetail() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [productId]);

  const {
    loading,
    ready,
    error,
    variants,
    variantById,
    variantBySlug,
    familyById,
    brandById,
    specsByVariantId,
    assetsByVariantId,
    colorsById,
    variantColorsByVariantId,
    assets = [],
  } = useCatalog();

  const [compareState, setCompareState] = useState(() => getState());

  useEffect(() => {
    return subscribe((nextState) => {
      setCompareState(nextState);
    });
  }, []);

  const product = useMemo(() => {
    if (!productId) return null;
    return variantBySlug.get(productId) || variantById.get(productId) || null;
  }, [productId, variantBySlug, variantById]);

  const productSpecs = useMemo(() => (product?.id ? specsByVariantId.get(product.id) || [] : []), [product, specsByVariantId]);
  const productAssets = useMemo(() => (product?.id ? assetsByVariantId.get(product.id) || [] : []), [product, assetsByVariantId]);
  const productVariantColors = useMemo(() => (product?.id ? variantColorsByVariantId.get(product.id) || [] : []), [product, variantColorsByVariantId]);

  const brandAssetsByBrandId = useMemo(() => {
    const map = new Map();
    for (const asset of Array.isArray(assets) ? assets : []) {
      const entityType = normalizeLower(asset?.entityType || asset?.entity_type);
      if (entityType !== "brand") continue;
      const entityId = normalizeText(asset?.entityId || asset?.entity_id || asset?.brandId || asset?.brand_id);
      if (!entityId) continue;
      if (!map.has(entityId)) map.set(entityId, []);
      map.get(entityId).push(asset);
    }
    return map;
  }, [assets]);

  const colorChoices = useMemo(
    () => buildColorChoices(productVariantColors, colorsById, productAssets),
    [productVariantColors, colorsById, productAssets]
  );

  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedImageId, setSelectedImageId] = useState("");

  useEffect(() => {
    setSelectedColorId(colorChoices[0]?.id || "");
    setSelectedImageId("");
  }, [product?.id, colorChoices]);

  const selectedColor = useMemo(
    () => colorChoices.find((choice) => choice.id === selectedColorId) || colorChoices[0] || null,
    [colorChoices, selectedColorId]
  );

  const heroImages = useMemo(
    () => buildHeroImages({ selectedColor, variantAssets: productAssets }),
    [selectedColor, productAssets]
  );

  const selectedImage = useMemo(
    () => heroImages.find((image) => image.id === selectedImageId) || heroImages[0] || null,
    [heroImages, selectedImageId]
  );

  useEffect(() => {
    setSelectedImageId(heroImages[0]?.id || "");
  }, [heroImages, product?.id]);

  const family = product?.familyId ? familyById.get(product.familyId) || null : null;
  const brand = product?.brandId ? brandById.get(product.brandId) || null : null;
  const brandLogoUrl = useMemo(() => findBrandLogo(brand, brandAssetsByBrandId), [brand, brandAssetsByBrandId]);

  const topCards = useMemo(() => buildTopCards(product, productSpecs), [product, productSpecs]);
  const whyThisIsGoodChoice = useMemo(() => buildWhyThisIsGoodChoice(product, productSpecs), [product, productSpecs]);
  const specGroups = useMemo(() => buildSpecGroups(productSpecs), [productSpecs]);

  const isInCompare = useMemo(() => {
    if (!product) return false;
    return isSelected(product.id) || isSelected(product.slug);
  }, [product, compareState]);

  const bottomCompareItems = useMemo(
    () => buildBottomCompareItems(compareState?.items || [], variants || [], assetsByVariantId),
    [compareState, variants, assetsByVariantId]
  );

  const similarProducts = useMemo(() => {
    if (!product?.id) return [];

    const baseBrandId = normalizeText(product.brandId);
    const scored = [];

    for (const candidate of Array.isArray(variants) ? variants : []) {
      if (!candidate?.id || candidate.id === product.id) continue;
      if (normalizeText(candidate.brandId) === baseBrandId) continue;

      const candidateSpecs = specsByVariantId.get(candidate.id) || [];
      const score = scoreSimilarity(product, candidate, productSpecs, candidateSpecs);
      if (score <= 0) continue;

      const candidateBrand = brandById.get(candidate.brandId) || null;
      const candidateAssets = assetsByVariantId.get(candidate.id) || [];
      const heroAsset = findHeroAsset(candidateAssets);

      scored.push({
        id: candidate.id,
        slug: normalizeText(candidate.slug) || normalizeText(candidate.id),
        name: normalizeText(candidate.name) || "Product",
        brandName: normalizeText(candidateBrand?.name),
        fuel:
          normalizeText(candidate.fuelType) ||
          normalizeText(candidate.fuel_type) ||
          specValue(candidateSpecs, ["fuel_type", "fuel", "primary_fuel"]),
        width: specValue(candidateSpecs, ["overall_width", "width", "product_width"]),
        imageUrl: assetUrl(heroAsset),
        score,
      });
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, 4);
  }, [product, variants, brandById, assetsByVariantId, specsByVariantId, productSpecs]);

  function handleCompareClick() {
    if (!product || isInCompare) return;
    addItem(product.id || product.slug);
  }

  function showPrevImage() {
    if (!heroImages.length) return;
    const currentIndex = heroImages.findIndex((image) => image.id === selectedImage?.id);
    const nextIndex = currentIndex <= 0 ? heroImages.length - 1 : currentIndex - 1;
    setSelectedImageId(heroImages[nextIndex].id);
  }

  function showNextImage() {
    if (!heroImages.length) return;
    const currentIndex = heroImages.findIndex((image) => image.id === selectedImage?.id);
    const nextIndex = currentIndex >= heroImages.length - 1 ? 0 : currentIndex + 1;
    setSelectedImageId(heroImages[nextIndex].id);
  }

  const backBrandSlug = normalizeText(location.state?.fromBrandSlug) || normalizeText(brand?.id);
  const backBrandName = normalizeText(location.state?.fromBrandName) || normalizeText(brand?.name) || "Brand";

  if (loading) {
    return (
      <main style={pageShellStyle}>
        <div style={containerStyle}>
          <div style={{ ...glassCardStyle, padding: 32, textAlign: "center" }}>Loading product…</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={pageShellStyle}>
        <div style={containerStyle}>
          <div style={{ ...glassCardStyle, padding: 32 }}>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Unable to load product</div>
            <div style={{ opacity: 0.8 }}>{error.message || "Catalog failed to load."}</div>
          </div>
        </div>
      </main>
    );
  }

  if (ready && !product) {
    return (
      <main style={pageShellStyle}>
        <div style={containerStyle}>
          <div style={{ ...glassCardStyle, padding: 32 }}>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Product Detail</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>The requested product could not be found.</div>
            <div style={{ opacity: 0.72, lineHeight: 1.6 }}>Route productId: {productId}</div>
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

      <style>{`
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
        @keyframes ambientFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(18px, -12px, 0) scale(1.04); }
        }
      `}</style>

      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                minWidth: 0,
                height: 56,
                padding: "0 22px",
                border: "none",
                borderRadius: 18,
                background: "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
                color: "#f7fbff",
                fontSize: "0.92rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "0 16px 34px rgba(67, 93, 131, 0.32)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Back
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(backBrandSlug ? `/brands/` : "/brands", {
                  state: backBrandSlug
                    ? {
                        fromBrandSlug: backBrandSlug,
                        fromBrandName: backBrandName,
                      }
                    : undefined,
                })
              }
              style={{
                minWidth: 0,
                height: 56,
                padding: "0 22px",
                border: "none",
                borderRadius: 18,
                background: "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
                color: "#f7fbff",
                fontSize: "0.92rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "0 16px 34px rgba(67, 93, 131, 0.32)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Go to All Brands
            </button>
          </div>
        </div>

        <section
          style={{
            ...glassCardStyle,
            padding: 24,
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(520px, 0.85fr)",
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                borderRadius: 24,
                minHeight: 620,
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                border: "1px solid rgba(117, 163, 255, 0.12)",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                padding: 28,
                position: "relative",
              }}
            >
              {heroImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={showPrevImage}
                    style={{
                      position: "absolute",
                      left: 18,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(8,16,30,0.72)",
                      color: "#fff",
                      fontSize: 24,
                      lineHeight: 1,
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={showNextImage}
                    style={{
                      position: "absolute",
                      right: 18,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(8,16,30,0.72)",
                      color: "#fff",
                      fontSize: 24,
                      lineHeight: 1,
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              ) : null}

              {selectedImage?.url ? (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt || product?.name || "Product image"}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div style={{ color: "rgba(220,230,255,0.55)", fontSize: 14 }}>No image</div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div>
              {brandLogoUrl ? (
                <div style={{ minHeight: 72, display: "flex", alignItems: "center", marginBottom: 14 }}>
                  <img
                    src={brandLogoUrl}
                    alt={`${brand?.name || "Brand"} logo`}
                    style={{ maxHeight: 72, maxWidth: 280, width: "auto", height: "auto", objectFit: "contain", display: "block" }}
                  />
                </div>
              ) : null}

              <h1 style={{ margin: "0 0 8px", fontSize: "clamp(2.4rem, 5vw, 4rem)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                {product?.name || family?.name || "Product"}
              </h1>

              <div style={{ marginTop: 16, fontSize: 26, fontWeight: 800, color: "#9fc3ff" }}>
                {findPrice(product, productSpecs)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {topCards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(117,163,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    padding: 12,
                    minHeight: 86,
                  }}
                >
                  <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.68 }}>
                    {card.label}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{card.value}</div>
                </div>
              ))}
            </div>

            {colorChoices.length ? (
              <div>
                <div style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.72, marginBottom: 10 }}>
                  Colors
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {colorChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => {
                        setSelectedColorId(choice.id);
                        setSelectedImageId(`color-${choice.id}`);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 999,
                        border:
                          selectedColor?.id === choice.id
                            ? "1px solid rgba(132,178,255,0.78)"
                            : "1px solid rgba(117,163,255,0.12)",
                        background:
                          selectedColor?.id === choice.id
                            ? "rgba(73,122,255,0.18)"
                            : "rgba(255,255,255,0.04)",
                        color: "#eef5ff",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: choice.swatchHex || "#d9dde5",
                          border: "1px solid rgba(255,255,255,0.20)",
                          display: "inline-block",
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                        }}
                      />
                      <span style={{ fontWeight: 700 }}>{choice.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {whyThisIsGoodChoice.length ? (
              <div style={{ ...glassCardStyle, padding: 18 }}>
                <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.74, marginBottom: 12 }}>
                  Why This Grill Is a Good Choice
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {whyThisIsGoodChoice.map((reason) => (
                    <div key={reason} style={{ lineHeight: 1.6, opacity: 0.92 }}>
                      {reason}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={handleCompareClick}
                    disabled={isInCompare}
                    style={{
                      width: "100%",
                      minHeight: 58,
                      borderRadius: 18,
                      border: isInCompare
                        ? "1px solid rgba(120,193,152,0.35)"
                        : "none",
                      background: isInCompare
                        ? "rgba(80,144,104,0.22)"
                        : "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
                      color: "#fff",
                      fontSize: "0.96rem",
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      boxShadow: isInCompare
                        ? "none"
                        : "0 16px 34px rgba(67, 93, 131, 0.32)",
                      cursor: isInCompare ? "default" : "pointer",
                      opacity: isInCompare ? 0.95 : 1,
                    }}
                  >
                    {isInCompare ? "Added to Compare" : "Add to Compare"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={handleCompareClick}
                  disabled={isInCompare}
                  style={{
                    width: "100%",
                    minHeight: 58,
                    borderRadius: 18,
                    border: isInCompare
                      ? "1px solid rgba(120,193,152,0.35)"
                      : "none",
                    background: isInCompare
                      ? "rgba(80,144,104,0.22)"
                      : "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
                    color: "#fff",
                    fontSize: "0.96rem",
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    boxShadow: isInCompare
                      ? "none"
                      : "0 16px 34px rgba(67, 93, 131, 0.32)",
                    cursor: isInCompare ? "default" : "pointer",
                    opacity: isInCompare ? 0.95 : 1,
                  }}
                >
                  {isInCompare ? "Added to Compare" : "Add to Compare"}
                </button>
              </div>
            )}
          </div>
        </section>

        {specGroups.length ? (
          <section style={{ marginTop: 22, display: "grid", gap: 18 }}>
            {specGroups.map((group) => (
              <div key={group.groupName} style={{ ...glassCardStyle, padding: 18 }}>
                <div style={{ fontSize: 15, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.72, marginBottom: 14 }}>
                  {group.groupName}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: 16,
                        border: "1px solid rgba(117,163,255,0.10)",
                        background: "rgba(255,255,255,0.03)",
                        padding: 14,
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.66, marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

      </div>

      {bottomCompareItems.length >= 1 ? (
        <div
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
            {bottomCompareItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 220,
                  maxWidth: 260,
                  padding: 8,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                  flexShrink: 0,
                }}
              >
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
                      width: 52,
                      height: 52,
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
                          display: "block",
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
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: "#eef5ff",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {item.name}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    removeItem(item.id);
                    if (item.slug && item.slug !== item.id) {
                      removeItem(item.slug);
                    }
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(10,18,32,0.96)",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                    padding: 0,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (bottomCompareItems.length >= 2) {
                navigate("/compare");
              }
            }}
            disabled={bottomCompareItems.length < 2}
            style={{
              minHeight: 52,
              padding: "0 20px",
              borderRadius: 14,
              border: "none",
              background:
                bottomCompareItems.length >= 2
                  ? "linear-gradient(135deg,#4c75db,#2f57bc)"
                  : "linear-gradient(135deg, rgba(92,108,140,0.55), rgba(58,69,91,0.55))",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: bottomCompareItems.length >= 2 ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              opacity: bottomCompareItems.length >= 2 ? 1 : 0.7,
            }}
          >
            Compare ({bottomCompareItems.length})
          </button>
        </div>
      ) : null}
    </main>
  );
}
