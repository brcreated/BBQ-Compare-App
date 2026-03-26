import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import {
  FUEL_TYPES,
  PRODUCT_CATEGORIES,
} from "../../packages/shared-types/src/productCatalog";
import {
  createBooleanField,
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.families;

export const familiesSchema = createDatasetSchema({
  dataset: "families",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: ["brands"],

  fields: {
    FamilyId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    BrandId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    FamilyName: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    FuelType: createStringField({
      required: true,
      nullable: false,
      enum: FUEL_TYPES,
    }),
    Category: createStringField({
      required: true,
      nullable: false,
      enum: PRODUCT_CATEGORIES,
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
  relationships: [
    {
      type: "belongsTo",
      field: "BrandId",
      targetDataset: "brands",
      targetField: "BrandId",
      required: true,
    },
  ],
});