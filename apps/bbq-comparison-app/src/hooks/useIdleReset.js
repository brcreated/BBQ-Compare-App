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
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };

    const resetTimer = () => {
      clearTimers();
      setIsIdleFading(false);

      const safeFadeDuration = Math.min(fadeDuration, timeout);

      fadeTimerRef.current = setTimeout(() => {
        setIsIdleFading(true);
      }, Math.max(timeout - safeFadeDuration, 0));

      timerRef.current = setTimeout(() => {
        setIsIdleFading(false);
        navigate("/", { replace: true });
      }, timeout);
    };

    const events = [
      "touchstart",
      "touchmove",
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "wheel",
      "pointerdown",
      "pointermove",
      "click",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      clearTimers();

      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [navigate, timeout, fadeDuration]);

  return { isIdleFading };
}