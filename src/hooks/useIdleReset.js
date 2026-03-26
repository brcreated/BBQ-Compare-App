// src/hooks/useIdleReset.js
import { useEffect, useRef } from "react";

export default function useIdleReset({
  timeout = 60000,
  onReset,
  resetUrl = "/",
  enabled = true,
} = {}) {
  const lastActivityRef = useRef(Date.now());
  const hasResetRef = useRef(false);
  const rafRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      hasResetRef.current = false;
    };

    const runReset = () => {
      if (hasResetRef.current) return;
      hasResetRef.current = true;

      try {
        if (typeof onReset === "function") {
          onReset();
        }
      } catch (err) {
        console.error("Idle reset onReset failed:", err);
      }

      // Hard redirect is more reliable than router navigation on kiosk/TV wrappers.
      if (window.location.pathname !== resetUrl) {
        window.location.replace(resetUrl);
      } else {
        // Already on welcome page: force a reload so UI/store truly resets.
        window.location.reload();
      }
    };

    const checkIdle = () => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;
      if (idleFor >= timeout) {
        runReset();
      }
    };

    const loop = () => {
      checkIdle();
      rafRef.current = window.requestAnimationFrame(loop);
    };

    const events = [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "touchstart",
      "touchmove",
      "touchend",
      "touchcancel",
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

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) markActivity();
    });

    window.addEventListener("focus", markActivity);
    window.addEventListener("pageshow", markActivity);

    markActivity();

    // Use both interval and RAF for stubborn Android TV wrappers.
    intervalRef.current = window.setInterval(checkIdle, 1000);
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);

      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
        document.removeEventListener(eventName, markActivity);
      });

      window.removeEventListener("focus", markActivity);
      window.removeEventListener("pageshow", markActivity);
    };
  }, [enabled, timeout, onReset, resetUrl]);
}