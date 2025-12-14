"use client";

import { useState, useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { createLogger } from "@/lib/logger";

const logger = createLogger("System");

/**
 * Hook for managing development server lifecycle
 * Responsibilities:
 * - Dev server process spawning
 * - Port listening and URL management
 * - Preview iframe state management
 */
export function useDevServer(
  instance: WebContainer | null,
  terminal: Terminal | null
) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  
  // Track if we've already set up the server listener to prevent duplicates
  const hasServerListenerRef = useRef(false);
  const serverProcessRef = useRef<any>(null);

  const log = useCallback(
    (message: string) => terminal?.writeln(message),
    [terminal]
  );

  const startServer = useCallback(async () => {
    if (!instance || !terminal) {
      logger.error("Cannot start server: instance or terminal not available");
      return;
    }

    try {
      // 1. Only set up listener once per instance to prevent duplicates
      if (!hasServerListenerRef.current) {
        instance.on("server-ready", (port, url) => {
          logger.debug(`Server ready on port ${port}: ${url}`);
          setPreviewUrl(url); // Save the internal URL
        });
        hasServerListenerRef.current = true;
      }

      // 2. Spawn the dev server process
      log("\x1b[35m[System] Starting Preview Server...\x1b[0m");
      const process = await instance.spawn("npm", ["run", "dev"]);
      serverProcessRef.current = process;

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            // Optional: Pipe dev server logs to terminal
            // terminal.write(data);
          },
        })
      );
    } catch (error) {
      logger.error("Failed to start dev server", { error });
      log("\r\n\x1b[31m[System] Failed to start preview server.\x1b[0m");
    }
  }, [instance, terminal, log]);

  const stopServer = useCallback(async () => {
    if (serverProcessRef.current) {
      try {
        serverProcessRef.current.kill();
        serverProcessRef.current = null;
        setPreviewUrl(null);
        logger.debug("Dev server stopped");
      } catch (error) {
        logger.error("Failed to stop dev server", { error });
      }
    }
  }, []);

  const refreshPreview = useCallback(() => {
    setIframeKey((prev) => prev + 1);
  }, []);

  return {
    startServer,
    stopServer,
    previewUrl,
    iframeKey,
    refreshPreview,
  };
}
