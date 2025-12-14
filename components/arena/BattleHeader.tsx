"use client";

import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  return (
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
          <h1 className="text-sm font-bold leading-none">{challengeTitle}</h1>
          <span className="text-xs text-zinc-500">Bug Battle</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onRunTests}
          disabled={disabled}
          className={
            isRunning ? "opacity-80" : "bg-emerald-600 hover:bg-emerald-700"
          }
        >
          {isRunning ? "Running..." : "Run Tests"}
        </Button>
      </div>
    </header>
  );
});
