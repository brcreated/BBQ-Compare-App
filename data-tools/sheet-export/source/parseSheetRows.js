import { buildNormalizedHeaderIndex } from "./normalizeHeaders.js";

function isCellEmpty(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function isCompletelyBlankRow(row) {
  return !row || row.every(isCellEmpty);
}

function toCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return typeof value === "string" ? value.trim() : value;
}

function buildMissingRequiredColumns(requiredColumns, headerIndex) {
  return (requiredColumns || []).filter((columnName) => !headerIndex.has(columnName));
}

export function parseSheetRows({
  sourceKey,
  sheetName,
  values,
  requiredColumns = [],
  keyColumn = null,
}) {
  const safeValues = Array.isArray(values) ? values : [];

  if (safeValues.length === 0) {
    return {
      sourceKey,
      sheetName,
      headers: [],
      rows: [],
      skippedRowCount: 0,
      issues: [
        {
          level: "warning",
          code: "EMPTY_SHEET",
          message: `Sheet "${sheetName}" exists but has no rows.`,
          sourceKey,
          sheetName,
        },
      ],
    };
  }

  const [headerRow = [], ...dataRows] = safeValues;
  const { normalizedHeaders, index, duplicates } = buildNormalizedHeaderIndex(headerRow);

  const issues = [];
  const rows = [];
  let skippedRowCount = 0;

  if (duplicates.length > 0) {
    duplicates.forEach((duplicate) => {
      issues.push({
        level: "error",
        code: "DUPLICATE_HEADER",
        message: `Sheet "${sheetName}" has duplicate header "${duplicate.headerName}".`,
        sourceKey,
        sheetName,
        headerName: duplicate.headerName,
        firstColumnIndex: duplicate.firstColumnIndex,
        duplicateColumnIndex: duplicate.duplicateColumnIndex,
      });
    });
  }

  const missingRequiredColumns = buildMissingRequiredColumns(requiredColumns, index);

  if (missingRequiredColumns.length > 0) {
    issues.push({
      level: "error",
      code: "MISSING_REQUIRED_COLUMNS",
      message: `Sheet "${sheetName}" is missing required columns: ${missingRequiredColumns.join(", ")}.`,
      sourceKey,
      sheetName,
      missingColumns: missingRequiredColumns,
    });
  }

  dataRows.forEach((rawRow, rowOffset) => {
    const sourceRowNumber = rowOffset + 2;
    const row = Array.isArray(rawRow) ? rawRow : [];

    if (isCompletelyBlankRow(row)) {
      skippedRowCount += 1;
      return;
    }

    const parsedRow = {};

    normalizedHeaders.forEach((headerName, columnIndex) => {
      if (!headerName) {
        return;
      }

      parsedRow[headerName] = toCellValue(row[columnIndex]);
    });

    const sourceMeta = {
      sourceKey,
      sheetName,
      rowNumber: sourceRowNumber,
    };

    if (keyColumn && isCellEmpty(parsedRow[keyColumn])) {
      issues.push({
        level: "warning",
        code: "EMPTY_KEY_COLUMN",
        message: `Sheet "${sheetName}" row ${sourceRowNumber} is missing key column "${keyColumn}" and was skipped.`,
        sourceKey,
        sheetName,
        rowNumber: sourceRowNumber,
        keyColumn,
      });
      skippedRowCount += 1;
      return;
    }

    rows.push({
      ...parsedRow,
      _source: sourceMeta,
    });
  });

  return {
    sourceKey,
    sheetName,
    headers: normalizedHeaders,
    rows,
    skippedRowCount,
    issues,
  };
}