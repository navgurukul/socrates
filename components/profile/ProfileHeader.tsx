"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    joinedDate: Date;
  };
  streaks: {
    current: number;
    max: number;
    lastCompleted: string | null;
  };
  stats: {
    completedBattles: number;
  };
}

export function ProfileHeader({ user, streaks, stats }: ProfileHeaderProps) {
  // Generate initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  // Format join date
  const joinDate = new Date(user.joinedDate);
  const joinDateString = joinDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Check if current streak is a new personal record
  const isPersonalRecord = streaks.current > 0 && streaks.current === streaks.max;

  return (
    <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || user.email}
                className="w-24 h-24 rounded-full border-2 border-zinc-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                <span className="text-3xl font-bold text-zinc-300">
                  {getInitials()}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              {user.name || user.email}
            </h1>
            <div className="flex items-center gap-2 text-zinc-400 text-sm justify-center md:justify-start">
              <Calendar className="w-4 h-4" />
              <span>Member since {joinDateString}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex gap-4 shrink-0">
            {/* Current Streak */}
            <div
              className={cn(
                "flex flex-col items-center p-4 rounded-lg border",
                isPersonalRecord
                  ? "bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]"
                  : "bg-zinc-900/50 border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Flame
                  className={cn(
                    "w-5 h-5",
                    streaks.current > 0 ? "text-orange-500" : "text-zinc-600"
                  )}
                />
                <span className="text-2xl font-mono font-bold text-white">
                  {streaks.current}
                </span>
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                Day Streak
              </span>
              {streaks.max > 0 && (
                <span className="text-[10px] text-zinc-600 mt-1">
                  Best: {streaks.max}
                </span>
              )}
            </div>

            {/* Battles Completed */}
            <div className="flex flex-col items-center p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <span className="text-2xl font-mono font-bold text-emerald-500 mb-1">
                {stats.completedBattles}
              </span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                Battles Solved
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
