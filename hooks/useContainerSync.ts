"use client";

import { useEffect, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { ensureDirectory } from "@/lib/fileUtils";
import { TIMINGS } from "@/lib/config/constants";

/**
 * Hook to sync file contents to WebContainer filesystem with debouncing
 * Handles change detection, directory creation, and debounced writes
 */
export function useContainerSync(
  instance: WebContainer | null,
  fileContents: Record<string, string>,
  isReady: boolean,
  debounceMs: number = TIMINGS.DEBOUNCE_FILE_SYNC_MS
) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousContentsRef = useRef<Record<string, string>>({});

  const syncToContainer = useCallback(async () => {
    if (!instance) return;

    // Find only changed files
    for (const [filename, content] of Object.entries(fileContents)) {
      if (previousContentsRef.current[filename] !== content) {
        // Ensure parent directory exists
        await ensureDirectory(instance.fs, filename);
        await instance.fs.writeFile(filename, content);
      }
    }
    previousContentsRef.current = { ...fileContents };
  }, [instance, fileContents]);

  // Debounced sync effect - syncs file changes to WebContainer after debounce period
  useEffect(() => {
    if (!instance || !isReady) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      syncToContainer();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fileContents, instance, isReady, debounceMs, syncToContainer]);
}
