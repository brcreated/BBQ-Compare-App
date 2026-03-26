import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import {
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.specs;

export const specsSchema = createDatasetSchema({
  dataset: "specs",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: ["variants"],
  
  fields: {
    SpecId: createStringField({
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
    SpecName: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    SpecValue: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    SpecGroup: createStringField({
      required: false,
      nullable: true,
    }),
    SortOrder: createNumberField({
      required: true,
      nullable: false,
      integer: true,
      min: 0,
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