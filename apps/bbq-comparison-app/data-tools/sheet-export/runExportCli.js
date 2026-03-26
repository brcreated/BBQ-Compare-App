import "dotenv/config";
import { runSheetExport } from "./runExport.js";
import { uploadJsonToR2 } from "../shared/r2Upload.js";

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const spreadsheetId =
    getArg("spreadsheet") ||
    process.env.BBQ_COMPARE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    console.error("");
    console.error("Missing spreadsheet ID.");
    console.error("");
    console.error(
      "Provide one using:\n" +
      "--spreadsheet=<GOOGLE_SHEET_ID>\n" +
      "or environment variable BBQ_COMPARE_SPREADSHEET_ID"
    );
    console.error("");
    process.exit(1);
  }

  const publish = hasFlag("publish");

  const publishConfig = publish
    ? {
        accountId:
          getArg("cf-account-id") ||
          process.env.CLOUDFLARE_ACCOUNT_ID,
        bucketName:
          getArg("r2-bucket") ||
          process.env.CLOUDFLARE_R2_BUCKET,
        apiToken:
          getArg("cf-api-token") ||
          process.env.CLOUDFLARE_API_TOKEN,
      }
    : undefined;

  const publishBasePath =
    getArg("publish-base-path") ||
    process.env.BBQ_COMPARE_PUBLISH_BASE_PATH ||
    "data";

  try {
    await runSheetExport({
      spreadsheetId,
      publish,
      publishConfig,
      publishBasePath,
    });

    console.log("Export finished successfully.");
  } catch (error) {
    console.error("");
    console.error("Export failed.");
    console.error("");
    console.error(error);
    console.error("");
    process.exit(1);
  }
}

main();