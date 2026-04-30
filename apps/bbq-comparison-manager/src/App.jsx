import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import BrandsPage from "./pages/BrandsPage";
import ProductsPage from "./pages/ProductsPage";
import ProductEditPage from "./pages/ProductEditPage";
import PublishPage from "./pages/PublishPage";
import LoginPage from "./pages/LoginPage";
import { useDataStore } from "./store/dataStore";
import { useAuthStore } from "./store/authStore";

function DataLoader() {
  const { loadAll, brands, loading } = useDataStore();
  const { token } = useAuthStore();
  useEffect(() => {
    if (token && !brands.length && !loading) loadAll();
  }, [token]);
  return null;
}

function RequireAuth({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <DataLoader />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductEditPage />} />
          <Route path="publish" element={<PublishPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
