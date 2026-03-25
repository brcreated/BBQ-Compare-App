import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import {
  createBooleanField,
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.variantColors;

export const variantColorsSchema = createDatasetSchema({
  dataset: "variantColors",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: ["variants", "colors"],

  fields: {
    VariantColorId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    VariantId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    ColorId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    SortOrder: createNumberField({
      required: false,
      nullable: true,
      integer: true,
      min: 0,
    }),
    Active: createBooleanField({
      required: true,
      nullable: false,
    }),
  },
  relationships: [
    {
      type: "belongsTo",
      field: "VariantId",
      targetDataset: "variants",
      targetField: "VariantId",
      required: true,
    },
    {
      type: "belongsTo",
      field: "ColorId",
      targetDataset: "colors",
      targetField: "ColorId",
      required: true,
    },
  ],
});