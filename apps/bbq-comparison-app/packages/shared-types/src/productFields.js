import {
  CAPABILITY_INPUT_KEYS,
  CAPABILITY_OUTPUT_KEYS,
  RESERVED_SYNC_FIELDS,
} from "./productCatalog.js";

export const COMMON_RECORD_FIELDS = Object.freeze({
  Active: "boolean",
  SortOrder: "number",
});

export const BRAND_FIELDS = Object.freeze({
  BrandId: "string",
  BrandName: "string",
  LogoURL: "string|null",
  BrandBackgroundURL: "string|null",
  Description: "string|null",
  Active: "boolean",
  SortOrder: "number",
});

export const FAMILY_FIELDS = Object.freeze({
  FamilyId: "string",
  BrandId: "string",
  FamilyName: "string",
  FuelType: "string|null",
  Category: "string|null",
  Description: "string|null",
  Active: "boolean",
  SortOrder: "number",
});

export const VARIANT_CORE_FIELDS = Object.freeze({
  VariantId: "string",
  FamilyId: "string",
  VariantName: "string",

  ModelNumber: "string|null",
  SKU: "string|null",
  UPC: "string|null",

  FuelType: "string|null",
  FuelGroup: "string|null",
  InstallType: "string|null",
  CookingStyle: "string|null",
  UseCase: "string|null",
  SizeClass: "string|null",
  PriceTier: "string|null",
  SkillLevel: "string|null",
  PortabilityClass: "string|null",

  PrimaryCookingArea: "number|null",
  SecondaryCookingArea: "number|null",
  TotalCookingArea: "number|null",

  Width: "number|null",
  Depth: "number|null",
  Height: "number|null",
  Weight: "number|null",

  Price: "number|null",
  MSRP: "number|null",
  MAPPrice: "number|null",
  SalePrice: "number|null",

  Description: "string|null",
  Active: "boolean",
  SortOrder: "number",
});

export const VARIANT_CAPABILITY_INPUT_FIELDS = Object.freeze(
  CAPABILITY_INPUT_KEYS.reduce((acc, key) => {
    acc[key] = "number|null";
    return acc;
  }, {})
);

export const VARIANT_CAPABILITY_OUTPUT_FIELDS = Object.freeze(
  CAPABILITY_OUTPUT_KEYS.reduce((acc, key) => {
    acc[key] = "number|null";
    return acc;
  }, {})
);

export const VARIANT_RESERVED_SYNC_FIELDS = Object.freeze(
  RESERVED_SYNC_FIELDS.reduce((acc, key) => {
    acc[key] = "string|null";
    return acc;
  }, {})
);

export const COLOR_FIELDS = Object.freeze({
  ColorId: "string",
  ColorName: "string",
  ColorHex: "string|null",
  Active: "boolean",
  SortOrder: "number",
});

export const IMAGE_FIELDS = Object.freeze({
  ImageId: "string",
  EntityType: "string",
  EntityId: "string",
  ColorId: "string|null",
  ImageType: "string|null",
  FileName: "string|null",
  FilePath: "string",
  SourceURL: "string|null",
  SourcePage: "string|null",
  AltText: "string|null",
  SortOrder: "number",
  Active: "boolean",
});

export const SPEC_FIELDS = Object.freeze({
  SpecId: "string",
  EntityType: "string",
  EntityId: "string",
  SpecKey: "string",
  SpecValue: "string",
  SpecGroup: "string|null",
  SortOrder: "number",
  Active: "boolean",
});