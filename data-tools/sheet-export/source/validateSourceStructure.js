function normalizeIssue(issue) {
  return {
    level: issue?.level || "warning",
    code: issue?.code || "SOURCE_ISSUE",
    message: issue?.message || "Unknown source issue.",
    sourceKey: issue?.sourceKey || null,
    sheetName: issue?.sheetName || null,
    rowNumber: issue?.rowNumber || null,
    ...issue,
  };
}

export function validateSourceStructure(sourceData) {
  const issues = (sourceData?.issues || []).map(normalizeIssue);

  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level !== "error");

  const summary = {
    ok: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    issues,
    errors,
    warnings,
  };

  return summary;
}

export function formatSourceValidationSummary(validation) {
  const safeValidation = validation || {
    ok: true,
    errorCount: 0,
    warningCount: 0,
    issues: [],
  };

  const lines = [
    `Source validation: ${safeValidation.ok ? "OK" : "FAILED"}`,
    `Errors: ${safeValidation.errorCount}`,
    `Warnings: ${safeValidation.warningCount}`,
  ];

  if ((safeValidation.issues || []).length > 0) {
    lines.push("");
    lines.push("Issues:");

    safeValidation.issues.forEach((issue) => {
      const locationParts = [
        issue.sheetName ? `sheet=${issue.sheetName}` : null,
        issue.rowNumber ? `row=${issue.rowNumber}` : null,
        issue.sourceKey ? `source=${issue.sourceKey}` : null,
      ].filter(Boolean);

      const location =
        locationParts.length > 0 ? ` (${locationParts.join(", ")})` : "";

      lines.push(
        `- [${issue.level.toUpperCase()}] ${issue.code}: ${issue.message}${location}`
      );
    });
  }

  return lines.join("\n");
}