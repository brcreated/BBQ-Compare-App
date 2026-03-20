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

export function exportSpecs({ sourceData }) {
  const rows = sourceData.getSheetRows("specs");

  return rows
    .filter((row) => {
      if (!row) return false;

      const id = toStringOrEmpty(row.spec_id);
      const entityType = normalizeEntityType(row.entity_type);
      const entityId =
        entityType === "variant"
          ? toStringOrEmpty(row.entity_id || row.variant_id)
          : toStringOrEmpty(row.entity_id);
      const specKey = toStringOrEmpty(row.spec_key);

      return Boolean(id && entityType && entityId && specKey);
    })
    .map((row) => {
      const entityType = normalizeEntityType(row.entity_type);
      const entityId =
        entityType === "variant"
          ? toStringOrEmpty(row.entity_id || row.variant_id)
          : toStringOrEmpty(row.entity_id);

      return {
        id: toStringOrEmpty(row.spec_id),
        entityType,
        entityId,
        variantId: entityType === "variant" ? entityId : "",
        key: toStringOrEmpty(row.spec_key),
        label: toStringOrEmpty(row.spec_label),
        value: row.spec_value == null ? "" : String(row.spec_value).trim(),
        unit: toStringOrEmpty(row.spec_unit || row.unit),
        valueType: toStringOrEmpty(row.value_type),
        group: toStringOrEmpty(row.spec_group),
        sortOrder:
          row.spec_sort_order != null && row.spec_sort_order !== ""
            ? toNumberOrNull(row.spec_sort_order)
            : toNumberOrNull(row.sort_order),
        isActive: toBoolean(row.active, true),
      };
    });
}