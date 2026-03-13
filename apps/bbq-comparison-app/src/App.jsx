import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import HomePage from "./pages/HomePage";
import BrandPage from "./pages/BrandPage";
import FuelTypePage from "./pages/FuelTypePage";
import BuiltInsPage from "./pages/BuiltInsPage";
import ComparePage from "./pages/ComparePage";
import ProductDetailPage from "./pages/ProductDetailPage";

function Nav() {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px",
        background: "#1b1b1b",
        borderBottom: "1px solid #333",
      }}
    >
      <Link to="/" style={{ color: "#fff" }}>
        Splash
      </Link>
      <Link to="/home" style={{ color: "#fff" }}>
        Home
      </Link>
      <Link to="/brands" style={{ color: "#fff" }}>
        Brands
      </Link>
      <Link to="/fuel" style={{ color: "#fff" }}>
        Fuel
      </Link>
      <Link to="/built-ins" style={{ color: "#fff" }}>
        Built-Ins
      </Link>
      <Link to="/compare" style={{ color: "#fff" }}>
        Compare
      </Link>
      <Link to="/product" style={{ color: "#fff" }}>
        Product
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          background: "#111",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Nav />
        <div style={{ padding: "24px" }}>
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/brands" element={<BrandPage />} />
            <Route path="/fuel" element={<FuelTypePage />} />
            <Route path="/built-ins" element={<BuiltInsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/product" element={<ProductDetailPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}