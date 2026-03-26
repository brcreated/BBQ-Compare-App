import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import { IMAGE_TYPES } from "../../packages/shared-types/src/productCatalog";
import {
  createBooleanField,
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.assets;

export const assetsSchema = createDatasetSchema({
  dataset: "assets",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: ["variants", "colors"],
  
  fields: {
    ImageId: createStringField({
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
    ColorId: createStringField({
      required: false,
      nullable: true,
      pattern: "^[A-Z0-9_-]+$",
    }),
    ImageURL: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    ImageType: createStringField({
      required: true,
      nullable: false,
      enum: IMAGE_TYPES,
    }),
    Selected: createBooleanField({
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
      required: false,
    },
  ],
});