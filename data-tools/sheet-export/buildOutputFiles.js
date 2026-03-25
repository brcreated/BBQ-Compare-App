const DATASET_FILE_NAMES = {
  brands: "brands.json",
  families: "families.json",
  variants: "variants.json",
  colors: "colors.json",
  variantColors: "variantColors.json",
  assets: "assets.json",
  specs: "specs.json",
  recommendationRules: "recommendationRules.json",
};

function resolveDatasets(exportResult) {
  if (
    exportResult?.data &&
    typeof exportResult.data === "object" &&
    !Array.isArray(exportResult.data)
  ) {
    return exportResult.data;
  }

  throw new Error(
    "Export result did not include datasets. Expected exportResult.data."
  );
}

function resolveManifest(exportResult) {
  if (exportResult?.manifest && typeof exportResult.manifest === "object") {
    return exportResult.manifest;
  }

  if (
    exportResult?.publishPayload?.manifest &&
    typeof exportResult.publishPayload.manifest === "object"
  ) {
    return exportResult.publishPayload.manifest;
  }

  throw new Error(
    "Export result did not include a manifest. Expected exportResult.manifest or exportResult.publishPayload.manifest."
  );
}

export function buildOutputFiles(exportResult) {
  const datasets = resolveDatasets(exportResult);
  const manifest = resolveManifest(exportResult);

  const files = {};

  for (const [datasetKey, fileName] of Object.entries(DATASET_FILE_NAMES)) {
    files[fileName] = Array.isArray(datasets[datasetKey]) ? datasets[datasetKey] : [];
  }

  files["manifest.json"] = manifest;

  return files;
}