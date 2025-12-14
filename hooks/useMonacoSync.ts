"use client";

import { useEffect, useRef } from "react";
import { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

/**
 * Hook to sync file contents to Monaco editor models
 * Maintains a local cache of created model paths to optimize cleanup
 * and avoid scanning all Monaco internal models on every sync
 */
export function useMonacoSync(
  monaco: Monaco | null,
  fileContents: Record<string, string>
) {
  // Cache of user-created model paths for efficient cleanup
  const createdModelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!monaco) return;

    // 1. Create models for files that don't have one yet (for IntelliSense across files)
    // DO NOT update existing models - the Editor component manages its own model content
    Object.entries(fileContents).forEach(([path, content]) => {
      const uri = monaco.Uri.parse(path);
      const existingModel = monaco.editor.getModel(uri);

      if (!existingModel) {
        // Only create if it doesn't exist - this enables IntelliSense for unopened files
        monaco.editor.createModel(
          content,
          undefined, // Let Monaco detect language
          uri
        );
        // Add to cache for efficient tracking
        createdModelsRef.current.add(path);
      }
      // Do NOT call setValue on existing models - the Editor manages its own content
    });

    // 2. Cleanup: Delete models for files that were removed
    // Only iterate over our cached user models instead of all Monaco models
    const fileKeys = new Set(Object.keys(fileContents));
    const modelsToRemove: string[] = [];

    createdModelsRef.current.forEach((modelPath) => {
      if (!fileKeys.has(modelPath)) {
        modelsToRemove.push(modelPath);
      }
    });

    // Dispose removed models and clean up cache
    modelsToRemove.forEach((modelPath) => {
      const uri = monaco.Uri.parse(modelPath);
      const model = monaco.editor.getModel(uri);
      if (model) {
        model.dispose();
      }
      createdModelsRef.current.delete(modelPath);
    });
  }, [monaco, fileContents]);
}
