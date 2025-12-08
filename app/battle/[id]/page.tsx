"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CodeEditor } from "@/components/arena/CodeEditor";
import { Terminal } from "@/components/arena/Terminal";
import { useWebContainer } from "@/hooks/useWebContainer";
import { useShell } from "@/hooks/useShell";
import { getChallenge } from "@/lib/content/challenges";
import { Terminal as XTerminal } from "xterm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"; // npm install lucide-react if needed
import Link from "next/link";

export default function BattleArena() {
  const params = useParams();
  const router = useRouter();

  // 1. Resolve Challenge ID
  const challengeId = typeof params.id === "string" ? params.id : "";
  const challenge = getChallenge(challengeId);

  const { instance } = useWebContainer();
  const [term, setTerm] = useState<XTerminal | null>(null);
  const { setupChallenge, runTests, isRunning } = useShell(instance, term);

  const [code, setCode] = useState("");

  // 2. Redirect if invalid ID
  useEffect(() => {
    if (!challenge) {
      router.push("/");
    } else {
      // Set initial code only once when challenge loads
      const initialCode = challenge.files["index.js"]?.file.contents || "";
      setCode(initialCode);
    }
  }, [challenge, router]);

  // 3. Setup Environment when Engine + Terminal are ready
  useEffect(() => {
    if (instance && term && challenge) {
      setupChallenge(challenge);
    }
  }, [instance, term, challenge, setupChallenge]);

  if (!challenge) return null; // Or a loading spinner

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-white">
      {/* Header Bar */}
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
          {/* We can add a "Reset Code" button here later */}
          <Button
            size="sm"
            onClick={() => runTests(code)}
            disabled={!instance || isRunning}
            className={
              isRunning ? "opacity-80" : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            {isRunning ? "Running..." : "Run Tests"}
          </Button>
        </div>
      </header>

      {/* Main Split View */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
        {/* Left: Editor */}
        <div className="relative flex flex-col min-h-0 bg-[#1e1e1e]">
          <CodeEditor
            initialCode={code} // Use state variable, not constant
            onChange={(val) => setCode(val || "")}
          />
        </div>

        {/* Right: Terminal */}
        <div className="relative flex flex-col min-h-0 bg-zinc-950">
          <div className="flex-1 p-0 overflow-hidden">
            <Terminal onTerminalReady={setTerm} />
          </div>
        </div>
      </div>
    </main>
  );
}
