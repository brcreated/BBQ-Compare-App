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

function buildVariantColorId(variantId, colorId) {
  return `${variantId}__${colorId}`;
}

export function exportVariantColors({ sourceData, datasets }) {
  const rows = sourceData.getSheetRows("variantColors");

  const variantDataset = datasets?.get?.("variants");
  const colorDataset = datasets?.get?.("colors");

  const validVariantIds = new Set(
    Array.isArray(variantDataset?.records)
      ? variantDataset.records
          .map((record) => toStringOrEmpty(record.id))
          .filter(Boolean)
      : []
  );

  const validColorIds = new Set(
    Array.isArray(colorDataset?.records)
      ? colorDataset.records
          .map((record) => toStringOrEmpty(record.id))
          .filter(Boolean)
      : []
  );

  return rows
    .filter((row) => {
      if (!row) return false;

      const variantId = toStringOrEmpty(row.variant_id);
      const colorId = toStringOrEmpty(row.color_id);

      if (!variantId || !colorId) return false;
      if (validVariantIds.size > 0 && !validVariantIds.has(variantId)) return false;
      if (validColorIds.size > 0 && !validColorIds.has(colorId)) return false;

      return true;
    })
    .map((row) => {
      const variantId = toStringOrEmpty(row.variant_id);
      const colorId = toStringOrEmpty(row.color_id);

      return {
        id: buildVariantColorId(variantId, colorId),
        variantId,
        colorId,
        sortOrder: toNumberOrNull(row.sort_order),
        isActive: toBoolean(row.active, true),
      };
    });
}