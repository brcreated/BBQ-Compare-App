// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import WelcomeScreen from "./pages/WelcomeScreen";
import DiscoveryHub from "./pages/DiscoveryHub";
import BrandSelection from "./pages/BrandSelection";
import BrandResults from "./pages/BrandResults";
import BrandNavigatorPage from "./pages/BrandNavigatorPage";
import ProductDetail from "./pages/ProductDetail";
import ComparePage from "./pages/ComparePage";
import CompareMiniBar from "./components/CompareMiniBar";
import { CatalogProvider } from "./context/CatalogContext";
import AboutPage from "./pages/AboutPage";
import { clearAll } from "./state/comparisonStore";

const IDLE_MS = 300000;       // 5 minutes total
const WARN_MS = 60000;        // show countdown in last 60 seconds

function doReset() {
  try {
    clearAll();
    localStorage.clear();
    sessionStorage.clear();
  } catch (_) {}
  window.location.replace("/");
}

function AppShell() {
  const lastActivityRef = useRef(Date.now());
  const [secondsLeft, setSecondsLeft] = useState(IDLE_MS / 1000);
  const isWarning = secondsLeft <= WARN_MS / 1000;

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
      {/* Start Over button — always visible bottom-right */}
      <div style={{
        position: "fixed", right: 20, bottom: 20, zIndex: 99999,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
      }}>
        {isWarning && (
          <div style={{
            background: "rgba(248,81,73,0.92)", color: "#fff",
            padding: "6px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            boxShadow: "0 4px 16px rgba(248,81,73,0.4)",
            animation: "pulseWarn 1s ease-in-out infinite",
          }}>
            Resetting in {secondsLeft}s
          </div>
        )}
        <button
          onClick={doReset}
          style={{
            background: isWarning
              ? "linear-gradient(135deg, rgba(248,81,73,0.9), rgba(200,40,40,0.85))"
              : "linear-gradient(135deg, rgba(15,22,36,0.92), rgba(9,14,24,0.95))",
            border: isWarning ? "1px solid rgba(248,81,73,0.6)" : "1px solid rgba(117,163,255,0.2)",
            color: isWarning ? "#fff" : "rgba(180,200,240,0.7)",
            borderRadius: 14, padding: "12px 22px",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: isWarning
              ? "0 8px 28px rgba(248,81,73,0.35)"
              : "0 8px 28px rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
            transition: "all 250ms ease",
            letterSpacing: "0.02em",
          }}
        >
          ↺ Start Over
        </button>
      </div>

      <style>{`
        @keyframes pulseWarn {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
      `}</style>

      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/discover" element={<DiscoveryHub />} />
        <Route path="/brands" element={<BrandSelection />} />
        <Route path="/brand/:brandSlug" element={<BrandNavigatorPage />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>

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