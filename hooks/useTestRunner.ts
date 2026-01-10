"use client";

import { useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { ensureDirectory } from "@/lib/fileUtils";
import { createLogger } from "@/lib/logger";
import { useBattleStore } from "@/lib/store/battleStore";
import { TEST_STATUS } from "@/lib/config/constants";

const logger = createLogger("System");

/**
 * Hook for managing test execution and result reporting
 * Responsibilities:
 * - File synchronization before tests
 * - Vitest process management
 * - Output capture and status tracking
 */
export function useTestRunner(
  instance: WebContainer | null,
  terminal: Terminal | null
) {
  const setStatus = useBattleStore((state) => state.setStatus);
  const setTestOutput = useBattleStore((state) => state.setTestOutput);

  const log = useCallback(
    (message: string) => terminal?.writeln(message),
    [terminal]
  );

  const runTests = useCallback(
    async (fileContents: Record<string, string>) => {
      if (!instance || !terminal) {
        logger.error("Cannot run tests: instance or terminal not available");
        return;
      }

      setStatus(TEST_STATUS.RUNNING);
      setTestOutput(""); // Reset output buffer

      log("\r\n\x1b[34m[Test] Running validation...\x1b[0m\r\n");

      try {
        // 1. Sync file contents from Editor to Container with batched writes
        // Batch directory creation first
        await Promise.all(
          Object.keys(fileContents).map((filename) =>
            ensureDirectory(instance.fs, filename)
          )
        );

        // Then batch file writes
        await Promise.all(
          Object.entries(fileContents).map(([filename, content]) =>
            instance.fs.writeFile(filename, content)
          )
        );

        // 2. Run Tests
        const testProcess = await instance.spawn("./node_modules/.bin/vitest", [
          "run",
        ]);

        let outputBuffer = ""; // Local buffer to capture stream

        testProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal.write(data); // Write to user screen
              outputBuffer += data; // Save to buffer
            },
          })
        );

        const exitCode = await testProcess.exit;

        // Save final buffer to state
        setTestOutput(outputBuffer);

        if (exitCode === 0) {
          setStatus(TEST_STATUS.PASSED);
          log("\r\n\x1b[32m[System] Tests Passed! ✨\x1b[0m");
        } else {
          setStatus(TEST_STATUS.FAILED);
          log("\r\n\x1b[31m[System] Tests Failed.\x1b[0m");
        }
      } catch (error) {
        logger.error("Test execution failed", { error });
        setStatus(TEST_STATUS.FAILED);
        log("\r\n\x1b[31m[System] Test execution error.\x1b[0m");
      }
    },
    [instance, terminal, log, setStatus, setTestOutput]
  );

  return {
    runTests,
  };
}
