"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { CodeEditor } from "@/components/arena/CodeEditor";
import { Terminal } from "@/components/arena/Terminal";
import { FileTree } from "@/components/arena/FileTree";
import { buildFileTree } from "@/lib/fileUtils";
import { SuccessDialog } from "@/components/arena/SuccessDialog";
import { AiTutor } from "@/components/arena/AITutor";
import { ProjectBrief } from "@/components/arena/ProjectBrief";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useWebContainer } from "@/hooks/useWebContainer";
import { useTypeBridge } from "@/hooks/useTypeBridge"; // ✅ Import
import { useShell } from "@/hooks/useShell";
import { getChallenge } from "@/lib/content/challenges";
import { Terminal as XTerminal } from "xterm";
import { Button } from "@/components/ui/button";
import { Monaco } from "@monaco-editor/react"; // ✅ Import Type
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ArrowLeft, Files, FileText } from "lucide-react";
import Link from "next/link";
import { getLanguageFromFilename } from "@/lib/utils";
import { useFileSystem } from "@/hooks/useFileSystem";

export default function BattleArena() {
  const params = useParams();
  const router = useRouter();

  const challengeId = typeof params.id === "string" ? params.id : "";
  const challenge = getChallenge(challengeId);

  const { instance } = useWebContainer();
  const [term, setTerm] = useState<XTerminal | null>(null);
  const { setupChallenge, runTests, status, testOutput } = useShell(
    instance,
    term
  );
  const isRunning = status === "running";

  // ✅ IntelliSense Integration
  const { injectIntelliSense } = useTypeBridge();
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null);
  const [isEnvReady, setIsEnvReady] = useState(false); // Tracks if dependencies are installed

  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("index.js");

  const { createFile, deletePath, renamePath } = useFileSystem(
    fileContents,
    setFileContents
  );

  // ✅ Capture Monaco instance on mount
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    setMonacoInstance(monaco);
  };

  useEffect(() => {
    if (!challenge) {
      router.push("/");
    } else {
      const initialFiles: Record<string, string> = {};
      Object.entries(challenge.files).forEach(([name, data]) => {
        initialFiles[name] = data.file.contents;
      });
      setFileContents(initialFiles);

      const firstFile =
        Object.keys(initialFiles).find((f) => f.endsWith(".js")) ||
        Object.keys(initialFiles)[0];
      setActiveFile(firstFile);
    }
  }, [challenge, router]);

  // ✅ Setup Challenge & Signal Readiness
  useEffect(() => {
    if (instance && term && challenge) {
      setIsEnvReady(false);
      setupChallenge(challenge).then(() => {
        setIsEnvReady(true);
      });
    }
  }, [instance, term, challenge, setupChallenge]);

  // ✅ Trigger IntelliSense Bridge
  // Runs only when: Environment is ready (node_modules exist) AND Monaco is mounted
  useEffect(() => {
    if (isEnvReady && instance && monacoInstance) {
      console.log("[Arena] Triggering IntelliSense Injection...");
      injectIntelliSense(instance, monacoInstance);
    }
  }, [isEnvReady, instance, monacoInstance, injectIntelliSense]);

  // Handle user typing
  const handleCodeChange = (newContent: string | undefined) => {
    if (newContent === undefined) return;
    setFileContents((prev) => ({
      ...prev,
      [activeFile]: newContent,
    }));
  };

  if (!challenge) return null;

  const isCurrentFileReadOnly = challenge.files[activeFile]?.readOnly || false;

  // ✅ Build the tree structure efficiently
  const fileTree = useMemo(() => {
    return buildFileTree(Object.keys(fileContents));
  }, [fileContents]);

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
              initialCode={fileContents[activeFile] || ""}
              language={getLanguageFromFilename(activeFile)}
              onChange={handleCodeChange}
              readOnly={isCurrentFileReadOnly}
              onMount={handleEditorDidMount} // ✅ Pass the mounter
            />
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-zinc-800 hover:bg-zinc-700 transition-colors"
        />

        <ResizablePanel defaultSize={35} minSize={20}>
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

      <SuccessDialog isOpen={status === "passed"} onClose={() => {}} />
    </main>
  );
}
