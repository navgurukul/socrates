"use client";

import { useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { Challenge } from "@/lib/content/types";
import { createLogger } from "@/lib/logger";
import { CONTAINER } from "@/lib/config/constants";

const logger = createLogger("System");

type FileSystemTree = {
  [name: string]:
    | { file: { contents: string } }
    | { directory: FileSystemTree };
};

/**
 * Converts flat file paths to nested WebContainer directory structure
 * e.g., { "src/index.js": {...} } -> { src: { directory: { "index.js": {...} } } }
 */
function buildMountTree(
  files: Record<string, { file: { contents: string } }>
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [path, fileData] of Object.entries(files)) {
    const parts = path.split("/");
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current[part] = { file: { contents: fileData.file.contents } };
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = (current[part] as { directory: FileSystemTree }).directory;
      }
    }
  }

  return tree;
}

/**
 * Hook for managing challenge setup and file system preparation
 * Responsibilities:
 * - Challenge file mounting and cleanup
 * - Dependency installation
 * - Environment preparation
 */
export function useChallengeSetup(
  instance: WebContainer | null,
  terminal: Terminal | null
) {
  // Track current challenge ID to prevent redundant setup in Strict Mode
  const currentChallengeRef = useRef<string | null>(null);
  const shouldStartServerRef = useRef<boolean>(false);

  const log = useCallback(
    (message: string) => terminal?.writeln(message),
    [terminal]
  );

  const cleanupChallenge = useCallback(async () => {
    if (!instance) return;

    try {
      // Remove src/ directory to clear old challenge files
      await instance.fs.rm("src", { recursive: true, force: true });
      logger.debug("Challenge files cleaned up");
    } catch (error) {
      // Expected: directory may not exist
      logger.debug("No existing src directory to remove", { error });
    }
  }, [instance]);

  const setupChallenge = useCallback(
    async (challenge: Challenge): Promise<boolean> => {
      if (!instance || !terminal) {
        logger.error("Cannot setup challenge: instance or terminal not available");
        return false;
      }

      // Idempotency guard: Skip if same challenge already set up
      if (currentChallengeRef.current === challenge.id) {
        logger.debug("Challenge already set up, skipping redundant setup");
        return shouldStartServerRef.current;
      }

      // Update current challenge ID
      currentChallengeRef.current = challenge.id;

      // Clear terminal for fresh start
      terminal.clear();

      // 1. Clean up old challenge files before mounting new ones
      log("\x1b[33m[System] Mounting file system...\x1b[0m");
      await cleanupChallenge();

      // 2. Mount new challenge files
      const flatFiles: Record<string, { file: { contents: string } }> = {};
      Object.entries(challenge.files).forEach(([name, data]) => {
        flatFiles[name] = { file: { contents: data.file.contents } };
      });
      const mountTree = buildMountTree(flatFiles);
      await instance.mount(mountTree);

      // 3. Check if dependencies need to be installed
      let needsInstall = true;
      try {
        const dirs = await instance.fs.readdir("node_modules");
        if (dirs.length > CONTAINER.NODE_MODULES_MIN_DIRS) {
          needsInstall = false;
        }
      } catch {
        needsInstall = true;
      }

      if (needsInstall) {
        log("\x1b[33m[System] Installing dependencies...\x1b[0m");

        const installProcess = await instance.spawn(
          "npm",
          CONTAINER.NPM_INSTALL_FLAGS as unknown as string[]
        );

        installProcess.output.pipeTo(
          new WritableStream({
            write(d) {
              terminal.write(d);
            },
          })
        );
        const exitCode = await installProcess.exit;

        if (exitCode !== 0) {
          log("\r\n\x1b[31m[System] Dependency installation failed.\x1b[0m");
          return false;
        }
      } else {
        log("\x1b[32m[System] Environment cached. Skipping install.\x1b[0m");
      }

      log("\r\n\x1b[32m[System] Ready to code.\x1b[0m");

      // Check if challenge has dev script (indicates a preview-able app)
      const hasViteConfig =
        "vite.config.js" in challenge.files ||
        "vite.config.ts" in challenge.files;
      const packageJson = challenge.files["package.json"]?.file?.contents || "";
      const hasDevScript = packageJson.includes('"dev"');

      // Return true if dev server should be started, and cache it
      shouldStartServerRef.current = hasViteConfig || hasDevScript;
      return shouldStartServerRef.current;
    },
    [instance, terminal, log, cleanupChallenge]
  );

  return {
    setupChallenge,
    cleanupChallenge,
  };
}
