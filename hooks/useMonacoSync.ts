"use client";

import { useEffect } from "react";
import { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export function useMonacoSync(
  monaco: Monaco | null,
  fileContents: Record<string, string>
) {
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
      }
      // Do NOT call setValue on existing models - the Editor manages its own content
    });

    // 2. Cleanup: Delete models for files that were removed
    const models = monaco.editor.getModels();
    const fileKeys = new Set(Object.keys(fileContents));

    models.forEach((model: editor.ITextModel) => {
      // Extract just the path portion for comparison
      // uri.path gives us "/index.js" or "index.js" depending on format
      let modelPath = model.uri.path;
      // Remove leading slash if present
      if (modelPath.startsWith("/")) {
        modelPath = modelPath.slice(1);
      }

      // Filter out internal Monaco models
      const isInternalModel =
        modelPath.includes("node_modules") ||
        model.uri.scheme === "inmemory" ||
        model.uri.toString().startsWith("ts:") ||
        model.uri.toString().includes("typescript");

      if (!isInternalModel && !fileKeys.has(modelPath)) {
        model.dispose();
      }
    });
  }, [monaco, fileContents]);
}
