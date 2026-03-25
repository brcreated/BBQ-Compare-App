//AboutPage.jsx

import React, { useEffect, useState } from "react";
import BRcreatedLogo from "../components/BrcreatedLogo.jsx";

export default function AboutModal({ isOpen, onClose }) {
  const [version, setVersion] = useState("Loading...");
  const [versionSource, setVersionSource] = useState("");

  const GITHUB_CONFIG = {
    owner: "YOUR_GITHUB_USERNAME_OR_ORG",
    repo: "YOUR_REPOSITORY_NAME",
    branch: "main",
    packageJsonPath: "package.json",
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadVersion() {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.packageJsonPath}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error("package fetch failed");

        const json = await res.json();

        if (!cancelled && json?.version) {
          setVersion(`v${json.version}`);
          setVersionSource("GitHub");
          return;
        }

        throw new Error("no version");
      } catch {
        if (!cancelled) {
          setVersion("dev");
          setVersionSource("local");
        }
      }
    }

    loadVersion();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        .about-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(3, 8, 16, 0.78);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .about-modal-card {
          width: min(920px, 100%);
          border-radius: 28px;
          overflow: hidden;
          background:
            radial-gradient(circle at top, rgba(76, 201, 240, 0.10), transparent 26%),
            linear-gradient(180deg, rgba(7, 12, 24, 0.98) 0%, rgba(4, 8, 18, 0.99) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.50);
          color: #ffffff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          position: relative;
        }

        .about-modal-topbar {
          display: flex;
          justify-content: flex-end;
          padding: 16px 16px 0;
        }

        .about-modal-close {
          appearance: none;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          font-size: 20px;
          cursor: pointer;
          transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
        }

        .about-modal-close:hover {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(76, 201, 240, 0.35);
        }

        .about-modal-content {
          padding: 8px 32px 32px;
        }

        .about-modal-hero {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 28px 0 12px;
        }

        .about-modal-hero-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 28px 30px;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(10, 18, 35, 0.88) 0%, rgba(5, 10, 20, 0.96) 100%);
          border: 1px solid rgba(76, 201, 240, 0.14);
          box-shadow:
            0 0 0 1px rgba(76, 201, 240, 0.08),
            0 0 36px rgba(76, 201, 240, 0.10);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          min-width: min(100%, 560px);
        }

        .about-modal-hero-link:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: rgba(76, 201, 240, 0.24);
          box-shadow:
            0 0 0 1px rgba(76, 201, 240, 0.16),
            0 0 56px rgba(76, 201, 240, 0.18);
        }

        .about-modal-badge {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(76, 201, 240, 0.08);
          border: 1px solid rgba(76, 201, 240, 0.16);
          color: #9fe6ff;
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .about-modal-hero-text {
          text-align: center;
        }

        .about-modal-title {
          margin: 0;
          font-size: 14px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: #8bd1ff;
        }

        .about-modal-subtitle {
          margin: 10px 0 0;
          font-size: 16px;
          color: #c8d4e6;
          line-height: 1.55;
        }

        .about-modal-copy {
          max-width: 760px;
          margin: 28px auto 0;
          color: #b9c7d8;
          text-align: center;
          line-height: 1.75;
          font-size: 17px;
        }

        .about-modal-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-top: 28px;
        }

        .about-modal-meta-card {
          padding: 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .about-modal-meta-label {
          margin: 0;
          font-size: 12px;
          color: #8bd1ff;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .about-modal-meta-value {
          margin: 10px 0 0;
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .about-modal-meta-small {
          margin: 10px 0 0;
          font-size: 14px;
          color: #b9c7d8;
          line-height: 1.5;
          word-break: break-word;
        }

        .about-modal-footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
          font-size: 14px;
          color: #b9c7d8;
        }

        .about-modal-footer a {
          color: #4cc9f0;
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .about-modal-content {
            padding: 8px 18px 20px;
          }

          .about-modal-hero-link {
            padding: 22px 18px;
            min-width: 100%;
          }

          .about-modal-copy {
            font-size: 15px;
          }
        }
      `}</style>

      <div
        className="about-modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="About this app"
      >
        <div
          className="about-modal-card"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="about-modal-topbar">
            <button
              type="button"
              className="about-modal-close"
              onClick={onClose}
              aria-label="Close about popup"
            >
              ×
            </button>
          </div>

          <div className="about-modal-content">
            <div className="about-modal-hero">
              <a
                className="about-modal-hero-link"
                href="https://brcreated.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="about-modal-badge">Custom experience by</div>

                <BRcreatedLogo />

                <div className="about-modal-hero-text">
                  <h2 className="about-modal-title">Created by</h2>
                  <p className="about-modal-subtitle">
                    Built for premium retail experiences.
                  </p>
                </div>
              </a>
            </div>

            <p className="about-modal-copy">
              A fast, interactive showroom experience designed to help customers
              compare products, understand differences, and choose with confidence.
            </p>

            <div className="about-modal-meta">
              <div className="about-modal-meta-card">
                <p className="about-modal-meta-label">Version</p>
                <p className="about-modal-meta-value">{version}</p>
              </div>

              <div className="about-modal-meta-card">
                <p className="about-modal-meta-label">Source</p>
                <p className="about-modal-meta-small">{versionSource}</p>
              </div>

              <div className="about-modal-meta-card">
                <p className="about-modal-meta-label">Branch</p>
                <p className="about-modal-meta-small">{GITHUB_CONFIG.branch}</p>
              </div>
            </div>

            <div className="about-modal-footer">
              Copyright © {year} | Created by{" "}
              <a
                href="https://brcreated.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                brcreated.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}