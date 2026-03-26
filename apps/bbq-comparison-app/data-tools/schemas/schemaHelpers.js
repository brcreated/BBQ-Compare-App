export function createEnum(values) {
  return Object.freeze([...values]);
}

export function createStringField(options = {}) {
  return Object.freeze({
    type: "string",
    required: options.required ?? true,
    nullable: options.nullable ?? false,
    trim: options.trim ?? true,
    minLength: options.minLength ?? 0,
    enum: options.enum ?? null,
    pattern: options.pattern ?? null,
  });
}

export function createNumberField(options = {}) {
  return Object.freeze({
    type: "number",
    required: options.required ?? true,
    nullable: options.nullable ?? false,
    min: options.min ?? null,
    max: options.max ?? null,
    integer: options.integer ?? false,
  });
}

export function createBooleanField(options = {}) {
  return Object.freeze({
    type: "boolean",
    required: options.required ?? true,
    nullable: options.nullable ?? false,
  });
}

export function createFieldSet(fields) {
  return Object.freeze({ ...fields });
}

export function createDatasetSchema(config) {
  return Object.freeze({
    dataset: config.dataset,
    fileName: config.fileName,
    recordKey: config.recordKey,
    idField: config.idField,

    /* NEW */
    dependsOn: Object.freeze(config.dependsOn ?? []),

    fields: createFieldSet(config.fields),
    relationships: Object.freeze(config.relationships ?? []),
  });
}