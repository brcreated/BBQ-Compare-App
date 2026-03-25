// src/lib/catalogApi.js
const RAW_DATA_BASE_URL = import.meta.env.VITE_DATA_BASE_URL || "/data";
const DATA_BASE_URL = RAW_DATA_BASE_URL.replace(/\/$/, "");

function datasetUrl(filename) {
  return `${DATA_BASE_URL}/${filename}`;
}

async function fetchJsonFile(filename) {
  const response = await fetch(datasetUrl(filename), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error(`Failed to load ${filename} (${response.status})`);
    error.status = response.status;
    error.filename = filename;
    throw error;
  }

  return response.json();
}

async function fetchOptionalJsonFile(filenames, fallbackValue = []) {
  for (const filename of filenames) {
    try {
      return await fetchJsonFile(filename);
    } catch (error) {
      if (error?.status === 404) {
        continue;
      }

      throw error;
    }
  }

  return fallbackValue;
}

export async function loadCatalogDatasets() {
  const [variants, families, brands, specs, assets, colors, variantColors] =
    await Promise.all([
      fetchJsonFile("variants.json"),
      fetchJsonFile("families.json"),
      fetchJsonFile("brands.json"),
      fetchJsonFile("specs.json"),
      fetchJsonFile("assets.json"),
      fetchJsonFile("colors.json").catch((error) => {
        if (error?.status === 404) return [];
        throw error;
      }),
      fetchOptionalJsonFile(["variantColors.json", "variantcolors.json"], []),
    ]);

  return {
    variants: Array.isArray(variants) ? variants : [],
    families: Array.isArray(families) ? families : [],
    brands: Array.isArray(brands) ? brands : [],
    specs: Array.isArray(specs) ? specs : [],
    assets: Array.isArray(assets) ? assets : [],
    colors: Array.isArray(colors) ? colors : [],
    variantColors: Array.isArray(variantColors) ? variantColors : [],
  };
}
