import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useIdleReset(
  timeout = 60000,
  fadeDurationOrOnIdle = 5000,
  maybeOnIdle
) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const [isIdleFading, setIsIdleFading] = useState(false);

  const fadeDuration =
    typeof fadeDurationOrOnIdle === "number" ? fadeDurationOrOnIdle : 5000;

  const onIdle =
    typeof fadeDurationOrOnIdle === "function"
      ? fadeDurationOrOnIdle
      : typeof maybeOnIdle === "function"
      ? maybeOnIdle
      : null;

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

        if (typeof onIdle === "function") {
          onIdle();
          return;
        }

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
  }, [navigate, timeout, fadeDuration, onIdle]);

  return { isIdleFading };
}
