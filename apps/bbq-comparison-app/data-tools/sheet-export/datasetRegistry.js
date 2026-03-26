import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts.js";

export const DATASET_REGISTRY = [
  {
    datasetName: "brands",
    fileName: "brands.json",
    contract: DATASET_CONTRACTS.brands,
    exporter: "exportBrands",
    dependsOn: [],
    required: true,
  },
  {
    datasetName: "families",
    fileName: "families.json",
    contract: DATASET_CONTRACTS.families,
    exporter: "exportFamilies",
    dependsOn: ["brands"],
    required: true,
  },
  {
    datasetName: "variants",
    fileName: "variants.json",
    contract: DATASET_CONTRACTS.variants,
    exporter: "exportVariants",
    dependsOn: ["families", "brands"],
    required: true,
  },
  {
    datasetName: "colors",
    fileName: "colors.json",
    contract: DATASET_CONTRACTS.colors,
    exporter: "exportColors",
    dependsOn: [],
    required: false,
  },
  {
    datasetName: "variantColors",
    fileName: "variantColors.json",
    contract: DATASET_CONTRACTS.variantColors,
    exporter: "exportVariantColors",
    dependsOn: ["variants", "colors"],
    required: false,
  },
  {
    datasetName: "assets",
    fileName: "assets.json",
    contract: DATASET_CONTRACTS.assets,
    exporter: "exportAssets",
    dependsOn: ["brands", "families", "variants", "colors"],
    required: false,
  },
  {
    datasetName: "specs",
    fileName: "specs.json",
    contract: DATASET_CONTRACTS.specs,
    exporter: "exportSpecs",
    dependsOn: ["variants"],
    required: false,
  },
  {
    datasetName: "recommendationRules",
    fileName: "recommendationRules.json",
    contract: DATASET_CONTRACTS.recommendationRules,
    exporter: "exportRecommendationRules",
    dependsOn: ["brands", "families", "variants", "specs"],
    required: false,
  },
];

export function getDatasetRegistry() {
  return DATASET_REGISTRY.map((entry) => ({
    ...entry,
    dependsOn: [...entry.dependsOn],
  }));
}