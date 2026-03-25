// src/pages/QuizPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";

export default function QuizPage() {
  const navigate = useNavigate();
  const { variants, ready } = useCatalog();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    fuel: null,
    cookingStyle: null,
    size: null,
    install: null,
    budget: null,
  });

  const steps = [
    "fuel",
    "cookingStyle",
    "size",
    "install",
    "budget",
    "results",
  ];

  const progress = ((step + 1) / steps.length) * 100;

  function setAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setTimeout(() => setStep((s) => s + 1), 200);
  }

  function goBack() {
    if (step === 0) return navigate("/discover");
    setStep((s) => s - 1);
  }

    // -----------------------------
  // RECOMMENDATION SCORING (Step 3)
  // -----------------------------
  const scoredVariants = useMemo(() => {
    if (!ready) return [];

    return variants
      .map((v) => {
        let score = 0;

        const fuel = String(v.fuelType || "").toLowerCase();
        const install = String(v.installType || "").toLowerCase();

        // Fuel weighting (strong)
        if (answers.fuel && answers.fuel !== "any") {
          if (fuel.includes(answers.fuel)) score += 5;
        }

        // Installation weighting
        if (answers.install && answers.install !== "any") {
          if (install.includes(answers.install)) score += 3;
        }

        // Cooking style (light placeholder for now)
        if (answers.cookingStyle === "bbq" && fuel.includes("pellet")) score += 2;
        if (answers.cookingStyle === "grill" && fuel.includes("gas")) score += 2;

        return { variant: v, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [variants, answers, ready]);

  const topVariants = scoredVariants.slice(0, 40);


  function goToResults() {
    navigate("/brand/all", {
      state: {
        quizResults: topVariants.map((v) => v.variant.id),
      },
    });
  }

  function Card({ label, value }) {
    return (
      <button
        onClick={() => setAnswer(steps[step], value)}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "24px",
          fontSize: "18px",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  function renderStep() {
    switch (steps[step]) {
      case "fuel":
        return (
          <>
            <h2>What fuel do you prefer?</h2>
            <div className="grid">
              <Card label="Pellet" value="pellet" />
              <Card label="Gas" value="gas" />
              <Card label="Charcoal / Wood" value="charcoal" />
              <Card label="Not Sure" value="any" />
            </div>
          </>
        );

      case "cookingStyle":
        return (
          <>
            <h2>How do you like to cook?</h2>
            <div className="grid">
              <Card label="Low & Slow BBQ" value="bbq" />
              <Card label="High Heat Grilling" value="grill" />
              <Card label="Both" value="both" />
            </div>
          </>
        );

      case "size":
        return (
          <>
            <h2>How many people do you cook for?</h2>
            <div className="grid">
              <Card label="1–4" value="small" />
              <Card label="5–10" value="medium" />
              <Card label="10+" value="large" />
            </div>
          </>
        );

      case "install":
        return (
          <>
            <h2>Installation type?</h2>
            <div className="grid">
              <Card label="Freestanding" value="freestanding" />
              <Card label="Built-In" value="builtin" />
              <Card label="Not Sure" value="any" />
            </div>
          </>
        );

      case "budget":
        return (
          <>
            <h2>What is your budget?</h2>
            <div className="grid">
              <Card label="Under $1,000" value="low" />
              <Card label="$1,000 – $3,000" value="mid" />
              <Card label="$3,000+" value="high" />
            </div>
          </>
        );

      case "results":
        return (
          <>
            <h2>Your Recommendation</h2>
            <p style={{ opacity: 0.7 }}>
              {topVariants.length} matching grills found
            </p>

            <button
              onClick={goToResults}
              style={{
                marginTop: 24,
                padding: "16px 32px",
                fontSize: 18,
                borderRadius: 12,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              View Results
            </button>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 20%, #0f172a, #020617)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "40px 24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <button onClick={goBack}>Back</button>
        <div>{Math.round(progress)}%</div>
      </div>

      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#2563eb",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {renderStep()}
      </div>

      <style>
        {`
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 24px;
          }

          h2 {
            font-size: 28px;
            margin-bottom: 12px;
          }
        `}
      </style>
    </main>
  );
}
