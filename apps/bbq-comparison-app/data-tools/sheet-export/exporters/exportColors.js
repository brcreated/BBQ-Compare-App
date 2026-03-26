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

export function exportColors({ sourceData }) {
  const rows = sourceData.getSheetRows("colors");

  return rows
    .filter((row) => {
      if (!row) return false;

      const colorId = toStringOrEmpty(row.color_id);
      const colorName = toStringOrEmpty(row.color_name);

      return Boolean(colorId && colorName);
    })
    .map((row) => ({
      id: toStringOrEmpty(row.color_id),
      name: toStringOrEmpty(row.color_name),
      family: toStringOrEmpty(row.color_family),
      swatchHex: toStringOrEmpty(row.color_hex),
      imageUrl: toStringOrEmpty(row.image_url),
      sortOrder: toNumberOrNull(row.sort_order),
      isActive: toBoolean(row.active, true),
    }));
}