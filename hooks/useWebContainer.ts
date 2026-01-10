"use client";

import { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import { getWebContainerInstance } from "@/lib/engine/instance";

export function useWebContainer() {
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let bootStarted = false;

    async function boot() {
      // Prevent multiple boot attempts from the same component
      if (bootStarted) return;
      bootStarted = true;

      try {
        setIsLoading(true);
        const webcontainer = await getWebContainerInstance();
        if (mounted) {
          setInstance(webcontainer);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("WebContainer boot failed:", err);
        if (mounted) {
          // Check specifically for the headers issue
          if (
            err instanceof Error &&
            err.message.includes("SharedArrayBuffer")
          ) {
            setError(
              "Security Headers Missing: COOP/COEP headers are required."
            );
          } else {
            setError("Failed to boot WebContainer.");
          }
          setIsLoading(false);
        }
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  return { instance, isLoading, error };
}
