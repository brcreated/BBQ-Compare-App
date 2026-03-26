import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import HealthPage from "../pages/HealthPage";
import ProductDetail from "../pages/ProductDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "health",
        element: <HealthPage />,
      },
      {
        path: "product/:productId",
        element: <ProductDetail />,
      },
    ],
  },
]);