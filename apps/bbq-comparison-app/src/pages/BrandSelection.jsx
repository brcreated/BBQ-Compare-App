
// src/pages/BrandSelection.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
            <div className="brand-selection-placeholder">Loading brands...</div>
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

      <style>{`
        .brand-selection-screen {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          overflow-y: visible;
          background:
            radial-gradient(circle at 18% 14%, rgba(76, 110, 168, 0.09), transparent 28%),
            radial-gradient(circle at 82% 88%, rgba(76, 110, 168, 0.08), transparent 32%),
            linear-gradient(180deg, #0a0d12 0%, #0f141b 48%, #090c11 100%);
          color: #e6edf7;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .ambient-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.08;
          background-image:
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.7));
        }

        .ambient-light {
          position: absolute;
          border-radius: 999px;
          filter: blur(130px);
          pointer-events: none;
          opacity: 0.1;
          animation: ambientFloat 14s ease-in-out infinite;
        }

        .ambient-light-1 {
          width: 520px;
          height: 520px;
          top: -180px;
          left: -120px;
          background: #4f6691;
          animation-delay: 0s;
        }

        .ambient-light-2 {
          width: 560px;
          height: 560px;
          right: -180px;
          bottom: -180px;
          background: #3d5377;
          animation-delay: 3s;
        }

        .ambient-light-3 {
          width: 420px;
          height: 420px;
          top: 28%;
          left: 42%;
          background: #324661;
          opacity: 0.06;
          animation-delay: 6s;
        }

        .brand-selection-shell {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          width: 100%;
          padding: 18px 28px 34px;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 20px;
        }

        .brand-selection-topbar {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .interactive-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 120ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 160ms ease,
            filter 120ms ease;
          -webkit-tap-highlight-color: transparent;
          will-change: transform;
        }

        .interactive-button:active {
          transform: scale(0.975);
          filter: brightness(1.04);
        }

        .interactive-button:focus-visible {
          outline: 2px solid rgba(122, 157, 219, 0.5);
          outline-offset: 2px;
        }

        .interactive-button::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(122,157,219,0.22) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 160ms ease;
          pointer-events: none;
        }

        .interactive-button:active::after {
          opacity: 1;
        }

        .button-sheen {
          position: absolute;
          inset: -120% auto auto -40%;
          width: 38%;
          height: 260%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(20deg);
          pointer-events: none;
          opacity: 0;
        }

        .home-button {
          height: 68px;
          min-width: 380px;
          padding: 0 44px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(102,138,193,0.96) 0%, rgba(70,96,137,0.96) 100%);
          color: #f7fbff;
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow:
            0 18px 42px rgba(67, 93, 131, 0.38),
            inset 0 1px 0 rgba(255,255,255,0.2);
          cursor: pointer;
        }

        .brand-hero {
          max-width: 1180px;
          margin: 0 auto;
          width: 100%;
          padding: 22px 6px 6px;
          text-align: center;
        }

        .brand-hero-copy {
          margin: 0 auto;
          max-width: 860px;
          display: grid;
          gap: 12px;
        }

        .brand-selection-eyebrow {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(230, 237, 247, 0.54);
        }

        .brand-selection-title {
          margin: 0;
          font-size: clamp(3rem, 4.6vw, 5.3rem);
          line-height: 0.96;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: #f6f9ff;
          text-shadow: 0 8px 30px rgba(0,0,0,0.26);
        }

        .brand-selection-subtitle {
          margin: 0 auto;
          max-width: 760px;
          font-size: 1.02rem;
          line-height: 1.7;
          font-weight: 500;
          color: rgba(230, 237, 247, 0.74);
        }

        .brand-gallery-shell {
          position: relative;
          max-width: 1520px;
          margin: 0 auto;
          width: 100%;
          padding: 28px;
          border-radius: 34px;
          border: 1px solid rgba(255,255,255,0.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.016));
          box-shadow:
            0 30px 80px rgba(0,0,0,0.38),
            inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(22px);
          overflow: hidden;
        }

        .brand-gallery-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at top center, rgba(90,120,180,0.09), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 28%);
        }

        .brand-gallery-header {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 26px;
          padding: 0 4px;
        }

        .brand-gallery-title {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(243,247,255,0.95);
        }

        .brand-gallery-meta {
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(230,237,247,0.48);
        }

        .brand-selection-placeholder {
          min-height: 320px;
          border: 2px dashed rgba(148, 163, 184, 0.22);
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(203, 213, 225, 0.72);
          font-weight: 700;
          padding: 24px;
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.02);
        }

        .brand-selection-error {
          color: #fecaca;
          border-color: rgba(248, 113, 113, 0.35);
          background: rgba(127, 29, 29, 0.16);
        }

        .brand-selection-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
        }

        .brand-card {
          min-height: 292px;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.18);
          background:
            linear-gradient(180deg, rgba(250,252,255,0.98) 0%, rgba(238,243,249,0.96) 100%);
          box-shadow:
            0 30px 64px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255,255,255,0.86);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 22px;
          box-sizing: border-box;
          cursor: pointer;
        }

        .brand-card-logo-wrap {
          flex: 1;
          min-height: 156px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            radial-gradient(circle at top center, rgba(76,110,168,0.14), transparent 54%),
            linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,247,252,0.82));
          border-radius: 22px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.95),
            0 12px 28px rgba(14, 22, 34, 0.08);
        }

        .brand-card-logo {
          max-width: 100%;
          max-height: 98px;
          object-fit: contain;
          display: block;
          filter: saturate(1.03) contrast(1.02);
        }

        .brand-card-fallback {
          text-align: center;
          font-size: 1.15rem;
          line-height: 1.3;
          font-weight: 800;
          color: #243247;
        }

        .brand-card-footer {
          display: grid;
          gap: 8px;
          padding-top: 18px;
        }

        .brand-card-name {
          font-size: 1.16rem;
          line-height: 1.18;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-align: center;
          color: #101827;
        }

        .brand-card-cta {
          font-size: 0.78rem;
          line-height: 1;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-align: center;
          color: rgba(56, 82, 120, 0.72);
        }

        @keyframes ambientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(18px, -12px, 0) scale(1.04);
          }
        }

        @media (max-width: 1400px) {
          .brand-selection-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 1120px) {
          .brand-selection-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .brand-gallery-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 1024px) {
          .brand-selection-shell {
            padding: 18px 20px 20px;
          }

          .home-button {
            min-width: 320px;
          }

          .brand-gallery-shell {
            padding: 22px;
          }
        }

        @media (max-width: 768px) {
          .brand-selection-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .brand-gallery-shell {
            padding: 18px;
            border-radius: 26px;
          }

          .brand-selection-title {
            font-size: clamp(2.5rem, 9vw, 3.5rem);
          }

          .home-button {
            width: 100%;
            min-width: 0;
          }

          .brand-gallery-header {
            margin-bottom: 18px;
          }
        }
      `}</style>
    </main>
  );
}
