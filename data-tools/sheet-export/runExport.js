import { GoogleSheetsWorkbook } from "./source/googleSheetsWorkbook.js";
import { loadGoogleSheetSourceData } from "./source/googleSheetsAdapter.js";
import {
  validateSourceStructure,
  formatSourceValidationSummary,
} from "./source/validateSourceStructure.js";
import { runSheetExport as runExportPipeline } from "./exportRunner.js";
import { writeLocalOutput } from "./writeLocalOutput.js";
import { buildOutputFiles } from "./buildOutputFiles.js";
import { publishDatasets } from "./publishDatasets.js";
import { uploadJsonToR2 } from "../shared/r2Upload.js";

export async function runSheetExport({
  spreadsheetId,
  workbookName = "BBQ Comparison Source",
  writeFiles = true,
  outputDir,
  publish = false,
  publishConfig,
  publishBasePath = "data",
}) {
  if (!spreadsheetId) {
    throw new Error("Missing spreadsheetId for export run.");
  }

  console.log("");
  console.log("Starting sheet export...");
  console.log(`Workbook: ${workbookName}`);
  console.log("");

  const workbook = new GoogleSheetsWorkbook({
    spreadsheetId,
  });

  const sourceData = await loadGoogleSheetSourceData({
    workbookName,
    workbook,
  });

  const validation = validateSourceStructure(sourceData);

  console.log(formatSourceValidationSummary(validation));
  console.log("");

  if (!validation.ok) {
    throw new Error("Source validation failed. Export aborted.");
  }

  const exportResult = await runExportPipeline({
    adapter: {
      async loadSheets() {
        return {
          brands: sourceData.getSheetRows("brands"),
          families: sourceData.getSheetRows("families"),
          variants: sourceData.getSheetRows("variants"),
          colors: sourceData.getSheetRows("colors"),
          variantColors: sourceData.getSheetRows("variantColors"),
          assets: sourceData.getSheetRows("assets"),
          specs: sourceData.getSheetRows("specs"),
          recommendationRules: sourceData.getSheetRows("recommendationRules"),
        };
      },
    },
    outputBasePath: publishBasePath,
  });

  const files = buildOutputFiles(exportResult);

  for (const [filename, data] of Object.entries(files)) {
  await uploadJsonToR2(filename, data);
}

  let localOutput = null;
  if (writeFiles) {
    localOutput = await writeLocalOutput({
      files,
      outputDir,
    });

    console.log("Local files written:");
    localOutput.writtenFiles.forEach((file) => {
      console.log(`- ${file.fileName}`);
    });
    console.log("");
  }

  let publishResult = null;
  if (publish) {
    publishResult = await publishDatasets({
      files,
      publishConfig,
      basePath: publishBasePath,
    });

    console.log("Published files:");
    publishResult.uploads.forEach((upload) => {
      console.log(`- ${upload.objectKey}`);
    });
    console.log("");
  }

  console.log("Export execution complete.");
  console.log("");

  return {
    sourceValidation: validation,
    exportResult,
    localOutput,
    publishResult,
  };
}