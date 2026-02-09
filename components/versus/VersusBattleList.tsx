"use client";

import { useVersusStore, BattleState } from "@/lib/store/versus-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, Play, SkipForward, Lock, Circle } from "lucide-react";

export function VersusBattleList() {
  const { challengePool, battleStates, currentBattleId, selectBattle } =
    useVersusStore();

  const getStatusIcon = (state: BattleState) => {
    switch (state) {
      case "solved":
        return <Check className="w-4 h-4 text-green-400" />;
      case "in_progress":
        return <Play className="w-4 h-4 text-blue-400" />;
      case "skipped":
        return <SkipForward className="w-4 h-4 text-yellow-400" />;
      case "locked":
        return <Lock className="w-4 h-4 text-zinc-600" />;
      default:
        return <Circle className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getStatusLabel = (state: BattleState) => {
    switch (state) {
      case "solved":
        return "Solved";
      case "in_progress":
        return "Current";
      case "skipped":
        return "Skipped";
      case "locked":
        return "Locked";
      default:
        return "Available";
    }
  };

  const handleSelectBattle = (battleId: string) => {
    const state = battleStates[battleId];
    if (state === "available" || state === "skipped") {
      selectBattle(battleId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="p-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Battles</h2>
        <p className="text-xs text-zinc-500 mt-1">
          {Object.values(battleStates).filter((s) => s === "solved").length} /{" "}
          {challengePool.length} solved
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {challengePool.map((battleId, index) => {
            const state = battleStates[battleId] || "available";
            const isClickable = state === "available" || state === "skipped";
            const isCurrent = battleId === currentBattleId;

            return (
              <button
                key={battleId}
                onClick={() => handleSelectBattle(battleId)}
                disabled={!isClickable}
                className={cn(
                  "w-full text-left p-2 rounded-lg border transition-all",
                  "flex items-center gap-2",
                  isCurrent
                    ? "bg-blue-950/30 border-blue-800/50 ring-1 ring-blue-700/50"
                    : state === "solved"
                    ? "bg-green-950/20 border-green-800/30"
                    : state === "skipped"
                    ? "bg-yellow-950/20 border-yellow-800/30 cursor-pointer hover:bg-yellow-950/30"
                    : isClickable
                    ? "bg-zinc-900/40 border-zinc-800/50 cursor-pointer hover:bg-zinc-900/60"
                    : "bg-zinc-900/20 border-zinc-800/30 opacity-50"
                )}
              >
                <div className="flex-shrink-0">{getStatusIcon(state)}</div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium truncate",
                      isCurrent
                        ? "text-blue-300"
                        : state === "solved"
                        ? "text-green-300"
                        : state === "skipped"
                        ? "text-yellow-300"
                        : "text-zinc-300"
                    )}
                  >
                    Battle {index + 1}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {getStatusLabel(state)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
