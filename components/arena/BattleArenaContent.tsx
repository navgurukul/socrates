"use client";

import { useMemo, useCallback } from "react";
import { type OnMount } from "@monaco-editor/react";
import { BattleHeader } from "./BattleHeader";
import { SidebarPanel } from "./SidebarPanel";
import { EditorPanel } from "./EditorPanel";
import { PreviewPanel } from "./PreviewPanel";
import { BottomTabsPanel } from "./BottomTabsPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { buildFileTree } from "@/lib/fileUtils";
import { getLanguageFromFilename } from "@/lib/utils";
import { useBattle } from "@/hooks/useBattle";
import { LAYOUT } from "@/lib/config/constants";
import { ErrorToast } from "@/components/ui/error-toast";

/**
 * Battle Arena Content - Main arena UI
 * Consumes BattleContext for all state and actions
 */
export function BattleArenaContent() {
  const {
    challenge,
    fileContents,
    activeFile,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    renameFile,
    runTests,
    isRunning,
    instance,
    previewUrl,
    refreshPreview,
    setTerminal,
    testOutput,
    reviewData,
    attemptCount,
    setMonacoInstance,
    activeBottomTab,
    setActiveBottomTab,
  } = useBattle();

  // Build the tree structure efficiently
  const fileTree = useMemo(() => {
    return buildFileTree(Object.keys(fileContents));
  }, [fileContents]);

  // Handle user typing
  const handleCodeChange = useCallback(
    (newContent: string | undefined) => {
      if (newContent === undefined) return;
      updateFileContent(activeFile, newContent);
    },
    [activeFile, updateFileContent]
  );

  // Capture Monaco instance on mount
  const handleEditorDidMount: OnMount = useCallback(
    (_editor, monaco) => {
      setMonacoInstance(monaco);
    },
    [setMonacoInstance]
  );

  const isCurrentFileReadOnly = challenge?.files[activeFile]?.readOnly || false;

  if (!challenge) return null;

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-white">
      <ErrorToast />
      <BattleHeader
        challengeTitle={challenge.title}
        onRunTests={runTests}
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
            onDelete={deleteFile}
            onRename={renameFile}
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
                iframeKey={0}
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
                onTerminalReady={setTerminal}
                files={fileContents}
                testOutput={testOutput}
                reviewData={reviewData}
                attemptCount={attemptCount}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
