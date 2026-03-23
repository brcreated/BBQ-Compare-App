import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";

function toNumberOrMax(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function normalizePath(value) {
  return String(value || "").replace(/^\/+/, "");
}

function buildAssetUrl(assetBaseUrl, path) {
  const cleanBase = String(assetBaseUrl || "").replace(/\/$/, "");
  const cleanPath = normalizePath(path);

  if (!cleanPath) {
    return "";
  }

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  return `${cleanBase}/${cleanPath}`;
}

function getAssetEntityType(asset) {
  return String(
    asset?.entity_type ||
      asset?.entityType ||
      ""
  ).toLowerCase();
}

function getAssetEntityId(asset) {
  return String(
    asset?.entity_id ||
      asset?.entityId ||
      asset?.brandId ||
      ""
  );
}

function getAssetImageType(asset) {
  return String(
    asset?.image_type ||
      asset?.imageType ||
      asset?.assetType ||
      ""
  ).toLowerCase();
}

function getAssetSortOrder(asset) {
  return toNumberOrMax(
    asset?.sort_order ??
      asset?.sortOrder ??
      asset?.priority
  );
}

function getAssetIsActive(asset) {
  if (typeof asset?.active === "boolean") {
    return asset.active;
  }

  if (typeof asset?.isActive === "boolean") {
    return asset.isActive;
  }

  return true;
}

function getAssetPath(asset) {
  return (
    asset?.file_path ||
    asset?.filePath ||
    asset?.url ||
    asset?.src ||
    ""
  );
}

function isBrandLogoAsset(asset, brandId) {
  const entityType = getAssetEntityType(asset);
  const entityId = getAssetEntityId(asset);
  const imageType = getAssetImageType(asset);

  const matchesEntityType =
    entityType === "brand" ||
    (!!asset?.brandId && !entityType);

  const matchesEntityId =
    entityId === brandId ||
    asset?.brandId === brandId;

  const matchesImageType =
    imageType === "logo" ||
    imageType === "brand_logo" ||
    imageType === "brandlogo" ||
    imageType === "main_logo";

  return matchesEntityType && matchesEntityId && matchesImageType && getAssetIsActive(asset);
}

function getBrandLogoPath(brand, assets) {
  const matches = assets
    .filter((asset) => isBrandLogoAsset(asset, brand.id))
    .sort((a, b) => getAssetSortOrder(a) - getAssetSortOrder(b));

  return getAssetPath(matches[0]);
}

export default function BrandSelection() {
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [failedLogos, setFailedLogos] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const dataBaseUrl = import.meta.env.VITE_DATA_BASE_URL;

        if (!dataBaseUrl) {
          throw new Error("Missing VITE_DATA_BASE_URL in .env");
        }

        const cleanDataBaseUrl = dataBaseUrl.replace(/\/$/, "");
        const brandsUrl = `${cleanDataBaseUrl}/brands.json`;
        const assetsUrl = `${cleanDataBaseUrl}/assets.json`;

        const [brandsResponse, assetsResponse] = await Promise.all([
          fetch(brandsUrl),
          fetch(assetsUrl),
        ]);

        if (!brandsResponse.ok) {
          throw new Error(`Failed to fetch brands.json (${brandsResponse.status})`);
        }

        if (!assetsResponse.ok) {
          throw new Error(`Failed to fetch assets.json (${assetsResponse.status})`);
        }

        const [brandsData, assetsData] = await Promise.all([
          brandsResponse.json(),
          assetsResponse.json(),
        ]);

        const normalizedBrands = Array.isArray(brandsData)
          ? brandsData
          : Array.isArray(brandsData?.brands)
            ? brandsData.brands
            : [];

        const normalizedAssets = Array.isArray(assetsData)
          ? assetsData
          : Array.isArray(assetsData?.assets)
            ? assetsData.assets
            : [];

        setBrands(normalizedBrands);
        setAssets(normalizedAssets);
      } catch (err) {
        console.error("Brand selection load error:", err);
        setError(err?.message || "Failed to load brand selection data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const visibleBrands = useMemo(() => {
    return [...brands]
      .filter((brand) => brand?.isActive === true)
      .sort((a, b) => {
        const aSort = toNumberOrMax(a?.sortOrder);
        const bSort = toNumberOrMax(b?.sortOrder);

        if (aSort !== bSort) {
          return aSort - bSort;
        }

        return String(a?.name || "").localeCompare(String(b?.name || ""));
      });
  }, [brands]);

  const brandCards = useMemo(() => {
    const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL;

    return visibleBrands.map((brand) => {
      const logoPath = getBrandLogoPath(brand, assets);
      const logoSrc = buildAssetUrl(assetBaseUrl, logoPath);

      return {
        ...brand,
        logoSrc,
      };
    });
  }, [visibleBrands, assets]);

  const handleBrandSelect = (brandId) => {
    navigate(`/brand/${brandId}`);
  };

  const handleLogoError = (brandId, logoSrc) => {
    console.error("Logo failed to load:", { brandId, logoSrc });

    setFailedLogos((prev) => ({
      ...prev,
      [brandId]: true,
    }));
  };

  if (loading) {
    return (
      <main className="brand-selection-screen">
        <section className="brand-selection-shell">
          <div className="brand-selection-status-card">Loading brands...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="brand-selection-screen">
        <section className="brand-selection-shell">
          <div className="brand-selection-status-card brand-selection-status-card--error">
            {error}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="brand-selection-screen">
      <div className="brand-selection-background-glow brand-selection-background-glow--one" />
      <div className="brand-selection-background-glow brand-selection-background-glow--two" />
      <div className="brand-selection-grid-overlay" />

      <section className="brand-selection-shell">
        <motion.header
          className="brand-selection-header"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <p className="brand-selection-eyebrow">Shop by Brand</p>
          <h1 className="brand-selection-title">Choose a Brand</h1>
          <p className="brand-selection-subtitle">
            Tap a brand to explore grills, smokers, and outdoor cooking products.
          </p>
        </motion.header>

        <motion.section
          className="brand-selection-grid"
          aria-label="Brand selection grid"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.08,
              },
            },
          }}
        >
          {brandCards.map((brand) => {
            const showFallback = failedLogos[brand.id] || !brand.logoSrc;

            return (
              <motion.button
                key={brand.id}
                type="button"
                className="brand-selection-card"
                aria-label={brand.name}
                onClick={() => handleBrandSelect(brand.id)}
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.985 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.32,
                      ease: "easeOut",
                    },
                  },
                }}
                whileHover={{ y: -6, scale: 1.012 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="brand-selection-card-shine" />
                <div className="brand-selection-card-inner">
                  {showFallback ? (
                    <span className="brand-selection-fallback-name">
                      {brand.name}
                    </span>
                  ) : (
                    <img
                      src={brand.logoSrc}
                      alt={brand.name}
                      className="brand-selection-logo"
                      loading="lazy"
                      onError={() => handleLogoError(brand.id, brand.logoSrc)}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.section>
      </section>
    </main>
  );
}