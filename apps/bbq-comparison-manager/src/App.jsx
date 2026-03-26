import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Dashboard() {
  return <div>Manager Dashboard</div>;
}

function ReviewQueue() {
  return <div>Review Queue</div>;
}

function Products() {
  return <div>Product Manager</div>;
}

function Publish() {
  return <div>Publish Screen</div>;
}

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
        Dashboard
      </Link>
      <Link to="/review" style={{ color: "#fff" }}>
        Review
      </Link>
      <Link to="/products" style={{ color: "#fff" }}>
        Products
      </Link>
      <Link to="/publish" style={{ color: "#fff" }}>
        Publish
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/products" element={<Products />} />
            <Route path="/publish" element={<Publish />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}