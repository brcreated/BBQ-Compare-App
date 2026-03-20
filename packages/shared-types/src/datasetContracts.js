import {
  BRAND_FIELDS,
  FAMILY_FIELDS,
  VARIANT_CORE_FIELDS,
  VARIANT_CAPABILITY_INPUT_FIELDS,
  VARIANT_CAPABILITY_OUTPUT_FIELDS,
  VARIANT_RESERVED_SYNC_FIELDS,
  COLOR_FIELDS,
  IMAGE_FIELDS,
  SPEC_FIELDS,
} from "./productFields.js";

export const DATASET_CONTRACTS = Object.freeze({
  brands: Object.freeze({
    fileName: "brands.json",
    recordKey: "brands",
    idField: "BrandId",
    fields: BRAND_FIELDS,
  }),

  families: Object.freeze({
    fileName: "families.json",
    recordKey: "families",
    idField: "FamilyId",
    fields: FAMILY_FIELDS,
  }),

  variants: Object.freeze({
    fileName: "variants.json",
    recordKey: "variants",
    idField: "VariantId",
    fields: Object.freeze({
      ...VARIANT_CORE_FIELDS,
      ...VARIANT_CAPABILITY_INPUT_FIELDS,
      ...VARIANT_CAPABILITY_OUTPUT_FIELDS,
      ...VARIANT_RESERVED_SYNC_FIELDS,
    }),
  }),

  colors: Object.freeze({
    fileName: "colors.json",
    recordKey: "colors",
    idField: "ColorId",
    fields: COLOR_FIELDS,
  }),

  specs: Object.freeze({
    fileName: "specs.json",
    recordKey: "specs",
    idField: "SpecId",
    fields: SPEC_FIELDS,
  }),

  assets: Object.freeze({
    fileName: "assets.json",
    recordKey: "assets",
    idField: "ImageId",
    fields: IMAGE_FIELDS,
  }),

  recommendationRules: Object.freeze({
    fileName: "recommendationRules.json",
    recordKey: "recommendationRules",
    idField: "RuleId",
    fields: Object.freeze({
      RuleId: "string",
      RuleType: "string",
      RuleValue: "string|null",
    }),
  }),
});