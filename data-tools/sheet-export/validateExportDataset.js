import { validateDataset } from "../validators/validateDataset.js";

export function validateExportDataset(input) {
  return validateDataset(input);
}