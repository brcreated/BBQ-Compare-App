// src/pages/WelcomeScreen.jsx
import { useMemo, useState } from "react";
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
        ? "scale(0.94)"
        : isHovered
        ? "translateY(-2px) scale(1.01)"
        : "scale(1)",
      boxShadow: isPressed
        ? "0 8px 20px rgba(0,0,0,0.22)"
        : isHovered
        ? "0 22px 48px rgba(0,0,0,0.36)"
        : "0 14px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
    };
  }, [isHovered, isPressed]);

  return (
    <main style={styles.container}>
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

      <div style={styles.logoContainer}>
        <img src={LOGO_URL} alt="Logo" style={styles.logo} />
      </div>

      <div style={styles.content}>
        <div style={styles.contentInner}>
          <h1 style={styles.headline}>Explore Premium Outdoor Cooking</h1>

          <p style={styles.subheadline}>Compare Outdoor Grills</p>

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
    width: "100%",
    minHeight: "100dvh",
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
      "linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.56) 45%, rgba(0,0,0,0.82) 100%)",
    zIndex: 2,
  },

  logoContainer: {
    position: "absolute",
    top: "max(12px, env(safe-area-inset-top, 0px))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 4,
    width: "min(92vw, 760px)",
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },

  logo: {
    width: "min(100%, 760px)",
    maxWidth: "68vw",
    minWidth: "220px",
    height: "auto",
  },

  content: {
    position: "relative",
    zIndex: 3,
    width: "100%",
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(16px, 3vw, 40px)",
  },

  contentInner: {
    width: "min(100%, 980px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    color: "#fff",
    animation: "welcomeFadeIn 900ms ease-out both",
    paddingTop: "clamp(72px, 10vw, 128px)",
  },

  headline: {
    margin: "0 0 18px 0",
    fontSize: "clamp(34px, 6vw, 72px)",
    lineHeight: 1.05,
    fontWeight: 600,
    letterSpacing: "-0.03em",
  },

  subheadline: {
    margin: "0 0 34px 0",
    fontSize: "clamp(16px, 2.2vw, 22px)",
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.88)",
    maxWidth: "760px",
  },

  cta: {
    border: "none",
    borderRadius: "999px",
    background: "linear-gradient(180deg, #ffffff 0%, #e8eef8 100%)",
    color: "#111827",
    minWidth: "min(340px, 90vw)",
    minHeight: "clamp(60px, 8vw, 76px)",
    padding: "clamp(16px, 2.2vw, 22px) clamp(32px, 5vw, 52px)",
    fontSize: "clamp(18px, 2.2vw, 22px)",
    fontWeight: 700,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "transform 140ms ease, box-shadow 140ms ease, filter 100ms ease",
  },
};

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
