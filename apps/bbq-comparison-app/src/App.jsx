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
import QuizPage from "./pages/QuizPage";

export default function App() {
  return (
    <CatalogProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/discover" element={<DiscoveryHub />} />
          <Route path="/brands" element={<BrandSelection />} />
          <Route path="/brand/:brandSlug" element={<BrandResults />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
        <CompareMiniBar />
      </BrowserRouter>
    </CatalogProvider>
  );
}
