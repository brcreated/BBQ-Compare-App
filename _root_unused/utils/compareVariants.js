import { normalizeSpecsByVariant } from "./normalizeSpecs";

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

function normalizeResolverKey(key) {
  return normalizeText(key).replace(/\s+/g, "_");
}

function getVariantValue(variant, key) {
  if (!variant || !key) return "";

  const normalizedKey = normalizeResolverKey(key);

  const candidates = [
    normalizedKey,
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

function normalizeInput(arg1, arg2) {
  if (Array.isArray(arg1)) {
    return {
      variants: [],
      variantIds: arg1,
      specs: Array.isArray(arg2) ? arg2 : [],
    };
  }

  return {
    variants: Array.isArray(arg1?.variants) ? arg1.variants : [],
    variantIds: Array.isArray(arg1?.variantIds) ? arg1.variantIds : [],
    specs: Array.isArray(arg1?.specs) ? arg1.specs : [],
  };
}

function buildVariantMap(variants, variantIds) {
  const map = new Map();

  variants.forEach((variant) => {
    const id = getVariantId(variant);
    if (id) {
      map.set(String(id), variant);
    }
  });

  variantIds.forEach((id) => {
    if (!map.has(String(id))) {
      map.set(String(id), null);
    }
  });

  return map;
}

function normalizeSpecEntryValue(value) {
  if (value == null || value === "") return "";
  return String(value).trim();
}

function buildResolvedSpecRow({
  specKey,
  specLabel,
  specGroup,
  comparisonPriority,
  specSortOrder,
  variantIds,
  variantMap,
  specsByVariant,
}) {
  const values = {};
  const normalizedKey = normalizeResolverKey(specKey);

  variantIds.forEach((variantId) => {
    const safeVariantId = String(variantId);
    const variant = variantMap.get(safeVariantId);
    const variantValue = variant ? getVariantValue(variant, normalizedKey) : "";

    if (variantValue != null && String(variantValue).trim() !== "") {
      values[safeVariantId] = {
        displayValue: String(variantValue).trim(),
        rawValue: variantValue,
        source: "variant",
      };
      return;
    }

    const matchingSpecs = specsByVariant[safeVariantId] || [];
    const specMatch = matchingSpecs.find(
      (spec) => normalizeResolverKey(spec.specKey) === normalizedKey
    );

    if (specMatch) {
      values[safeVariantId] = specMatch;
      return;
    }

    values[safeVariantId] = null;
  });

  const valueList = variantIds.map((variantId) =>
    values[String(variantId)]?.displayValue || ""
  );

  const uniqueValues = new Set(valueList);
  const isDifferent = uniqueValues.size > 1;

  return {
    specKey: normalizedKey,
    specLabel: specLabel || toDisplayLabel(normalizedKey),
    specGroup: specGroup || "General",
    comparisonPriority:
      Number.isFinite(Number(comparisonPriority)) ? Number(comparisonPriority) : 9999,
    specSortOrder:
      Number.isFinite(Number(specSortOrder)) ? Number(specSortOrder) : 9999,
    values,
    isDifferent,
  };
}

export function compareVariants(arg1 = [], arg2 = []) {
  const { variants, variantIds, specs } = normalizeInput(arg1, arg2);

  if (!variantIds.length) {
    return {
      groups: [],
      hasDifferences: false,
    };
  }

  const variantMap = buildVariantMap(variants, variantIds);
  const specsByVariant = normalizeSpecsByVariant(specs);
  const specMap = new Map();

  const preferredRows = [
    {
      specKey: "fuel_type",
      specLabel: "Fuel Type",
      specGroup: "Overview",
      comparisonPriority: 1,
      specSortOrder: 1,
    },
    {
      specKey: "install_type",
      specLabel: "Install Type",
      specGroup: "Overview",
      comparisonPriority: 2,
      specSortOrder: 2,
    },
    {
      specKey: "primary_cooking_area",
      specLabel: "Primary Cooking Area",
      specGroup: "Cooking",
      comparisonPriority: 3,
      specSortOrder: 1,
    },
    {
      specKey: "secondary_cooking_area",
      specLabel: "Secondary Cooking Area",
      specGroup: "Cooking",
      comparisonPriority: 4,
      specSortOrder: 2,
    },
    {
      specKey: "total_cooking_area",
      specLabel: "Total Cooking Area",
      specGroup: "Cooking",
      comparisonPriority: 5,
      specSortOrder: 3,
    },
    {
      specKey: "width",
      specLabel: "Width",
      specGroup: "Dimensions",
      comparisonPriority: 6,
      specSortOrder: 1,
    },
    {
      specKey: "depth",
      specLabel: "Depth",
      specGroup: "Dimensions",
      comparisonPriority: 7,
      specSortOrder: 2,
    },
    {
      specKey: "height",
      specLabel: "Height",
      specGroup: "Dimensions",
      comparisonPriority: 8,
      specSortOrder: 3,
    },
    {
      specKey: "weight",
      specLabel: "Weight",
      specGroup: "Dimensions",
      comparisonPriority: 9,
      specSortOrder: 4,
    },
    {
      specKey: "price",
      specLabel: "Price",
      specGroup: "Pricing",
      comparisonPriority: 10,
      specSortOrder: 1,
    },
    {
      specKey: "msrp",
      specLabel: "MSRP",
      specGroup: "Pricing",
      comparisonPriority: 11,
      specSortOrder: 2,
    },
    {
      specKey: "map_price",
      specLabel: "MAP Price",
      specGroup: "Pricing",
      comparisonPriority: 12,
      specSortOrder: 3,
    },
    {
      specKey: "sale_price",
      specLabel: "Sale Price",
      specGroup: "Pricing",
      comparisonPriority: 13,
      specSortOrder: 4,
    },
  ];

  preferredRows.forEach((row) => {
    specMap.set(
      normalizeResolverKey(row.specKey),
      buildResolvedSpecRow({
        ...row,
        variantIds,
        variantMap,
        specsByVariant,
      })
    );
  });

  variantIds.forEach((variantId) => {
    const matchingSpecs = specsByVariant[String(variantId)] || [];

    matchingSpecs.forEach((spec) => {
      const normalizedKey = normalizeResolverKey(spec.specKey);

      if (specMap.has(normalizedKey)) {
        return;
      }

      specMap.set(
        normalizedKey,
        buildResolvedSpecRow({
          specKey: normalizedKey,
          specLabel: spec.specLabel,
          specGroup: spec.specGroup || "General",
          comparisonPriority: spec.comparisonPriority,
          specSortOrder: spec.specSortOrder,
          variantIds,
          variantMap,
          specsByVariant,
        })
      );
    });
  });

  const rows = Array.from(specMap.values()).filter((row) => {
    const hasAnyValue = variantIds.some((variantId) => {
      const entry = row.values[String(variantId)];
      return normalizeSpecEntryValue(entry?.displayValue) !== "";
    });

    return hasAnyValue;
  });

  const hasDifferences = rows.some((row) => row.isDifferent);

  const grouped = rows.reduce((acc, row) => {
    const groupName = row.specGroup || "General";

    if (!acc[groupName]) {
      acc[groupName] = [];
    }

    acc[groupName].push(row);
    return acc;
  }, {});

  const groups = Object.entries(grouped)
    .map(([groupName, items]) => ({
      group: groupName,
      items: [...items].sort((a, b) => {
        if (a.comparisonPriority !== b.comparisonPriority) {
          return a.comparisonPriority - b.comparisonPriority;
        }

        if (a.specSortOrder !== b.specSortOrder) {
          return a.specSortOrder - b.specSortOrder;
        }

        return String(a.specLabel).localeCompare(String(b.specLabel));
      }),
    }))
    .sort((a, b) => String(a.group).localeCompare(String(b.group)));

  return {
    groups,
    hasDifferences,
  };
}

export default compareVariants;