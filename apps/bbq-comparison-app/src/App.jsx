// src/App.jsx
import React from "react";
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
import useIdleReset from "./hooks/useIdleReset";
import { clearAll } from "./state/comparisonStore";

function AppShell() {
  useIdleReset({
    timeout: 60000,
    fadeDuration: 5000,
    resetPath: "/",
    onReset: () => {
      clearAll();
    },
  });

  return (
    <>
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