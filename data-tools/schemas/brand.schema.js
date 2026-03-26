import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import { createBooleanField, createDatasetSchema, createNumberField, createStringField } from "./schemaHelpers";

const contract = DATASET_CONTRACTS.brands;

export const brandsSchema = createDatasetSchema({
  dataset: "brands",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: [],
  
  fields: {
    BrandId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    BrandName: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    LogoURL: createStringField({
      required: false,
      nullable: true,
      minLength: 1,
    }),
    BrandBackgroundURL: createStringField({
      required: false,
      nullable: true,
      minLength: 1,
    }),
    Description: createStringField({
      required: false,
      nullable: true,
    }),
    Active: createBooleanField({
      required: true,
      nullable: false,
    }),
    SortOrder: createNumberField({
      required: true,
      nullable: false,
      integer: true,
      min: 0,
    }),
  },
});