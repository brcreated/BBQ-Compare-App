// src/pages/ProductDetail.jsx

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
  padding: "22px 28px 220px",
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

function formatPriceDisplay(value) {
  if (value === null || value === undefined) return "Request Pricing";

  const raw = String(value).trim();
  if (!raw) return "Request Pricing";

  if (/[a-zA-Z]/.test(raw)) {
    return raw;
  }

  const numeric = Number(raw.replace(/[$,]/g, ""));
  if (Number.isFinite(numeric) && numeric > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(numeric);
  }

  return raw;
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
  if (normalized === "gas") return "Gas";
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
  if (
    normalizedLabel.includes("width") ||
    normalizedLabel.includes("height") ||
    normalizedLabel.includes("depth") ||
    normalizedLabel.includes("cutout")
  ) {
    const inches = formatInches(raw);
    if (inches) return inches;
  }

  if (
    normalizedLabel.includes("area") ||
    normalizedLabel.includes("surface") ||
    normalizedLabel.includes("grilling")
  ) {
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
  if (normalizedLabel.includes("installation") || normalizedLabel.includes("install type")) {
    return normalizeInstallationLabel(raw);
  }
  if (normalizedLabel.includes("category") || normalizedLabel.includes("type")) return titleize(raw);

  return titleize(raw) === raw ? raw : titleize(raw);
}

function parsePriceNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function computeFamilySale(family, product) {
  if (!family) return null;
  const pct = Number(family.salePercent ?? 0);
  if (!pct || pct <= 0) return null;
  const endDate = family.saleEnd;
  if (endDate && new Date(endDate + "T23:59:59") < new Date()) return null;

  // Base price: prefer matrix min, then direct fields
  const matrix = Array.isArray(product?.pricingMatrix) ? product.pricingMatrix : [];
  const matrixNums = matrix
    .map((r) => parsePriceNum(r.mapPrice ?? r.price ?? r.msrp))
    .filter((n) => n !== null && n > 0);
  const matrixMin = matrixNums.length > 0 ? Math.min(...matrixNums) : null;
  const basePrice = matrixMin ??
    parsePriceNum(product?.mapPrice ?? product?.map_price ?? product?.price ?? product?.msrp);
  if (!basePrice) return null;

  const salePrice = Math.round(basePrice * (1 - pct / 100));
  if (salePrice <= 0) return null;
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const endsLabel = endDate
    ? new Date(endDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  return { salePrice, originalPrice: basePrice, savingsLabel: `Save ${pct}%`, endsLabel, fmt };
}

function computeActiveSale(product) {
  if (!product?.saleEnabled) return null;
  const endDate = product?.saleEndDate;
  if (endDate && new Date(endDate + "T23:59:59") < new Date()) return null;
  const base = parsePriceNum(product?.price) ?? parsePriceNum(product?.msrp) ?? parsePriceNum(product?.map_price);
  if (!base) return null;
  const discountType = product?.saleDiscountType || "percent";
  const discountVal = parseFloat(product?.saleDiscount || 0);
  if (!discountVal) return null;
  const saleAmt = discountType === "dollar" ? base - discountVal : base * (1 - discountVal / 100);
  if (saleAmt <= 0) return null;
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const savingsLabel = discountType === "dollar" ? `Save ${fmt(discountVal)}` : `Save ${discountVal}%`;
  const endsLabel = endDate
    ? new Date(endDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  return { salePrice: Math.round(saleAmt), originalPrice: base, savingsLabel, endsLabel, fmt };
}

const DETAIL_FUEL_LABELS = {
  propane: "Propane",
  natural_gas: "Natural Gas",
  wood: "Wood",
  charcoal: "Charcoal",
  pellet: "Pellet",
};

function getPricingMatrixRows(product) {
  const matrix = Array.isArray(product?.pricingMatrix) ? product.pricingMatrix : [];
  if (matrix.length === 0) return null;
  return matrix.map((r) => ({
    ...r,
    fuelLabel: r.fuelType ? (DETAIL_FUEL_LABELS[r.fuelType] || r.fuelType) : null,
    displayPrice: r.mapPrice ?? r.price ?? r.msrp ?? null,
    msrpDisplay: r.msrp && r.msrp > (r.mapPrice ?? r.price ?? 0) ? r.msrp : null,
  }));
}

function findPrice(product, specs) {
  const matrix = Array.isArray(product?.pricingMatrix) ? product.pricingMatrix : [];
  if (matrix.length > 0) {
    const base = matrix.find((r) => !r.fuelType && !r.colorId);
    const nums = matrix
      .map((r) => { const v = r.mapPrice ?? r.price ?? r.msrp; return v ? Number(v) : null; })
      .filter((n) => n !== null && n > 0);
    if (nums.length > 0) {
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const usePrice = base ? (Number(base.mapPrice ?? base.price ?? base.msrp) || min) : min;
      if (min !== max && !base) return `From ${formatPriceDisplay(min)}`;
      return formatPriceDisplay(usePrice);
    }
  }

  const direct =
    product?.price ??
    product?.mapPrice ??
    product?.map_price ??
    product?.msrp;

  if (direct != null && String(direct).trim() !== "") {
    return formatPriceDisplay(direct);
  }

  for (const key of ["price", "map_price", "msrp", "starting_price"]) {
    const value = specValue(specs, [key]);
    if (value) return formatPriceDisplay(value);
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
      id: normalizeText(
        item?.id || item?.colorId || item?.color_id || linkedColor?.id || `color-${index}`
      ),
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
    specValue(specs, ["fuel_type", "fuel", "primary_fuel"]);

  // Dimensions: W × D × H from variant fields first, then specs
  const wRaw = normalizeText(variant?.productWidth  || variant?.product_width)  || specValue(specs, ["product_width",  "overall_width",  "width"]);
  const dRaw = normalizeText(variant?.productDepth  || variant?.product_depth)  || specValue(specs, ["product_depth",  "overall_depth",  "depth"]);
  const hRaw = normalizeText(variant?.productHeight || variant?.product_height) || specValue(specs, ["product_height", "overall_height", "height"]);
  const dimParts = [
    wRaw ? `${formatNumber(wRaw)}"W` : "",
    dRaw ? `${formatNumber(dRaw)}"D` : "",
    hRaw ? `${formatNumber(hRaw)}"H` : "",
  ].filter(Boolean);
  const dimensions = dimParts.join(" × ");

  const temperatureRange = formatTemperatureRange(
    normalizeText(variant?.temperatureRangeMin || variant?.temperature_range_min) ||
      specValue(specs, ["temperature_range_min", "min_temp", "minimum_temperature"]),
    normalizeText(variant?.temperatureRangeMax || variant?.temperature_range_max) ||
      specValue(specs, ["temperature_range_max", "max_temp", "maximum_temperature"])
  );

  const cookingAreaRaw =
    normalizeText(variant?.primaryCookingArea || variant?.primary_cooking_area) ||
    specValue(specs, ["primary_cooking_area", "main_cooking_area", "primary_grilling_area"]);
  const cookingSpace = cookingAreaRaw ? formatAreaValue(cookingAreaRaw) : "";

  const gratesRaw =
    normalizeText(variant?.numberOfGrates || variant?.number_of_grates || variant?.grateCount || variant?.grate_count) ||
    specValue(specs, ["number_of_grates", "grate_count", "num_grates", "grates"]);

  const madeIn =
    normalizeText(variant?.madeIn || variant?.made_in || variant?.countryOfOrigin || variant?.country_of_origin) ||
    specValue(specs, ["made_in", "made_in_usa", "country_of_origin", "manufactured_in"]);

  return [
    { label: "Fuel",             value: fuel        ? normalizeFuelLabel(fuel) : "—" },
    { label: "Dimensions",       value: dimensions  || "—" },
    { label: "Temp Range",       value: temperatureRange || "—" },
    { label: "Cooking Space",    value: cookingSpace || "—" },
    { label: "Number of Grates", value: gratesRaw   || "—" },
    { label: "Made In",          value: madeIn      || "—" },
  ];
}

function buildWhyThisIsGoodChoice(variant, specs) {
  const reasons = [];

  const totalArea = specValue(specs, ["total_cooking_area", "total_grilling_area"]);
  if (totalArea) {
    reasons.push(
      `Generous cooking space with ${formatAreaValue(totalArea) || totalArea} total grilling area.`
    );
  }

  const maxTemp = specValue(specs, ["max_temp", "temperature_range_max"]);
  if (maxTemp) {
    reasons.push(
      `Built for strong heat performance with temperatures up to ${formatNumber(maxTemp) || maxTemp}°.`
    );
  }

  const material = specValue(specs, ["material", "primary_material", "construction_material"]);
  if (material) {
    reasons.push(
      `Premium build materials featuring ${formatDisplayValue("material", material)} construction.`
    );
  }

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
    if (!spec?.showOnSite) continue;
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
  const candidateWidth = toNumber(
    specValue(candidateSpecs, ["overall_width", "width", "product_width"])
  );

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
          <div style={{ color: "rgba(220,230,255,0.55)", fontSize: 14 }}>No image</div>
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

function parsePriceNumber(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;
  if (/[a-zA-Z]/.test(raw)) return null;

  const numeric = Number(raw.replace(/[$,]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function findBrandLogo(brand, assetsByBrandId) {
  if (!brand) return "";

  const directLogo = normalizeText(
    brand?.logoUrl || brand?.logo_url || brand?.brandLogoUrl || brand?.brand_logo_url
  );
  if (directLogo) return directLogo;

  const brandAssets = assetsByBrandId.get(brand.id) || [];
  const logoAsset =
    brandAssets.find((asset) => {
      const imageType = normalizeLower(
        asset?.imageType || asset?.image_type || asset?.type || asset?.assetType
      );
      return ["logo", "brand-logo", "brand_logo"].includes(imageType);
    }) || brandAssets[0];

  return assetUrl(logoAsset);
}

export default function ProductDetail() {
  const { productId, variantId } = useParams();
  const resolvedProductId = productId || variantId || "";
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [resolvedProductId]);

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
    if (!resolvedProductId) return null;
    return variantBySlug.get(resolvedProductId) || variantById.get(resolvedProductId) || null;
  }, [resolvedProductId, variantBySlug, variantById]);

  // Config group — other products linked via configGroupId
  const configGroup = useMemo(() => {
    if (!product?.configGroupId) return [];
    return (Array.isArray(variants) ? variants : [])
      .filter((v) => v.configGroupId === product.configGroupId && v.id !== product.id && v.isActive !== false)
      .sort((a, b) => {
        // Primary first, then alphabetical by configLabel
        if (a.isConfigPrimary && !b.isConfigPrimary) return -1;
        if (!a.isConfigPrimary && b.isConfigPrimary) return 1;
        return (a.configLabel || a.name || "").localeCompare(b.configLabel || b.name || "");
      });
  }, [product, variants]);

  // Always show name + description from the primary config in the group
  const primaryConfig = useMemo(() => {
    if (!configGroup.length) return product;
    return [product, ...configGroup].find((c) => c.isConfigPrimary) || product;
  }, [product, configGroup]);

  const productSpecs = useMemo(
    () => (product?.id ? specsByVariantId.get(product.id) || [] : []),
    [product, specsByVariantId]
  );
  const productAssets = useMemo(
    () => (product?.id ? assetsByVariantId.get(product.id) || [] : []),
    [product, assetsByVariantId]
  );
  const productVariantColors = useMemo(
    () => (product?.id ? variantColorsByVariantId.get(product.id) || [] : []),
    [product, variantColorsByVariantId]
  );

  const brandAssetsByBrandId = useMemo(() => {
    const map = new Map();
    for (const asset of Array.isArray(assets) ? assets : []) {
      const entityType = normalizeLower(asset?.entityType || asset?.entity_type);
      if (entityType !== "brand") continue;
      const entityId = normalizeText(
        asset?.entityId || asset?.entity_id || asset?.brandId || asset?.brand_id
      );
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
  const specGroups = useMemo(() => buildSpecGroups(productSpecs), [productSpecs]);

  const isInCompare = useMemo(() => {
    if (!product) return false;
    return isSelected(product.id) || isSelected(product.slug);
  }, [product, compareState]);

  const compareCount = compareState?.items?.length || 0;
  
  const isCompareFull = compareCount >= 4;

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
  if (!product) return;

  if (isInCompare) {
    removeItem(product.id);
    if (product.slug && product.slug !== product.id) {
      removeItem(product.slug);
    }
    return;
  }

  if (isCompareFull) return;

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

  return (
    <main className="brand-results-screen">
      <div className="brand-results-page-fade">
        <div className="ambient-light ambient-light-1" />
        <div className="ambient-light ambient-light-2" />
        <div className="ambient-light ambient-light-3" />

        <section className="brand-results-shell">
          {loading ? (
            <div style={{ ...glassCardStyle, padding: 32, textAlign: "center" }}>Loading product…</div>
          ) : error ? (
            <div style={{ ...glassCardStyle, padding: 32 }}>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Unable to load product</div>
              <div style={{ opacity: 0.8 }}>{error.message || "Catalog failed to load."}</div>
            </div>
          ) : ready && !product ? (
            <div style={{ ...glassCardStyle, padding: 32 }}>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Product Detail</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
                The requested product could not be found.
              </div>
              <div style={{ opacity: 0.72, lineHeight: 1.6 }}>Route productId: {resolvedProductId}</div>
            </div>
          ) : (
            <>
              <section
                className="interactive-panel"
                style={{
                  padding: 24,
                  display: "grid",
                  gap: 24,
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  alignItems: "start",
                }}
              >
                <div>
                  <div
                    style={{
                      borderRadius: 24,
                      minHeight: "clamp(320px, 50vw, 620px)",
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
                          style={{
                            maxHeight: 72,
                            maxWidth: 280,
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </div>
                    ) : null}

                    <h1
                      style={{
                        margin: "0 0 8px",
                        fontSize: "clamp(2.6rem, 4vw, 4.3rem)",
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        fontWeight: 800,
                        color: "#f2f6fb",
                      }}
                    >
                      {primaryConfig?.name || family?.name || "Product"}
                    </h1>

                    {configGroup.length > 0 && (() => {
                      // Stable order: primary first, then alphabetical — never reorders on click
                      const allConfigs = [product, ...configGroup].sort((a, b) => {
                        if (a.isConfigPrimary && !b.isConfigPrimary) return -1;
                        if (!a.isConfigPrimary && b.isConfigPrimary) return 1;
                        return (a.configLabel || a.name || "").localeCompare(b.configLabel || b.name || "");
                      });
                      return (
                        <div style={{ marginTop: 14, marginBottom: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {allConfigs.map((cfg) => {
                            const isCurrent = cfg.id === product.id;
                            return (
                              <button
                                key={cfg.id}
                                onClick={isCurrent ? undefined : () => navigate(`/product/${cfg.slug || cfg.id}`)}
                                style={{
                                  padding: "9px 18px", borderRadius: 999,
                                  cursor: isCurrent ? "default" : "pointer",
                                  border: isCurrent ? "1px solid rgba(245,158,11,0.55)" : "1px solid rgba(255,255,255,0.14)",
                                  background: isCurrent ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.04)",
                                  color: isCurrent ? "#f5c06a" : "rgba(255,255,255,0.75)",
                                  fontSize: 14, fontWeight: isCurrent ? 700 : 600,
                                  transition: "border-color 0.15s, background 0.15s, color 0.15s",
                                }}
                                onMouseEnter={isCurrent ? undefined : (e) => {
                                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
                                  e.currentTarget.style.background = "rgba(245,158,11,0.08)";
                                  e.currentTarget.style.color = "#f5c06a";
                                }}
                                onMouseLeave={isCurrent ? undefined : (e) => {
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                  e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                                }}
                              >
                                {cfg.configLabel || cfg.name}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {(() => {
                      const sale = computeActiveSale(product) || computeFamilySale(family, product);
                      if (sale) {
                        return (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 30, fontWeight: 900, color: "#f87c3f", letterSpacing: "-0.03em" }}>
                                {sale.fmt(sale.salePrice)}
                              </span>
                              <span style={{ fontSize: 18, fontWeight: 700, color: "#8fa0b8", textDecoration: "line-through", textDecorationThickness: "2px" }}>
                                {sale.fmt(sale.originalPrice)}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(250,160,80,0.9)", background: "rgba(250,120,60,0.12)", border: "1px solid rgba(250,120,60,0.25)", borderRadius: 8, padding: "3px 10px" }}>
                                {sale.savingsLabel}
                              </span>
                            </div>
                            {sale.endsLabel && (
                              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "rgba(250,160,80,0.7)", letterSpacing: "0.06em" }}>
                                SALE ENDS {sale.endsLabel.toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const matrixRows = getPricingMatrixRows(product);
                      const hasFuelRows = matrixRows && matrixRows.some((r) => r.fuelType);

                      if (hasFuelRows) {
                        const fmt = (n) => n
                          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n))
                          : null;
                        return (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,210,255,0.55)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                              Pricing Options
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {matrixRows.map((r) => (
                                <div key={r.id} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                                  {r.fuelLabel && (
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(180,210,255,0.65)", minWidth: 100 }}>{r.fuelLabel}</span>
                                  )}
                                  <span style={{ fontSize: 22, fontWeight: 800, color: "#9fc3ff", letterSpacing: "-0.02em" }}>
                                    {fmt(r.displayPrice) || "—"}
                                  </span>
                                  {r.msrpDisplay && (
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#8fa0b8", textDecoration: "line-through" }}>
                                      {fmt(r.msrpDisplay)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div style={{ marginTop: 16, fontSize: 26, fontWeight: 800, color: "#9fc3ff" }}>
                          {findPrice(product, productSpecs)}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
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
                      <div
                        style={{
                          fontSize: 13,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          opacity: 0.72,
                          marginBottom: 10,
                        }}
                      >
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

                  <div style={{ ...glassCardStyle, padding: 18 }}>
                    <button
                      type="button"
                      onClick={handleCompareClick}
                      disabled={!isInCompare && isCompareFull}
                      style={{
                        width: "100%",
                        minHeight: 58,
                        borderRadius: 18,
                        border: isInCompare ? "1px solid rgba(120,193,152,0.35)" : "none",
                        background: isInCompare
                          ? "rgba(80,144,104,0.22)"
                          : "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
                        color: "#fff",
                        fontSize: "0.96rem",
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        boxShadow: isInCompare ? "none" : "0 16px 34px rgba(67, 93, 131, 0.32)",
                        cursor: !isInCompare && isCompareFull ? "not-allowed" : "pointer",
                        opacity: !isInCompare && isCompareFull ? 0.5 : 1,
                      }}
                    >
                      <span className="button-sheen" />
                      {isInCompare ? "Remove from Compare" : isCompareFull ? "Compare Full" : "Add to Compare"}
                    </button>
                  </div>
                </div>
              </section>

              {(() => {
                const desc = primaryConfig?.description || product?.description || family?.description;
                return desc ? (
                  <section style={{ marginTop: 22 }}>
                    <div className="interactive-panel" style={{ padding: 22 }}>
                      <p style={{ margin: 0, lineHeight: 1.7, fontSize: 15, color: "#dce8f5", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                        {desc}
                      </p>
                    </div>
                  </section>
                ) : null;
              })()}

              {specGroups.length ? (
                <section style={{ marginTop: 22, display: "grid", gap: 18 }}>
                  {specGroups.map((group) => (
                    <div key={group.groupName} className="interactive-panel" style={{ padding: 18 }}>
                      <div style={{ fontSize: 15, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.72, marginBottom: 14 }}>
                        {group.groupName}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                        {group.items.map((item) => (
                          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(117,163,255,0.10)", background: "rgba(255,255,255,0.03)", padding: 14 }}>
                            <div style={{ fontSize: 12, opacity: 0.66, marginBottom: 6 }}>{item.label}</div>
                            <div style={{ fontSize: 17, fontWeight: 700 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ) : null}

              {similarProducts.length ? (
                <section style={{ marginTop: 22 }}>
                  <div className="interactive-panel" style={{ padding: 18 }}>
                    <div
                      style={{
                        fontSize: 15,
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        opacity: 0.72,
                        marginBottom: 14,
                      }}
                    >
                      Similar Products
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                      {similarProducts.map((similar) => (
                        <ProductCard
                          key={similar.id}
                          product={similar}
                          onClick={(item) => navigate(`/product/${item.slug || item.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          )}

          <style>{`
            .brand-results-screen {
              scroll-padding-bottom: 220px;
              position: relative;
              min-height: 100vh;
              width: 100%;
              overflow-x: clip;
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
              grid-template-rows: auto 1fr;
              gap: 16px;
            }

            .brand-results-topbar {
              display: flex;
              justify-content: flex-start;
              align-items: center;
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
                transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 220ms ease,
                border-color 220ms ease,
                filter 220ms ease;
              -webkit-tap-highlight-color: transparent;
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

            .back-button {
              min-width: 0;
              height: 56px;
              padding: 0 22px;
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
              white-space: nowrap;
              flex: 0 0 auto;
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
              .product-detail-grid,
              .similar-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 1200px) {
              .product-main-grid {
                grid-template-columns: 1fr !important;
              }
            }

            @media (max-width: 768px) {
              .brand-results-shell {
                padding: 18px 20px 120px;
              }
            }
          `}</style>
        </section>

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
            <div style={{ display: "flex", gap: 10, overflowX: "auto", minWidth: 0 }}>
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
                    style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
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
                          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
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
      </div>

    </main>
  );
}
