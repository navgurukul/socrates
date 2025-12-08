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

  // ... (keep log and setupChallenge as they were)
  const log = useCallback(
    (message: string) => {
      terminal?.writeln(message);
    },
    [terminal]
  );

  const setupChallenge = useCallback(
    async (challenge: Challenge) => {
      // ... (same as before)
      if (!instance || !terminal) return;

      // Reset status on new challenge load
      setStatus("idle");

      log("\x1b[33m[System] Setting up environment...\x1b[0m");
      await instance.mount(challenge.files);

      // ... (rest of the install logic)
      // Assuming install logic is here...

      // Quick fix for the previous code snippet:
      // Make sure we actually install packages if you didn't keep that part
      const installProcess = await instance.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(d) {
            terminal.write(d);
          },
        })
      );
      await installProcess.exit;

      log("\r\n\x1b[32m[System] Ready to code.\x1b[0m");
    },
    [instance, terminal, log]
  );

  const runTests = useCallback(
    async (fileContents: Record<string, string>) => {
      if (!instance || !terminal) return;

      setStatus("running");
      log("\r\n\x1b[34m[Test] Running validation...\x1b[0m\r\n");

      // 1. Write ALL files to the container
      // This ensures changes in utils.js or other files are captured
      for (const [filename, content] of Object.entries(fileContents)) {
        await instance.fs.writeFile(filename, content);
      }

      // 2. Run Tests (Same as before)
      const testProcess = await instance.spawn("npx", ["vitest", "run"]);

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
        log("\r\n\x1b[32m[System] Tests Passed! Great job.\x1b[0m");
      } else {
        setStatus("failed");
        log("\r\n\x1b[31m[System] Tests Failed. Try again.\x1b[0m");
      }
    },
    [instance, terminal, log]
  );

  return { setupChallenge, runTests, status }; // Return status instead of isRunning
}
