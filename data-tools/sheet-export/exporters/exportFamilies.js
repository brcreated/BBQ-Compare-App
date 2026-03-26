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

export function exportFamilies({ sourceData }) {
  const rows = sourceData.getSheetRows("families");

  return rows
    .filter((row) => row && row.family_id && row.brand_id && row.family_name)
    .map((row) => ({
      id: String(row.family_id).trim(),
      brandId: String(row.brand_id).trim(),
      name: String(row.family_name).trim(),
      description: row.description ? String(row.description).trim() : "",
      sortOrder: toNumberOrNull(row.sort_order),
      isActive: toBoolean(row.active, true),
    }));
}