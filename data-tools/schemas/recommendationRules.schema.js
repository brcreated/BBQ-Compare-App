import { DATASET_CONTRACTS } from "../../packages/shared-types/src/datasetContracts";
import {
  createBooleanField,
  createDatasetSchema,
  createNumberField,
  createStringField,
} from "./schemaHelpers";

const contract = DATASET_CONTRACTS.recommendationRules;

export const recommendationRulesSchema = createDatasetSchema({
  dataset: "recommendationRules",
  fileName: contract.fileName,
  recordKey: contract.recordKey,
  idField: contract.idField,

  dependsOn: [],
  
  fields: {
    RuleId: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
      pattern: "^[A-Z0-9_-]+$",
    }),
    RuleName: createStringField({
      required: true,
      nullable: false,
      minLength: 1,
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
    Filters: Object.freeze({
      type: "array",
      required: true,
      nullable: false,
    }),
    Scores: Object.freeze({
      type: "array",
      required: true,
      nullable: false,
    }),
    Notes: createStringField({
      required: false,
      nullable: true,
    }),
  },
});