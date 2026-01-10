"use client";

import { cn } from "@/lib/utils";
import { Medal } from "lucide-react";

interface LeaderboardRowProps {
  entry: {
    rank: number;
    username: string;
    avatarUrl: string | null;
    value: number;
  };
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  // Generate initials from username
  const getInitials = () => {
    return entry.username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all",
        isCurrentUser
          ? "bg-blue-950/20 border-blue-800 ring-1 ring-blue-700/50"
          : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center font-mono font-bold text-zinc-500">
        {entry.rank <= 3 ? (
          <Medal
            className={cn(
              "w-5 h-5",
              entry.rank === 1 && "text-yellow-400 fill-yellow-400/20",
              entry.rank === 2 && "text-zinc-400 fill-zinc-400/20",
              entry.rank === 3 && "text-amber-700 fill-amber-700/20"
            )}
          />
        ) : (
          <span>#{entry.rank}</span>
        )}
      </div>

      {/* Avatar & Name */}
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar */}
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.username}
            className="w-10 h-10 rounded-full border-2 border-zinc-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
            <span className="text-xs font-bold text-zinc-300">
              {getInitials()}
            </span>
          </div>
        )}

        <span
          className={cn(
            "font-medium",
            isCurrentUser ? "text-blue-400" : "text-zinc-200"
          )}
        >
          {entry.username} {isCurrentUser && "(You)"}
        </span>
      </div>

      {/* Score */}
      <div className="font-mono text-lg font-bold text-zinc-100">
        {entry.value}
      </div>
    </div>
  );
}
