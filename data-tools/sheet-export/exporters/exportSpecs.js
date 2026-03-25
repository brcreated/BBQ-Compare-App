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

function normalizeEntityType(value) {
  return value ? String(value).trim().toLowerCase() : "";
}

function normalizeSpecValue(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value).trim();
}

function buildDerivedVariantSpecs(variant) {
  if (!variant || !variant.id) return [];

  const specs = [];
  let sortSeed = 1000;

  function addSpec({
    key,
    label,
    value,
    unit = "",
    group = "General",
    valueType = "",
  }) {
    if (value === null || value === undefined || value === "") return;

    specs.push({
      id: `derived_${variant.id}_${key}`,
      entityType: "variant",
      entityId: variant.id,
      variantId: variant.id,
      key,
      label,
      value: normalizeSpecValue(value),
      unit,
      valueType,
      group,
      sortOrder: sortSeed++,
      isActive: true,
    });
  }

  addSpec({
    key: "body_material",
    label: "Body Material",
    value: variant.bodyMaterial,
    group: "General",
  });

  addSpec({
    key: "primary_cooking_area",
    label: "Primary Cooking Area",
    value: variant.primaryCookingArea,
    unit: "sq in",
    group: "Cooking",
    valueType: "number",
  });

  addSpec({
    key: "secondary_cooking_area",
    label: "Secondary Cooking Area",
    value: variant.secondaryCookingArea,
    unit: "sq in",
    group: "Cooking",
    valueType: "number",
  });

  addSpec({
    key: "total_cooking_area",
    label: "Total Cooking Area",
    value: variant.totalCookingArea,
    unit: "sq in",
    group: "Cooking",
    valueType: "number",
  });

  addSpec({
    key: "width",
    label: "Width",
    value: variant.productWidth ?? variant.width,
    unit: "inches",
    group: "Dimensions",
    valueType: "number",
  });

  addSpec({
    key: "depth",
    label: "Depth",
    value: variant.productDepth ?? variant.depth,
    unit: "inches",
    group: "Dimensions",
    valueType: "number",
  });

  addSpec({
    key: "height",
    label: "Height",
    value: variant.productHeight ?? variant.height,
    unit: "inches",
    group: "Dimensions",
    valueType: "number",
  });

  addSpec({
    key: "length",
    label: "Length",
    value: variant.productLength ?? variant.length,
    unit: "inches",
    group: "Dimensions",
    valueType: "number",
  });

  addSpec({
    key: "weight",
    label: "Weight",
    value: variant.productWeight ?? variant.weight,
    unit: "lbs",
    group: "Dimensions",
    valueType: "number",
  });

  addSpec({
    key: "temperature_range_min",
    label: "Min Temperature",
    value: variant.temperatureRangeMin,
    unit: "°F",
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "temperature_range_max",
    label: "Max Temperature",
    value: variant.temperatureRangeMax,
    unit: "°F",
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "grate_levels",
    label: "Grate Levels",
    value: variant.grateLevels,
    group: "Cooking",
    valueType: "number",
  });

  addSpec({
    key: "rack_width",
    label: "Rack Width",
    value: variant.rackWidth,
    unit: "inches",
    group: "Cooking",
    valueType: "number",
  });

  addSpec({
    key: "rack_depth",
    label: "Rack Depth",
    value: variant.rackDepth,
    unit: "inches",
    group: "Cooking",
    valueType: "number",
  });

  addSpec({
    key: "burger_capacity",
    label: "Burger Capacity",
    value: variant.burgerCapacity,
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "brisket_capacity",
    label: "Brisket Capacity",
    value: variant.brisketCapacity,
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "rib_rack_capacity",
    label: "Rib Rack Capacity",
    value: variant.ribRackCapacity,
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "pork_butt_capacity",
    label: "Pork Butt Capacity",
    value: variant.porkButtCapacity,
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "chicken_capacity",
    label: "Chicken Capacity",
    value: variant.chickenCapacity,
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "burner_count",
    label: "Burner Count",
    value: variant.burnerCount,
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "heat_zones",
    label: "Heat Zones",
    value: variant.heatZones,
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "pellet_hopper_capacity",
    label: "Pellet Hopper Capacity",
    value: variant.pelletHopperCapacity,
    unit: "lbs",
    group: "Performance",
    valueType: "number",
  });

  addSpec({
    key: "fuel_type",
    label: "Fuel Type",
    value: variant.fuelType,
    group: "General",
  });

  addSpec({
    key: "install_type",
    label: "Installation",
    value: variant.installType,
    group: "General",
  });

  addSpec({
    key: "cooking_category",
    label: "Cooking Category",
    value: variant.cookingCategory,
    group: "General",
  });

  addSpec({
    key: "cooking_style",
    label: "Cooking Style",
    value: variant.cookingStyle,
    group: "General",
  });

  addSpec({
    key: "size_class",
    label: "Size Class",
    value: variant.sizeClass,
    group: "General",
  });

  addSpec({
    key: "wifi_enabled",
    label: "WiFi Enabled",
    value: variant.wifiEnabled,
    group: "Features",
    valueType: "boolean",
  });

  addSpec({
    key: "rotisserie_compatible",
    label: "Rotisserie Compatible",
    value: variant.rotisserieCompatible,
    group: "Features",
    valueType: "boolean",
  });

  addSpec({
    key: "direct_flame_access",
    label: "Direct Flame Access",
    value: variant.directFlameAccess,
    group: "Features",
    valueType: "boolean",
  });

  addSpec({
    key: "side_burner",
    label: "Side Burner",
    value: variant.sideBurner,
    group: "Features",
    valueType: "boolean",
  });

  addSpec({
    key: "supports_propane",
    label: "Supports Propane",
    value: variant.supportsPropane,
    group: "Fuel",
    valueType: "boolean",
  });

  addSpec({
    key: "supports_natural_gas",
    label: "Supports Natural Gas",
    value: variant.supportsNaturalGas,
    group: "Fuel",
    valueType: "boolean",
  });

  addSpec({
    key: "supports_charcoal",
    label: "Supports Charcoal",
    value: variant.supportsCharcoal,
    group: "Fuel",
    valueType: "boolean",
  });

  addSpec({
    key: "supports_pellet",
    label: "Supports Pellet",
    value: variant.supportsPellet,
    group: "Fuel",
    valueType: "boolean",
  });

  addSpec({
    key: "supports_wood",
    label: "Supports Wood",
    value: variant.supportsWood,
    group: "Fuel",
    valueType: "boolean",
  });

  addSpec({
    key: "built_in_compatible",
    label: "Built-In Compatible",
    value: variant.builtInCompatible,
    group: "Installation",
    valueType: "boolean",
  });

  addSpec({
    key: "freestanding_compatible",
    label: "Freestanding Compatible",
    value: variant.freestandingCompatible,
    group: "Installation",
    valueType: "boolean",
  });

  addSpec({
    key: "supports_built_in",
    label: "Supports Built-In",
    value: variant.supportsBuiltIn,
    group: "Installation",
    valueType: "boolean",
  });

  addSpec({
    key: "supports_freestanding",
    label: "Supports Freestanding",
    value: variant.supportsFreestanding,
    group: "Installation",
    valueType: "boolean",
  });

  addSpec({
    key: "optional_base_supported",
    label: "Optional Base Supported",
    value: variant.optionalBaseSupported,
    group: "Installation",
    valueType: "boolean",
  });

  addSpec({
    key: "compatible_base",
    label: "Compatible Base",
    value: variant.compatibleBase,
    group: "Installation",
  });

  return specs;
}

export function exportSpecs({ sourceData, datasets }) {
  const rows = sourceData.getSheetRows("specs");
  const variantRecords = datasets?.get?.("variants")?.records || [];

  const baseSpecs = rows
    .filter((row) => {
      if (!row) return false;

      const id = toStringOrEmpty(row.spec_id);
      const entityType = normalizeEntityType(row.entity_type);
      const entityId =
        entityType === "variant"
          ? toStringOrEmpty(row.entity_id || row.variant_id)
          : toStringOrEmpty(row.entity_id);
      const specKey = toStringOrEmpty(row.spec_key);

      return Boolean(id && entityType && entityId && specKey);
    })
    .map((row) => {
      const entityType = normalizeEntityType(row.entity_type);
      const entityId =
        entityType === "variant"
          ? toStringOrEmpty(row.entity_id || row.variant_id)
          : toStringOrEmpty(row.entity_id);

      return {
        id: toStringOrEmpty(row.spec_id),
        entityType,
        entityId,
        variantId: entityType === "variant" ? entityId : "",
        key: toStringOrEmpty(row.spec_key),
        label: toStringOrEmpty(row.spec_label),
        value: row.spec_value == null ? "" : String(row.spec_value).trim(),
        unit: toStringOrEmpty(row.spec_unit || row.unit),
        valueType: toStringOrEmpty(row.value_type),
        group: toStringOrEmpty(row.spec_group),
        sortOrder:
          row.spec_sort_order != null && row.spec_sort_order !== ""
            ? toNumberOrNull(row.spec_sort_order)
            : toNumberOrNull(row.sort_order),
        isActive: toBoolean(row.active, true),
      };
    });

  const existingVariantSpecKeys = new Set(
    baseSpecs
      .filter((spec) => spec.entityType === "variant" && spec.entityId && spec.key)
      .map((spec) => `${spec.entityId}::${spec.key}`)
  );

  const derivedSpecs = variantRecords.flatMap((variant) =>
    buildDerivedVariantSpecs(variant).filter(
      (spec) => !existingVariantSpecKeys.has(`${spec.entityId}::${spec.key}`)
    )
  );

  return [...baseSpecs, ...derivedSpecs];
}