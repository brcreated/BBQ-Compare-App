function toBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  return ["true", "yes", "1", "active"].includes(normalized);
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function exportRecommendationRules({ sourceData }) {
  const rows = sourceData.getSheetRows("recommendationRules");

  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  return rows
    .filter((row) => row && row.rule_id && row.target_variant_id)
    .map((row) => ({
      id: String(row.rule_id).trim(),
      targetVariantId: String(row.target_variant_id).trim(),
      conditionKey: row.condition_key ? String(row.condition_key).trim() : "",
      operator: row.operator ? String(row.operator).trim() : "",
      value: row.value == null ? "" : String(row.value).trim(),
      score: toNumber(row.score, 0),
      priority: toNumber(row.priority, 0),
      isActive: toBoolean(row.active, true),
    }));
}