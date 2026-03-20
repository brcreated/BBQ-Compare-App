export const SOURCE_WORKBOOK = {
  name: "BBQ Comparison Source Workbook",
};

export const SHEET_DEFINITIONS = {
  brands: {
    sheetName: "Brands",
    required: true,
    requiredColumns: ["brand_id", "brand_name"],
    optionalColumns: [
      "brand_slug",
      "brand_logo_url",
      "brand_background_url",
      "description",
      "website_url",
      "active",
      "sort_order",
      "notes",
    ],
    keyColumn: "brand_id",
  },

  families: {
    sheetName: "Families",
    required: true,
    requiredColumns: ["family_id", "brand_id", "family_name"],
    optionalColumns: [
      "family_slug",
      "cooking_category",
      "fuel_type",
      "description",
      "active",
      "sort_order",
      "notes",
    ],
    keyColumn: "family_id",
  },

  variants: {
    sheetName: "Variants",
    required: true,
    requiredColumns: ["variant_id", "family_id", "variant_name"],
    optionalColumns: [
      "model_number",
      "variant_slug",
      "active",
      "sort_order",
      "cooking_category",
      "fuel_type",
      "install_type",
      "sku",
      "status",
      "notes",
      "data_source",
      "last_updated_at",
    ],
    keyColumn: "variant_id",
  },

  colors: {
    sheetName: "Colors",
    required: false,
    requiredColumns: ["color_id", "color_name"],
    optionalColumns: [
      "color_family",
      "color_hex",
      "image_url",
      "sort_order",
      "active",
      "notes",
    ],
    keyColumn: "color_id",
  },

  variantColors: {
    sheetName: "VariantColors",
    required: false,
    requiredColumns: ["variant_id", "color_id"],
    optionalColumns: [
      "sort_order",
      "active",
      "notes",
    ],
    keyColumn: null,
  },

  assets: {
    sheetName: "Assets",
    required: false,
    requiredColumns: ["asset_id", "entity_type", "entity_id"],
    optionalColumns: [
      "image_type",
      "asset_type",
      "file_name",
      "file_path",
      "source_url",
      "source_page",
      "source_priority",
      "width_px",
      "height_px",
      "alt_text",
      "sort_order",
      "active",
      "notes",
      "url",
    ],
    keyColumn: "asset_id",
  },

  specs: {
    sheetName: "Specs",
    required: false,
    requiredColumns: ["spec_id", "entity_type", "entity_id", "spec_key", "spec_value"],
    optionalColumns: [
      "variant_id",
      "spec_label",
      "spec_unit",
      "unit",
      "value_type",
      "spec_group",
      "spec_sort_order",
      "sort_order",
      "comparison_priority",
      "is_comparison_key",
      "active",
      "notes",
    ],
    keyColumn: "spec_id",
  },

  recommendationRules: {
    sheetName: "RecommendationRules",
    required: false,
    requiredColumns: ["rule_id"],
    optionalColumns: [
      "target_variant_id",
      "condition_key",
      "operator",
      "value",
      "score",
      "priority",
      "active",
    ],
    keyColumn: "rule_id",
  },
};

export function getSheetDefinition(sourceKey) {
  return SHEET_DEFINITIONS[sourceKey] || null;
}

export function getAllSheetDefinitions() {
  return Object.entries(SHEET_DEFINITIONS).map(([sourceKey, definition]) => ({
    sourceKey,
    ...definition,
  }));
}

export function getRequiredSheetDefinitions() {
  return getAllSheetDefinitions().filter((definition) => definition.required);
}