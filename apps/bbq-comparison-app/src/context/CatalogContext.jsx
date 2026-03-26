// src/context/CatalogContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadCatalogDatasets } from "../lib/catalogApi";

const CatalogContext = createContext(null);

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function indexById(items) {
  const map = new Map();

  for (const item of safeArray(items)) {
    const id = item?.id;
    if (!id) continue;
    map.set(id, item);
  }

  return map;
}

function indexVariantBySlug(variants) {
  const map = new Map();

  for (const variant of safeArray(variants)) {
    const slug = variant?.slug;
    if (!slug) continue;
    map.set(slug, variant);
  }

  return map;
}

function groupByVariantId(items) {
  const map = new Map();

  for (const item of safeArray(items)) {
    const variantId = item?.variantId;
    if (!variantId) continue;

    if (!map.has(variantId)) {
      map.set(variantId, []);
    }

    map.get(variantId).push(item);
  }

  return map;
}

function groupVariantSpecs(specs) {
  const map = new Map();

  for (const spec of safeArray(specs)) {
    const entityType = String(spec?.entityType || "").trim().toLowerCase();
    if (entityType !== "variant") continue;

    const variantId = spec?.entityId;
    if (!variantId) continue;

    if (!map.has(variantId)) {
      map.set(variantId, []);
    }

    map.get(variantId).push(spec);
  }

  return map;
}

function sortGroupedValues(map, compareFn) {
  for (const [key, values] of map.entries()) {
    map.set(key, [...values].sort(compareFn));
  }

  return map;
}

function assetSort(a, b) {
  const aSort = Number.isFinite(Number(a?.sortOrder)) ? Number(a.sortOrder) : 999999;
  const bSort = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 999999;

  if (aSort !== bSort) return aSort - bSort;

  const aType = String(a?.imageType || "");
  const bType = String(b?.imageType || "");
  return aType.localeCompare(bType);
}

function specSort(a, b) {
  const aSort = Number.isFinite(Number(a?.sortOrder)) ? Number(a.sortOrder) : 999999;
  const bSort = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 999999;

  if (aSort !== bSort) return aSort - bSort;

  const aLabel = String(a?.label || a?.key || "");
  const bLabel = String(b?.label || b?.key || "");
  return aLabel.localeCompare(bLabel);
}

function variantColorSort(a, b) {
  const aSort = Number.isFinite(Number(a?.sortOrder)) ? Number(a.sortOrder) : 999999;
  const bSort = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 999999;

  if (aSort !== bSort) return aSort - bSort;

  const aName = String(a?.name || "");
  const bName = String(b?.name || "");
  return aName.localeCompare(bName);
}

export function CatalogProvider({ children }) {
  const [datasets, setDatasets] = useState({
    brands: [],
    families: [],
    variants: [],
    specs: [],
    assets: [],
    colors: [],
    variantColors: [],
  });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setStatus("loading");
      setError(null);

      try {
        const result = await loadCatalogDatasets();

        if (!isMounted) return;

        setDatasets({
          brands: safeArray(result.brands),
          families: safeArray(result.families),
          variants: safeArray(result.variants),
          specs: safeArray(result.specs),
          assets: safeArray(result.assets),
          colors: safeArray(result.colors),
          variantColors: safeArray(result.variantColors),
        });
        setStatus("ready");
      } catch (loadError) {
        if (!isMounted) return;

        setError(loadError);
        setStatus("error");
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  const lookups = useMemo(() => {
    const variantById = indexById(datasets.variants);
    const variantBySlug = indexVariantBySlug(datasets.variants);
    const familyById = indexById(datasets.families);
    const brandById = indexById(datasets.brands);
    const colorsById = indexById(datasets.colors);

    const specsByVariantId = sortGroupedValues(
      groupVariantSpecs(datasets.specs),
      specSort,
    );

    const assetsByVariantId = sortGroupedValues(
      groupByVariantId(datasets.assets),
      assetSort,
    );

    const variantColorsByVariantId = sortGroupedValues(
      groupByVariantId(datasets.variantColors),
      variantColorSort,
    );

    return {
      variantById,
      variantBySlug,
      familyById,
      brandById,
      specsByVariantId,
      assetsByVariantId,
      colorsById,
      variantColorsByVariantId,
    };
  }, [datasets]);

  const value = useMemo(() => {
    return {
      status,
      loading: status === "loading",
      ready: status === "ready",
      error,
      datasets,
      ...datasets,
      ...lookups,
    };
  }, [status, error, datasets, lookups]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }

  return context;
}
