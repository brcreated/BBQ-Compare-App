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

function getSpecPriority(spec) {
  const key = normalizeText(spec?.spec_key || spec?.spec_label || "");

  if (!key) return 999;

  const priorityGroups = [
    [
      "total cooking area",
      "primary cooking area",
      "cooking area",
      "total grilling area",
    ],
    [
      "max temperature",
      "temperature range max",
      "temperature max",
      "temperature range",
    ],
    ["pellet hopper capacity", "hopper capacity", "fuel capacity"],
    [
      "burger capacity",
      "brisket capacity",
      "pork butt capacity",
      "chicken capacity",
      "rib rack capacity",
    ],
    ["product width", "width", "grill width"],
    ["product weight", "weight"],
  ];

  for (let groupIndex = 0; groupIndex < priorityGroups.length; groupIndex += 1) {
    if (priorityGroups[groupIndex].some((term) => key.includes(term))) {
      return groupIndex;
    }
  }

  return 100;
}

function sortSpecsForMerchandising(specs) {
  return [...specs].sort((a, b) => {
    const priorityA = getSpecPriority(a);
    const priorityB = getSpecPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const labelA = normalizeText(a?.spec_label || a?.spec_key || "");
    const labelB = normalizeText(b?.spec_label || b?.spec_key || "");

    return labelA.localeCompare(labelB);
  });
}

function getFeaturedHighlightLabel(spec) {
  const key = normalizeText(spec?.spec_key || spec?.spec_label || "");

  if (
    key.includes("total cooking area") ||
    key.includes("primary cooking area") ||
    key.includes("cooking area")
  ) {
    return "Cooking Capacity";
  }

  if (
    key.includes("max temperature") ||
    key.includes("temperature range max") ||
    key.includes("temperature max") ||
    key.includes("temperature range")
  ) {
    return "Heat Performance";
  }

  if (
    key.includes("pellet hopper capacity") ||
    key.includes("hopper capacity") ||
    key.includes("fuel capacity")
  ) {
    return "Fuel Capacity";
  }

  if (
    key.includes("burger capacity") ||
    key.includes("brisket capacity") ||
    key.includes("pork butt capacity") ||
    key.includes("chicken capacity") ||
    key.includes("rib rack capacity")
  ) {
    return "Food Capacity";
  }

  if (
    key.includes("product width") ||
    key === "width" ||
    key.includes("grill width")
  ) {
    return "Footprint";
  }

  if (key.includes("product weight") || key === "weight") {
    return "Build Weight";
  }

  return "Featured Highlight";
}

function getGuideRecommendation({ cookingCategory, fuelType, installType, primarySpec }) {
  const category = normalizeText(cookingCategory);
  const fuel = normalizeText(fuelType);
  const install = normalizeText(installType);
  const specKey = normalizeText(primarySpec?.spec_key || primarySpec?.spec_label || "");

  if (install.includes("built in")) {
    return "Best for premium outdoor kitchen builds.";
  }

  if (install.includes("cart") || install.includes("freestanding")) {
    return "Best for flexible patio placement.";
  }

  if (category.includes("pizza")) {
    return "Best for fast high-heat pizza cooking.";
  }

  if (category.includes("griddle")) {
    return "Best for crowd-friendly flat-top cooking.";
  }

  if (category.includes("charcoal")) {
    return "Best for live-fire flavor lovers.";
  }

  if (fuel.includes("pellet")) {
    return "Best for set-it-and-hold-it smoking.";
  }

  if (fuel.includes("gas") || fuel.includes("propane") || fuel.includes("natural gas")) {
    return "Best for fast ignition and everyday grilling.";
  }

  if (
    specKey.includes("total cooking area") ||
    specKey.includes("primary cooking area") ||
    specKey.includes("cooking area")
  ) {
    return "Best for shoppers focused on cooking space.";
  }

  if (
    specKey.includes("max temperature") ||
    specKey.includes("temperature range") ||
    specKey.includes("temperature max")
  ) {
    return "Best for shoppers prioritizing heat performance.";
  }

  if (
    specKey.includes("burger capacity") ||
    specKey.includes("brisket capacity") ||
    specKey.includes("pork butt capacity") ||
    specKey.includes("chicken capacity") ||
    specKey.includes("rib rack capacity")
  ) {
    return "Best for feeding bigger groups with confidence.";
  }

  return "Best for shoppers comparing premium performance.";
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
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  if (!variant) return null;

  const familyName = getFamilyName(family);
  const variantName = getVariantName(variant);
  const brandName = getBrandName(brand, variant);
  const variantId = getVariantId(variant);
  const productTitle = buildProductTitle(familyName, variantName);
  const merchandisedSpecs = sortSpecsForMerchandising(
    Array.isArray(topSpecs) ? topSpecs.slice(0, 3) : []
  );
  const primarySpec = merchandisedSpecs[0] || null;
  const secondarySpecs = primarySpec ? merchandisedSpecs.slice(1) : merchandisedSpecs;

  const cookingCategory = getCookingCategory(variant, family);
  const fuelType = getFuelType(variant, family);
  const installType = getInstallType(variant);

  const metaChips = buildMetaChips(variant, family);
  const pricing = getPricingData(variant);
  const recommendationLine = getGuideRecommendation({
    cookingCategory,
    fuelType,
    installType,
    primarySpec,
  });

  const isInteractive = isHovered || isFocused;
  const isElevated = isInteractive || isSelected;

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

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className={`product-card ${isSelected ? "selected" : ""}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        setIsPressed(false);
      }}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
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
          : isInteractive
          ? "1px solid rgba(255, 255, 255, 0.18)"
          : "1px solid rgba(255, 255, 255, 0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), rgba(14,20,31,0.88)",
        boxShadow: isFocused
          ? "0 0 0 3px rgba(245,158,11,0.28), 0 28px 70px rgba(0,0,0,0.34), 0 0 0 1px rgba(245,158,11,0.14)"
          : isSelected
          ? "0 28px 70px rgba(0,0,0,0.34), 0 0 0 1px rgba(245,158,11,0.14), 0 0 30px rgba(245,158,11,0.10)"
          : isInteractive
          ? "0 28px 70px rgba(0,0,0,0.34), 0 10px 24px rgba(0,0,0,0.20)"
          : "0 20px 50px rgba(0,0,0,0.28), 0 6px 18px rgba(0,0,0,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transform: isPressed
          ? "translateY(-1px) scale(0.997)"
          : isInteractive
          ? "translateY(-4px)"
          : "translateY(0)",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        outline: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: isSelected ? 8 : isInteractive ? 5 : 0,
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
          opacity: isElevated ? 1 : 0.9,
          transition: "opacity 180ms ease",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: 27,
          pointerEvents: "none",
          boxShadow: isFocused
            ? "inset 0 0 0 2px rgba(245,158,11,0.24)"
            : "none",
          transition: "box-shadow 180ms ease",
          zIndex: 2,
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
              transform: isPressed
                ? "scale(1.02)"
                : isInteractive
                ? "scale(1.035)"
                : "scale(1)",
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

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.07)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              color: "#f3d79b",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Showroom Recommendation
          </div>

          <div
            style={{
              color: "#e7edf7",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            {recommendationLine}
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
              boxShadow: isInteractive
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
              {getFeaturedHighlightLabel(primarySpec)}
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
                  background: isInteractive
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
                background: isInteractive
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
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onPointerCancel={(event) => event.stopPropagation()}
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
                : isInteractive
                ? "0 14px 28px rgba(245,158,11,0.20), inset 0 1px 0 rgba(255,255,255,0.14)"
                : "0 12px 24px rgba(245,158,11,0.16), inset 0 1px 0 rgba(255,255,255,0.14)",
              transform: isPressed ? "scale(0.995)" : isInteractive ? "translateY(-1px)" : "translateY(0)",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.01em",
              cursor: "pointer",
              transition:
                "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
              outline: "none",
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