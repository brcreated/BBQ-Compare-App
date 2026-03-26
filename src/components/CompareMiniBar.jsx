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
        left: 20,
        right: 20,
        bottom: 20,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(8,16,30,0.94)",
          boxShadow: "0 22px 60px rgba(0,0,0,0.38)",
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            flex: 1,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 180,
                padding: 8,
                borderRadius: 14,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <button
                type="button"
                onClick={() => navigate(`/product/${item.slug || item.id}`)}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  width: 56,
                  height: 56,
                  borderRadius: 12,
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
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>No Image</div>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/product/${item.slug || item.id}`)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#fff",
                  textAlign: "left",
                  padding: 0,
                  cursor: "pointer",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  flex: 1,
                }}
              >
                {item.name}
              </button>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  borderRadius: 999,
                  width: 24,
                  height: 24,
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => clearAll()}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 14px",
              fontWeight: 700,
              cursor: "pointer",
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
              borderRadius: 12,
              padding: "12px 16px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
