"use client";

import { useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { Challenge } from "@/lib/content/types";
import { useBattleStore } from "@/lib/store/battleStore";
import { TEST_STATUS } from "@/lib/config/constants";
import { useChallengeSetup } from "./useChallengeSetup";
import { useTestRunner } from "./useTestRunner";
import { useDevServer } from "./useDevServer";

/**
 * Facade hook that orchestrates challenge setup, test execution, and dev server management.
 * Delegates to specialized hooks for single-responsibility concerns.
 * 
 * @deprecated This hook will be removed in a future version. Use the specialized hooks directly:
 * - useChallengeSetup for challenge initialization
 * - useTestRunner for test execution
 * - useDevServer for preview server management
 */
export function useShell(
  instance: WebContainer | null,
  terminal: Terminal | null
) {
  const setStatus = useBattleStore((state) => state.setStatus);
  
  // Delegate to specialized hooks
  const { setupChallenge: setupChallengeImpl } = useChallengeSetup(instance, terminal);
  const { runTests: runTestsImpl } = useTestRunner(instance, terminal);
  const { 
    startServer, 
    previewUrl, 
    iframeKey, 
    refreshPreview 
  } = useDevServer(instance, terminal);

  const setupChallenge = useCallback(
    async (challenge: Challenge) => {
      setStatus(TEST_STATUS.IDLE);
      
      // Delegate to useChallengeSetup
      const shouldStartServer = await setupChallengeImpl(challenge);
      
      // Auto-start server if it's a web challenge
      if (shouldStartServer) {
        startServer();
      }
    },
    [setupChallengeImpl, startServer, setStatus]
  );

  const runTests = useCallback(
    async (fileContents: Record<string, string>) => {
      // Delegate to useTestRunner
      await runTestsImpl(fileContents);
    },
    [runTestsImpl]
  );

  return {
    setupChallenge,
    runTests,
    previewUrl,
    iframeKey,
    refreshPreview,
  };
}
