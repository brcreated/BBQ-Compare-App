// src/hooks/useIdleReset.js
import { useEffect, useRef, useState } from "react";

export default function useIdleReset({
  timeout = 60000,
  onReset,
  resetUrl = "/",
  enabled = true,
} = {}) {
  const lastActivityRef = useRef(0);
  const hasResetRef = useRef(false);
  const intervalRef = useRef(null);
  const [isIdleFading, setIsIdleFading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsIdleFading(false);
      return;
    }

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      hasResetRef.current = false;
      setIsIdleFading(false);
    };

    const runReset = () => {
      if (hasResetRef.current) return;
      hasResetRef.current = true;

      try {
        if (typeof onReset === "function") {
          onReset();
        }
      } catch (error) {
        console.error("Idle reset onReset failed:", error);
      }

      if (window.location.pathname !== resetUrl) {
        window.location.href = resetUrl;
      } else {
        window.location.reload();
      }
    };

    const checkIdle = () => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;
      const fadeStart = Math.max(timeout - 5000, 0);

      setIsIdleFading(idleFor >= fadeStart && idleFor < timeout);

      if (idleFor >= timeout) {
        runReset();
      }
    };

    const events = [
      "pointerdown",
      "pointermove",
      "pointerup",
      "touchstart",
      "touchmove",
      "touchend",
      "mousedown",
      "mousemove",
      "mouseup",
      "click",
      "keydown",
      "keyup",
      "wheel",
      "scroll",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
      document.addEventListener(eventName, markActivity, { passive: true });
    });

    const handleVisibility = () => {
      if (!document.hidden) {
        markActivity();
      }
    };

    window.addEventListener("focus", markActivity);
    window.addEventListener("pageshow", markActivity);
    document.addEventListener("visibilitychange", handleVisibility);

    markActivity();
    intervalRef.current = window.setInterval(checkIdle, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
        document.removeEventListener(eventName, markActivity);
      });

      window.removeEventListener("focus", markActivity);
      window.removeEventListener("pageshow", markActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, timeout, onReset, resetUrl]);

  return { isIdleFading };
}