
// src/pages/BrandSelection.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/brand-selection.css";

function joinUrl(base, path) {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function resolveAssetUrl(base, path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (isAbsoluteUrl(value)) return value;
  return joinUrl(base, value);
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function cleanLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTitle(value) {
  return cleanLabel(value).replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function isActiveRecord(record) {
  const value = record?.isActive ?? record?.active ?? true;

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  return !["false", "0", "no", "inactive"].includes(normalized);
}

function getRecordId(record) {
  return normalizeId(
    pickFirst(record?.id, record?.brand_id, record?.brandId, record?.slug, record?.brand_slug)
  );
}

function getAssetEntityType(asset) {
  return normalizeId(pickFirst(asset?.entity_type, asset?.entityType));
}

function getAssetEntityId(asset) {
  return normalizeId(
    pickFirst(asset?.entity_id, asset?.entityId, asset?.brand_id, asset?.brandId)
  );
}

function getAssetType(asset) {
  return normalizeId(
    pickFirst(asset?.image_type, asset?.imageType, asset?.assetType, asset?.type)
  );
}

function getAssetSortOrder(asset) {
  const raw = pickFirst(asset?.sort_order, asset?.sortOrder, 999999);
  const num = Number(raw);
  return Number.isFinite(num) ? num : 999999;
}

function getAssetFilePath(asset) {
  return pickFirst(
    asset?.file_path,
    asset?.filePath,
    asset?.url,
    asset?.src,
    asset?.path
  );
}

function getBrandLogoUrl(brand, assets, assetBaseUrl) {
  const directLogo = resolveAssetUrl(
    assetBaseUrl,
    pickFirst(
      brand?.logoUrl,
      brand?.logo_url,
      brand?.brandLogoUrl,
      brand?.brand_logo_url
    )
  );

  if (directLogo) return directLogo;

  const brandId = getRecordId(brand);

  const logoAsset = assets
    .filter((asset) => {
      if (!isActiveRecord(asset)) return false;
      if (getAssetEntityType(asset) !== "brand") return false;
      if (getAssetEntityId(asset) !== brandId) return false;

      const assetType = getAssetType(asset);
      return ["logo", "brand-logo", "brand_logo"].includes(assetType);
    })
    .sort((a, b) => getAssetSortOrder(a) - getAssetSortOrder(b))[0];

  if (!logoAsset) return "";

  return resolveAssetUrl(assetBaseUrl, getAssetFilePath(logoAsset));
}

export default function BrandSelection() {
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dataBaseUrl = import.meta.env.VITE_DATA_BASE_URL || "";
  const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL || "";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        if (!dataBaseUrl) {
          throw new Error("Missing VITE_DATA_BASE_URL");
        }

        const [brandsResponse, assetsResponse] = await Promise.all([
          fetch(joinUrl(dataBaseUrl, "brands.json")),
          fetch(joinUrl(dataBaseUrl, "assets.json")),
        ]);

        const failedResponse = [brandsResponse, assetsResponse].find(
          (response) => !response.ok
        );

        if (failedResponse) {
          throw new Error(`Failed to fetch ${failedResponse.url}`);
        }

        const [brandsJson, assetsJson] = await Promise.all([
          brandsResponse.json(),
          assetsResponse.json(),
        ]);

        if (cancelled) return;

        setBrands(Array.isArray(brandsJson) ? brandsJson : []);
        setAssets(Array.isArray(assetsJson) ? assetsJson : []);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load brands"
        );
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [dataBaseUrl]);

  const visibleBrands = useMemo(() => {
    return brands
      .filter((brand) => isActiveRecord(brand))
      .map((brand) => {
        const id = getRecordId(brand);

        return {
          id,
          name: pickFirst(
            brand?.displayName,
            brand?.display_name,
            brand?.shortName,
            brand?.short_name,
            brand?.title,
            brand?.label,
            brand?.name,
            formatTitle(id)
          ),
          logoUrl: getBrandLogoUrl(brand, assets, assetBaseUrl),
          sortOrder: Number(pickFirst(brand?.sortOrder, brand?.sort_order, 999999)),
        };
      })
      .filter((brand) => brand.id)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return String(a.name).localeCompare(String(b.name));
      });
  }, [brands, assets, assetBaseUrl]);

  return (
    <main className="brand-selection-screen">
      <div className="ambient-light ambient-light-1" />
      <div className="ambient-light ambient-light-2" />
      <div className="ambient-light ambient-light-3" />
      <div className="ambient-grid" />

      <section className="brand-selection-shell">
        <div className="brand-selection-topbar">
          <button
            type="button"
            className="home-button interactive-button"
            onClick={() => navigate("/discover")}
          >
            <span className="button-sheen" />
            Home
          </button>
        </div>

        <section className="brand-hero">
          <div className="brand-hero-copy">
            <div className="brand-selection-eyebrow">Showroom Navigation</div>
            <h1 className="brand-selection-title">Browse by Brand</h1>
            <p className="brand-selection-subtitle">
              Tap a logo to explore products, compare lines, and move through the catalog with a simple touchscreen flow.
            </p>
          </div>
        </section>

        <section className="brand-gallery-shell">
          {loading ? (
            <div className="brand-selection-grid">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="brand-card brand-card--skeleton">
                  <div className="skeleton-logo-wrap" />
                  <div className="brand-card-footer">
                    <div className="skeleton-line skeleton-line--name" />
                    <div className="skeleton-line skeleton-line--cta" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="brand-selection-placeholder brand-selection-error">
              {error}
            </div>
          ) : visibleBrands.length === 0 ? (
            <div className="brand-selection-placeholder">
              No brands available.
            </div>
          ) : (
            <>
              <div className="brand-gallery-header">
                <div className="brand-gallery-title">Select a Brand</div>
                <div className="brand-gallery-meta">{visibleBrands.length} brands available</div>
              </div>

              <div className="brand-selection-grid">
                {visibleBrands.map((brand) => (
                  <article
                    key={brand.id}
                    className="brand-card interactive-button"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/brand/${brand.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/brand/${brand.id}`);
                      }
                    }}
                  >
                    <span className="button-sheen" />

                    <div className="brand-card-logo-wrap">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={`${brand.name} logo`}
                          className="brand-card-logo"
                        />
                      ) : (
                        <div className="brand-card-fallback">{brand.name}</div>
                      )}
                    </div>

                    <div className="brand-card-footer">
                      <div className="brand-card-name">{brand.name}</div>
                      <div className="brand-card-cta">Tap to Explore</div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

