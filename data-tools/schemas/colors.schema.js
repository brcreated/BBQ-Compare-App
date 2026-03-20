import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import {
  createBooleanField,
  createDatasetSchema,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.colors;

export const colorsSchema = createDatasetSchema({
  dataset: "colors",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: ["variants"],
  
  fields: {
    ColorId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    VariantId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    ColorName: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    ColorHex: createStringField({
      required: false,
      nullable: true,
      pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
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
  ],
});