import crypto from "node:crypto";
import { getDatasetRegistry } from "./datasetRegistry.js";
import { resolveDatasetOrder } from "./dependencyResolver.js";
import { loadSourceData } from "./loadSourceData.js";
import { serializeDataset } from "./serializeDataset.js";
import { buildManifest } from "./buildManifest.js";
import { preparePublishPayload } from "./publishDatasets.js";
import { getExporter } from "./exporters/index.js";
import { validateExportDataset } from "./validateExportDataset.js";

function createContentHash(contents) {
  return crypto.createHash("sha256").update(contents, "utf8").digest("hex");
}

function buildDatasetVersion(hash) {
  return hash.slice(0, 12);
}

export async function runSheetExport({ adapter, outputBasePath = "data" } = {}) {
  const registry = getDatasetRegistry();
  const exportOrder = resolveDatasetOrder(registry);

  const sourceSheetNames = registry.map((entry) => entry.datasetName);
  const sourceData = await loadSourceData({
    adapter,
    sheets: sourceSheetNames,
  });

  const datasets = [];
  const datasetMap = new Map();
  const errors = [];
  const warnings = [];

  for (const datasetName of exportOrder) {
    const datasetConfig = registry.find(
      (entry) => entry.datasetName === datasetName
    );

    if (!datasetConfig) {
      throw new Error(`Missing dataset config for "${datasetName}"`);
    }

    try {
      const exporter = getExporter(datasetConfig.exporter);

      const records = await exporter({
        sourceData,
        datasets: datasetMap,
        datasetConfig,
      });

      if (!Array.isArray(records)) {
        throw new Error(
          `Exporter "${datasetConfig.exporter}" must return an array`
        );
      }

      validateExportDataset({
        datasetName: datasetConfig.datasetName,
        contract: datasetConfig.contract,
        records,
        datasets: datasetMap,
      });

      const contents = serializeDataset(records);
      const hash = createContentHash(contents);
      const version = buildDatasetVersion(hash);

      const datasetResult = {
        datasetName: datasetConfig.datasetName,
        fileName: datasetConfig.fileName,
        contract: datasetConfig.contract,
        dependsOn: [...(datasetConfig.dependsOn || [])],
        required: datasetConfig.required !== false,
        recordCount: records.length,
        version,
        hash,
        records,
        contents,
        path: `${outputBasePath}/${datasetConfig.fileName}`,
        contentType: "application/json",
      };

      datasets.push(datasetResult);
      datasetMap.set(datasetConfig.datasetName, datasetResult);
    } catch (error) {
      errors.push({
        datasetName,
        message: error instanceof Error ? error.message : String(error),
      });

      if (datasetConfig.required !== false) {
        break;
      }

      warnings.push({
        datasetName,
        message: `Optional dataset "${datasetName}" failed and was skipped`,
      });
    }
  }

  const data = Object.fromEntries(
    datasets.map((dataset) => [dataset.datasetName, dataset.records])
  );

  const success = errors.length === 0;

  if (!success) {
    return {
      success: false,
      exportOrder,
      datasets: datasets.map((dataset) => ({
        datasetName: dataset.datasetName,
        fileName: dataset.fileName,
        recordCount: dataset.recordCount,
        version: dataset.version,
        hash: dataset.hash,
      })),
      data,
      counts: Object.fromEntries(
        datasets.map((dataset) => [dataset.datasetName, dataset.recordCount])
      ),
      hashes: Object.fromEntries(
        datasets.map((dataset) => [dataset.datasetName, dataset.hash])
      ),
      errors,
      warnings,
      publishPayload: null,
      manifest: null,
    };
  }

  const manifestObject = buildManifest({
    generatedAt: new Date(),
    datasets,
  });

  const manifestContents = JSON.stringify(manifestObject, null, 2) + "\n";
  const manifestFile = {
    path: `${outputBasePath}/manifest.json`,
    contents: manifestContents,
    contentType: "application/json",
  };

  const publishPayload = preparePublishPayload({
    datasetFiles: datasets.map((dataset) => ({
      path: dataset.path,
      contents: dataset.contents,
      contentType: dataset.contentType,
    })),
    manifestFile,
  });

  return {
    success: true,
    exportOrder,
    datasets: datasets.map((dataset) => ({
      datasetName: dataset.datasetName,
      fileName: dataset.fileName,
      recordCount: dataset.recordCount,
      version: dataset.version,
      hash: dataset.hash,
    })),
    data,
    counts: Object.fromEntries(
      datasets.map((dataset) => [dataset.datasetName, dataset.recordCount])
    ),
    hashes: Object.fromEntries(
      datasets.map((dataset) => [dataset.datasetName, dataset.hash])
    ),
    errors,
    warnings,
    manifest: manifestObject,
    publishPayload,
  };
}