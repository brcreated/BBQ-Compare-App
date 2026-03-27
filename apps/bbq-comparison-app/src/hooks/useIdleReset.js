// src/hooks/useIdleReset.js

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useIdleReset(timeout = 60000, fadeDuration = 5000) {
  const navigate = useNavigate();

  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  const [isIdleFading, setIsIdleFading] = useState(false);

  useEffect(() => {
    const clearTimers = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };

    const startTimers = () => {
      clearTimers();
      setIsIdleFading(false);

      const safeFadeDuration = Math.min(fadeDuration, timeout);

      // Start fade before reset
      fadeTimerRef.current = setTimeout(() => {
        setIsIdleFading(true);
      }, Math.max(timeout - safeFadeDuration, 0));

      // Full reset
      timerRef.current = setTimeout(() => {
        navigate("/", { replace: true });
      }, timeout);
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "touchstart",
      "touchmove",
      "keydown",
      "scroll",
    ];

    const handleActivity = () => {
      startTimers();
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    // Init
    startTimers();

    return () => {
      clearTimers();
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [navigate, timeout, fadeDuration]);

  return { isIdleFading };
}