function buildGoogleSheetsCsvUrl({ spreadsheetId, sheetName }) {
  const baseUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq`;
  const query = new URLSearchParams({
    tqx: "out:csv",
    sheet: sheetName,
  });

  return `${baseUrl}?${query.toString()}`;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text) {
  const rows = [];
  let currentLine = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      currentLine += char;
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (currentLine.length > 0 || char === "\n") {
        rows.push(parseCsvLine(currentLine));
      }

      currentLine = "";

      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      continue;
    }

    currentLine += char;
  }

  if (currentLine.length > 0) {
    rows.push(parseCsvLine(currentLine));
  }

  return rows;
}

export class GoogleSheetsWorkbook {
  constructor({ spreadsheetId, fetchImpl = fetch }) {
    if (!spreadsheetId) {
      throw new Error("Missing required spreadsheetId for GoogleSheetsWorkbook.");
    }

    this.spreadsheetId = spreadsheetId;
    this.fetchImpl = fetchImpl;
    this.cache = new Map();
  }

  async getSheetValues(sheetName) {
    if (!sheetName) {
      throw new Error("Missing sheetName.");
    }

    if (this.cache.has(sheetName)) {
      return this.cache.get(sheetName);
    }

    const url = buildGoogleSheetsCsvUrl({
      spreadsheetId: this.spreadsheetId,
      sheetName,
    });

    const response = await this.fetchImpl(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to load Google Sheet tab "${sheetName}" from spreadsheet "${this.spreadsheetId}" (${response.status} ${response.statusText}).`
      );
    }

    const csvText = await response.text();
    const values = parseCsv(csvText);

    this.cache.set(sheetName, values);
    return values;
  }
}