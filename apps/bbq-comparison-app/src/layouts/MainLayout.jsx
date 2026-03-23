import React from "react";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
          }}
        >
          BBQ Comparison
        </h1>
      </div>

      <div
        style={{
          padding: "24px",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}