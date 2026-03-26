export const ENTITY_TYPES = Object.freeze({
  BRAND: "brand",
  FAMILY: "family",
  VARIANT: "variant",
  COLOR: "color",
  IMAGE: "image",
  SPEC: "spec",
});

export const ID_PREFIXES = Object.freeze({
  BRAND: "BRAND",
  FAMILY: "FAMILY",
  VARIANT: "VARIANT",
  COLOR: "COLOR",
  IMAGE: "IMAGE",
  SPEC: "SPEC",
});

export const FUEL_TYPES = Object.freeze([
  "Pellet",
  "Charcoal",
  "Gas",
  "Electric",
  "Wood",
  "Dual Fuel",
]);

export const PRODUCT_CATEGORIES = Object.freeze([
  "Freestanding",
  "Built-In",
  "Offset",
  "Kamado",
  "Pizza Oven",
  "Flat Top",
]);

export const IMAGE_TYPES = Object.freeze([
  "Hero",
  "Gallery",
  "Detail",
  "Lifestyle",
]);

export const CAPABILITY_INPUT_KEYS = Object.freeze([
  "PrimaryCookingArea",
  "SecondaryCookingArea",
  "TotalCookingArea",
  "GrateLevels",
  "RackWidth",
  "RackDepth",
]);

export const CAPABILITY_OUTPUT_KEYS = Object.freeze([
  "BurgerCapacity",
  "BrisketCapacity",
  "RibRackCapacity",
  "PorkButtCapacity",
  "ChickenCapacity",
]);

export const COMPARISON_KEYS = Object.freeze({
  CORE: [
    "FuelType",
    "TotalCookingArea",
    "PrimaryCookingArea",
    "TemperatureRange",
    "Weight",
    "Width",
    "Depth",
    "Height",
    "HopperCapacity",
    "Warranty",
    "MadeInCountry",
    "Price",
  ],
  PERFORMANCE: [
    "MaxTemperature",
    "MinTemperature",
    "PelletHopperSize",
    "BurnerCount",
    "HeatZones",
    "InsulatedCookingChamber",
  ],
  CAPACITY: [
    "BurgerCapacity",
    "BrisketCapacity",
    "RibRackCapacity",
    "PorkButtCapacity",
    "ChickenCapacity",
  ],
  FEATURES: [
    "WiFiEnabled",
    "RotisserieCompatible",
    "DirectFlameAccess",
    "SideBurner",
    "CartType",
    "BuiltInCompatible",
  ],
});

export const RESERVED_SYNC_FIELDS = Object.freeze([
  "ShopifyProductId",
  "ShopifyVariantId",
  "ShopifyHandle",
  "PriceSource",
  "LastShopifySyncAt",
]);

export const DATASET_FILES = Object.freeze([
  "brands.json",
  "families.json",
  "variants.json",
  "specs.json",
  "assets.json",
  "recommendationRules.json",
  "manifest.json",
]);