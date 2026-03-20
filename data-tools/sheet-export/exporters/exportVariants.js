function toBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  return ["true", "yes", "1", "active"].includes(normalized);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toStringOrEmpty(value) {
  return value == null ? "" : String(value).trim();
}

function pickFirstValue(row, keys) {
  for (const key of keys) {
    if (row[key] != null && row[key] !== "") {
      return row[key];
    }
  }

  return "";
}

export function exportVariants({ sourceData, datasets }) {
  const rows = sourceData.getSheetRows("variants");
  const familyRecords = datasets?.get?.("families")?.records || [];

  const familyToBrandId = new Map(
    familyRecords.map((family) => [family.id, family.brandId])
  );

  return rows
    .filter((row) => row && row.variant_id && row.family_id && row.variant_name)
    .map((row) => {
      const familyId = toStringOrEmpty(row.family_id);
      const brandId =
        toStringOrEmpty(pickFirstValue(row, ["brand_id"])) ||
        familyToBrandId.get(familyId) ||
        "";

      const isActive = toBoolean(row.active, true);

      return {
        id: toStringOrEmpty(row.variant_id),
        brandId,
        familyId,

        name: toStringOrEmpty(row.variant_name),
        sku: toStringOrEmpty(row.sku),
        upc: toStringOrEmpty(row.upc),
        modelNumber: toStringOrEmpty(row.model_number),

        fuelType: toStringOrEmpty(
          pickFirstValue(row, ["fuel_type", "default_fuel"])
        ),
        fuelGroup: toStringOrEmpty(row.fuel_group),
        installType: toStringOrEmpty(row.install_type),
        cookingStyle: toStringOrEmpty(row.cooking_style),
        useCase: toStringOrEmpty(row.use_case),
        sizeClass: toStringOrEmpty(row.size_class),
        priceTier: toStringOrEmpty(row.price_tier),
        skillLevel: toStringOrEmpty(row.skill_level),
        portabilityClass: toStringOrEmpty(row.portability_class),

        category: toStringOrEmpty(
          pickFirstValue(row, ["category", "cooking_category"])
        ),
        description: toStringOrEmpty(row.description),

        primaryCookingArea: toNumberOrNull(
          pickFirstValue(row, ["primary_cooking_area"])
        ),
        secondaryCookingArea: toNumberOrNull(
          pickFirstValue(row, ["secondary_cooking_area"])
        ),
        totalCookingArea: toNumberOrNull(
          pickFirstValue(row, ["total_cooking_area", "cooking_area"])
        ),

        width: toNumberOrNull(
          pickFirstValue(row, ["product_width", "width"])
        ),
        depth: toNumberOrNull(
          pickFirstValue(row, ["product_depth", "depth"])
        ),
        height: toNumberOrNull(
          pickFirstValue(row, ["product_height", "height"])
        ),
        weight: toNumberOrNull(
          pickFirstValue(row, ["product_weight", "weight"])
        ),

        price: toNumberOrNull(row.price),
        msrp: toNumberOrNull(row.msrp),
        mapPrice: toNumberOrNull(row.map_price),
        salePrice: toNumberOrNull(row.sale_price),

        supportsLP: toNumberOrNull(row.supports_lp),
        supportsNaturalGas: toNumberOrNull(row.supports_natural_gas),
        supportsCharcoal: toNumberOrNull(row.supports_charcoal),
        supportsPellet: toNumberOrNull(row.supports_pellet),
        supportsWood: toNumberOrNull(row.supports_wood),

        status:
          row.status != null && row.status !== ""
            ? String(row.status).trim()
            : isActive
            ? "active"
            : "inactive",

        sortOrder: toNumberOrNull(row.sort_order),
        isActive,
      };
    });
}