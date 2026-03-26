// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import WelcomeScreen from "./pages/WelcomeScreen";
import DiscoveryHub from "./pages/DiscoveryHub";
import BrandSelection from "./pages/BrandSelection";
import BrandResults from "./pages/BrandResults";
import ProductDetail from "./pages/ProductDetail";
import ComparePage from "./pages/ComparePage";
import CompareMiniBar from "./components/CompareMiniBar";
import { CatalogProvider } from "./context/CatalogContext";
import AboutPage from "./pages/AboutPage";
import { clearAll } from "./state/comparisonStore";

function AppShell() {
  const timeoutMs = 60000;
  const lastActivityRef = useRef(0);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const runReset = () => {
      try {
        clearAll();
        sessionStorage.clear();
        localStorage.removeItem("bbq_compare_items");
        localStorage.removeItem("bbqCompareItems");
        localStorage.removeItem("compareItems");
      } catch (error) {
        console.error("Idle reset clear failed:", error);
      }

      window.location.replace("/?idleReset=" + Date.now());
    };

    const checkIdle = () => {
      const now = Date.now();
      const idleMs = now - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((timeoutMs - idleMs) / 1000));

      setSecondsLeft(remaining);

      if (idleMs >= timeoutMs) {
        runReset();
      }
    };

    const events = [
      "pointerdown",
      "pointermove",
      "pointerup",
      "touchstart",
      "touchmove",
      "touchend",
      "mousedown",
      "mousemove",
      "mouseup",
      "click",
      "keydown",
      "keyup",
      "wheel",
      "scroll",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
      document.addEventListener(eventName, markActivity, { passive: true });
    });

    window.addEventListener("focus", markActivity);
    window.addEventListener("pageshow", markActivity);

    const handleVisibility = () => {
      if (!document.hidden) {
        markActivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    markActivity();
    const intervalId = window.setInterval(checkIdle, 1000);

    return () => {
      window.clearInterval(intervalId);

      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
        document.removeEventListener(eventName, markActivity);
      });

      window.removeEventListener("focus", markActivity);
      window.removeEventListener("pageshow", markActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          zIndex: 99999,
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          padding: "10px 12px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        Idle reset test: {secondsLeft}s
      </div>

      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/discover" element={<DiscoveryHub />} />
        <Route path="/brands" element={<BrandSelection />} />
        <Route path="/brand/:brandSlug" element={<BrandResults />} />
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