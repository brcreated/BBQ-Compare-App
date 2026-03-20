import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT_DIR = path.resolve("data-tools/sheet-export/output");

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJsonFile(filePath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, "utf8");
}

export async function writeLocalOutput({
  files,
  outputDir = DEFAULT_OUTPUT_DIR,
}) {
  if (!files || typeof files !== "object") {
    throw new Error("writeLocalOutput requires a files object.");
  }

  await ensureDirectory(outputDir);

  const writtenFiles = [];

  for (const [fileName, data] of Object.entries(files)) {
    const filePath = path.join(outputDir, fileName);

    await writeJsonFile(filePath, data);

    writtenFiles.push({
      fileName,
      filePath,
    });
  }

  return {
    outputDir,
    writtenFiles,
  };
}