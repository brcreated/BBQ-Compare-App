import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getState, subscribe } from "../state/comparisonStore";

export const HEADER_H = 68;

const HOME_PATHS = new Set(["/", "/discover"]);
const HEADER_HIDDEN_PATHS = new Set(["/"]);

const navBtnStyle = {
  background: "none", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(180,200,240,0.85)",
  borderRadius: 12, padding: "12px 24px",
  fontSize: 15, fontWeight: 700, cursor: "pointer",
  transition: "all 200ms ease",
  whiteSpace: "nowrap",
  minHeight: 44,
};

export default function KioskHeader({ isWarning, secondsLeft, onStartOver }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [compareCount, setCompareCount] = useState(() => getState().items.length);

  useEffect(() => {
    return subscribe((s) => setCompareCount(s.items.length));
  }, []);

  const pathname = location.pathname;
  const onComparePage = pathname === "/compare";
  const showBack = !HOME_PATHS.has(pathname);

  if (HEADER_HIDDEN_PATHS.has(pathname)) return null;

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0,
      height: HEADER_H, zIndex: 9990,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      gap: 12,
      background: "rgba(6,9,16,0.94)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.32)",
    }}>

      {/* Left: back (conditional) */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0, minWidth: 100 }}>
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            style={{
              ...navBtnStyle,
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 20px",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
            Back
          </button>
        )}
      </div>

      {/* Center nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate("/brands")} style={navBtnStyle}>
          Browse Brands
        </button>
        <button onClick={() => navigate("/about")} style={navBtnStyle}>
          About
        </button>
      </div>

      {/* Right: compare badge + start over */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, minWidth: 100, justifyContent: "flex-end" }}>

        {compareCount > 0 && (
          <button
            onClick={() => navigate("/compare")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: onComparePage
                ? "linear-gradient(135deg, rgba(43,88,190,0.9), rgba(28,56,130,0.85))"
                : "linear-gradient(135deg, rgba(43,88,190,0.6), rgba(28,56,130,0.55))",
              border: "1px solid rgba(117,163,255,0.35)",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 20px",
              fontSize: 15, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(43,88,190,0.3)",
              transition: "all 200ms ease",
              whiteSpace: "nowrap",
              minHeight: 44,
            }}
          >
            <span style={{
              background: "rgba(255,255,255,0.22)",
              borderRadius: 6, padding: "2px 8px",
              fontSize: 14, fontWeight: 900,
              minWidth: 22, textAlign: "center",
            }}>
              {compareCount}
            </span>
            Compare
          </button>
        )}

        <button
          onClick={onStartOver}
          style={{
            background: isWarning
              ? "linear-gradient(135deg, rgba(248,81,73,0.92), rgba(200,40,40,0.88))"
              : "rgba(255,255,255,0.06)",
            border: isWarning
              ? "1px solid rgba(248,81,73,0.5)"
              : "1px solid rgba(255,255,255,0.1)",
            color: isWarning ? "#fff" : "rgba(180,200,240,0.65)",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 15, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 250ms ease",
            boxShadow: isWarning ? "0 4px 18px rgba(248,81,73,0.4)" : "none",
            minWidth: isWarning ? 178 : "auto",
            minHeight: 44,
            justifyContent: "center",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 17 }}>↺</span>
          {isWarning ? `Returning in ${secondsLeft}s` : "Start Over"}
        </button>
      </div>
    </header>
  );
}
