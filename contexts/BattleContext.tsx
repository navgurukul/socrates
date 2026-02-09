"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal as XTerminal } from "xterm";
import { Monaco } from "@monaco-editor/react";
import { Challenge } from "@/lib/content/types";
import { type TestStatus } from "@/lib/config/constants";
import { type ReviewData } from "@/lib/store/battleStore";
import { useWebContainer } from "@/hooks/useWebContainer";
import { useShell } from "@/hooks/useShell";
import { useChallengeLoader } from "@/hooks/useChallengeLoader";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useTypeBridge } from "@/hooks/useTypeBridge";
import { useMonacoSync } from "@/hooks/useMonacoSync";
import { useContainerSync } from "@/hooks/useContainerSync";
import { useBattleStore } from "@/lib/store/battleStore";
import { useEditorStore } from "@/lib/store/editorStore";
import { useUserStore } from "@/lib/store/userStore";
import { useDebugTraceStore } from "@/lib/store/debugTraceStore";
import { submitSuccess } from "@/lib/actions/progress";
import { completeDailyBattle } from "@/lib/actions/daily-battles";
import { TABS } from "@/lib/config/constants";

/**
 * Result type for file operations with error handling
 */
export interface FileOperationResult {
  success: boolean;
  error?: {
    message: string;
    canRetry: boolean;
    operation: "create" | "delete" | "rename";
    path: string;
  };
}

/**
 * Battle Context Value - All state and actions needed by battle arena components
 */
export interface BattleContextValue {
  // WebContainer
  instance: WebContainer | null;
  terminal: XTerminal | null;
  containerLoading: boolean;
  containerError: string | null;
  setTerminal: (terminal: XTerminal | null) => void;

  // Challenge
  challenge: Challenge | null;
  challengeLoading: boolean;
  isEnvReady: boolean;

  // Files
  fileContents: Record<string, string>;
  activeFile: string;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;

  // File Operations
  createFile: (path: string) => Promise<FileOperationResult>;
  deleteFile: (path: string, type: "file" | "folder") => Promise<void>;
  renameFile: (
    oldPath: string,
    newPath: string,
    type: "file" | "folder"
  ) => Promise<void>;

  // Battle Actions
  runTests: () => Promise<void>;
  refreshPreview: () => void;

  // Battle State
  status: TestStatus;
  testOutput: string;
  reviewData: ReviewData | null;
  attemptCount: number;
  isRunning: boolean;
  activeBottomTab: string;
  setActiveBottomTab: (tab: string) => void;

  // Preview
  previewUrl: string | null;

  // Monaco
  monacoInstance: Monaco | null;
  setMonacoInstance: (monaco: Monaco) => void;

  // Source
  source?: string;
}

/**
 * Battle Context - provides all battle-related state and actions
 */
export const BattleContext = createContext<BattleContextValue | null>(null);

interface BattleProviderProps {
  children: React.ReactNode;
  challengeId: string;
  source?: string; // "daily" | "daily-archive" | "versus" | undefined
  isVersusMode?: boolean;
  onVersusComplete?: () => void;
}

/**
 * Battle Provider - Centralizes all battle-related state management
 * Eliminates prop drilling by providing context to all child components
 */
export function BattleProvider({
  children,
  challengeId,
  source,
  isVersusMode,
  onVersusComplete,
}: BattleProviderProps) {
  // Local state
  const [term, setTerm] = useState<XTerminal | null>(null);
  const [isEnvReady, setIsEnvReady] = useState(false);

  // Debounce timer for file opened events
  const fileOpenedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastOpenedFileRef = useRef<string>("");

  // Smart throttling for file edit events
  const fileEditStateRef = useRef<
    Record<
      string,
      {
        isIdle: boolean;
        lastLoggedAt: number;
        lastContentLength: number;
      }
    >
  >({});
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Idle detection timer (2 minutes)
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

  // WebContainer
  const {
    instance,
    isLoading: containerLoading,
    error: containerError,
  } = useWebContainer();

  // Challenge loading
  const { challenge, isLoading: challengeLoading } =
    useChallengeLoader(challengeId);

  // Shell operations (challenge setup, tests, preview)
  const {
    setupChallenge,
    runTests: runTestsImpl,
    previewUrl,
    iframeKey,
    refreshPreview,
  } = useShell(instance, term);

  // File system operations
  const {
    createFile: createFileImpl,
    deletePath,
    renamePath,
  } = useFileSystem(instance);

  // Type bridge for IntelliSense
  const { injectIntelliSense } = useTypeBridge();

  // Battle Store - manages execution state
  const status = useBattleStore((state) => state.status);
  const testOutput = useBattleStore((state) => state.testOutput);
  const reviewData = useBattleStore((state) => state.reviewData);
  const attemptCount = useBattleStore((state) => state.attemptCount);
  const activeBottomTab = useBattleStore((state) => state.activeBottomTab);
  const setReviewData = useBattleStore((state) => state.setReviewData);
  const incrementAttempts = useBattleStore((state) => state.incrementAttempts);
  const setActiveBottomTab = useBattleStore(
    (state) => state.setActiveBottomTab
  );
  const resetBattle = useBattleStore((state) => state.resetBattle);

  // Editor Store - manages file state
  const fileContents = useEditorStore((state) => state.fileContents);
  const activeFile = useEditorStore((state) => state.activeFile);
  const monacoInstance = useEditorStore((state) => state.monacoInstance);
  const setFileContents = useEditorStore((state) => state.setFileContents);
  const updateFile = useEditorStore((state) => state.updateFile);
  const setActiveFile = useEditorStore((state) => state.setActiveFile);
  const setMonacoInstance = useEditorStore((state) => state.setMonacoInstance);
  const resetEditor = useEditorStore((state) => state.resetEditor);

  // User Store
  const markSolved = useUserStore((state) => state.markSolved);

  // Debug Trace Store
  const startTrace = useDebugTraceStore((state) => state.startTrace);
  const addEvent = useDebugTraceStore((state) => state.addEvent);
  const completeTrace = useDebugTraceStore((state) => state.completeTrace);
  const resetTrace = useDebugTraceStore((state) => state.resetTrace);
  const trace = useDebugTraceStore((state) => state.trace);

  // Sync Monaco models with file contents
  useMonacoSync(monacoInstance, fileContents);

  // Sync file contents to WebContainer filesystem
  useContainerSync(instance, fileContents, isEnvReady);

  // Reset stores when challengeId changes (battle switch)
  useEffect(() => {
    // Reset Zustand stores to ensure clean slate for new battle
    resetBattle();
    resetEditor();
  }, [challengeId, resetBattle, resetEditor]);

  // Setup Challenge & Signal Readiness
  useEffect(() => {
    if (instance && term && challenge) {
      setIsEnvReady(false);
      // Reset trace and edit state when switching challenges
      resetTrace();
      fileEditStateRef.current = {};
      setupChallenge(challenge).then(() => {
        setIsEnvReady(true);
      });
    }
  }, [instance, term, challenge, setupChallenge, resetTrace]);

  // Trigger IntelliSense Bridge
  useEffect(() => {
    if (isEnvReady && instance && monacoInstance) {
      injectIntelliSense(instance, monacoInstance);
    }
  }, [isEnvReady, instance, monacoInstance, injectIntelliSense]);

  // Start debug trace when challenge loads and environment is ready
  useEffect(() => {
    if (challenge?.id && isEnvReady) {
      startTrace(challenge.id);
    }
  }, [challenge?.id, isEnvReady, startTrace]);

  // Initialize file contents when challenge loads
  useEffect(() => {
    if (!challenge || challengeLoading) return;

    const initialFiles: Record<string, string> = {};
    Object.entries(challenge.files).forEach(([name, data]) => {
      initialFiles[name] = data.file.contents;
    });
    setFileContents(initialFiles);

    const firstFile =
      Object.keys(initialFiles).find((f) => f.endsWith(".js")) ||
      Object.keys(initialFiles)[0];
    setActiveFile(firstFile);
  }, [challenge, challengeLoading, setFileContents, setActiveFile]);

  // Track if we've already handled this "passed" session to avoid duplicate review fetches
  const hasHandledPassRef = useRef(false);

  // Reset the flag when status changes away from "passed"
  useEffect(() => {
    if (status !== "passed") {
      hasHandledPassRef.current = false;
    }
  }, [status]);

  // Save progress and fetch review when user wins (only once per pass)
  useEffect(() => {
    if (status === "passed" && !hasHandledPassRef.current) {
      hasHandledPassRef.current = true;

      // 🎮 Versus Mode: Just call the callback and skip standard flow
      if (isVersusMode) {
        onVersusComplete?.();
        return;
      }

      // Complete debug trace
      completeTrace();

      markSolved(challengeId);
      setActiveBottomTab(TABS.TUTOR);

      // Fetch code review for AITutor (capture fileContents at time of pass)
      const passedCode = fileContents;
      fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: passedCode, challengeId }),
      })
        .then((res) => res.json())
        .then((data) => setReviewData(data))
        .catch((err) => console.error("Review fetch failed:", err));

      // Save to Cloud (fire-and-forget) with code that passed
      submitSuccess(challengeId, passedCode, attemptCount).then((res) => {
        if (res.error) console.error("Cloud save failed:", res.error);
      });

      // 🔥 Daily Battle: Mark completion and update streak
      if (source === "daily") {
        const timezoneOffset = new Date().getTimezoneOffset();
        completeDailyBattle(challengeId, timezoneOffset)
          .then((result) => {
            if (result.success && result.streak) {
              console.log(
                `[Daily Battle] Streak updated: ${result.streak.currentStreak} days (max: ${result.streak.maxStreak})`
              );
            } else if (result.error) {
              console.error("[Daily Battle] Completion failed:", result.error);
            }
          })
          .catch((err) =>
            console.error("[Daily Battle] Completion error:", err)
          );
      }

      // 🧠 Memory Loop: Generate learning insight from debug trace (fire-and-forget)
      if (trace) {
        fetch("/api/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            trace,
            attemptCount,
            code: passedCode,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.warning) {
              console.warn(
                "[Memory Loop] Insight creation warning:",
                data.warning
              );
            } else {
              console.log("[Memory Loop] Insight created:", data.insightId);
            }
          })
          .catch((err) =>
            console.error("[Memory Loop] Insight creation failed:", err)
          );
      }
    }
  }, [
    status,
    challengeId,
    source,
    isVersusMode,
    onVersusComplete,
    markSolved,
    fileContents,
    attemptCount,
    setReviewData,
    setActiveBottomTab,
    completeTrace,
    trace,
  ]);

  // Track test failures in debug trace
  useEffect(() => {
    if (status === "failed") {
      addEvent({
        type: "test_failed",
        timestamp: Date.now(),
        metadata: { testCount: attemptCount },
      });
    }
  }, [status, attemptCount, addEvent]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (fileOpenedTimerRef.current) {
        clearTimeout(fileOpenedTimerRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, []);

  // Reset activity timer helper
  const resetActivityTimer = useCallback(() => {
    // Clear existing timer
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }

    // Start new idle detection timer
    activityTimerRef.current = setTimeout(() => {
      addEvent({
        type: "idle_detected",
        timestamp: Date.now(),
      });
    }, IDLE_TIMEOUT_MS);
  }, [addEvent, IDLE_TIMEOUT_MS]);

  // Start idle detection when environment is ready
  useEffect(() => {
    if (isEnvReady) {
      resetActivityTimer();
    }
  }, [isEnvReady, resetActivityTimer]);

  // Wrapped actions
  const updateFileContent = useCallback(
    (path: string, content: string) => {
      const oldContent = fileContents[path] || "";
      updateFile(path, content);

      // Reset idle detection timer on activity
      resetActivityTimer();

      // Smart throttling for file_edited events
      const THROTTLE_INTERVAL = 30000; // 30 seconds
      const IDLE_TIMEOUT = 5000; // 5 seconds of no typing = idle
      const now = Date.now();

      // Initialize state for this file if needed
      if (!fileEditStateRef.current[path]) {
        fileEditStateRef.current[path] = {
          isIdle: true,
          lastLoggedAt: 0,
          lastContentLength: oldContent.length,
        };
      }

      const state = fileEditStateRef.current[path];
      const timeSinceLastLog = now - state.lastLoggedAt;
      const shouldLog =
        state.isIdle || // First edit after idle
        timeSinceLastLog >= THROTTLE_INTERVAL; // Or every 30 seconds

      if (shouldLog) {
        addEvent({
          type: "file_edited",
          timestamp: now,
          metadata: {
            path,
            deltaSize: Math.abs(content.length - state.lastContentLength),
          },
        });

        // Update state
        fileEditStateRef.current[path] = {
          isIdle: false,
          lastLoggedAt: now,
          lastContentLength: content.length,
        };
      }

      // Reset idle timer - mark as idle after 5 seconds of no typing
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        // Mark all files as idle
        Object.keys(fileEditStateRef.current).forEach((filePath) => {
          fileEditStateRef.current[filePath].isIdle = true;
        });
      }, IDLE_TIMEOUT);
    },
    [fileContents, updateFile, addEvent, resetActivityTimer]
  );

  const createFile = useCallback(
    async (path: string): Promise<FileOperationResult> => {
      return await createFileImpl(path);
    },
    [createFileImpl]
  );

  const deleteFile = useCallback(
    async (path: string, type: "file" | "folder") => {
      await deletePath(path, type);
    },
    [deletePath]
  );

  const renameFile = useCallback(
    async (oldPath: string, newPath: string, type: "file" | "folder") => {
      await renamePath(oldPath, newPath, type);
    },
    [renamePath]
  );

  const runTests = useCallback(async () => {
    incrementAttempts();

    // Clear previous review data on new test run
    setReviewData(null);

    // Reset idle detection timer on activity
    resetActivityTimer();

    // Track test run
    addEvent({
      type: "test_run",
      timestamp: Date.now(),
    });
    await runTestsImpl(fileContents);
  }, [
    runTestsImpl,
    fileContents,
    incrementAttempts,
    addEvent,
    resetActivityTimer,
    setReviewData,
  ]);

  const isRunning = status === "running";

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<BattleContextValue>(
    () => ({
      // WebContainer
      instance,
      terminal: term,
      containerLoading,
      containerError,
      setTerminal: setTerm,

      // Challenge
      challenge,
      challengeLoading,
      isEnvReady,

      // Files
      fileContents,
      activeFile,
      setActiveFile: (path: string) => {
        setActiveFile(path);

        // Reset idle detection timer on activity
        resetActivityTimer();

        // Debounce file_opened events (300ms)
        if (fileOpenedTimerRef.current) {
          clearTimeout(fileOpenedTimerRef.current);
        }

        // Only track if it's a different file
        if (lastOpenedFileRef.current !== path) {
          fileOpenedTimerRef.current = setTimeout(() => {
            addEvent({
              type: "file_opened",
              timestamp: Date.now(),
              metadata: { path },
            });
            lastOpenedFileRef.current = path;
          }, 300);
        }
      },
      updateFileContent,

      // File Operations
      createFile,
      deleteFile,
      renameFile,

      // Battle Actions
      runTests,
      refreshPreview,

      // Battle State
      status,
      testOutput,
      reviewData,
      attemptCount,
      isRunning,
      activeBottomTab,
      setActiveBottomTab,

      // Preview
      previewUrl,

      // Monaco
      monacoInstance,
      setMonacoInstance,

      // Source
      source,
    }),
    [
      instance,
      term,
      containerLoading,
      containerError,
      challenge,
      challengeLoading,
      isEnvReady,
      fileContents,
      activeFile,
      setActiveFile,
      updateFileContent,
      createFile,
      deleteFile,
      renameFile,
      runTests,
      refreshPreview,
      status,
      testOutput,
      reviewData,
      attemptCount,
      isRunning,
      activeBottomTab,
      setActiveBottomTab,
      previewUrl,
      monacoInstance,
      setMonacoInstance,
      addEvent,
      resetActivityTimer,
      source,
    ]
  );

  return (
    <BattleContext.Provider value={value}>{children}</BattleContext.Provider>
  );
}
