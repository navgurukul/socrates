"use client";

import { useVersusStore } from "@/lib/store/versus-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Crown, Medal } from "lucide-react";

export function VersusLiveLeaderboard() {
  const { rankings, currentUserId } = useVersusStore();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      <div className="p-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Live Rankings</h2>
        <p className="text-xs text-zinc-500 mt-1">Updated in real-time</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {rankings.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">
              Rankings will appear as players solve challenges
            </p>
          ) : (
            rankings.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              const isLeader = entry.rank === 1 && entry.solved > 0;

              return (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    isCurrentUser
                      ? "bg-blue-950/30 border-blue-800/50 ring-1 ring-blue-700/50"
                      : isLeader
                      ? "bg-yellow-950/20 border-yellow-800/30"
                      : "bg-zinc-900/40 border-zinc-800/50"
                  )}
                >
                  {/* Rank */}
                  <div className="w-6 flex justify-center">
                    {isLeader ? (
                      <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                    ) : entry.rank <= 3 ? (
                      <Medal
                        className={cn(
                          "w-5 h-5",
                          entry.rank === 2 && "text-zinc-400 fill-zinc-400/20",
                          entry.rank === 3 && "text-amber-700 fill-amber-700/20"
                        )}
                      />
                    ) : (
                      <span className="text-xs font-mono text-zinc-500">
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.username}
                      className="w-8 h-8 rounded-full border border-zinc-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-zinc-400">
                        {getInitials(entry.username)}
                      </span>
                    </div>
                  )}

                  {/* Name & Stats */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium truncate",
                        isCurrentUser ? "text-blue-300" : "text-zinc-200"
                      )}
                    >
                      {entry.username}
                      {isCurrentUser && (
                        <span className="text-zinc-500 ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {formatTime(entry.totalTimeMs)} total
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-lg font-bold font-mono",
                        isLeader ? "text-yellow-400" : "text-zinc-200"
                      )}
                    >
                      {entry.solved}
                    </p>
                    <p className="text-[10px] text-zinc-500">solved</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
