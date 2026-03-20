import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="page-container">
          <h1 className="app-title">BBQ Comparison</h1>
        </div>
      </header>

      <main className="app-main">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}