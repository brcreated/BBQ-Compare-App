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

  const idleTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const [isIdleFading, setIsIdleFading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const clearTimers = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };

    const runReset = () => {
      setIsIdleFading(false);

      if (typeof onReset === "function") {
        onReset();
      }

      if (location.pathname !== resetPath) {
        navigate(resetPath, { replace: true });
      }
    };

    const startTimers = () => {
      clearTimers();
      setIsIdleFading(false);

      const safeFadeDuration = Math.min(fadeDuration, timeout);

      fadeTimerRef.current = setTimeout(() => {
        setIsIdleFading(true);
      }, Math.max(timeout - safeFadeDuration, 0));

      idleTimerRef.current = setTimeout(() => {
        runReset();
      }, timeout);
    };

    const handleActivity = () => {
      startTimers();
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
      "wheel",
      "scroll",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    startTimers();

    return () => {
      clearTimers();

      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [enabled, timeout, fadeDuration, onReset, resetPath, navigate, location.pathname]);

  return { isIdleFading };
}