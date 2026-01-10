"use client";

import { useEffect, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { ensureDirectory } from "@/lib/fileUtils";
import { TIMINGS } from "@/lib/config/constants";

/**
 * Hook to sync file contents to WebContainer filesystem with adaptive debouncing
 * Implements a hybrid strategy:
 * - Leading edge: Immediate sync on first change after idle period
 * - Short debounce: 150ms for small changes (<100 chars)
 * - Long debounce: 500ms for large changes or rapid typing
 */
export function useContainerSync(
  instance: WebContainer | null,
  fileContents: Record<string, string>,
  isReady: boolean,
  debounceMs: number = TIMINGS.DEBOUNCE_FILE_SYNC_MS // Fallback if adaptive disabled
) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousContentsRef = useRef<Record<string, string>>({});
  const lastSyncTimeRef = useRef<number>(0);
  const lastChangeTimeRef = useRef<number>(0);
  const syncInProgressRef = useRef<boolean>(false); // Guard against concurrent syncs

  const syncToContainer = useCallback(async () => {
    if (!instance) return;

    // Guard: Prevent concurrent sync operations
    if (syncInProgressRef.current) {
      return;
    }

    syncInProgressRef.current = true;

    try {
      // Find only changed files
      for (const [filename, content] of Object.entries(fileContents)) {
        if (previousContentsRef.current[filename] !== content) {
          // Ensure parent directory exists
          await ensureDirectory(instance.fs, filename);
          await instance.fs.writeFile(filename, content);
        }
      }
      previousContentsRef.current = { ...fileContents };
      lastSyncTimeRef.current = Date.now();
    } finally {
      // Always clear the in-progress flag
      syncInProgressRef.current = false;
    }
  }, [instance, fileContents]);

  // Calculate content delta size for adaptive debouncing
  const calculateDeltaSize = useCallback(() => {
    let deltaSize = 0;
    for (const [filename, content] of Object.entries(fileContents)) {
      const prevContent = previousContentsRef.current[filename] || "";
      deltaSize += Math.abs(content.length - prevContent.length);
    }
    return deltaSize;
  }, [fileContents]);

  // Adaptive debounced sync effect
  useEffect(() => {
    if (!instance || !isReady) return;

    const now = Date.now();
    lastChangeTimeRef.current = now;

    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Adaptive debounce strategy
    if (TIMINGS.SYNC_ENABLE_LEADING_EDGE) {
      const timeSinceLastSync = now - lastSyncTimeRef.current;
      const isFirstChangeAfterIdle = timeSinceLastSync > TIMINGS.SYNC_IDLE_THRESHOLD_MS;

      // Leading edge: Sync immediately on first change after idle period
      if (isFirstChangeAfterIdle) {
        syncToContainer();
        return;
      }

      // Adaptive trailing debounce based on change size
      const deltaSize = calculateDeltaSize();
      const isSmallChange = deltaSize < TIMINGS.SYNC_SMALL_CHANGE_CHARS;
      const adaptiveDebounce = isSmallChange 
        ? TIMINGS.SYNC_SHORT_DEBOUNCE_MS 
        : TIMINGS.SYNC_LONG_DEBOUNCE_MS;

      debounceTimerRef.current = setTimeout(() => {
        syncToContainer();
      }, adaptiveDebounce);
    } else {
      // Fallback to fixed debounce if adaptive is disabled
      debounceTimerRef.current = setTimeout(() => {
        syncToContainer();
      }, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fileContents, instance, isReady, debounceMs, syncToContainer, calculateDeltaSize]);
}
