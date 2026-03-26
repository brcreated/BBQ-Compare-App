function normalizeHeaderValue(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeHeaderName(header) {
  return normalizeHeaderValue(header);
}

export function normalizeHeaderRow(headerRow) {
  return (headerRow || []).map(normalizeHeaderName);
}

export function buildNormalizedHeaderIndex(headerRow) {
  const normalizedHeaders = normalizeHeaderRow(headerRow);
  const index = new Map();
  const duplicates = [];

  normalizedHeaders.forEach((headerName, columnIndex) => {
    if (!headerName) {
      return;
    }

    if (index.has(headerName)) {
      duplicates.push({
        headerName,
        firstColumnIndex: index.get(headerName),
        duplicateColumnIndex: columnIndex,
      });
      return;
    }

    index.set(headerName, columnIndex);
  });

  return {
    normalizedHeaders,
    index,
    duplicates,
  };
}