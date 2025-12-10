"use client";

import { useState, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { Challenge } from "@/lib/content/types";

export type TestStatus = "idle" | "running" | "passed" | "failed";

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
 * Ensures parent directories exist before writing a file
 */
async function ensureDir(
  instance: WebContainer,
  filePath: string
): Promise<void> {
  const parts = filePath.split("/");
  if (parts.length <= 1) return; // No directory needed

  const dirPath = parts.slice(0, -1).join("/");
  try {
    await instance.fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

export function useShell(
  instance: WebContainer | null,
  terminal: Terminal | null
) {
  const [status, setStatus] = useState<TestStatus>("idle");
  // ✅ NEW: Store the full terminal log for the AI to read
  const [testOutput, setTestOutput] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // ✅ NEW State

  const log = useCallback(
    (message: string) => terminal?.writeln(message),
    [terminal]
  );

  // ✅ NEW: Function to start the dev server
  const startDevServer = useCallback(async () => {
    if (!instance || !terminal) return;

    // 1. Set up the listener BEFORE spawning
    instance.on("server-ready", (port, url) => {
      console.log(`[System] Server ready on port ${port}: ${url}`);
      setPreviewUrl(url); // Save the internal URL
    });

    // 2. Spawn the process
    // We use npm run dev so we can run the dev server
    // Note: This process runs indefinitely.
    const process = await instance.spawn("npm", ["run", "dev"]);

    process.output.pipeTo(
      new WritableStream({
        write(data) {
          // Optional: Pipe dev server logs to terminal
          // terminal.write(data);
        },
      })
    );
  }, [instance, terminal]);

  const setupChallenge = useCallback(
    async (challenge: Challenge) => {
      if (!instance || !terminal) return;
      setStatus("idle");
      setTestOutput(""); // Reset test output
      setPreviewUrl(null); // Reset preview URL

      // Clear terminal for fresh start
      terminal.clear();

      // 1. Mount files first (build nested tree structure)
      log("\x1b[33m[System] Mounting file system...\x1b[0m");
      const flatFiles: Record<string, { file: { contents: string } }> = {};
      Object.entries(challenge.files).forEach(([name, data]) => {
        flatFiles[name] = { file: { contents: data.file.contents } };
      });
      const mountTree = buildMountTree(flatFiles);
      await instance.mount(mountTree);

      // 2. Smart Install: Check if dependencies already exist
      let needsInstall = true;
      try {
        const dirs = await instance.fs.readdir("node_modules");
        if (dirs.length > 0) {
          needsInstall = false;
        }
      } catch (error) {
        needsInstall = true;
      }

      if (needsInstall) {
        log(
          "\x1b[33m[System] Installing dependencies (this happens once)...\x1b[0m"
        );
        const installProcess = await instance.spawn("npm", ["install"]);
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
          return;
        }
      } else {
        log("\x1b[32m[System] Environment cached. Skipping install.\x1b[0m");
      }

      log("\r\n\x1b[32m[System] Ready to code.\x1b[0m");

      // ✅ Auto-start server if it's a web challenge
      // Check if challenge has vite config or dev script (indicates a preview-able app)
      const hasViteConfig =
        "vite.config.js" in challenge.files ||
        "vite.config.ts" in challenge.files;
      const packageJson = challenge.files["package.json"]?.file?.contents || "";
      const hasDevScript = packageJson.includes('"dev"');

      if (hasViteConfig || hasDevScript) {
        log("\x1b[35m[System] Starting Preview Server...\x1b[0m");
        startDevServer();
      }
    },
    [instance, terminal, log, startDevServer]
  );

  const runTests = useCallback(
    async (fileContents: Record<string, string>) => {
      if (!instance || !terminal) return;
      setStatus("running");
      setTestOutput(""); // ✅ Reset output buffer

      log("\r\n\x1b[34m[Test] Running validation...\x1b[0m\r\n");

      // 1. Sync file contents from Editor to Container
      for (const [filename, content] of Object.entries(fileContents)) {
        await ensureDir(instance, filename);
        await instance.fs.writeFile(filename, content);
      }

      // 2. Run Tests
      const testProcess = await instance.spawn("./node_modules/.bin/vitest", [
        "run",
      ]);

      let outputBuffer = ""; // ✅ Local buffer to capture stream

      testProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data); // Write to user screen
            outputBuffer += data; // ✅ Save to buffer
          },
        })
      );

      const exitCode = await testProcess.exit;

      // ✅ Save final buffer to state
      setTestOutput(outputBuffer);

      if (exitCode === 0) {
        setStatus("passed");
        log("\r\n\x1b[32m[System] Tests Passed! \u2728\x1b[0m");
      } else {
        setStatus("failed");
        log("\r\n\x1b[31m[System] Tests Failed.\x1b[0m");
      }
    },
    [instance, terminal, log]
  );

  // ✅ Return the new testOutput state
  return { setupChallenge, runTests, status, testOutput, previewUrl };
}
