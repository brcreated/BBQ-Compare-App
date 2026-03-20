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

function normalizeEntityType(value) {
  return value ? String(value).trim().toLowerCase() : "";
}

function normalizeAssetType(row) {
  if (row.image_type != null && row.image_type !== "") {
    return String(row.image_type).trim();
  }

  if (row.asset_type != null && row.asset_type !== "") {
    return String(row.asset_type).trim();
  }

  return "image";
}

function pickFilePath(row) {
  if (row.file_path != null && row.file_path !== "") {
    return String(row.file_path).trim();
  }

  if (row.url != null && row.url !== "") {
    return String(row.url).trim();
  }

  if (row.source_url != null && row.source_url !== "") {
    return String(row.source_url).trim();
  }

  return "";
}

export function exportAssets({ sourceData }) {
  const rows = sourceData.getSheetRows("assets");

  return rows
    .filter((row) => {
      if (!row) return false;

      const id = toStringOrEmpty(row.asset_id);
      const entityType = normalizeEntityType(row.entity_type);
      const entityId = toStringOrEmpty(row.entity_id);
      const filePath = pickFilePath(row);

      return Boolean(id && entityType && entityId && filePath);
    })
    .map((row) => {
      const entityType = normalizeEntityType(row.entity_type);
      const entityId = toStringOrEmpty(row.entity_id);

      return {
        id: toStringOrEmpty(row.asset_id),
        entityType,
        entityId,
        brandId: entityType === "brand" ? entityId : "",
        familyId: entityType === "family" ? entityId : "",
        variantId: entityType === "variant" ? entityId : "",
        colorId: toStringOrEmpty(row.color_id),
        imageType: normalizeAssetType(row),
        fileName: toStringOrEmpty(row.file_name),
        filePath: pickFilePath(row),
        sourceUrl: toStringOrEmpty(row.source_url),
        sourcePage: toStringOrEmpty(row.source_page),
        altText: toStringOrEmpty(row.alt_text),
        sortOrder: toNumberOrNull(row.sort_order),
        isActive: toBoolean(row.active, true),
      };
    });
}