// src/components/TopBar.jsx
import React from "react";

const shellStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1100,
  width: "100%",
  padding: "8px 0 10px",
  background:
    "linear-gradient(180deg, rgba(10,13,18,0.90) 0%, rgba(10,13,18,0.72) 68%, rgba(10,13,18,0) 100%)",
  backdropFilter: "blur(8px)",
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  columnGap: 18,
  rowGap: 10,
  minHeight: 56,
};

const leftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const titleStyle = {
  color: "#f3f7ff",
  fontSize: "0.95rem",
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
  paddingTop: 1,
};

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
};

const buttonStyle = {
  minWidth: 0,
  height: 52,
  padding: "0 20px",
  border: "none",
  borderRadius: 18,
  background: "linear-gradient(180deg, #5a78a8 0%, #435d83 100%)",
  color: "#f7fbff",
  fontSize: "0.88rem",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  boxShadow: "0 14px 28px rgba(67, 93, 131, 0.26)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  position: "relative",
  overflow: "hidden",
};

const compareBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 20,
  height: 20,
  marginLeft: 8,
  padding: "0 6px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.18)",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.02em",
};

function ActionButton({ children, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} style={buttonStyle}>
      {children}
      {badge > 0 ? <span style={compareBadgeStyle}>{badge}</span> : null}
    </button>
  );
}

export default function TopBar({
  title = "",
  onBack,
  onHome,
  onBrands,
  onAbout,
  compareCount = 0,
  style = {},
}) {
  return (
    <div style={{ ...shellStyle, ...style }}>
      <div style={rowStyle}>
        <div style={leftStyle}>
          {onBack ? <ActionButton onClick={onBack}>Back</ActionButton> : null}
          {title ? <div style={titleStyle}>{title}</div> : null}
        </div>

        <div style={actionsStyle}>
          {onHome ? <ActionButton onClick={onHome}>Home</ActionButton> : null}
          {onBrands ? <ActionButton onClick={onBrands}>Brands</ActionButton> : null}
          {onAbout ? <ActionButton onClick={onAbout}>About</ActionButton> : null}
        </div>
      </div>
    </div>
  );
}