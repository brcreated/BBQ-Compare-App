// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import useAppUpdateManager from "./hooks/useAppUpdateManager";
import WelcomeScreen from "./pages/WelcomeScreen";
import DiscoveryHub from "./pages/DiscoveryHub";
import BrandSelection from "./pages/BrandSelection";
import BrandResults from "./pages/BrandResults";
import BrandNavigatorPage from "./pages/BrandNavigatorPage";
import ProductDetail from "./pages/ProductDetail";
import ComparePage from "./pages/ComparePage";
import CompareMiniBar from "./components/CompareMiniBar";
import KioskHeader, { HEADER_H } from "./components/KioskHeader";
import { CatalogProvider } from "./context/CatalogContext";
import AboutPage from "./pages/AboutPage";
import { clearAll } from "./state/comparisonStore";

const IDLE_MS = 300000;
const WARN_MS = 60000;

function doReset() {
  try {
    clearAll();
    localStorage.clear();
    sessionStorage.clear();
  } catch (_) {}
  window.location.replace("/?_r=" + Date.now());
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const lastActivityRef = useRef(Date.now());
  const [secondsLeft, setSecondsLeft] = useState(IDLE_MS / 1000);
  const isWarning = secondsLeft <= WARN_MS / 1000;
  const location = useLocation();
  const isStartScreen = location.pathname === "/";

  const { updatedAtLabel, updatedAt, appVersion } = useAppUpdateManager({
    checkIntervalMs: 60000,
    nightlyReloadHour: 3,
    nightlyReloadMinute: 0,
    enableNightlyReload: true,
  });

  function doStay() {
    lastActivityRef.current = Date.now();
  }

  // Strip reset param silently on mount
  useEffect(() => {
    if (window.location.search.includes("_r=")) {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    const markActivity = () => { lastActivityRef.current = Date.now(); };

    const checkIdle = () => {
      const idleMs = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((IDLE_MS - idleMs) / 1000));
      setSecondsLeft(remaining);
      if (idleMs >= IDLE_MS) doReset();
    };

    const events = ["pointerdown","pointermove","pointerup","touchstart","touchmove",
      "touchend","mousedown","mousemove","mouseup","click","keydown","keyup","wheel","scroll"];

    events.forEach((e) => {
      window.addEventListener(e, markActivity, { passive: true });
      document.addEventListener(e, markActivity, { passive: true });
    });
    window.addEventListener("focus", markActivity);
    window.addEventListener("pageshow", markActivity);
    const handleVisibility = () => { if (!document.hidden) markActivity(); };
    document.addEventListener("visibilitychange", handleVisibility);

    markActivity();
    const id = window.setInterval(checkIdle, 1000);

    return () => {
      window.clearInterval(id);
      events.forEach((e) => {
        window.removeEventListener(e, markActivity);
        document.removeEventListener(e, markActivity);
      });
      window.removeEventListener("focus", markActivity);
      window.removeEventListener("pageshow", markActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <>
      <KioskHeader isWarning={isWarning} secondsLeft={secondsLeft} onStartOver={doReset} />

      {/* Full-screen dim overlay in last 60 seconds */}
      {isWarning && (
        <div
          onClick={doStay}
          style={{
            position: "fixed", inset: 0, zIndex: 99997,
            background: "rgba(4,7,12,0.88)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 18,
            animation: "fadeInOverlay 500ms ease",
          }}
        >
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "rgba(180,200,240,0.5)",
          }}>
            Returning to start screen in
          </div>
          <div style={{
            fontSize: 100, fontWeight: 900, color: "#fff",
            lineHeight: 1, fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 60px rgba(248,81,73,0.5)",
            animation: secondsLeft <= 10 ? "pulseWarn 0.8s ease-in-out infinite" : "none",
          }}>
            {secondsLeft}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); doStay(); }}
            style={{
              marginTop: 12,
              background: "linear-gradient(135deg, rgba(43,88,190,0.95), rgba(28,56,130,0.9))",
              border: "1px solid rgba(117,163,255,0.4)",
              color: "#fff", borderRadius: 18,
              padding: "18px 52px", fontSize: 18, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 40px rgba(43,88,190,0.45)",
              letterSpacing: "0.02em",
            }}
          >
            I'm Still Here
          </button>
          <div style={{ fontSize: 12, color: "rgba(180,200,240,0.3)", marginTop: 4 }}>
            Tap anywhere to continue browsing
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseWarn {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.06); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <ScrollToTop />
      <div style={{ paddingTop: isStartScreen ? 0 : HEADER_H }}>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/discover" element={<DiscoveryHub />} />
          <Route path="/brands" element={<BrandSelection />} />
          <Route path="/brand/:brandSlug" element={<BrandNavigatorPage />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route
            path="/about"
            element={
              <AboutPage
                updatedAtLabel={updatedAtLabel}
                updatedAt={updatedAt}
                appVersion={appVersion}
              />
            }
          />
        </Routes>
      </div>

      <CompareMiniBar />
    </>
  );
}

export default function App() {
  return (
    <CatalogProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </CatalogProvider>
  );
}
