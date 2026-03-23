import React from "react";

export default function BrandResults() {
  return (
    <main className="brand-results-screen">
      <section className="brand-results-shell">
        <header className="brand-results-header">
          <div className="brand-results-header-content">
            <p className="brand-results-eyebrow">Brand Results</p>
            <h1 className="brand-results-title">Loading Brand</h1>
            <p className="brand-results-subtitle">
              Explore products for the selected brand.
            </p>
          </div>
        </header>

        <section className="brand-results-filters" aria-label="Product filters">
          <div className="brand-results-filter-placeholder">
            Filters will go here
          </div>
        </section>

        <section className="brand-results-grid-section" aria-label="Products">
          <div className="brand-results-grid-placeholder">
            Product grid will go here
          </div>
        </section>
      </section>

      <style>{`
        .brand-results-screen {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(circle at top center, rgba(59, 130, 246, 0.14), transparent 30%),
            linear-gradient(180deg, #07111f 0%, #050b14 50%, #03060b 100%);
          color: #f8fafc;
          padding: 32px;
          box-sizing: border-box;
        }

        .brand-results-shell {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 24px;
        }

        .brand-results-header {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.94)),
            rgba(15, 23, 42, 0.9);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          min-height: 200px;
          display: flex;
          align-items: center;
          padding: 36px 40px;
        }

        .brand-results-header::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 85% 20%, rgba(96, 165, 250, 0.16), transparent 24%),
            radial-gradient(circle at 75% 80%, rgba(59, 130, 246, 0.1), transparent 22%);
          pointer-events: none;
        }

        .brand-results-header-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
        }

        .brand-results-eyebrow {
          margin: 0 0 10px;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(191, 219, 254, 0.85);
        }

        .brand-results-title {
          margin: 0;
          font-size: clamp(2.25rem, 4vw, 4rem);
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ffffff;
        }

        .brand-results-subtitle {
          margin: 14px 0 0;
          font-size: 1.15rem;
          line-height: 1.5;
          color: rgba(226, 232, 240, 0.82);
          max-width: 700px;
        }

        .brand-results-filters,
        .brand-results-grid-section {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 24px;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(14px);
          box-shadow:
            0 18px 44px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .brand-results-filters {
          min-height: 110px;
          display: flex;
          align-items: center;
          padding: 24px 28px;
        }

        .brand-results-grid-section {
          min-height: 520px;
          padding: 28px;
        }

        .brand-results-filter-placeholder,
        .brand-results-grid-placeholder {
          width: 100%;
          border: 2px dashed rgba(148, 163, 184, 0.22);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(203, 213, 225, 0.72);
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .brand-results-filter-placeholder {
          min-height: 58px;
        }

        .brand-results-grid-placeholder {
          min-height: 460px;
        }

        @media (max-width: 1024px) {
          .brand-results-screen {
            padding: 20px;
          }

          .brand-results-header {
            padding: 28px;
            min-height: 180px;
          }

          .brand-results-filters {
            padding: 20px;
          }

          .brand-results-grid-section {
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}