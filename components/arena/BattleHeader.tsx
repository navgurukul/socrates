"use client";

import { memo, useEffect, useRef } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface BattleHeaderProps {
  challengeTitle: string;
  onRunTests: () => void;
  isRunning: boolean;
  disabled: boolean;
}

export const BattleHeader = memo(function BattleHeader({
  challengeTitle,
  onRunTests,
  isRunning,
  disabled,
}: BattleHeaderProps) {
  const router = useRouter();
  const entryHistoryLengthRef = useRef<number>(0);

  // Capture history length when component mounts (when entering battle page)
  useEffect(() => {
    entryHistoryLengthRef.current = window.history.length;
  }, []);

  const handleBack = () => {
    const currentLength = window.history.length;
    const entryLength = entryHistoryLengthRef.current;
    const extraEntries = currentLength - entryLength;

    if (extraEntries > 0) {
      // If iframe or other interactions added history entries, go back multiple times
      console.debug(
        `[BattleHeader] Going back ${
          extraEntries + 1
        } entries to exit battle page`
      );
      window.history.go(-(extraEntries + 1));
    } else {
      // Normal single back navigation
      router.back();
    }
  };
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="flex items-center gap-4">
        <ArrowLeft
          className="cursor-pointer h-5 w-5 text-white hover:text-zinc-400"
          onClick={handleBack}
        />
        <div className="flex flex-col">
          <h1 className="text-sm font-bold leading-none">{challengeTitle}</h1>
          <span className="text-xs text-zinc-500">Bug Battle</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onRunTests}
          disabled={disabled}
          className={cn(
            isRunning && "opacity-80",
            !isRunning && "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>
    </header>
  );
});
