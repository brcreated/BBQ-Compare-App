import React, { useEffect, useState } from "react";
import BRcreatedLogo from "../components/BRcreatedLogo";

const GITHUB_CONFIG = {
  owner: "brcreated",
  repo: "BBQ-Compare-App",
  branch: "main",
  packageJsonPath: "package.json",
};

export default function AboutPage({ appVersion }) {
  const [version, setVersion] = useState(appVersion || "Loading...");
  const [versionSource, setVersionSource] = useState(appVersion ? "build" : "");

  useEffect(() => {
    if (appVersion) {
      setVersion(`v${appVersion}`);
      setVersionSource("build");
      return;
    }

    let cancelled = false;

    async function loadVersion() {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.packageJsonPath}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        if (!cancelled && json?.version) {
          setVersion(`v${json.version}`);
          setVersionSource("GitHub");
        }
      } catch {
        if (!cancelled) {
          setVersion("dev");
          setVersionSource("local");
        }
      }
    }

    loadVersion();
    return () => { cancelled = true; };
  }, [appVersion]);

  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        .about-page-wrap {
          min-height: calc(100vh - 68px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .about-card {
          width: min(920px, 100%);
          border-radius: 28px;
          overflow: hidden;
          background:
            radial-gradient(circle at top, rgba(76,201,240,0.10), transparent 26%),
            linear-gradient(180deg, rgba(7,12,24,0.98) 0%, rgba(4,8,18,0.99) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 40px 100px rgba(0,0,0,0.50);
          color: #ffffff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
          padding: 32px;
        }

        .about-hero {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px 0 12px;
        }

        .about-hero-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 28px 30px;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(10,18,35,0.88) 0%, rgba(5,10,20,0.96) 100%);
          border: 1px solid rgba(76,201,240,0.14);
          box-shadow: 0 0 0 1px rgba(76,201,240,0.08), 0 0 36px rgba(76,201,240,0.10);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          min-width: min(100%, 560px);
        }

        .about-hero-link:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: rgba(76,201,240,0.24);
          box-shadow: 0 0 0 1px rgba(76,201,240,0.16), 0 0 56px rgba(76,201,240,0.18);
        }

        .about-badge {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(76,201,240,0.08);
          border: 1px solid rgba(76,201,240,0.16);
          color: #9fe6ff;
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .about-hero-title {
          margin: 0;
          font-size: 14px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: #8bd1ff;
          text-align: center;
        }

        .about-hero-subtitle {
          margin: 10px 0 0;
          font-size: 16px;
          color: #c8d4e6;
          line-height: 1.55;
          text-align: center;
        }

        .about-copy {
          max-width: 760px;
          margin: 28px auto 0;
          color: #b9c7d8;
          text-align: center;
          line-height: 1.75;
          font-size: 17px;
        }

        .about-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-top: 28px;
        }

        .about-meta-card {
          padding: 18px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .about-meta-label {
          margin: 0;
          font-size: 12px;
          color: #8bd1ff;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .about-meta-value {
          margin: 10px 0 0;
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .about-meta-small {
          margin: 10px 0 0;
          font-size: 14px;
          color: #b9c7d8;
          line-height: 1.5;
          word-break: break-word;
        }

        .about-footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          font-size: 14px;
          color: #b9c7d8;
        }

        .about-footer a {
          color: #4cc9f0;
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .about-card { padding: 20px 18px; }
          .about-hero-link { padding: 22px 18px; min-width: 100%; }
          .about-copy { font-size: 15px; }
        }
      `}</style>

      <div className="about-page-wrap">
        <div className="about-card">
          <div className="about-hero">
            <a
              className="about-hero-link"
              href="https://brcreated.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="about-badge">Custom experience by</div>
              <BRcreatedLogo />
              <div>
                <h2 className="about-hero-title">Created by</h2>
                <p className="about-hero-subtitle">Built for premium retail experiences.</p>
              </div>
            </a>
          </div>

          <p className="about-copy">
            A fast, interactive showroom experience designed to help customers
            compare products, understand differences, and choose with confidence.
          </p>

          <div className="about-meta">
            <div className="about-meta-card">
              <p className="about-meta-label">Version</p>
              <p className="about-meta-value">{version}</p>
            </div>
            <div className="about-meta-card">
              <p className="about-meta-label">Source</p>
              <p className="about-meta-small">{versionSource}</p>
            </div>
            <div className="about-meta-card">
              <p className="about-meta-label">Branch</p>
              <p className="about-meta-small">{GITHUB_CONFIG.branch}</p>
            </div>
          </div>

          <div className="about-footer">
            Copyright © {year} | Created by{" "}
            <a href="https://brcreated.app" target="_blank" rel="noopener noreferrer">
              brcreated.app
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
