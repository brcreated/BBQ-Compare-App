import { useEffect, useRef, useState } from "react";

const VERSION_URL = "/app-version.json";
const CHECK_INTERVAL_MS = 60 * 1000;

function formatTimestamp(isoString) {
  if (!isoString) return "Unknown";

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function getNextNightlyReloadDelay(targetHour = 3, targetMinute = 0) {
  const now = new Date();
  const next = new Date();

  next.setHours(targetHour, targetMinute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

export default function useAppUpdateManager({
  checkIntervalMs = CHECK_INTERVAL_MS,
  nightlyReloadHour = 3,
  nightlyReloadMinute = 0,
  enableNightlyReload = true,
} = {}) {
  const currentVersionRef = useRef(null);
  const initializedRef = useRef(false);
  const reloadGuardRef = useRef(false);

  const [appVersion, setAppVersion] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedAtLabel, setUpdatedAtLabel] = useState("Unknown");

  useEffect(() => {
    let intervalId = null;
    let nightlyTimeoutId = null;
    let nightlyIntervalId = null;

    async function fetchVersion() {
      try {
        const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Failed to fetch app version:", error);
        return null;
      }
    }

    async function checkForUpdates() {
      const data = await fetchVersion();
      if (!data || !data.appVersion) return;

      setAppVersion(data.appVersion);
      setUpdatedAt(data.updatedAt || null);
      setUpdatedAtLabel(formatTimestamp(data.updatedAt));

      if (!initializedRef.current) {
        currentVersionRef.current = data.appVersion;
        initializedRef.current = true;
        return;
      }

      if (
        currentVersionRef.current &&
        data.appVersion !== currentVersionRef.current &&
        !reloadGuardRef.current
      ) {
        reloadGuardRef.current = true;
        window.location.reload();
      }
    }

    function runNightlyReload() {
      if (reloadGuardRef.current) return;
      reloadGuardRef.current = true;
      window.location.reload();
    }

    checkForUpdates();
    intervalId = window.setInterval(checkForUpdates, checkIntervalMs);

    if (enableNightlyReload) {
      const initialDelay = getNextNightlyReloadDelay(
        nightlyReloadHour,
        nightlyReloadMinute
      );

      nightlyTimeoutId = window.setTimeout(() => {
        runNightlyReload();

        nightlyIntervalId = window.setInterval(
          runNightlyReload,
          24 * 60 * 60 * 1000
        );
      }, initialDelay);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (nightlyTimeoutId) window.clearTimeout(nightlyTimeoutId);
      if (nightlyIntervalId) window.clearInterval(nightlyIntervalId);
    };
  }, [checkIntervalMs, nightlyReloadHour, nightlyReloadMinute, enableNightlyReload]);

  return {
    appVersion,
    updatedAt,
    updatedAtLabel,
  };
}