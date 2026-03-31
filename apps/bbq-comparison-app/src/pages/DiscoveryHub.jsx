import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useIdleReset from "../hooks/useIdleReset";
import AboutModal from "../components/AboutModal";

const brandLogos = [
  { id: "abs", name: "ABS", file: "abs-logo.png" },
  { id: "alfa", name: "Alfa", file: "alfa-logo.png" },
  { id: "alfresco", name: "Alfresco", file: "alfresco-logo.png" },
  { id: "artisan", name: "Artisan", file: "artisan-logo.png" },
  { id: "delta-heat", name: "Delta Heat", file: "delta-heat-logo.png" },
  { id: "gateway", name: "Gateway", file: "gateway-logo.png" },
  { id: "gozney", name: "Gozney", file: "gozney-logo.png" },
  { id: "halo", name: "Halo", file: "halo-logo.png" },
  { id: "horizon", name: "Horizon", file: "horizon-logo.png" },
  { id: "napoleon", name: "Napoleon", file: "napoleon-logo.png" },
  { id: "primo", name: "Primo", file: "primo-logo.png" },
  { id: "recteq", name: "Recteq", file: "recteq-logo.png" },
  { id: "smokin-brothers", name: "Smokin Brothers", file: "smokin-brothers-logo.png" },
  { id: "twin-eagles", name: "Twin Eagles", file: "twin-eagles-logo.png" },
  { id: "yoder", name: "Yoder", file: "yoder-logo.png" },
];

const fuelOptions = [
  {
    id: "pellet",
    title: "Pellet Grills",
    subtitle: "Set-it-and-enjoy flavor",
    fuel: "pellet",
    image: `${import.meta.env.VITE_ASSET_BASE_URL}/fuel/pellets.png`,
  },
  {
    id: "charcoal",
    title: "Charcoal & Wood",
    subtitle: "Traditional smoke and fire",
    fuel: "charcoal",
    image: `${import.meta.env.VITE_ASSET_BASE_URL}/fuel/charcoal.png`,
  },
  {
    id: "gas",
    title: "Gas Grills",
    subtitle: "Fast, clean, and convenient",
    fuel: "gas",
    image: `${import.meta.env.VITE_ASSET_BASE_URL}/fuel/gas.png`,
  },
];

export default function DiscoveryHub() {
  const navigate = useNavigate();
  const { isIdleFading } = useIdleReset(60000, 5000);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const brandScrollRef = useRef(null);
  const isResettingRef = useRef(false);
  const dragStateRef = useRef({
    isPointerDown: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
  });

  useEffect(() => {
    const container = brandScrollRef.current;
    if (!container) return;

    const setInitialPosition = () => {
      const singleSetWidth = container.scrollWidth / 3;
      if (singleSetWidth > 0) {
        container.scrollLeft = singleSetWidth;
      }
    };

    const resetLoopIfNeeded = () => {
      if (isResettingRef.current) return;

      const singleSetWidth = container.scrollWidth / 3;
      if (!singleSetWidth) return;

      if (container.scrollLeft <= singleSetWidth * 0.35) {
        isResettingRef.current = true;
        container.scrollLeft += singleSetWidth;
        requestAnimationFrame(() => {
          isResettingRef.current = false;
        });
      } else if (container.scrollLeft >= singleSetWidth * 1.65) {
        isResettingRef.current = true;
        container.scrollLeft -= singleSetWidth;
        requestAnimationFrame(() => {
          isResettingRef.current = false;
        });
      }
    };

    const handleScroll = () => {
      resetLoopIfNeeded();
    };

    const handleWheel = (event) => {
      const mostlyVerticalWheel =
        Math.abs(event.deltaY) > Math.abs(event.deltaX);

      if (mostlyVerticalWheel) {
        container.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    };

    const handlePointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      dragStateRef.current.isPointerDown = true;
      dragStateRef.current.isDragging = false;
      dragStateRef.current.startX = event.clientX;
      dragStateRef.current.startY = event.clientY;
      dragStateRef.current.startScrollLeft = container.scrollLeft;
    };

    const handlePointerMove = (event) => {
      const drag = dragStateRef.current;
      if (!drag.isPointerDown) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (!drag.isDragging) {
        const horizontalIntent =
          Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY);

        if (horizontalIntent) {
          drag.isDragging = true;
          container.classList.add("is-dragging");
        }
      }

      if (!drag.isDragging) return;

      container.scrollLeft = drag.startScrollLeft - deltaX;
      resetLoopIfNeeded();

      if (event.pointerType === "mouse") {
        event.preventDefault();
      }
    };

    const endPointer = () => {
      const drag = dragStateRef.current;
      drag.isPointerDown = false;

      if (drag.isDragging) {
        setTimeout(() => {
          container.classList.remove("is-dragging");
          drag.isDragging = false;
        }, 0);
      } else {
        container.classList.remove("is-dragging");
        drag.isDragging = false;
      }
    };

    setInitialPosition();

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", endPointer);
    container.addEventListener("pointercancel", endPointer);
    container.addEventListener("pointerleave", endPointer);

    const resizeObserver = new ResizeObserver(() => {
      if (container.scrollLeft === 0) {
        setInitialPosition();
      } else {
        resetLoopIfNeeded();
      }
    });

    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", endPointer);
      container.removeEventListener("pointercancel", endPointer);
      container.removeEventListener("pointerleave", endPointer);
      resizeObserver.disconnect();
    };
  }, []);

  const loopedLogos = [...brandLogos, ...brandLogos, ...brandLogos];

  const handleFuelNavigate = (fuel) => {
    navigate(`/brand/all?fuel=${encodeURIComponent(fuel)}`);
  };

  return (
    <main className="discovery-hub-screen">
      <div className="ambient-light ambient-light-1" />
      <div className="ambient-light ambient-light-2" />
      <div className="ambient-light ambient-light-3" />

      <section className="discovery-hub-shell">
        <section className="discovery-hub-sections">
          <section className="discovery-section discovery-section-brands interactive-panel">
            <div className="section-title center-title">Shop by Brand</div>

            <div className="brand-carousel-shell">
              <div className="brand-scroll-wrap" ref={brandScrollRef}>
                <div className="brand-row">
                  {loopedLogos.map((brand, index) => (
                    <button
                      key={`${brand.id}-${index}`}
                      type="button"
                      className="logo-card interactive-button"
                      onClick={() => navigate(`/brand/${brand.id}`)}
                      aria-label={`Shop ${brand.name}`}
                    >
                      <span className="button-sheen" />
                      <img
                        src={`${import.meta.env.VITE_ASSET_BASE_URL}/logos/${brand.file}`}
                        alt={brand.name}
                        draggable="false"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="discovery-section discovery-section-fuel interactive-panel">
            <div className="section-title center-title">Browse by Fuel Type</div>

            <div className="fuel-grid">
              {fuelOptions.map((fuel) => (
                <button
                  key={fuel.id}
                  type="button"
                  className="fuel-card interactive-button"
                  onClick={() => handleFuelNavigate(fuel.fuel)}
                  aria-label={fuel.title}
                >
                  <span className="button-sheen" />
                  <div
                    className="fuel-bg"
                    style={{ backgroundImage: `url("${fuel.image}")` }}
                  />
                  <div className="fuel-overlay" />
                  <div className="fuel-content">
                    <h3>{fuel.title}</h3>
                    <p>{fuel.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="discovery-section discovery-section-experience interactive-panel">
            <div className="section-title center-title">Browse by Cooking Experience</div>

            <div className="specialty-grid">
              <button
                type="button"
                className="specialty-card interactive-button"
                onClick={() => navigate("/brand/all?installation=built-in")}
              >
                <span className="button-sheen" />
                <div
                  className="specialty-bg"
                  style={{
                    backgroundImage: `url("${import.meta.env.VITE_ASSET_BASE_URL}/fuel/outdoor-kitchen.png")`,
                  }}
                />
                <div className="specialty-overlay" />
                <div className="specialty-content">
                  <h2>Outdoor Kitchen</h2>
                  <p>Explore Built-In Grills</p>
                </div>
              </button>

              <button
                type="button"
                className="specialty-card interactive-button"
                onClick={() => navigate("/brand/all?category=griddle")}
              >
                <span className="button-sheen" />
                <div
                  className="specialty-bg"
                  style={{
                    backgroundImage: `url("https://bbqcompareassets.brcreated.app/assets/fuel/griddle.png")`,
                  }}
                />
                <div className="specialty-overlay" />
                <div className="specialty-content">
                  <h2>Griddles</h2>
                  <p>Explore Flat Top Cooking</p>
                </div>
              </button>

              <button
                type="button"
                className="specialty-card interactive-button"
                onClick={() => navigate("/brand/all?category=pizza-oven")}
              >
                <span className="button-sheen" />
                <div
                  className="specialty-bg"
                  style={{
                    backgroundImage: `url("${import.meta.env.VITE_ASSET_BASE_URL}/fuel/pizza.png")`,
                  }}
                />
                <div className="specialty-overlay" />
                <div className="specialty-content">
                  <h2>Pizza Ovens</h2>
                  <p>Explore Gas or Wood-Fired Pizza Ovens</p>
                </div>
              </button>
            </div>
          </section>

          <div className="bottom-action-row">
            <button
              type="button"
              className="split-action-button interactive-button"
              onClick={() => navigate("/brand/all")}
            >
              <span className="button-sheen" />
              View All
            </button>

            <button
              type="button"
              className="split-action-button interactive-button secondary"
              onClick={() => setIsAboutOpen(true)}
            >
              <span className="button-sheen" />
              About
            </button>
          </div>
        </section>
      </section>

      <div
        className={`idle-fade-overlay ${isIdleFading ? "idle-fade-overlay-visible" : ""}`}
        aria-hidden="true"
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <style>{`
        .discovery-hub-screen {
          position: relative;
          min-height: 100dvh;
          width: 100%;
          overflow-x: hidden;
          overflow-y: visible;
          background:
            radial-gradient(circle at 18% 14%, rgba(76, 110, 168, 0.09), transparent 28%),
            radial-gradient(circle at 82% 88%, rgba(76, 110, 168, 0.08), transparent 32%),
            linear-gradient(180deg, #0a0d12 0%, #0f141b 48%, #090c11 100%);
          color: #e6edf7;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .ambient-light {
          position: absolute;
          border-radius: 999px;
          filter: blur(130px);
          pointer-events: none;
          opacity: 0.1;
          animation: ambientFloat 14s ease-in-out infinite;
        }

        .ambient-light-1 {
          width: 520px;
          height: 520px;
          top: -180px;
          left: -120px;
          background: #4f6691;
          animation-delay: 0s;
        }

        .ambient-light-2 {
          width: 560px;
          height: 560px;
          right: -180px;
          bottom: -180px;
          background: #3d5377;
          animation-delay: 3s;
        }

        .ambient-light-3 {
          width: 420px;
          height: 420px;
          top: 28%;
          left: 42%;
          background: #324661;
          opacity: 0.06;
          animation-delay: 6s;
        }

        .discovery-hub-shell {
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          width: 100%;
          padding: clamp(14px, 2.4vw, 28px);
          box-sizing: border-box;
        }

        .discovery-hub-sections {
          display: grid;
          gap: 16px;
          min-height: calc(100dvh - clamp(28px, 4.8vw, 56px));
          grid-template-rows: minmax(240px, 1.12fr) minmax(220px, 1.05fr) minmax(240px, 1fr) auto;
        }

        .discovery-section {
          position: relative;
          border-radius: 24px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.018));
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(18px);
          overflow: hidden;
          transition:
            transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 260ms ease,
            box-shadow 260ms ease,
            background 260ms ease;
        }

        .discovery-section::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 35%),
            radial-gradient(circle at top center, rgba(90, 120, 180, 0.06), transparent 42%);
        }

        .section-title {
          position: relative;
          z-index: 1;
          font-size: clamp(1.2rem, 2.2vw, 1.68rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #f2f6fb;
        }

        .center-title {
          text-align: center;
          padding: 18px 18px 8px;
        }

        .brand-carousel-shell {
          position: relative;
          z-index: 1;
          min-height: 0;
          height: calc(100% - 64px);
          display: flex;
          align-items: center;
          padding: 0 12px 14px;
          box-sizing: border-box;
        }

        .brand-scroll-wrap {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: auto;
          cursor: grab;
          padding: 6px 10px;
          box-sizing: border-box;
          touch-action: pan-x;
          user-select: none;
        }

        .brand-scroll-wrap::-webkit-scrollbar {
          display: none;
        }

        .brand-scroll-wrap:active,
        .brand-scroll-wrap.is-dragging {
          cursor: grabbing;
        }

        .brand-scroll-wrap.is-dragging .logo-card {
          pointer-events: none;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: clamp(12px, 1.8vw, 18px);
          width: max-content;
        }

        .interactive-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 220ms ease,
            border-color 220ms ease,
            filter 220ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .interactive-button:active {
          transform: scale(0.985);
        }

        .interactive-button:focus-visible {
          outline: 2px solid rgba(122, 157, 219, 0.5);
          outline-offset: 2px;
        }

        .button-sheen {
          position: absolute;
          inset: -120% auto auto -40%;
          width: 38%;
          height: 260%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(20deg);
          pointer-events: none;
          opacity: 0;
          transition: opacity 220ms ease;
        }

        .logo-card {
          width: clamp(156px, 18vw, 220px);
          height: clamp(96px, 10.5vw, 128px);
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(14px, 1.6vw, 18px);
          border-radius: 22px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #ffffff;
          box-shadow:
            0 14px 28px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.85);
        }

        .logo-card img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
          pointer-events: none;
          user-select: none;
        }

        .discovery-section-fuel {
          padding: 14px 16px 16px;
          box-sizing: border-box;
        }

        .fuel-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          min-height: 0;
          height: calc(100% - 58px);
        }

        .fuel-card {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: #121821;
          min-height: clamp(170px, 23vw, 220px);
        }

        .fuel-bg {
          position: absolute;
          inset: 0;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          transform: scale(1.02);
          transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .fuel-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.42) 52%, rgba(0, 0, 0, 0.84) 100%);
        }

        .fuel-content {
          position: absolute;
          inset: auto 0 0 0;
          z-index: 1;
          padding: clamp(16px, 2vw, 20px);
          transform: translateY(0);
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .fuel-content h3 {
          margin: 0 0 8px;
          font-size: clamp(1.05rem, 1.6vw, 1.28rem);
          font-weight: 800;
          line-height: 1.08;
          color: #f4f7fc;
        }

        .fuel-content p {
          margin: 0;
          font-size: clamp(0.9rem, 1.1vw, 0.96rem);
          line-height: 1.42;
          color: rgba(230, 237, 247, 0.82);
        }

        .discovery-section-experience {
          padding: 14px 16px 16px;
          box-sizing: border-box;
        }

        .specialty-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          min-height: 0;
          height: calc(100% - 58px);
        }

        .specialty-card {
          position: relative;
          overflow: hidden;
          min-height: clamp(180px, 24vw, 240px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: #121821;
        }

        .specialty-bg {
          position: absolute;
          inset: 0;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          transform: scale(1.02);
          transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .specialty-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.42) 55%, rgba(0, 0, 0, 0.84) 100%);
        }

        .specialty-content {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: clamp(18px, 2vw, 24px);
          transform: translateY(0);
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .specialty-content h2 {
          margin: 0 0 10px;
          font-size: clamp(1.35rem, 2.6vw, 1.95rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f4f7fc;
        }

        .specialty-content p {
          margin: 0;
          font-size: clamp(0.92rem, 1.15vw, 1rem);
          line-height: 1.5;
          color: rgba(230, 237, 247, 0.86);
        }

        .bottom-action-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .split-action-button {
          min-height: 72px;
          border: none;
          border-radius: 20px;
          background: linear-gradient(180deg, #5a78a8 0%, #435d83 100%);
          color: #f7fbff;
          font-size: clamp(0.92rem, 1.2vw, 1rem);
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          box-shadow: 0 18px 38px rgba(67, 93, 131, 0.34);
          padding: 14px 20px;
        }

        .split-action-button.secondary {
          background: linear-gradient(180deg, #2b3442 0%, #1d2530 100%);
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28);
        }

        .idle-fade-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          pointer-events: none;
          opacity: 0;
          background:
            radial-gradient(circle at center, rgba(7, 10, 15, 0.12) 0%, rgba(7, 10, 15, 0.42) 55%, rgba(5, 8, 12, 0.78) 100%);
          transition: opacity 1200ms ease;
        }

        .idle-fade-overlay-visible {
          opacity: 1;
        }

        @keyframes ambientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(18px, -12px, 0) scale(1.04);
          }
        }

        @media (max-width: 1200px) {
          .discovery-hub-sections {
            grid-template-rows: auto;
            min-height: auto;
          }

          .discovery-hub-shell {
            padding: 18px 20px 20px;
          }

          .fuel-grid {
            grid-template-columns: 1fr;
            height: auto;
          }

          .specialty-grid {
            grid-template-columns: 1fr;
            height: auto;
          }

          .brand-carousel-shell {
            height: auto;
            min-height: 150px;
          }
        }

        @media (max-width: 768px) {
          .discovery-hub-sections {
            grid-template-rows: auto;
          }

          .section-title {
            font-size: 1.4rem;
          }

          .logo-card {
            width: 180px;
            height: 108px;
          }

          .specialty-content h2 {
            font-size: 1.6rem;
          }

          .bottom-action-row {
            grid-template-columns: 1fr;
          }

          .discovery-hub-shell {
            padding: 14px;
          }

          .discovery-section-fuel,
          .discovery-section-experience {
            padding: 12px;
          }

          .center-title {
            padding: 16px 16px 8px;
          }
        }
      `}</style>
    </main>
  );
}
