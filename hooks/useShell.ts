"use client";

import { useState, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { Challenge } from "@/lib/content/challenges";

export type TestStatus = "idle" | "running" | "passed" | "failed";

export function useShell(
  instance: WebContainer | null,
  terminal: Terminal | null
) {
  const [status, setStatus] = useState<TestStatus>("idle");

  const log = useCallback(
    (message: string) => terminal?.writeln(message),
    [terminal]
  );

  const setupChallenge = useCallback(
    async (challenge: Challenge) => {
      if (!instance || !terminal) return;
      setStatus("idle");

      // 1. Mount files first
      log("\x1b[33m[System] Mounting file system...\x1b[0m");
      const mountPoint: Record<string, { file: { contents: string } }> = {};
      Object.entries(challenge.files).forEach(([name, data]) => {
        mountPoint[name] = { file: { contents: data.file.contents } };
      });
      await instance.mount(mountPoint);

      // 2. Smart Install: Check if dependencies already exist
      let needsInstall = true;
      try {
        // If reading node_modules throws or returns empty, we need to install
        const dirs = await instance.fs.readdir("node_modules");
        if (dirs.length > 0) {
          needsInstall = false;
        }
      } catch (error) {
        // node_modules likely doesn't exist
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
    },
    [instance, terminal, log]
  );

  const runTests = useCallback(
    async (fileContents: Record<string, string>) => {
      if (!instance || !terminal) return;
      setStatus("running");
      log("\r\n\x1b[34m[Test] Running validation...\x1b[0m\r\n");

      // 1. Sync file contents from Editor to Container
      for (const [filename, content] of Object.entries(fileContents)) {
        await instance.fs.writeFile(filename, content);
      }

      // 2. Run Tests: Use direct binary path to avoid 'npx' overhead
      // 'vitest' is usually inside .bin. We use the relative path.
      const testProcess = await instance.spawn("./node_modules/.bin/vitest", [
        "run",
      ]);

      testProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data);
          },
        })
      );
      const exitCode = await testProcess.exit;

      if (exitCode === 0) {
        setStatus("passed");
        log("\r\n\x1b[32m[System] Tests Passed! \u2728\x1b[0m"); // Added sparkle emoji
      } else {
        setStatus("failed");
        log("\r\n\x1b[31m[System] Tests Failed.\x1b[0m");
      }
    },
    [instance, terminal, log]
  );

  return { setupChallenge, runTests, status };
}
