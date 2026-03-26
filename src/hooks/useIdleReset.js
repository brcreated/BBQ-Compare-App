// src/hooks/useIdleReset.js
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function useIdleReset({
  timeout = 60000,
  fadeDuration = 5000,
  enabled = true,
  onReset,
  resetPath = "/",
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const lastActivityRef = useRef(Date.now());
  const hasResetRef = useRef(false);
  const [isIdleFading, setIsIdleFading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      hasResetRef.current = false;
      setIsIdleFading(false);
    };

    const runReset = () => {
      if (hasResetRef.current) return;
      hasResetRef.current = true;
      setIsIdleFading(false);

      if (typeof onReset === "function") {
        onReset();
      }

      if (location.pathname !== resetPath) {
        navigate(resetPath, { replace: true });
      }
    };

    const checkIdle = () => {
      const idleFor = Date.now() - lastActivityRef.current;

      if (idleFor >= timeout) {
        runReset();
        return;
      }

      const fadeStart = Math.max(timeout - fadeDuration, 0);
      setIsIdleFading(idleFor >= fadeStart);
    };

    const activityEvents = [
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

    const handleVisibility = () => {
      if (!document.hidden) {
        markActivity();
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibility);

    // Start fresh whenever this hook mounts or route changes
    markActivity();

    // Watchdog interval: much more reliable on kiosk / TV hardware
    const intervalId = window.setInterval(checkIdle, 1000);

    return () => {
      window.clearInterval(intervalId);

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    enabled,
    timeout,
    fadeDuration,
    onReset,
    resetPath,
    navigate,
    location.pathname,
  ]);

  return { isIdleFading };
}