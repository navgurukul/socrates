"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Terminal, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyChallengeCardProps {
  challengeTitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isCompleted: boolean;
  streak: number;
  battleId: string;
  trackTitle?: string;
}

export function DailyChallengeCard({
  challengeTitle,
  difficulty,
  isCompleted,
  streak,
  battleId,
  trackTitle,
}: DailyChallengeCardProps) {
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown to next local midnight (user's timezone)
  useEffect(() => {
    const computeTimeLeft = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      const diff = nextMidnight.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    computeTimeLeft(); // Set immediately
    const timer = setInterval(computeTimeLeft, 60_000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="relative overflow-hidden border-zinc-800 bg-zinc-950/80 group">
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Info */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="bg-red-950/30 text-red-400 border-red-900/50 animate-pulse"
            >
              DAILY INCIDENT
            </Badge>
            {timeLeft && (
              <span className="text-zinc-500 text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" /> Resets in {timeLeft}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {challengeTitle}
          </h2>

          <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Flame
                className={cn(
                  "w-4 h-4",
                  streak > 0
                    ? "text-orange-500 fill-orange-500"
                    : "text-zinc-600"
                )}
              />
              <span className={streak > 0 ? "text-orange-400 font-medium" : ""}>
                {streak > 0 ? `${streak} Day Streak` : "Start your streak"}
              </span>
            </div>
            <div className="w-1 h-1 bg-zinc-700 rounded-full" />
            <span className="capitalize">{difficulty} Fix</span>
            {trackTitle && (
              <>
                <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span>{trackTitle}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Action */}
        <div className="w-full md:w-auto flex-shrink-0">
          {isCompleted ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-green-400 font-medium bg-green-950/20 px-4 py-2 rounded-md border border-green-900/50">
                <CheckCircle2 className="w-5 h-5" />
                <span>Patch Deployed</span>
              </div>
              <p className="text-xs text-zinc-500">Come back tomorrow</p>
            </div>
          ) : (
            <Link href={`/battle/${battleId}?source=daily`}>
              <Button
                size="lg"
                className="w-full md:w-auto bg-zinc-100 text-zinc-900 hover:bg-white font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all"
              >
                <Terminal className="w-4 h-4 mr-2" />
                Start Debugging
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
