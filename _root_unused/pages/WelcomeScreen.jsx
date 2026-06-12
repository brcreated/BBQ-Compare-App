//WelcomeScreen.jsx

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL;

const VIDEO_URL = `${ASSET_BASE_URL}/welcome/welcome-background.mp4`;
const FALLBACK_URL = `${ASSET_BASE_URL}/welcome/welcome-background-fallback.jpg`;
const LOGO_URL = `${ASSET_BASE_URL}/branding/logo.svg`;

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const ctaStyle = useMemo(() => {
    return {
      ...styles.cta,
      transform: isPressed
        ? "scale(0.98)"
        : isHovered
        ? "translateY(-1px)"
        : "scale(1)",
      boxShadow: isPressed
        ? "0 10px 24px rgba(0,0,0,0.24)"
        : isHovered
        ? "0 18px 40px rgba(0,0,0,0.32)"
        : "0 14px 32px rgba(0,0,0,0.28)",
    };
  }, [isHovered, isPressed]);

  return (
    <main style={styles.container}>
      {/* Background */}
      <div style={styles.backgroundWrapper}>
        <img src={FALLBACK_URL} alt="Background" style={styles.fallback} />

        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={FALLBACK_URL}
          style={styles.video}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        <div style={styles.overlay} />
      </div>

      {/* Logo at Top */}
      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Logo" style={styles.logo} />
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.contentInner}>
          <h1 style={styles.headline}>
            Explore Premium Outdoor Cooking
          </h1>

          <p style={styles.subheadline}>
            Compare Outdoor Grills
          </p>

          <button
            type="button"
            style={ctaStyle}
            onClick={() => navigate("/discover")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              setIsPressed(false);
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
          >
            Find Your Perfect Grill
          </button>
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#000",
  },

  backgroundWrapper: {
    position: "absolute",
    inset: 0,
  },

  fallback: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
  },

  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 1,
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.58) 45%, rgba(0,0,0,0.82) 100%)",
    zIndex: 2,
  },

  /* LOGO TOP */
  logoContainer: {
    position: "absolute",
    top: "0px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 4,
  },

  logo: {
    width: "750px",
    maxWidth: "60vw",
    height: "auto",
  },

  content: {
    position: "relative",
    zIndex: 3,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
  },

  contentInner: {
    width: "100%",
    maxWidth: "920px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    color: "#fff",
    animation: "welcomeFadeIn 900ms ease-out both",
  },

  headline: {
    margin: "0 0 18px 0",
    fontSize: "clamp(40px, 5vw, 72px)",
    lineHeight: 1.05,
    fontWeight: 600,
    letterSpacing: "-0.03em",
  },

  subheadline: {
    margin: "0 0 34px 0",
    fontSize: "clamp(18px, 1.6vw, 22px)",
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.88)",
    maxWidth: "760px",
  },

  cta: {
    border: "none",
    borderRadius: "999px",
    background: "#fff",
    color: "#111",
    minWidth: "220px",
    minHeight: "64px",
    padding: "18px 34px",
    fontSize: "18px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
};

/* Animation */
if (
  typeof document !== "undefined" &&
  !document.getElementById("welcome-keyframes")
) {
  const style = document.createElement("style");
  style.id = "welcome-keyframes";
  style.innerHTML = `
    @keyframes welcomeFadeIn {
      from {
        opacity: 0;
        transform: translateY(18px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}