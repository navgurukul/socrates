"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersusHeaderProps {
  remainingSeconds: number | null;
  solvedCount: number;
  totalBattles: number;
  onEarlySubmit: () => void;
}

export function VersusHeader({
  remainingSeconds,
  solvedCount,
  totalBattles,
  onEarlySubmit,
}: VersusHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 60;
  const isCriticalTime = remainingSeconds !== null && remainingSeconds <= 30;

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold leading-none text-white">
            Versus Match
          </h1>
          <span className="text-xs text-zinc-500">Multiplayer Battle</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Progress */}
        <Badge variant="secondary" className="gap-2 px-3 py-1.5 bg-zinc-800/50">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-zinc-200">
            {solvedCount} / {totalBattles}
          </span>
        </Badge>

        {/* Timer */}
        <Badge
          variant="secondary"
          className={cn(
            "gap-2 px-3 py-1.5 font-mono text-lg",
            isCriticalTime
              ? "bg-red-950/50 text-red-400 animate-pulse"
              : isLowTime
              ? "bg-yellow-950/50 text-yellow-400"
              : "bg-zinc-800/50 text-zinc-200"
          )}
        >
          <Clock
            className={cn(
              "w-4 h-4",
              isCriticalTime
                ? "text-red-400"
                : isLowTime
                ? "text-yellow-400"
                : "text-zinc-400"
            )}
          />
          {remainingSeconds !== null ? formatTime(remainingSeconds) : "--:--"}
        </Badge>

        {/* Early Submit */}
        <Button
          size="sm"
          variant="outline"
          onClick={onEarlySubmit}
          className="gap-2 border-zinc-700 hover:bg-zinc-800"
        >
          <Flag className="w-4 h-4" />
          Submit Match
        </Button>
      </div>
    </header>
  );
}
