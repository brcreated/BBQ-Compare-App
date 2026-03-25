//BrandSelections.jsx

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

        <header className="brand-selection-header interactive-panel">
          <div className="brand-selection-header-content">
            <h1 className="brand-selection-title">Brands</h1>
          </div>
        </header>

        <section className="brand-selection-grid-section interactive-panel">
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

                  <div className="brand-card-name">{brand.name}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .brand-selection-screen {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 14%, rgba(76, 110, 168, 0.09), transparent 28%),
            radial-gradient(circle at 82% 88%, rgba(76, 110, 168, 0.08), transparent 32%),
            linear-gradient(180deg, #0a0d12 0%, #0f141b 48%, #090c11 100%);
          color: #e6edf7;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
          padding: 22px 28px 24px;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 16px;
        }

        .brand-selection-topbar {
          display: flex;
          justify-content: flex-start;
        }

        .interactive-panel {
          position: relative;
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.018));
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(18px);
          overflow: hidden;
          transition:
            transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 260ms ease,
            box-shadow 260ms ease,
            background 260ms ease;
        }

        .interactive-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 35%),
            radial-gradient(circle at top center, rgba(90, 120, 180, 0.06), transparent 42%);
        }

        .interactive-panel:hover {
          transform: translateY(-2px);
          border-color: rgba(110, 145, 210, 0.17);
          box-shadow:
            0 30px 74px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .interactive-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 220ms ease,
            border-color 220ms ease,
            filter 220ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .interactive-button:hover {
          filter: brightness(1.03);
        }

        .interactive-button:active {
          transform: scale(0.985);
        }

        .interactive-button:focus-visible {
          outline: 2px solid rgba(122, 157, 219, 0.5);
          outline-offset: 2px;
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
          transition: opacity 220ms ease;
        }

        .interactive-button:hover .button-sheen {
          opacity: 1;
          animation: sheenSweep 900ms cubic-bezier(0.22, 1, 0.36, 1) 1;
        }

        .home-button {
          min-width: 220px;
          height: 64px;
          padding: 0 22px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(180deg, #5a78a8 0%, #435d83 100%);
          color: #f7fbff;
          font-size: 0.96rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 16px 34px rgba(67, 93, 131, 0.32);
          cursor: pointer;
        }

        .home-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 40px rgba(67, 93, 131, 0.38);
        }

        .brand-selection-header {
          min-height: 180px;
          padding: 34px 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .brand-selection-header-content {
          position: relative;
          z-index: 1;
          display: grid;
          justify-items: center;
          gap: 16px;
          max-width: 860px;
        }

        .brand-selection-title {
          margin: 0;
          font-size: clamp(2.6rem, 4vw, 4.3rem);
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f2f6fb;
        }

        .brand-selection-grid-section {
          padding: 20px 22px;
          box-sizing: border-box;
        }

        .brand-selection-placeholder {
          min-height: 240px;
          border: 2px dashed rgba(148, 163, 184, 0.22);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(203, 213, 225, 0.72);
          font-weight: 700;
          padding: 24px;
          position: relative;
          z-index: 1;
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
          gap: 18px;
        }

        .brand-card {
          min-height: 250px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: #ffffff;
          box-shadow:
            0 22px 42px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          padding: 22px;
          box-sizing: border-box;
        }

        .brand-card:hover {
          transform: translateY(-4px);
          border-color: rgba(110, 145, 210, 0.3);
          box-shadow: 0 24px 44px rgba(0, 0, 0, 0.24);
        }

        .brand-card-logo-wrap {
          flex: 1;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background:
            radial-gradient(circle at top center, rgba(76, 110, 168, 0.08), transparent 46%),
            linear-gradient(180deg, rgba(12, 18, 28, 0.02), rgba(12, 18, 28, 0.01));
          border-radius: 18px;
        }

        .brand-card-logo {
          max-width: 100%;
          max-height: 88px;
          object-fit: contain;
          display: block;
        }

        .brand-card-fallback {
          text-align: center;
          font-size: 1.15rem;
          line-height: 1.3;
          font-weight: 800;
          color: #243247;
        }

        .brand-card-name {
          padding-top: 18px;
          font-size: 1.18rem;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-align: center;
          color: #111827;
        }

        @keyframes ambientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(18px, -12px, 0) scale(1.04);
          }
        }

        @keyframes sheenSweep {
          0% {
            transform: translateX(-180%) rotate(20deg);
          }
          100% {
            transform: translateX(480%) rotate(20deg);
          }
        }

        @media (max-width: 1400px) {
          .brand-selection-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 1024px) {
          .brand-selection-shell {
            padding: 18px 20px 20px;
          }

          .brand-selection-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .brand-selection-grid {
            grid-template-columns: 1fr;
          }

          .home-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}