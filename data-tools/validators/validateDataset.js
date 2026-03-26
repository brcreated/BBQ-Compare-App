function isNullish(value) {
  return value === null || value === undefined;
}

function isEmptyString(value) {
  return typeof value === "string" && value.trim() === "";
}

function normalizeString(value, fieldConfig) {
  if (typeof value !== "string") return value;
  return fieldConfig.trim === false ? value : value.trim();
}

function validateStringField(fieldName, value, fieldConfig, errors, recordIndex) {
  const nextValue = normalizeString(value, fieldConfig);

  if (fieldConfig.nullable && nextValue === null) {
    return;
  }

  if (typeof nextValue !== "string") {
    errors.push(`[${recordIndex}] ${fieldName} must be a string.`);
    return;
  }

  if (!fieldConfig.nullable && isEmptyString(nextValue)) {
    errors.push(`[${recordIndex}] ${fieldName} cannot be empty.`);
    return;
  }

  if (
    typeof fieldConfig.minLength === "number" &&
    nextValue.length < fieldConfig.minLength
  ) {
    errors.push(
      `[${recordIndex}] ${fieldName} must be at least ${fieldConfig.minLength} characters.`
    );
  }

  if (Array.isArray(fieldConfig.enum) && !fieldConfig.enum.includes(nextValue)) {
    errors.push(
      `[${recordIndex}] ${fieldName} must be one of: ${fieldConfig.enum.join(", ")}.`
    );
  }

  if (fieldConfig.pattern) {
    const regex = new RegExp(fieldConfig.pattern);
    if (!regex.test(nextValue)) {
      errors.push(`[${recordIndex}] ${fieldName} does not match required format.`);
    }
  }
}

function validateNumberField(fieldName, value, fieldConfig, errors, recordIndex) {
  if (fieldConfig.nullable && value === null) {
    return;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push(`[${recordIndex}] ${fieldName} must be a number.`);
    return;
  }

  if (fieldConfig.integer && !Number.isInteger(value)) {
    errors.push(`[${recordIndex}] ${fieldName} must be an integer.`);
  }

  if (typeof fieldConfig.min === "number" && value < fieldConfig.min) {
    errors.push(`[${recordIndex}] ${fieldName} must be >= ${fieldConfig.min}.`);
  }

  if (typeof fieldConfig.max === "number" && value > fieldConfig.max) {
    errors.push(`[${recordIndex}] ${fieldName} must be <= ${fieldConfig.max}.`);
  }
}

function validateBooleanField(fieldName, value, fieldConfig, errors, recordIndex) {
  if (fieldConfig.nullable && value === null) {
    return;
  }

  if (typeof value !== "boolean") {
    errors.push(`[${recordIndex}] ${fieldName} must be a boolean.`);
  }
}

function validateField(fieldName, value, fieldConfig, errors, recordIndex) {
  if (isNullish(value)) {
    if (fieldConfig.required && !fieldConfig.nullable) {
      errors.push(`[${recordIndex}] ${fieldName} is required.`);
    }
    return;
  }

  if (value === null && fieldConfig.nullable) {
    return;
  }

  if (fieldConfig.type === "string") {
    validateStringField(fieldName, value, fieldConfig, errors, recordIndex);
    return;
  }

  if (fieldConfig.type === "number") {
    validateNumberField(fieldName, value, fieldConfig, errors, recordIndex);
    return;
  }

  if (fieldConfig.type === "boolean") {
    validateBooleanField(fieldName, value, fieldConfig, errors, recordIndex);
  }
}

function buildLookup(records, idField) {
  const lookup = new Set();

  for (const record of records) {
    if (record && record[idField] !== undefined && record[idField] !== null) {
      lookup.add(record[idField]);
    }
  }

  return lookup;
}

function validateUniqueIds(schema, records, errors) {
  const seen = new Map();

  records.forEach((record, index) => {
    const idValue = record?.[schema.idField];

    if (isNullish(idValue) || idValue === "") {
      return;
    }

    if (seen.has(idValue)) {
      errors.push(
        `[${index}] Duplicate ${schema.idField} "${idValue}" also appears at record [${seen.get(
          idValue
        )}].`
      );
      return;
    }

    seen.set(idValue, index);
  });
}

function validateRelationships(schema, records, relatedDatasets, errors) {
  for (const relationship of schema.relationships || []) {
    const targetRecords = relatedDatasets[relationship.targetDataset] || [];
    const targetLookup = buildLookup(targetRecords, relationship.targetField);

    records.forEach((record, index) => {
      const value = record?.[relationship.field];

      if (isNullish(value) || value === "") {
        if (relationship.required) {
          errors.push(
            `[${index}] ${relationship.field} must reference ${relationship.targetDataset}.${relationship.targetField}.`
          );
        }
        return;
      }

      if (!targetLookup.has(value)) {
        errors.push(
          `[${index}] ${relationship.field} references missing ${relationship.targetDataset}.${relationship.targetField}: ${value}.`
        );
      }
    });
  }
}

export function validateDataset(schema, payload, relatedDatasets = {}) {
  const errors = [];
  const records = payload?.[schema.recordKey];

  if (!Array.isArray(records)) {
    return {
      valid: false,
      errors: [`Payload key "${schema.recordKey}" must be an array.`],
    };
  }

  records.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`[${index}] Record must be an object.`);
      return;
    }

    Object.entries(schema.fields).forEach(([fieldName, fieldConfig]) => {
      validateField(fieldName, record[fieldName], fieldConfig, errors, index);
    });
  });

  validateUniqueIds(schema, records, errors);
  validateRelationships(schema, records, relatedDatasets, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}