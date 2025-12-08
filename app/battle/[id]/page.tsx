"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CodeEditor } from "@/components/arena/CodeEditor";
import { Terminal } from "@/components/arena/Terminal";
import { FileExplorer } from "@/components/arena/FileExplorer"; // New Import
import { SuccessDialog } from "@/components/arena/SuccessDialog";
import { useWebContainer } from "@/hooks/useWebContainer";
import { useShell } from "@/hooks/useShell";
import { getChallenge } from "@/lib/content/challenges";
import { Terminal as XTerminal } from "xterm";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BattleArena() {
  const params = useParams();
  const router = useRouter();

  const challengeId = typeof params.id === "string" ? params.id : "";
  const challenge = getChallenge(challengeId);

  const { instance } = useWebContainer();
  const [term, setTerm] = useState<XTerminal | null>(null);
  const { setupChallenge, runTests, status } = useShell(instance, term);
  const isRunning = status === "running";

  // STATE CHANGE: Track all files, not just one string
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>("index.js");

  useEffect(() => {
    if (!challenge) {
      router.push("/");
    } else {
      // Initialize state with all files from the challenge
      const initialFiles: Record<string, string> = {};
      Object.entries(challenge.files).forEach(([name, data]) => {
        initialFiles[name] = data.file.contents;
      });
      setFileContents(initialFiles);

      // Default to index.js, or the first file available
      const firstFile =
        Object.keys(initialFiles).find((f) => f.endsWith(".js")) ||
        Object.keys(initialFiles)[0];
      setActiveFile(firstFile);
    }
  }, [challenge, router]);

  useEffect(() => {
    if (instance && term && challenge) {
      setupChallenge(challenge);
    }
  }, [instance, term, challenge, setupChallenge]);

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
            // Pass the ENTIRE fileContents object to runTests
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

      {/* 3-Panel Layout: Explorer | Editor | Terminal */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Panel 1: File Explorer */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={20}>
          <FileExplorer
            files={Object.keys(fileContents)}
            activeFile={activeFile}
            onSelect={setActiveFile}
          />
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        {/* Panel 2: Editor */}
        <ResizablePanel defaultSize={45} minSize={25}>
          <div className="relative flex flex-col h-full bg-[#1e1e1e]">
            {/* Add a visual indicator for the user */}
            {isCurrentFileReadOnly && (
              <div className="absolute top-0 right-4 z-10 bg-red-900/80 text-red-200 text-xs px-2 py-1 rounded-b">
                Read Only
              </div>
            )}

            <CodeEditor
              key={activeFile}
              initialCode={fileContents[activeFile] || ""}
              onChange={handleCodeChange}
              readOnly={isCurrentFileReadOnly} // <--- PASS IT DOWN
            />
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-zinc-800 hover:bg-zinc-700 transition-colors"
        />

        {/* Panel 3: Terminal */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="relative flex flex-col h-full bg-zinc-950">
            <div className="flex-1 p-0 overflow-hidden">
              <Terminal onTerminalReady={setTerm} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <SuccessDialog isOpen={status === "passed"} onClose={() => {}} />
    </main>
  );
}
