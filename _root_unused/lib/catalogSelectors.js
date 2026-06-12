function normalizeString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeLookupKey(value) {
  return normalizeString(value).toLowerCase();
}

function buildEntityKey(entityType, entityId) {
  return `${normalizeLookupKey(entityType)}:${normalizeString(entityId)}`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickPreferredImage(assets) {
  const list = safeArray(assets);

  if (!list.length) return null;

  const hero =
    list.find((item) => item.imageType === "hero") ||
    list.find((item) => item.imageType === "primary") ||
    list.find((item) => item.imageType === "main") ||
    list[0];

  return hero || null;
}

export function getBrandById(runtime, brandId) {
  return runtime?.indexes?.brandById?.get(brandId) || null;
}

export function getFamilyById(runtime, familyId) {
  return runtime?.indexes?.familyById?.get(familyId) || null;
}

export function getVariantById(runtime, variantId) {
  return runtime?.indexes?.variantById?.get(variantId) || null;
}

export function getVariantBySlug(runtime, slug) {
  return runtime?.indexes?.variantBySlug?.get(slug) || null;
}

export function getFamiliesByBrandId(runtime, brandId) {
  return runtime?.indexes?.familiesByBrandId?.get(brandId) || [];
}

export function getVariantsByBrandId(runtime, brandId) {
  return runtime?.indexes?.variantsByBrandId?.get(brandId) || [];
}

export function getVariantsByFamilyId(runtime, familyId) {
  return runtime?.indexes?.variantsByFamilyId?.get(familyId) || [];
}

export function getColorsByVariantId(runtime, variantId) {
  return runtime?.indexes?.colorsByVariantId?.get(variantId) || [];
}

export function getAssetsForEntity(runtime, entityType, entityId) {
  const key = buildEntityKey(entityType, entityId);
  return runtime?.indexes?.assetsByEntityKey?.get(key) || [];
}

export function getSpecsForEntity(runtime, entityType, entityId) {
  const key = buildEntityKey(entityType, entityId);
  return runtime?.indexes?.specsByEntityKey?.get(key) || [];
}

export function getSpecByKey(runtime, entityType, entityId, specKey) {
  const key = buildEntityKey(entityType, entityId);
  const entitySpecMap = runtime?.indexes?.specMapByEntityKey?.get(key);

  if (!entitySpecMap) return null;

  return entitySpecMap.get(normalizeLookupKey(specKey)) || null;
}

export function getHeroAssetForVariant(runtime, variantId) {
  return pickPreferredImage(getAssetsForEntity(runtime, "variant", variantId));
}

export function getHeroAssetForFamily(runtime, familyId) {
  return pickPreferredImage(getAssetsForEntity(runtime, "family", familyId));
}

export function getLogoAssetForBrand(runtime, brandId) {
  const directBrand = getBrandById(runtime, brandId);

  if (directBrand?.logoUrl) {
    return {
      url: directBrand.logoUrl,
      altText: directBrand.name || "Brand logo",
      imageType: "logo",
    };
  }

  const brandAssets = getAssetsForEntity(runtime, "brand", brandId);
  const logo =
    brandAssets.find((item) => item.imageType === "logo") ||
    brandAssets.find((item) => item.imageType === "primary") ||
    brandAssets[0];

  return logo || null;
}

export function getResolvedVariantBundle(runtime, variantOrIdOrSlug) {
  const variant =
    typeof variantOrIdOrSlug === "object" && variantOrIdOrSlug
      ? variantOrIdOrSlug
      : getVariantById(runtime, variantOrIdOrSlug) ||
        getVariantBySlug(runtime, variantOrIdOrSlug);

  if (!variant) return null;

  const family = getFamilyById(runtime, variant.familyId);
  const brand = getBrandById(runtime, variant.brandId);
  const assets = getAssetsForEntity(runtime, "variant", variant.id);
  const heroAsset = getHeroAssetForVariant(runtime, variant.id);
  const specs = getSpecsForEntity(runtime, "variant", variant.id);
  const colors = getColorsByVariantId(runtime, variant.id);

  return {
    brand,
    family,
    variant,
    assets,
    heroAsset,
    specs,
    colors,
  };
}