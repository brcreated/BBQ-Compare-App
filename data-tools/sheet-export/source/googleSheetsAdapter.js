import { getAllSheetDefinitions, getSheetDefinition } from "./sheetConfig.js";
import { parseSheetRows } from "./parseSheetRows.js";

function buildMissingSheetIssue(definition) {
  return {
    level: definition.required ? "error" : "warning",
    code: "MISSING_SHEET",
    message: `${definition.required ? "Required" : "Optional"} sheet "${definition.sheetName}" was not found.`,
    sourceKey: definition.sourceKey,
    sheetName: definition.sheetName,
  };
}

export class GoogleSheetsAdapter {
  constructor({ workbookName = "Workbook", workbook }) {
    this.workbookName = workbookName;
    this.workbook = workbook;
  }

  async readAllSheets() {
    const definitions = getAllSheetDefinitions();
    const parsedSheets = new Map();
    const issues = [];

    for (const definition of definitions) {
      const values = await this.workbook?.getSheetValues?.(definition.sheetName);

      if (!values) {
        issues.push(buildMissingSheetIssue(definition));
        continue;
      }

      const parsed = parseSheetRows({
        sourceKey: definition.sourceKey,
        sheetName: definition.sheetName,
        values,
        requiredColumns: definition.requiredColumns,
        keyColumn: definition.keyColumn,
      });

      parsedSheets.set(definition.sourceKey, parsed);
      issues.push(...parsed.issues);
    }

    return {
      workbookName: this.workbookName,
      sheets: parsedSheets,
      issues,
    };
  }

  async readSheet(sourceKey) {
    const definition = getSheetDefinition(sourceKey);

    if (!definition) {
      throw new Error(`Unknown sheet source key "${sourceKey}".`);
    }

    const values = await this.workbook?.getSheetValues?.(definition.sheetName);

    if (!values) {
      return null;
    }

    return parseSheetRows({
      sourceKey,
      sheetName: definition.sheetName,
      values,
      requiredColumns: definition.requiredColumns,
      keyColumn: definition.keyColumn,
    });
  }
}

export async function loadGoogleSheetSourceData({ workbookName, workbook }) {
  const adapter = new GoogleSheetsAdapter({ workbookName, workbook });
  const result = await adapter.readAllSheets();

  return {
    workbookName: result.workbookName,
    issues: result.issues,
    hasErrors: result.issues.some((issue) => issue.level === "error"),

    getSheet(sourceKey) {
      return result.sheets.get(sourceKey) || null;
    },

    getSheetRows(sourceKey) {
      return result.sheets.get(sourceKey)?.rows || [];
    },

    getSheetHeaders(sourceKey) {
      return result.sheets.get(sourceKey)?.headers || [];
    },

    getAllSheets() {
      return result.sheets;
    },
  };
}