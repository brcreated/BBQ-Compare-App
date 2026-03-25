import { exportBrands } from "./exportBrands.js";
import { exportFamilies } from "./exportFamilies.js";
import { exportVariants } from "./exportVariants.js";
import { exportColors } from "./exportColors.js";
import { exportVariantColors } from "./exportVariantColors.js";
import { exportAssets } from "./exportAssets.js";
import { exportSpecs } from "./exportSpecs.js";
import { exportRecommendationRules } from "./exportRecommendationRules.js";

export const EXPORTERS = {
  exportBrands,
  exportFamilies,
  exportVariants,
  exportColors,
  exportVariantColors,
  exportAssets,
  exportSpecs,
  exportRecommendationRules,
};

export function getExporter(exporterName) {
  const exporter = EXPORTERS[exporterName];

  if (!exporter) {
    throw new Error(`Unknown exporter "${exporterName}"`);
  }

  return exporter;
}