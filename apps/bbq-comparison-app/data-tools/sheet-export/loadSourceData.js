export async function loadSourceData({ adapter, sheets = [] } = {}) {
  if (!adapter || typeof adapter.loadSheets !== "function") {
    throw new Error(
      'loadSourceData requires an adapter with a "loadSheets" function'
    );
  }

  const requestedSheets = [...new Set(sheets)].filter(Boolean);
  const rawSheets = await adapter.loadSheets(requestedSheets);

  if (!rawSheets || typeof rawSheets !== "object" || Array.isArray(rawSheets)) {
    throw new Error("Source adapter must return an object keyed by sheet name");
  }

  const sourceData = {};

  for (const sheetName of requestedSheets) {
    const rows = rawSheets[sheetName];

    if (!Array.isArray(rows)) {
      throw new Error(`Source sheet "${sheetName}" did not return a row array`);
    }

    sourceData[sheetName] = {
      sheetName,
      rows: rows.map((row) => ({ ...row })),
      rowCount: rows.length,
    };
  }

  return {
    requestedSheets,
    sheets: sourceData,
    getSheetRows(sheetName) {
      return sourceData[sheetName]?.rows ?? [];
    },
    getSheet(sheetName) {
      return sourceData[sheetName] ?? {
        sheetName,
        rows: [],
        rowCount: 0,
      };
    },
  };
}