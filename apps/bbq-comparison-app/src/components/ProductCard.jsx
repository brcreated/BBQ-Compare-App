import React, { useState } from "react";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildProductTitle(familyName, variantName) {
  const cleanFamily = String(familyName || "").trim();
  const cleanVariant = String(variantName || "").trim();

  if (!cleanFamily) return cleanVariant;
  if (!cleanVariant) return cleanFamily;

  const normalizedFamily = normalizeText(cleanFamily);
  const normalizedVariant = normalizeText(cleanVariant);

  if (
    normalizedVariant === normalizedFamily ||
    normalizedVariant.startsWith(`${normalizedFamily} `)
  ) {
    return cleanVariant;
  }

  return `${cleanFamily} ${cleanVariant}`;
}

function getVariantId(variant) {
  return (
    variant?.variant_id ||
    variant?.id ||
    variant?.sku ||
    variant?.handle ||
    variant?.variant_name ||
    variant?.name
  );
}

function getVariantName(variant) {
  return variant?.variant_name || variant?.name || "Unnamed Product";
}

function getFamilyName(family) {
  return family?.family_name || family?.name || "";
}

function getBrandName(brand, variant) {
  return (
    brand?.brand_name ||
    brand?.name ||
    variant?.brand_name ||
    variant?.brandName ||
    "Unknown Brand"
  );
}

function formatSpecLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Spec";

  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatSpecValue(spec) {
  const value = spec?.spec_value;
  const unit = spec?.spec_unit;

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return [value, unit].filter(Boolean).join(" ");
}

function titleCaseWords(value) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getCookingCategory(variant, family) {
  return titleCaseWords(
    variant?.cooking_category ||
      variant?.cookingCategory ||
      family?.cooking_category ||
      family?.cookingCategory ||
      ""
  );
}

function getFuelType(variant, family) {
  return titleCaseWords(
    variant?.fuel_type ||
      variant?.fuelType ||
      family?.fuel_type ||
      family?.fuelType ||
      ""
  );
}

function getInstallType(variant) {
  return titleCaseWords(
    variant?.install_type ||
      variant?.installType ||
      variant?.default_installation ||
      variant?.defaultInstallation ||
      ""
  );
}

function buildMetaChips(variant, family) {
  return [
    getCookingCategory(variant, family),
    getFuelType(variant, family),
    getInstallType(variant),
  ].filter(Boolean);
}

function parsePriceNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "";

  const numeric = parsePriceNumber(value);
  if (numeric === null) return String(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function getPricingData(variant) {
  const sale = parsePriceNumber(variant?.sale_price);
  const map = parsePriceNumber(variant?.map_price);
  const price = parsePriceNumber(variant?.price);
  const msrp = parsePriceNumber(variant?.msrp);

  if (sale !== null) {
    const reference =
      msrp !== null && msrp > sale
        ? msrp
        : map !== null && map > sale
        ? map
        : price !== null && price > sale
        ? price
        : null;

    return {
      label: "Sale Price",
      primary: formatCurrency(sale),
      secondary: reference ? formatCurrency(reference) : "",
      savings:
        reference && reference > sale ? formatCurrency(reference - sale) : "",
    };
  }

  if (map !== null) {
    const reference =
      msrp !== null && msrp > map
        ? msrp
        : price !== null && price > map
        ? price
        : null;

    return {
      label: "Our Price",
      primary: formatCurrency(map),
      secondary: reference ? formatCurrency(reference) : "",
      savings:
        reference && reference > map ? formatCurrency(reference - map) : "",
    };
  }

  if (price !== null) {
    const reference = msrp !== null && msrp > price ? msrp : null;

    return {
      label: "Starting At",
      primary: formatCurrency(price),
      secondary: reference ? formatCurrency(reference) : "",
      savings:
        reference && reference > price ? formatCurrency(reference - price) : "",
    };
  }

  if (msrp !== null) {
    return {
      label: "MSRP",
      primary: formatCurrency(msrp),
      secondary: "",
      savings: "",
    };
  }

  return {
    label: "Pricing",
    primary: "",
    secondary: "",
    savings: "",
  };
}

function getSelectionHeadline(isSelected) {
  return isSelected ? "Selected for Comparison" : "Ready to Compare";
}

function getSelectionSupport(isSelected) {
  return isSelected
    ? "This model is now in your compare set."
    : "Add this model to evaluate it side-by-side.";
}

function getButtonLabel(isSelected) {
  return isSelected ? "Selected" : "Compare";
}

function ProductCard({
  variant,
  family,
  brand,
  heroImage,
  topSpecs = [],
  isSelected = false,
  onSelect,
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!variant) return null;

  const familyName = getFamilyName(family);
  const variantName = getVariantName(variant);
  const brandName = getBrandName(brand, variant);
  const variantId = getVariantId(variant);
  const productTitle = buildProductTitle(familyName, variantName);
  const visibleSpecs = Array.isArray(topSpecs) ? topSpecs.slice(0, 3) : [];
  const primarySpec = visibleSpecs[0] || null;
  const secondarySpecs = primarySpec ? visibleSpecs.slice(1) : visibleSpecs;
  const metaChips = buildMetaChips(variant, family);
  const pricing = getPricingData(variant);

  const handleCardClick = () => {
    if (typeof onSelect === "function" && variantId) {
      onSelect(variantId);
    }
  };

  const handleCompareClick = (event) => {
    event.stopPropagation();

    if (typeof onSelect === "function" && variantId) {
      onSelect(variantId);
    }
  };

  return (
    <div
      className={`product-card ${isSelected ? "selected" : ""}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${
        isSelected ? "Remove from compare" : "Add to compare"
      }: ${productTitle || "Product"}`}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        border: isSelected
          ? "1px solid rgba(245, 158, 11, 0.42)"
          : isHovered
          ? "1px solid rgba(255, 255, 255, 0.18)"
          : "1px solid rgba(255, 255, 255, 0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), rgba(14,20,31,0.88)",
        boxShadow: isSelected
          ? "0 28px 70px rgba(0,0,0,0.34), 0 0 0 1px rgba(245,158,11,0.14), 0 0 30px rgba(245,158,11,0.10)"
          : isHovered
          ? "0 28px 70px rgba(0,0,0,0.34), 0 10px 24px rgba(0,0,0,0.20)"
          : "0 20px 50px rgba(0,0,0,0.28), 0 6px 18px rgba(0,0,0,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: isSelected ? 8 : isHovered ? 5 : 0,
          background:
            "linear-gradient(180deg, rgba(255,187,72,0.95), rgba(245,158,11,0.68))",
          boxShadow: isSelected ? "0 0 20px rgba(245,158,11,0.35)" : "none",
          transition: "width 180ms ease, box-shadow 180ms ease",
          zIndex: 3,
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top right, rgba(245,158,11,0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.04), transparent 26%)",
          opacity: isHovered || isSelected ? 1 : 0.9,
          transition: "opacity 180ms ease",
        }}
      />

      <div
        className="product-card__image-wrap"
        style={{
          position: "relative",
          aspectRatio: "4 / 3",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015)), rgba(255,255,255,0.02)",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 34,
              padding: "0 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(7, 11, 18, 0.56)",
              color: "#f8fafc",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {brandName}
          </span>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {pricing.savings ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(34,197,94,0.28)",
                  background:
                    "linear-gradient(180deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08)), rgba(34,197,94,0.08)",
                  color: "#dcfce7",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  boxShadow: "0 8px 18px rgba(34,197,94,0.12)",
                }}
              >
                Save {pricing.savings}
              </span>
            ) : null}

            {isSelected ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(245,158,11,0.36)",
                  background:
                    "linear-gradient(180deg, rgba(245,158,11,0.20), rgba(245,158,11,0.10)), rgba(245,158,11,0.08)",
                  color: "#fff7e8",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  boxShadow: "0 8px 18px rgba(245,158,11,0.14)",
                }}
              >
                In Compare
              </span>
            ) : null}
          </div>
        </div>

        {heroImage ? (
          <img
            src={heroImage}
            alt={productTitle || "Product image"}
            className="product-card__image"
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 22,
              position: "relative",
              zIndex: 1,
              transform: isHovered ? "scale(1.035)" : "scale(1)",
              transition: "transform 220ms ease",
            }}
          />
        ) : (
          <div
            className="product-card__image--placeholder"
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "rgba(231, 237, 247, 0.68)",
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span>No Image</span>
          </div>
        )}

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(5,8,13,0) 45%, rgba(5,8,13,0.24) 100%)",
          }}
        />
      </div>

      <div
        className="product-card__content"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "22px 22px 20px",
        }}
      >
        <div
          className="product-card__identity"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {familyName ? (
            <div
              className="product-card__family"
              style={{
                color: "#f2b84b",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {familyName}
            </div>
          ) : null}

          <div
            className="product-card__name"
            style={{
              color: "#f8fafc",
              fontSize: "clamp(1.2rem, 1.4vw, 1.55rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              textWrap: "balance",
            }}
          >
            {productTitle || variantName}
          </div>

          {metaChips.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 2,
              }}
            >
              {metaChips.map((chip) => (
                <span
                  key={chip}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 34,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(255,255,255,0.02)",
                    color: "#dbe5f3",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            minHeight: 64,
            padding: "2px 2px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                color: "#9eabc0",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {pricing.label}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "#f8fafc",
                  fontSize: pricing.primary ? "1.9rem" : "1.1rem",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {pricing.primary || "In Store"}
              </span>

              {pricing.secondary ? (
                <span
                  style={{
                    color: "#8fa0b8",
                    fontSize: "1rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textDecoration: "line-through",
                    textDecorationThickness: "2px",
                  }}
                >
                  {pricing.secondary}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {primarySpec ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "16px 18px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025)), rgba(255,255,255,0.025)",
              boxShadow: isHovered
                ? "0 12px 24px rgba(0,0,0,0.12)"
                : "0 8px 18px rgba(0,0,0,0.08)",
              transition: "box-shadow 180ms ease, background 180ms ease",
            }}
          >
            <span
              style={{
                color: "#9eabc0",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Featured Highlight
            </span>

            <span
              style={{
                color: "#d8e1ef",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {formatSpecLabel(primarySpec?.spec_label || primarySpec?.spec_key)}
            </span>

            <span
              style={{
                color: "#f8fafc",
                fontSize: "1.45rem",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              {formatSpecValue(primarySpec)}
            </span>
          </div>
        ) : null}

        <div
          className="product-card__specs"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
          }}
        >
          {secondarySpecs.length ? (
            secondarySpecs.map((spec, index) => (
              <div
                key={`${spec?.spec_key || "spec"}-${index}`}
                className="product-card__spec"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  minHeight: 46,
                  padding: "0 14px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  background: isHovered
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.03)",
                  transition: "background 180ms ease",
                }}
              >
                <span
                  className="spec-label"
                  style={{
                    color: "#9eabc0",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {formatSpecLabel(spec?.spec_label || spec?.spec_key)}
                </span>

                <span
                  className="spec-value"
                  style={{
                    color: "#f3f7fc",
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                >
                  {formatSpecValue(spec)}
                </span>
              </div>
            ))
          ) : !primarySpec ? (
            <div
              className="product-card__spec product-card__spec--empty"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                minHeight: 46,
                padding: "0 14px",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                background: isHovered
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.03)",
                transition: "background 180ms ease",
              }}
            >
              <span
                className="spec-label"
                style={{
                  color: "#9eabc0",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Details
              </span>
              <span
                className="spec-value"
                style={{
                  color: "#f3f7fc",
                  fontSize: 14,
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                View comparison options
              </span>
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 14,
            alignItems: "center",
            minHeight: 72,
            padding: "14px 16px",
            borderRadius: 20,
            border: isSelected
              ? "1px solid rgba(245,158,11,0.24)"
              : "1px solid rgba(255,255,255,0.06)",
            background: isSelected
              ? "linear-gradient(180deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05)), rgba(255,255,255,0.02)"
              : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), rgba(255,255,255,0.02)",
            boxShadow: isSelected
              ? "0 10px 24px rgba(245,158,11,0.12)"
              : "0 8px 18px rgba(0,0,0,0.08)",
            transition:
              "border-color 180ms ease, background 180ms ease, box-shadow 180ms ease",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minWidth: 0,
            }}
          >
            <div
              style={{
                color: isSelected ? "#fff2cf" : "#f3f7fc",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.02em",
              }}
            >
              {getSelectionHeadline(isSelected)}
            </div>

            <div
              style={{
                color: isSelected ? "#f3d79b" : "#9eabc0",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {getSelectionSupport(isSelected)}
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 96,
              minHeight: 40,
              padding: "0 14px",
              borderRadius: 999,
              border: isSelected
                ? "1px solid rgba(245,158,11,0.36)"
                : "1px solid rgba(255,255,255,0.10)",
              background: isSelected
                ? "linear-gradient(180deg, rgba(245,158,11,0.22), rgba(245,158,11,0.10)), rgba(245,158,11,0.10)"
                : "rgba(255,255,255,0.03)",
              color: isSelected ? "#fff7e8" : "#dbe5f3",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {isSelected ? "Active" : "Available"}
          </div>
        </div>

        <div
          className="product-card__actions"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
            marginTop: "auto",
            paddingTop: 2,
          }}
        >
          <div
            style={{
              color: isSelected ? "#f2b84b" : "#8fa0b8",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "color 180ms ease",
            }}
          >
            {isSelected ? "Tap again to remove from compare" : "Tap to add to compare"}
          </div>

          <button
            type="button"
            className={`compare-btn ${isSelected ? "active" : ""}`}
            onClick={handleCompareClick}
            aria-pressed={isSelected}
            style={{
              minHeight: 58,
              borderRadius: 18,
              border: isSelected
                ? "1px solid rgba(245,158,11,0.56)"
                : "1px solid rgba(245,158,11,0.34)",
              color: "#fff8e8",
              background: isSelected
                ? "linear-gradient(180deg, rgba(255,187,72,0.34), rgba(245,158,11,0.24)), rgba(245,158,11,0.16)"
                : "linear-gradient(180deg, rgba(255,187,72,0.26), rgba(245,158,11,0.18)), rgba(245,158,11,0.12)",
              boxShadow: isSelected
                ? "0 14px 28px rgba(245,158,11,0.20), 0 0 0 1px rgba(245,158,11,0.14)"
                : isHovered
                ? "0 14px 28px rgba(245,158,11,0.20), inset 0 1px 0 rgba(255,255,255,0.14)"
                : "0 12px 24px rgba(245,158,11,0.16), inset 0 1px 0 rgba(255,255,255,0.14)",
              transform: isHovered ? "translateY(-1px)" : "translateY(0)",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.01em",
              cursor: "pointer",
              transition:
                "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
            }}
          >
            {getButtonLabel(isSelected)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;