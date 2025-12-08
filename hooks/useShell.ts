"use client";

import { useState, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { Challenge } from "@/lib/content/challenges";

export function useShell(
  instance: WebContainer | null,
  terminal: Terminal | null
) {
  const [isRunning, setIsRunning] = useState(false);

  // 1. Helper to write to terminal
  const log = useCallback(
    (message: string) => {
      terminal?.writeln(message);
    },
    [terminal]
  );

  // 2. Setup the environment (Mount files + Install)
  const setupChallenge = useCallback(
    async (challenge: Challenge) => {
      if (!instance || !terminal) return;

      log("\x1b[33m[System] Setting up environment...\x1b[0m");

      // Mount files
      await instance.mount(challenge.files);

      // Check if node_modules exists (Skip install if already done)
      // Note: In a real app, you might want to force install if package.json changes.
      // For MVP, we assume dependencies are static.

      log(
        "\x1b[33m[System] Installing dependencies (this takes a moment)... \x1b[0m"
      );

      const installProcess = await instance.spawn("npm", ["install"]);

      // Pipe install output to terminal so user sees progress
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data);
          },
        })
      );

      const exitCode = await installProcess.exit;

      if (exitCode !== 0) {
        log("\r\n\x1b[31m[Error] Installation failed.\x1b[0m");
      } else {
        log("\r\n\x1b[32m[System] Ready to code.\x1b[0m");
      }
    },
    [instance, terminal, log]
  );

  // 3. Run the Tests
  const runTests = useCallback(
    async (code: string) => {
      if (!instance || !terminal) return;

      setIsRunning(true);
      log("\r\n\x1b[34m[Test] Running validation...\x1b[0m\r\n");

      // A. Update the user's code in the virtual file
      await instance.fs.writeFile("index.js", code);

      // B. Spawn the test runner
      // We use 'npx vitest run' to run once (not watch mode)
      const testProcess = await instance.spawn("npx", ["vitest", "run"]);

      // C. Pipe output
      testProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data);
          },
        })
      );

      await testProcess.exit;
      setIsRunning(false);
    },
    [instance, terminal, log]
  );

  return { setupChallenge, runTests, isRunning };
}
