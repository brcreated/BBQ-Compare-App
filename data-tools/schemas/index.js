export { brandsSchema } from "./brands.schema";
export { familiesSchema } from "./families.schema";
export { variantsSchema } from "./variants.schema";
export { colorsSchema } from "./colors.schema";
export { variantColorsSchema } from "./variantColors.schema";
export { assetsSchema } from "./assets.schema";
export { specsSchema } from "./specs.schema";
export { manifestSchema } from "./manifest.schema";
export { recommendationRulesSchema } from "./recommendationRules.schema";

import { brandsSchema } from "./brands.schema";
import { familiesSchema } from "./families.schema";
import { variantsSchema } from "./variants.schema";
import { colorsSchema } from "./colors.schema";
import { variantColorsSchema } from "./variantColors.schema";
import { assetsSchema } from "./assets.schema";
import { specsSchema } from "./specs.schema";
import { manifestSchema } from "./manifest.schema";
import { recommendationRulesSchema } from "./recommendationRules.schema";

export const ALL_DATASET_SCHEMAS = Object.freeze([
  brandsSchema,
  familiesSchema,
  variantsSchema,
  colorsSchema,
  variantColorsSchema,
  assetsSchema,
  specsSchema,
  manifestSchema,
  recommendationRulesSchema,
]);