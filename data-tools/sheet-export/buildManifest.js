export function buildManifest({ datasets = [], generatedAt = new Date() } = {}) {
  if (!Array.isArray(datasets)) {
    throw new Error("buildManifest expects a datasets array");
  }

  const timestamp =
    generatedAt instanceof Date ? generatedAt.toISOString() : generatedAt;

  const manifestDatasets = {};

  for (const ds of datasets) {
    if (!ds.datasetName) {
      throw new Error("Manifest dataset missing datasetName");
    }

    manifestDatasets[ds.datasetName] = {
      file: ds.fileName,
      version: ds.version,
      records: ds.recordCount,
      hash: ds.hash,
    };
  }

  return {
    version: "1",
    generatedAt: timestamp,
    datasets: manifestDatasets,
  };
}