function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeKey(value) {
  return normalizeText(value).replace(/\s+/g, "_");
}

function toTitleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getVariantId(spec) {
  return spec?.variantId || spec?.variant_id || spec?.entityId || spec?.entity_id || "";
}

function getSpecKey(spec) {
  return (
    spec?.key ||
    spec?.specKey ||
    spec?.spec_key ||
    ""
  );
}

function getSpecLabel(spec) {
  return (
    spec?.label ||
    spec?.specLabel ||
    spec?.spec_label ||
    ""
  );
}

function getSpecGroup(spec) {
  return (
    spec?.group ||
    spec?.specGroup ||
    spec?.spec_group ||
    ""
  );
}

function getSpecUnit(spec) {
  return spec?.unit || spec?.specUnit || spec?.spec_unit || "";
}

function getSpecValue(spec) {
  if (spec?.value != null) return spec.value;
  if (spec?.specValue != null) return spec.specValue;
  if (spec?.spec_value != null) return spec.spec_value;
  return "";
}

function getSortOrder(spec) {
  const raw = spec?.sortOrder ?? spec?.sort_order ?? spec?.specSortOrder ?? spec?.spec_sort_order;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 9999;
}

function buildSpecLabel(spec) {
  const explicitLabel = String(getSpecLabel(spec) || "").trim();
  if (explicitLabel) {
    return explicitLabel;
  }

  return toTitleCase(getSpecKey(spec));
}

function buildSpecGroup(spec) {
  const explicitGroup = String(getSpecGroup(spec) || "").trim();
  if (explicitGroup) {
    return explicitGroup;
  }

  const key = normalizeKey(getSpecKey(spec));

  if (
    [
      "fuel_type",
      "fuel",
      "primary_fuel",
      "default_fuel",
      "install_type",
      "category",
      "cooking_style",
      "use_case",
      "size_class",
      "price_tier",
      "skill_level",
      "portability_class",
    ].includes(key)
  ) {
    return "Overview";
  }

  if (
    [
      "cooking_area",
      "primary_cooking_area",
      "secondary_cooking_area",
      "total_cooking_area",
      "pizza_count",
      "hopper_capacity",
      "capacity",
    ].includes(key)
  ) {
    return "Cooking";
  }

  if (
    [
      "max_temp",
      "min_temp",
      "temperature_range",
      "temperature_range_max",
      "temperature_range_min",
      "btu",
      "btu_output",
      "main_burners",
      "side_burners",
      "burners",
    ].includes(key)
  ) {
    return "Performance";
  }

  if (
    [
      "weight",
      "width",
      "depth",
      "height",
      "overall_width",
      "overall_depth",
      "overall_height",
      "product_width",
      "product_depth",
      "product_height",
      "product_weight",
    ].includes(key)
  ) {
    return "Dimensions";
  }

  if (
    [
      "price",
      "msrp",
      "map_price",
      "sale_price",
    ].includes(key)
  ) {
    return "Pricing";
  }

  if (
    [
      "material",
      "finish",
      "construction",
      "grate_material",
    ].includes(key)
  ) {
    return "Construction";
  }

  return "General";
}

function buildComparisonPriority(spec) {
  const key = normalizeKey(getSpecKey(spec));

  const priorityMap = {
    fuel_type: 1,
    fuel: 2,
    install_type: 3,
    primary_cooking_area: 10,
    secondary_cooking_area: 11,
    total_cooking_area: 12,
    cooking_area: 13,
    max_temp: 20,
    temperature_range: 21,
    temperature_range_max: 22,
    btu_output: 23,
    btu: 24,
    main_burners: 25,
    pizza_count: 26,
    hopper_capacity: 27,
    width: 30,
    depth: 31,
    height: 32,
    weight: 33,
    product_width: 34,
    product_depth: 35,
    product_height: 36,
    product_weight: 37,
    price: 40,
    msrp: 41,
    map_price: 42,
    sale_price: 43,
  };

  return priorityMap[key] ?? 9999;
}

function buildDisplayValue(spec) {
  const rawValue = getSpecValue(spec);
  const safeValue = rawValue == null ? "" : String(rawValue).trim();
  const unit = String(getSpecUnit(spec) || "").trim();

  if (!safeValue) return "";
  if (!unit) return safeValue;

  return `${safeValue} ${unit}`.trim();
}

export function normalizeSpecs(specRows = []) {
  return specRows
    .filter((spec) => {
      const variantId = String(getVariantId(spec) || "").trim();
      const key = String(getSpecKey(spec) || "").trim();
      return Boolean(variantId && key);
    })
    .map((spec) => {
      const variantId = String(getVariantId(spec)).trim();
      const rawKey = String(getSpecKey(spec)).trim();
      const specKey = normalizeKey(rawKey);
      const rawValue = getSpecValue(spec);
      const displayValue = buildDisplayValue(spec);

      return {
        id: spec?.id || spec?.spec_id || "",
        variantId,
        specKey,
        specLabel: buildSpecLabel(spec),
        specGroup: buildSpecGroup(spec),
        comparisonPriority: buildComparisonPriority(spec),
        specSortOrder: getSortOrder(spec),
        rawValue: rawValue ?? "",
        numericValue: toNumber(rawValue),
        displayValue,
        unit: String(getSpecUnit(spec) || "").trim(),
      };
    })
    .sort((a, b) => {
      if (a.specGroup !== b.specGroup) {
        return a.specGroup.localeCompare(b.specGroup);
      }

      if (a.comparisonPriority !== b.comparisonPriority) {
        return a.comparisonPriority - b.comparisonPriority;
      }

      if (a.specSortOrder !== b.specSortOrder) {
        return a.specSortOrder - b.specSortOrder;
      }

      return a.specLabel.localeCompare(b.specLabel);
    });
}

export function normalizeSpecsByVariant(specRows = []) {
  const normalized = normalizeSpecs(specRows);

  return normalized.reduce((acc, spec) => {
    if (!acc[spec.variantId]) {
      acc[spec.variantId] = [];
    }

    acc[spec.variantId].push(spec);
    return acc;
  }, {});
}

export default normalizeSpecs;