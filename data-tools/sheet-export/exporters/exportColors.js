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

export function exportColors({ sourceData }) {
  const colorRows = sourceData.getSheetRows("colors");
  const variantColorRows = sourceData.getSheetRows("variantColors");

  const colorLookup = new Map(
    colorRows
      .filter((row) => row && row.color_id && row.color_name)
      .map((row) => [
        String(row.color_id).trim(),
        {
          colorId: String(row.color_id).trim(),
          name: String(row.color_name).trim(),
          swatchHex: row.color_hex ? String(row.color_hex).trim() : "",
          imageUrl: row.image_url ? String(row.image_url).trim() : "",
          sortOrder: toNumberOrNull(row.sort_order),
          isActive: toBoolean(row.active, true),
        },
      ])
  );

  return variantColorRows
    .filter((row) => row && row.variant_id && row.color_id)
    .map((row) => {
      const variantId = String(row.variant_id).trim();
      const colorId = String(row.color_id).trim();
      const color = colorLookup.get(colorId);

      if (!color) {
        return null;
      }

      return {
        id: colorId,
        variantId,
        name: color.name,
        swatchHex: color.swatchHex,
        imageUrl: color.imageUrl,
        sortOrder:
          row.sort_order !== undefined && row.sort_order !== null && row.sort_order !== ""
            ? toNumberOrNull(row.sort_order)
            : color.sortOrder,
        isActive:
          row.active !== undefined && row.active !== null && row.active !== ""
            ? toBoolean(row.active, true)
            : color.isActive,
      };
    })
    .filter(Boolean);
}