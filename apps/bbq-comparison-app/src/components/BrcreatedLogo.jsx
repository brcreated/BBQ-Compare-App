import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_TEXT = "brcreated.app";

export default function BrcreatedLogo({
  text = DEFAULT_TEXT,
  typingSpeed = 90,
  pauseAfterTyping = 1800,
  pauseAfterDelete = 500,
  loop = true,
  showCursor = true,
  size = "clamp(28px, 5vw, 64px)",
  centered = true,
}) {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fullText = useMemo(() => String(text || DEFAULT_TEXT), [text]);

  useEffect(() => {
    let timeout;

    if (!loop) {
      if (displayText.length < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }, typingSpeed);
      }
      return () => clearTimeout(timeout);
    }

    if (!isDeleting && displayText.length < fullText.length) {
      timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayText.length === fullText.length) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseAfterTyping);
    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length - 1));
      }, Math.max(typingSpeed * 0.45, 35));
    } else if (isDeleting && displayText.length === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
      }, pauseAfterDelete);
    }

    return () => clearTimeout(timeout);
  }, [
    displayText,
    fullText,
    isDeleting,
    loop,
    pauseAfterDelete,
    pauseAfterTyping,
    typingSpeed,
  ]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: centered ? "center" : "flex-start",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        aria-label={`Logo: ${fullText}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.06em",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "#EAF4FF",
          textShadow: "0 0 24px rgba(76, 201, 240, 0.12)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            color: "#3A86FF",
            textShadow: "0 0 18px rgba(58, 134, 255, 0.28)",
          }}
        >
          {"{"}
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minWidth: `${fullText.length * 0.58}em`,
            color: "#EAF4FF",
          }}
        >
          <span>{displayText}</span>

          {showCursor ? (
            <span
              style={{
                marginLeft: "0.04em",
                color: "#4CC9F0",
                animation: "brcreated-logo-blink 1s step-end infinite",
              }}
            >
              |
            </span>
          ) : null}
        </span>

        <span
          style={{
            color: "#3A86FF",
            textShadow: "0 0 18px rgba(58, 134, 255, 0.28)",
          }}
        >
          {"}"}
        </span>

        <style>
          {`
            @keyframes brcreated-logo-blink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
          `}
        </style>
      </div>
    </div>
  );
}