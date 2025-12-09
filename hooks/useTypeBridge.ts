"use client";

import { useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

// Vitest global types declaration for `expect`, `describe`, `it`, etc.
const VITEST_GLOBALS_DTS = `
declare global {
  const expect: typeof import('vitest')['expect'];
  const describe: typeof import('vitest')['describe'];
  const it: typeof import('vitest')['it'];
  const test: typeof import('vitest')['test'];
  const vi: typeof import('vitest')['vi'];
  const beforeEach: typeof import('vitest')['beforeEach'];
  const afterEach: typeof import('vitest')['afterEach'];
  const beforeAll: typeof import('vitest')['beforeAll'];
  const afterAll: typeof import('vitest')['afterAll'];
}
export {};
`;

export function useTypeBridge() {
  /**
   * Helper to add types to BOTH typescript and javascript defaults
   */
  const addExtraLib = useCallback(
    (monaco: Monaco, content: string, filePath: string) => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        content,
        filePath
      );
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        content,
        filePath
      );
    },
    []
  );

  const loadTypesFromContainer = useCallback(
    async (
      instance: WebContainer,
      monaco: Monaco,
      packageName: string, // e.g., "vitest"
      maxDepth: number = 5 // Prevent infinite recursion
    ) => {
      try {
        const packagePath = `node_modules/${packageName}`;

        // 1. Read package.json to find the real types entry point
        let typesEntry = "index.d.ts"; // Default fallback
        try {
          const pkgJsonStr = await instance.fs.readFile(
            `${packagePath}/package.json`,
            "utf-8"
          );
          const pkgJson = JSON.parse(pkgJsonStr);
          if (pkgJson.types) typesEntry = pkgJson.types;
          else if (pkgJson.typings) typesEntry = pkgJson.typings;
        } catch {
          // No package.json found, use default
        }

        // Normalize the types entry path
        const normalizedTypesEntry = typesEntry.replace(/^\.[\/]/, "");

        // 2. Recursively load all .d.ts files in the package
        const processDir = async (dirPath: string, depth: number) => {
          if (depth > maxDepth) return;

          let entries;
          try {
            entries = await instance.fs.readdir(dirPath, {
              withFileTypes: true,
            });
          } catch {
            return;
          }

          for (const entry of entries) {
            const fullPath = `${dirPath}/${entry.name}`;

            if (entry.isDirectory()) {
              // Skip nested node_modules and common non-type directories
              if (
                entry.name === "node_modules" ||
                entry.name === "__tests__" ||
                entry.name === "test"
              ) {
                continue;
              }
              await processDir(fullPath, depth + 1);
            } else if (entry.isFile() && entry.name.endsWith(".d.ts")) {
              const content = await instance.fs.readFile(fullPath, "utf-8");

              // Register at the actual file path
              addExtraLib(monaco, content, `file:///${fullPath}`);

              // If this is the main entry point, check if it needs a module declaration
              if (fullPath.endsWith(normalizedTypesEntry)) {
                console.log(
                  `[TypeBridge] Found entry point for ${packageName}: ${fullPath}`
                );
              }
            }
          }
        };

        await processDir(packagePath, 0);
        console.log(
          `[TypeBridge] Linked ${packageName} (Entry: ${typesEntry})`
        );
      } catch (e) {
        console.error(`[TypeBridge] Failed ${packageName}`, e);
      }
    },
    [addExtraLib]
  );

  const injectIntelliSense = useCallback(
    async (instance: WebContainer, monaco: Monaco) => {
      console.log("[TypeBridge] Starting injection...");

      const compilerOptions = {
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        typeRoots: ["node_modules/@types"],
        strict: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
      };

      // Apply compiler options to BOTH typescript and javascript defaults
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        compilerOptions
      );
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        ...compilerOptions,
        allowJs: true,
        checkJs: true,
      });

      // Enable eager model sync for better type resolution
      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

      // Load Vitest and its dependencies (order matters for type resolution)
      // First load the core dependencies that vitest relies on
      await Promise.all([
        loadTypesFromContainer(instance, monaco, "@vitest/spy"),
        loadTypesFromContainer(instance, monaco, "@vitest/utils"),
        loadTypesFromContainer(instance, monaco, "chai"),
      ]);

      // Then load vitest expect and runner
      await Promise.all([
        loadTypesFromContainer(instance, monaco, "@vitest/expect"),
        loadTypesFromContainer(instance, monaco, "@vitest/runner"),
      ]);

      // Finally load the main vitest package
      await loadTypesFromContainer(instance, monaco, "vitest");

      // Load other dependencies in parallel
      await Promise.all([
        loadTypesFromContainer(instance, monaco, "react"),
        loadTypesFromContainer(instance, monaco, "@types/react"),
        loadTypesFromContainer(instance, monaco, "@types/node"),
        loadTypesFromContainer(instance, monaco, "@testing-library/react"),
      ]);

      // Inject Vitest globals so `expect`, `describe`, etc. work without imports
      addExtraLib(
        monaco,
        VITEST_GLOBALS_DTS,
        "file:///node_modules/@types/vitest-globals/index.d.ts"
      );

      // Force models to re-evaluate types
      monaco.editor.getModels().forEach((model: editor.ITextModel) => {
        const value = model.getValue();
        model.setValue("");
        model.setValue(value);
      });

      console.log("[TypeBridge] Injection complete.");
    },
    [loadTypesFromContainer, addExtraLib]
  );

  return { injectIntelliSense };
}
