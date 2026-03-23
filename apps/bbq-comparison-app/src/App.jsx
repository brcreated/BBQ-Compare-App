import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import WelcomeScreen from "./pages/WelcomeScreen";
import DiscoveryHub from "./pages/DiscoveryHub";
import BrandSelection from "./pages/BrandSelection";
import BrandResults from "./pages/BrandResults";
import ProductDetail from "./pages/ProductDetail";

function QuizPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1>Quiz Page</h1>
    </main>
  );
}

function ComparePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1>Compare Page</h1>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/discover" element={<DiscoveryHub />} />
        <Route path="/brands" element={<BrandSelection />} />
        <Route path="/brand/:brandId" element={<BrandResults />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </BrowserRouter>
  );
}