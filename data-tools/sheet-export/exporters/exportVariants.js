function toBoolean(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();

  if (
    [
      "true",
      "yes",
      "y",
      "1",
      "active",
      "enabled",
      "on",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "n",
      "0",
      "inactive",
      "disabled",
      "off",
    ].includes(normalized)
  ) {
    return false;
  }

  return fallback;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toStringOrEmpty(value) {
  return value == null ? "" : String(value).trim();
}

function toIsoStringOrEmpty(value) {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? toStringOrEmpty(value) : parsed.toISOString();
}

function pickFirstValue(row, keys, fallback = "") {
  for (const key of keys) {
    if (row[key] != null && row[key] !== "") {
      return row[key];
    }
  }
  return fallback;
}

function normalizeStatus(rowActive, rowStatus) {
  const explicitStatus = toStringOrEmpty(rowStatus);
  if (explicitStatus) return explicitStatus;
  return rowActive ? "active" : "inactive";
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
      const id = toStringOrEmpty(row.variant_id);
      const familyId = toStringOrEmpty(row.family_id);

      const brandId =
        toStringOrEmpty(row.brand_id) ||
        toStringOrEmpty(familyToBrandId.get(familyId)) ||
        "";

      const isActive = toBoolean(row.active, true);

      const fuelType = toStringOrEmpty(
        pickFirstValue(row, ["fuel_type", "default_fuel"])
      );

      const category = toStringOrEmpty(
        pickFirstValue(row, ["cooking_category", "category"])
      );

      const installType = toStringOrEmpty(
        pickFirstValue(row, ["install_type", "default_installation"])
      );

      const productWidth = toNumberOrNull(
        pickFirstValue(row, ["product_width", "width"])
      );

      const productDepth = toNumberOrNull(
        pickFirstValue(row, ["product_depth", "depth"])
      );

      const productHeight = toNumberOrNull(
        pickFirstValue(row, ["product_height", "height"])
      );

      const productLength = toNumberOrNull(
        pickFirstValue(row, ["product_length", "length"])
      );

      const productWeight = toNumberOrNull(
        pickFirstValue(row, ["product_weight", "weight"])
      );

      const primaryCookingArea = toNumberOrNull(row.primary_cooking_area);
      const secondaryCookingArea = toNumberOrNull(row.secondary_cooking_area);
      const totalCookingArea = toNumberOrNull(
        pickFirstValue(row, ["total_cooking_area", "cooking_area"])
      );

      return {
        id,
        brandId,
        familyId,

        name: toStringOrEmpty(row.variant_name),
        slug: toStringOrEmpty(
          pickFirstValue(row, ["variant_slug", "slug"], id)
        ),
        modelNumber: toStringOrEmpty(row.model_number),
        sku: toStringOrEmpty(row.sku),
        upc: toStringOrEmpty(row.upc),

        description: toStringOrEmpty(row.description),
        notes: toStringOrEmpty(row.notes),

        category,
        cookingCategory: toStringOrEmpty(row.cooking_category),
        fuelType,
        fuelGroup: toStringOrEmpty(row.fuel_group),
        defaultFuel: toStringOrEmpty(row.default_fuel),
        installType,
        defaultInstallation: toStringOrEmpty(row.default_installation),
        cookingStyle: toStringOrEmpty(row.cooking_style),
        useCase: toStringOrEmpty(row.use_case),
        sizeClass: toStringOrEmpty(row.size_class),
        priceTier: toStringOrEmpty(row.price_tier),
        skillLevel: toStringOrEmpty(row.skill_level),
        portabilityClass: toStringOrEmpty(row.portability_class),

        productWidth,
        productDepth,
        productHeight,
        productLength,
        productWeight,

        width: productWidth,
        depth: productDepth,
        height: productHeight,
        length: productLength,
        weight: productWeight,

        temperatureRangeMin: toNumberOrNull(row.temperature_range_min),
        temperatureRangeMax: toNumberOrNull(row.temperature_range_max),

        primaryCookingArea,
        secondaryCookingArea,
        totalCookingArea,

        grateLevels: toNumberOrNull(row.grate_levels),
        rackWidth: toNumberOrNull(row.rack_width),
        rackDepth: toNumberOrNull(row.rack_depth),

        burgerCapacity: toNumberOrNull(row.burger_capacity),
        brisketCapacity: toNumberOrNull(row.brisket_capacity),
        ribRackCapacity: toNumberOrNull(row.rib_rack_capacity),
        porkButtCapacity: toNumberOrNull(row.pork_butt_capacity),
        chickenCapacity: toNumberOrNull(row.chicken_capacity),

        wifiEnabled: toBoolean(row.wifi_enabled, null),
        rotisserieCompatible: toBoolean(row.rotisserie_compatible, null),
        directFlameAccess: toBoolean(row.direct_flame_access, null),
        sideBurner: toBoolean(row.side_burner, null),

        builtInCompatible: toBoolean(row.built_in_compatible, null),
        freestandingCompatible: toBoolean(row.freestanding_compatible, null),
        supportsBuiltIn: toBoolean(row.supports_built_in, null),
        supportsFreestanding: toBoolean(row.supports_freestanding, null),
        optionalBaseSupported: toBoolean(row.optional_base_supported, null),

        compatibleBase: toStringOrEmpty(row.compatible_base),

        burnerCount: toNumberOrNull(row.burner_count),
        heatZones: toNumberOrNull(row.heat_zones),
        pelletHopperCapacity: toNumberOrNull(row.pellet_hopper_capacity),

        supportsLP: toBoolean(row.supports_lp, null),
        supportsNaturalGas: toBoolean(row.supports_natural_gas, null),
        supportsCharcoal: toBoolean(row.supports_charcoal, null),
        supportsPellet: toBoolean(row.supports_pellet, null),
        supportsWood: toBoolean(row.supports_wood, null),

        fuelConversionSupported: toBoolean(row.fuel_conversion_supported, null),
        compatibleConversionKit: toStringOrEmpty(row.compatible_conversion_kit),

        price: toNumberOrNull(row.price),
        msrp: toNumberOrNull(row.msrp),
        mapPrice: toNumberOrNull(row.map_price),
        salePrice: toNumberOrNull(row.sale_price),
        priceSource: toStringOrEmpty(row.price_source),

        shopifyProductId: toStringOrEmpty(row.shopify_product_id),
        shopifyVariantId: toStringOrEmpty(row.shopify_variant_id),
        shopifyHandle: toStringOrEmpty(row.shopify_handle),
        lastShopifySyncAt: toIsoStringOrEmpty(row.last_shopify_sync_at),

        dataSource: toStringOrEmpty(row.data_source),
        lastUpdatedAt: toIsoStringOrEmpty(row.last_updated_at),

        status: normalizeStatus(isActive, row.status),
        sortOrder: toNumberOrNull(row.sort_order),
        isActive,
      };
    });
}