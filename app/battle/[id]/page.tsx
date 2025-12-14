"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BattleHeader } from "@/components/arena/BattleHeader";
import { SidebarPanel } from "@/components/arena/SidebarPanel";
import { EditorPanel } from "@/components/arena/EditorPanel";
import { PreviewPanel } from "@/components/arena/PreviewPanel";
import { BottomTabsPanel } from "@/components/arena/BottomTabsPanel";
import { buildFileTree } from "@/lib/fileUtils";

import { useWebContainer } from "@/hooks/useWebContainer";
import { useTypeBridge } from "@/hooks/useTypeBridge";
import { useShell } from "@/hooks/useShell";
import { useChallengeLoader } from "@/hooks/useChallengeLoader";
import { useContainerSync } from "@/hooks/useContainerSync";
import { Terminal as XTerminal } from "xterm";
import { Button } from "@/components/ui/button";
import { type OnMount } from "@monaco-editor/react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { getLanguageFromFilename } from "@/lib/utils";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useMonacoSync } from "@/hooks/useMonacoSync";
import { useUserStore } from "@/lib/store/userStore";
import { submitSuccess } from "@/lib/actions/progress";
import { useBattleStore } from "@/lib/store/battleStore";
import { useEditorStore } from "@/lib/store/editorStore";
import { LAYOUT, TABS, TEST_STATUS } from "@/lib/config/constants";

export default function BattleArena() {
  const params = useParams();

  const challengeId = typeof params.id === "string" ? params.id : "";
  const { challenge, isLoading: isLoadingChallenge } =
    useChallengeLoader(challengeId);

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

  // Editor Store - manages file state
  const fileContents = useEditorStore((state) => state.fileContents);
  const activeFile = useEditorStore((state) => state.activeFile);
  const monacoInstance = useEditorStore((state) => state.monacoInstance);
  const setFileContents = useEditorStore((state) => state.setFileContents);
  const updateFile = useEditorStore((state) => state.updateFile);
  const setActiveFile = useEditorStore((state) => state.setActiveFile);
  const setMonacoInstance = useEditorStore((state) => state.setMonacoInstance);

  const { instance, error: containerError } = useWebContainer();
  const [term, setTerm] = useState<XTerminal | null>(null);
  const {
    setupChallenge,
    runTests,
    previewUrl,
    iframeKey,
    refreshPreview,
  } = useShell(instance, term);
  const isRunning = status === TEST_STATUS.RUNNING;

  // Progress Tracking
  const markSolved = useUserStore((state) => state.markSolved);

  // IntelliSense Integration
  const { injectIntelliSense } = useTypeBridge();
  const [isEnvReady, setIsEnvReady] = useState(false);

  const { createFile, deletePath, renamePath } = useFileSystem(instance);

  // ACTIVATE SYNC - Runs whenever fileContents changes (typing, creating files, etc.)
  useMonacoSync(monacoInstance, fileContents);

  // Debounced file sync to WebContainer filesystem (for live preview)
  useContainerSync(instance, fileContents, isEnvReady);

  // Capture Monaco instance on mount
  const handleEditorDidMount: OnMount = (_editor, monaco) => {
    setMonacoInstance(monaco);
  };

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
  // Runs only when: Environment is ready (node_modules exist) AND Monaco is mounted
  useEffect(() => {
    if (isEnvReady && instance && monacoInstance) {
      console.log("[Arena] Triggering IntelliSense Injection...");
      injectIntelliSense(instance, monacoInstance);
    }
  }, [isEnvReady, instance, monacoInstance, injectIntelliSense]);

  useEffect(() => {
    if (!challenge || isLoadingChallenge) return;

    const initialFiles: Record<string, string> = {};
    Object.entries(challenge.files).forEach(([name, data]) => {
      initialFiles[name] = data.file.contents;
    });
    setFileContents(initialFiles);

    const firstFile =
      Object.keys(initialFiles).find((f) => f.endsWith(".js")) ||
      Object.keys(initialFiles)[0];
    setActiveFile(firstFile);
  }, [challenge, isLoadingChallenge, setFileContents, setActiveFile]);

  // Save progress and fetch review when user wins
  useEffect(() => {
    if (status === TEST_STATUS.PASSED) {
      markSolved(challengeId);
      // Switch to AI Tutor tab to show the review
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
  }, [status, challengeId, markSolved, fileContents, attemptCount, setReviewData, setActiveBottomTab]);

  // Handle user typing
  const handleCodeChange = (newContent: string | undefined) => {
    if (newContent === undefined) return;
    updateFile(activeFile, newContent);
  };

  const isCurrentFileReadOnly = challenge?.files[activeFile]?.readOnly || false;

  // Build the tree structure efficiently
  const fileTree = useMemo(() => {
    return buildFileTree(Object.keys(fileContents));
  }, [fileContents]);

  // Stable callback for running tests
  const handleRunTests = useCallback(() => {
    incrementAttempts();
    runTests(fileContents);
  }, [runTests, fileContents, incrementAttempts]);

  // Handle WebContainer error
  if (containerError) {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-6 max-w-2xl px-8">
          <h1 className="text-3xl font-bold text-red-400">
            Browser Not Supported
          </h1>
          <div className="text-center space-y-4">
            <p className="text-zinc-300">
              WebContainer failed to initialize. This could be due to:
            </p>
            <ul className="text-left text-zinc-400 space-y-2">
              <li>• Missing security headers (COOP/COEP)</li>
              <li>• Unsupported browser (requires Chromium-based browsers)</li>
              <li>• SharedArrayBuffer not available</li>
            </ul>
            <p className="text-zinc-500 text-sm mt-4">
              <strong>Error:</strong> {containerError}
            </p>
            <p className="text-zinc-400">
              Please try using Chrome, Edge, or another Chromium-based browser.
            </p>
          </div>
          <Link href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  if (isLoadingChallenge) {
    return <LoadingScreen message="Loading challenge..." />;
  }

  if (!challenge) return null;

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-white">
      <BattleHeader
        challengeTitle={challenge.title}
        onRunTests={handleRunTests}
        isRunning={isRunning}
        disabled={!instance || isRunning}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel
          defaultSize={LAYOUT.SIDEBAR_DEFAULT_SIZE}
          minSize={LAYOUT.SIDEBAR_MIN_SIZE}
          maxSize={LAYOUT.SIDEBAR_MAX_SIZE}
        >
          <SidebarPanel
            challenge={challenge}
            fileTree={fileTree}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onCreateFile={createFile}
            onDelete={deletePath}
            onRename={renamePath}
          />
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        <ResizablePanel
          defaultSize={LAYOUT.EDITOR_DEFAULT_SIZE}
          minSize={LAYOUT.EDITOR_MIN_SIZE}
        >
          <EditorPanel
            activeFile={activeFile}
            content={fileContents[activeFile] || ""}
            language={getLanguageFromFilename(activeFile)}
            readOnly={isCurrentFileReadOnly}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
          />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-zinc-800 hover:bg-zinc-700 transition-colors"
        />

        <ResizablePanel
          defaultSize={LAYOUT.PREVIEW_DEFAULT_SIZE}
          minSize={LAYOUT.PREVIEW_MIN_SIZE}
        >
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel
              defaultSize={LAYOUT.BOTTOM_PANEL_DEFAULT_SIZE}
              minSize={LAYOUT.BOTTOM_PANEL_MIN_SIZE}
            >
              <PreviewPanel
                previewUrl={previewUrl}
                iframeKey={iframeKey}
                onRefresh={refreshPreview}
              />
            </ResizablePanel>

            <ResizableHandle className="bg-zinc-800 hover:bg-zinc-700 transition-colors" />

            <ResizablePanel
              defaultSize={LAYOUT.BOTTOM_PANEL_DEFAULT_SIZE}
              minSize={LAYOUT.BOTTOM_PANEL_MIN_SIZE}
            >
              <BottomTabsPanel
                activeTab={activeBottomTab}
                onTabChange={setActiveBottomTab}
                onTerminalReady={setTerm}
                files={fileContents}
                testOutput={testOutput}
                reviewData={reviewData}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
