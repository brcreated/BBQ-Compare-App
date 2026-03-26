export function resolveDatasetOrder(registry) {
  const resolved = [];
  const unresolved = new Set();

  const map = new Map();
  for (const dataset of registry) {
    map.set(dataset.datasetName, dataset);
  }

  function resolve(dataset) {
    const name = dataset.datasetName;

    if (resolved.includes(name)) return;

    if (unresolved.has(name)) {
      throw new Error(`Circular dataset dependency detected involving "${name}"`);
    }

    unresolved.add(name);

    for (const dep of dataset.dependsOn || []) {
      const depDataset = map.get(dep);

      if (!depDataset) {
        throw new Error(
          `Dataset "${name}" depends on unknown dataset "${dep}"`
        );
      }

      resolve(depDataset);
    }

    unresolved.delete(name);
    resolved.push(name);
  }

  for (const dataset of registry) {
    resolve(dataset);
  }

  return resolved;
}