function toBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  return ["true", "yes", "1", "active"].includes(normalized);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toStringOrEmpty(value) {
  return value == null ? "" : String(value).trim();
}

function pickFirstValue(row, keys) {
  for (const key of keys) {
    if (row[key] != null && row[key] !== "") {
      return row[key];
    }
  }

  return "";
}

export function exportBrands({ sourceData }) {
  const rows = sourceData.getSheetRows("brands");

  return rows
    .filter((row) => row && row.brand_id && row.brand_name)
    .map((row) => ({
      id: toStringOrEmpty(row.brand_id),
      name: toStringOrEmpty(row.brand_name),

      logoUrl: toStringOrEmpty(
        pickFirstValue(row, ["brand_logo_url", "logo_url", "logo"])
      ),
      brandBackgroundUrl: toStringOrEmpty(
        pickFirstValue(row, ["brand_background_url", "background_url"])
      ),
      description: toStringOrEmpty(row.description),
      websiteUrl: toStringOrEmpty(row.website_url),

      sortOrder: toNumberOrNull(row.sort_order),
      isActive: toBoolean(row.active, true),
    }));
}