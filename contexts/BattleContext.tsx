"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
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
import { submitSuccess } from "@/lib/actions/progress";
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
}

/**
 * Battle Context - provides all battle-related state and actions
 */
export const BattleContext = createContext<BattleContextValue | null>(null);

interface BattleProviderProps {
  children: React.ReactNode;
  challengeId: string;
}

/**
 * Battle Provider - Centralizes all battle-related state management
 * Eliminates prop drilling by providing context to all child components
 */
export function BattleProvider({ children, challengeId }: BattleProviderProps) {
  // Local state
  const [term, setTerm] = useState<XTerminal | null>(null);
  const [isEnvReady, setIsEnvReady] = useState(false);

  // WebContainer
  const { instance, isLoading: containerLoading, error: containerError } = useWebContainer();

  // Challenge loading
  const { challenge, isLoading: challengeLoading } = useChallengeLoader(challengeId);

  // Shell operations (challenge setup, tests, preview)
  const {
    setupChallenge,
    runTests: runTestsImpl,
    previewUrl,
    iframeKey,
    refreshPreview,
  } = useShell(instance, term);

  // File system operations
  const { createFile: createFileImpl, deletePath, renamePath } = useFileSystem(instance);

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
  const setActiveBottomTab = useBattleStore((state) => state.setActiveBottomTab);

  // Editor Store - manages file state
  const fileContents = useEditorStore((state) => state.fileContents);
  const activeFile = useEditorStore((state) => state.activeFile);
  const monacoInstance = useEditorStore((state) => state.monacoInstance);
  const setFileContents = useEditorStore((state) => state.setFileContents);
  const updateFile = useEditorStore((state) => state.updateFile);
  const setActiveFile = useEditorStore((state) => state.setActiveFile);
  const setMonacoInstance = useEditorStore((state) => state.setMonacoInstance);

  // User Store
  const markSolved = useUserStore((state) => state.markSolved);

  // Sync Monaco models with file contents
  useMonacoSync(monacoInstance, fileContents);

  // Sync file contents to WebContainer filesystem
  useContainerSync(instance, fileContents, isEnvReady);

  // Setup Challenge & Signal Readiness
  useEffect(() => {
    if (instance && term && challenge) {
      setIsEnvReady(false);
      setupChallenge(challenge).then(() => {
        setIsEnvReady(true);
      });
    }
  }, [instance, term, challenge, setupChallenge]);

  // Trigger IntelliSense Bridge
  useEffect(() => {
    if (isEnvReady && instance && monacoInstance) {
      injectIntelliSense(instance, monacoInstance);
    }
  }, [isEnvReady, instance, monacoInstance, injectIntelliSense]);

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

  // Save progress and fetch review when user wins
  useEffect(() => {
    if (status === "passed") {
      markSolved(challengeId);
      setActiveBottomTab(TABS.TUTOR);

      // Fetch code review for AITutor
      fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fileContents, challengeId }),
      })
        .then((res) => res.json())
        .then((data) => setReviewData(data))
        .catch((err) => console.error("Review fetch failed:", err));

      // Save to Cloud (fire-and-forget)
      submitSuccess(challengeId, fileContents, attemptCount).then((res) => {
        if (res.error) console.error("Cloud save failed:", res.error);
      });
    }
  }, [
    status,
    challengeId,
    markSolved,
    fileContents,
    attemptCount,
    setReviewData,
    setActiveBottomTab,
  ]);

  // Wrapped actions
  const updateFileContent = useCallback(
    (path: string, content: string) => {
      updateFile(path, content);
    },
    [updateFile]
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
    await runTestsImpl(fileContents);
  }, [runTestsImpl, fileContents, incrementAttempts]);

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
      setActiveFile,
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
    ]
  );

  return (
    <BattleContext.Provider value={value}>{children}</BattleContext.Provider>
  );
}
