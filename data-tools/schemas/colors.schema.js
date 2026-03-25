import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import {
  createBooleanField,
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.colors;

export const colorsSchema = createDatasetSchema({
  dataset: "colors",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: [],

  fields: {
    ColorId: createStringField({
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
    ColorFamily: createStringField({
      required: false,
      nullable: true,
    }),
    ColorHex: createStringField({
      required: false,
      nullable: true,
      pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    }),
    ImageURL: createStringField({
      required: false,
      nullable: true,
      minLength: 1,
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
});