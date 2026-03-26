import { useCallback, useEffect, useMemo, useState } from "react";
import { clearCatalogCache, loadCatalogRuntime } from "../lib/catalogApi";

export default function useCatalog() {
  const [status, setStatus] = useState("loading");
  const [runtime, setRuntime] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ force = false } = {}) => {
    try {
      if (force) {
        clearCatalogCache();
      }

      setStatus("loading");
      setError(null);

      const result = await loadCatalogRuntime();
      setRuntime(result);
      setStatus("ready");

      return result;
    } catch (err) {
      setRuntime(null);
      setError(err);
      setStatus("error");
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    load().catch((err) => {
      if (cancelled) return;
      console.error("Catalog load failed:", err);
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const value = useMemo(
    () => ({
      status,
      isLoading: status === "loading",
      isReady: status === "ready",
      isError: status === "error",
      error,
      runtime,
      reload: () => load({ force: true }),
    }),
    [status, error, runtime, load]
  );

  return value;
}