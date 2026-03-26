function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObjectKeys(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function defaultRecordSorter(a, b) {
  const aId = typeof a?.id === "string" ? a.id : "";
  const bId = typeof b?.id === "string" ? b.id : "";

  if (aId && bId) {
    return aId.localeCompare(bId);
  }

  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

export function serializeDataset(dataset, options = {}) {
  const {
    sortRecords = true,
    recordSorter = defaultRecordSorter,
    sortKeys = true,
    space = 2,
  } = options;

  if (!Array.isArray(dataset)) {
    throw new Error("serializeDataset expects an array dataset");
  }

  const normalizedRecords = sortRecords
    ? [...dataset].sort(recordSorter)
    : [...dataset];

  const finalRecords = sortKeys
    ? normalizedRecords.map(sortObjectKeys)
    : normalizedRecords;

  return JSON.stringify(finalRecords, null, space) + "\n";
}