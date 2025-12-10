"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { CodeEditor } from "@/components/arena/CodeEditor";
import { Terminal } from "@/components/arena/Terminal";
import { FileTree } from "@/components/arena/FileTree";
import { buildFileTree } from "@/lib/fileUtils";
import { SuccessDialog } from "@/components/arena/SuccessDialog";
import { AiTutor } from "@/components/arena/AITutor";
import { ProjectBrief } from "@/components/arena/ProjectBrief";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useWebContainer } from "@/hooks/useWebContainer";
import { useTypeBridge } from "@/hooks/useTypeBridge";
import { useShell } from "@/hooks/useShell";
import { useChallengeLoader } from "@/hooks/useChallengeLoader";
import { useContainerSync } from "@/hooks/useContainerSync";
import { Terminal as XTerminal } from "xterm";
import { Button } from "@/components/ui/button";
import { Monaco, OnMount } from "@monaco-editor/react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ArrowLeft, Files, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getLanguageFromFilename } from "@/lib/utils";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useMonacoSync } from "@/hooks/useMonacoSync";
import { useUserStore } from "@/lib/store/userStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BattleArena() {
  const params = useParams();

  const challengeId = typeof params.id === "string" ? params.id : "";
  const { challenge, isLoading: isLoadingChallenge } = useChallengeLoader(challengeId);

  const { instance, error: containerError } = useWebContainer();
  const [term, setTerm] = useState<XTerminal | null>(null);
  const {
    setupChallenge,
    runTests,
    status,
    testOutput,
    previewUrl,
    iframeKey,
    refreshPreview,
  } = useShell(instance, term);
  const isRunning = status === "running";

  // Progress Tracking
  const markSolved = useUserStore((state) => state.markSolved);

  // IntelliSense Integration
  const { injectIntelliSense } = useTypeBridge();
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null);
  const [isEnvReady, setIsEnvReady] = useState(false); // Tracks if dependencies are installed

  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("index.js");

  const { createFile, deletePath, renamePath } = useFileSystem(
    fileContents,
    setFileContents,
    instance
  );

  // ACTIVATE SYNC - Runs whenever fileContents changes (typing, creating files, etc.)
  useMonacoSync(monacoInstance, fileContents);

  // Debounced file sync to WebContainer filesystem (for live preview)
  useContainerSync(instance, fileContents, isEnvReady);

  // Capture Monaco instance on mount
  const handleEditorDidMount: OnMount = (_editor, monaco) => {
    setMonacoInstance(monaco);
  };

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
  }, [challenge, isLoadingChallenge]);

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

  // Save progress when user wins
  useEffect(() => {
    if (status === "passed") {
      markSolved(challengeId);
    }
  }, [status, challengeId, markSolved]);

  // Handle user typing
  const handleCodeChange = (newContent: string | undefined) => {
    if (newContent === undefined) return;
    setFileContents((prev) => ({
      ...prev,
      [activeFile]: newContent,
    }));
  };

  const isCurrentFileReadOnly = challenge?.files[activeFile]?.readOnly || false;

  // Build the tree structure efficiently
  const fileTree = useMemo(() => {
    return buildFileTree(Object.keys(fileContents));
  }, [fileContents]);

  // Handle WebContainer error
  if (containerError) {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-6 max-w-2xl px-8">
          <h1 className="text-3xl font-bold text-red-400">Browser Not Supported</h1>
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
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-none">
              {challenge.title}
            </h1>
            <span className="text-xs text-zinc-500">Bug Battle</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => runTests(fileContents)}
            disabled={!instance || isRunning}
            className={
              isRunning ? "opacity-80" : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            {isRunning ? "Running..." : "Run Tests"}
          </Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Tabs
            defaultValue="brief"
            className="flex flex-col h-full bg-zinc-950"
          >
            {/* Sidebar Tabs Header */}
            <div className="flex items-center border-b border-zinc-800 bg-zinc-950 px-2">
              <TabsList className="h-9 bg-transparent p-0 gap-1 w-full justify-start">
                <TabsTrigger
                  value="brief"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 rounded-md h-7 px-3 text-xs flex gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Brief
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 rounded-md h-7 px-3 text-xs flex gap-2"
                >
                  <Files className="w-3.5 h-3.5" />
                  Files
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Project Brief (The Ticket) */}
            <TabsContent
              value="brief"
              className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
            >
              <ProjectBrief challenge={challenge} />
            </TabsContent>

            {/* Tab 2: File Explorer */}
            <TabsContent
              value="files"
              className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
            >
              <FileTree
                tree={fileTree}
                activeFile={activeFile}
                onSelect={setActiveFile}
                onCreateFile={createFile}
                onDelete={deletePath}
                onRename={renamePath}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="relative flex flex-col h-full bg-[#1e1e1e]">
            {isCurrentFileReadOnly && (
              <div className="absolute top-0 right-4 z-10 bg-red-900/80 text-red-200 text-xs px-2 py-1 rounded-b">
                Read Only
              </div>
            )}

            <CodeEditor
              key={activeFile}
              filePath={activeFile}
              initialCode={fileContents[activeFile] || ""}
              language={getLanguageFromFilename(activeFile)}
              onChange={handleCodeChange}
              readOnly={isCurrentFileReadOnly}
              onMount={handleEditorDidMount}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-zinc-800 hover:bg-zinc-700 transition-colors"
        />

        <ResizablePanel defaultSize={35} minSize={20}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            {/* Top Sub-section: Live Preview */}
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full w-full relative bg-zinc-900">
                {/* Preview Header with refresh control */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2 py-1 bg-zinc-900/90 border-b border-zinc-800">
                  <span className="text-xs text-zinc-500">Preview</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-400 hover:text-white"
                          onClick={refreshPreview}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reload Preview</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {previewUrl ? (
                  <iframe
                    key={iframeKey}
                    src={previewUrl}
                    className="w-full h-full border-none bg-white pt-7"
                    title="Live Preview"
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-zinc-500 gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-400" />
                    <span className="text-xs">Starting Dev Server...</span>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle className="bg-zinc-800 hover:bg-zinc-700 transition-colors" />

            {/* Bottom Sub-section: Console & AI Tutor Tabs */}
            <ResizablePanel defaultSize={50} minSize={20}>
              <Tabs defaultValue="console" className="flex flex-col h-full">
                <TabsList className="h-9 w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-900 px-2">
                  <TabsTrigger
                    value="console"
                    className="h-7 rounded-sm px-3 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    Console
                  </TabsTrigger>
                  <TabsTrigger
                    value="tutor"
                    className="h-7 rounded-sm px-3 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    AI Tutor
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="console"
                  forceMount
                  className="flex-1 m-0 p-0 overflow-hidden outline-none data-[state=inactive]:hidden"
                >
                  <Terminal onTerminalReady={setTerm} />
                </TabsContent>

                <TabsContent
                  value="tutor"
                  forceMount
                  className="flex-1 m-0 p-0 overflow-hidden outline-none data-[state=inactive]:hidden"
                >
                  <AiTutor files={fileContents} testOutput={testOutput} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <SuccessDialog isOpen={status === "passed"} onClose={() => {}} />
    </main>
  );
}
