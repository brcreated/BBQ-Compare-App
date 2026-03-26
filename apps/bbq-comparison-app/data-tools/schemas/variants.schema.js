import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import {
  createBooleanField,
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.variants;

export const variantsSchema = createDatasetSchema({
  dataset: "variants",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: ["families"],
  
  fields: {
    VariantId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    FamilyId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    VariantName: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
    }),
    ModelNumber: createStringField({
      required: false,
      nullable: true,
    }),
    CookingArea: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    Weight: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    Width: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    Depth: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    Height: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    Price: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    Active: createBooleanField({
      required: true,
      nullable: false,
    }),

    PrimaryCookingArea: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    SecondaryCookingArea: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    TotalCookingArea: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    GrateLevels: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    RackWidth: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    RackDepth: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),

    BurgerCapacity: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    BrisketCapacity: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    RibRackCapacity: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    PorkButtCapacity: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),
    ChickenCapacity: createNumberField({
      required: false,
      nullable: true,
      min: 0,
    }),

    ShopifyProductId: createStringField({
      required: false,
      nullable: true,
    }),
    ShopifyVariantId: createStringField({
      required: false,
      nullable: true,
    }),
    ShopifyHandle: createStringField({
      required: false,
      nullable: true,
    }),
    PriceSource: createStringField({
      required: false,
      nullable: true,
    }),
    LastShopifySyncAt: createStringField({
      required: false,
      nullable: true,
    }),
  },
  relationships: [
    {
      type: "belongsTo",
      field: "FamilyId",
      targetDataset: "families",
      targetField: "FamilyId",
      required: true,
    },
  ],
});