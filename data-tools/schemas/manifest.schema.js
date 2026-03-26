import {
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

export const manifestSchema = createDatasetSchema({
  dataset: "manifest",
  fileName: "manifest.json",
  recordKey: "manifest",
  idField: "Dataset",

  dependsOn: [],
  
  fields: {
    Dataset: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),

    File: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),

    Version: createNumberField({
      required: true,
      nullable: false,
      integer: true,
      min: 1,
    }),

    RecordCount: createNumberField({
      required: true,
      nullable: false,
      integer: true,
      min: 0,
    }),

    Hash: createStringField({
      required: true,
      nullable: false,
      minLength: 10,
    }),

    GeneratedAt: createStringField({
      required: true,
      nullable: false,
    }),
  },
});