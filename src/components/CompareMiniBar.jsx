//CompareMiniBar.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getState, removeItem, clearAll, subscribe } from "../state/comparisonStore";
import { useCatalog } from "../context/CatalogContext";

function normalizeId(value) {
  return String(value || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function getAssetUrl(asset) {
  if (!asset) return "";

  if (asset.url) return asset.url;
  if (asset.imageUrl) return asset.imageUrl;
  if (asset.sourceUrl) return asset.sourceUrl;
  if (asset.source_url) return asset.source_url;

  const base = String(import.meta.env.VITE_ASSET_BASE_URL || "").replace(/\/$/, "");
  const filePath = String(asset.filePath || asset.file_path || "").replace(/^\//, "");

  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  return base ? `${base}/${filePath}` : `/${filePath}`;
}

function getHeroAsset(variantId, assets = []) {
  const normalizedVariantId = normalizeId(variantId);

  const matching = assets.filter((asset) => {
    const entityType = String(asset.entityType || asset.entity_type || "").toLowerCase();
    const entityId = normalizeId(asset.entityId || asset.entity_id || "");
    return entityType === "variant" && entityId === normalizedVariantId;
  });

  if (!matching.length) return null;

  const preferred = matching.find((asset) => {
    const imageType = String(asset.imageType || asset.image_type || "").toLowerCase();
    return ["hero", "main", "primary", "gallery-1", "gallery_1"].includes(imageType);
  });

  return preferred || matching[0] || null;
}

function buildCompareItems(compareIds, variants, assets) {
  return compareIds
    .map((selectedId) => {
      const normalizedSelected = normalizeId(selectedId);

      const variant =
        variants.find((item) => normalizeId(item.id || item.variantId || item.variant_id) === normalizedSelected) ||
        variants.find((item) => normalizeId(item.slug) === normalizedSelected);

      if (!variant) return null;

      const variantId = variant.id || variant.variantId || variant.variant_id || "";
      const heroAsset = getHeroAsset(variantId, assets);

      return {
        id: variantId,
        slug: variant.slug || variantId,
        name: variant.name || variant.variantName || variant.variant_name || "Product",
        imageUrl: getAssetUrl(heroAsset),
      };
    })
    .filter(Boolean);
}

export default function CompareMiniBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ready, variants, assets } = useCatalog();
  const [compareState, setCompareState] = useState(() => getState());

  useEffect(() => {
    return subscribe((nextState) => {
      setCompareState(nextState);
    });
  }, []);

  const pathname = location.pathname || "";

  const shouldHide =
    pathname === "/" ||
    pathname === "/discover" ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/brand/");

  const compareIds = useMemo(() => {
    return Array.isArray(compareState?.items) ? compareState.items : [];
  }, [compareState]);

  const items = useMemo(() => {
    return buildCompareItems(compareIds, variants || [], assets || []);
  }, [compareIds, variants, assets]);

  if (shouldHide || !ready || !items.length) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          borderRadius: 20,
          border: "1px solid rgba(117,163,255,0.18)",
          background: "rgba(6,10,20,0.96)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(117,163,255,0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "center",
        }}
      >
        {/* Product chips */}
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            flex: 1,
            paddingBottom: 2,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 200,
                padding: "10px 12px",
                borderRadius: 14,
                background: "rgba(117,163,255,0.07)",
                border: "1px solid rgba(117,163,255,0.12)",
                flexShrink: 0,
              }}
            >
              {/* Thumbnail */}
              <button
                type="button"
                onClick={() => navigate(`/product/${item.slug || item.id}`)}
                style={{
                  border: "none",
                  background: "rgba(255,255,255,0.06)",
                  padding: 0,
                  cursor: "pointer",
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>No Image</div>
                )}
              </button>

              {/* Name */}
              <button
                type="button"
                onClick={() => navigate(`/product/${item.slug || item.id}`)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#e8f0ff",
                  textAlign: "left",
                  padding: 0,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {item.name}
              </button>

              {/* Remove — 44×44 tap target */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(200,210,240,0.8)",
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 18,
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => clearAll()}
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(200,210,240,0.7)",
              borderRadius: 14,
              padding: "14px 20px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              minHeight: 52,
            }}
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => navigate("/compare")}
            style={{
              border: "none",
              background: "linear-gradient(135deg, #4c75db 0%, #2f57bc 100%)",
              color: "#fff",
              borderRadius: 14,
              padding: "14px 28px",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              minHeight: 52,
              boxShadow: "0 6px 20px rgba(43,88,190,0.4)",
              letterSpacing: "0.01em",
            }}
          >
            Compare ({items.length})
          </button>
        </div>
      </div>
    </div>
  );
}
