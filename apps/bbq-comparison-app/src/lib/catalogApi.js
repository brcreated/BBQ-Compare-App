const DATA_BASE_URL = import.meta.env.VITE_DATA_BASE_URL;
const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || "";

function joinUrl(base, path) {
  return `${String(base || "").replace(/\/+$/, "")}/${String(path || "").replace(
    /^\/+/,
    ""
  )}`;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.json();
}

export async function loadCatalogData() {
  if (!DATA_BASE_URL) {
    throw new Error("VITE_DATA_BASE_URL is missing");
  }

  const urls = {
    manifest: joinUrl(DATA_BASE_URL, "manifest.json"),
    brands: joinUrl(DATA_BASE_URL, "brands.json"),
    families: joinUrl(DATA_BASE_URL, "families.json"),
    variants: joinUrl(DATA_BASE_URL, "variants.json"),
    colors: joinUrl(DATA_BASE_URL, "colors.json"),
    assets: joinUrl(DATA_BASE_URL, "assets.json"),
    specs: joinUrl(DATA_BASE_URL, "specs.json"),
    recommendationRules: joinUrl(DATA_BASE_URL, "recommendationRules.json"),
  };

  const [
    manifest,
    brands,
    families,
    variants,
    colors,
    assets,
    specs,
    recommendationRules,
  ] = await Promise.all([
    fetchJson(urls.manifest),
    fetchJson(urls.brands),
    fetchJson(urls.families),
    fetchJson(urls.variants),
    fetchJson(urls.colors),
    fetchJson(urls.assets),
    fetchJson(urls.specs),
    fetchJson(urls.recommendationRules),
  ]);

  return {
    manifest,
    brands,
    families,
    variants,
    colors,
    assets,
    specs,
    recommendationRules,
  };
}

export function getRemoteAssetUrl(asset) {
  if (!asset) return "";

  const rawPath = asset.filePath || asset.file_path;

  if (!rawPath) {
    return asset.url || asset.src || asset.image_url || asset.imageUrl || "";
  }

  const path = String(rawPath).trim();

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedBase = String(ASSET_BASE_URL || "").replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  const finalPath = normalizedPath.startsWith("products/")
    ? normalizedPath
    : `products/${normalizedPath}`;

  return `${normalizedBase}/${finalPath}`;
}