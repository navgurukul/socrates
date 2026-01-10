"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DailyChallengeCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-zinc-800 bg-zinc-950/80">
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Info Skeleton */}
        <div className="space-y-3 flex-1 w-full">
          {/* Badge + Timer Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Skeleton className="h-6 w-32 rounded bg-zinc-800" />
            <Skeleton className="h-4 w-24 rounded bg-zinc-800" />
          </div>

          {/* Title Skeleton (2 lines) */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-full max-w-md rounded bg-zinc-800" />
            <Skeleton className="h-7 w-3/4 max-w-xs rounded bg-zinc-800" />
          </div>

          {/* Metadata Row (Streak, Difficulty, Track) */}
          <div className="flex items-center gap-4 flex-wrap">
            <Skeleton className="h-4 w-28 rounded bg-zinc-800" />
            <Skeleton className="h-1 w-1 rounded-full bg-zinc-700" />
            <Skeleton className="h-4 w-24 rounded bg-zinc-800" />
            <Skeleton className="h-1 w-1 rounded-full bg-zinc-700" />
            <Skeleton className="h-4 w-32 rounded bg-zinc-800" />
          </div>
        </div>

        {/* Right: Action Button Skeleton */}
        <div className="w-full md:w-auto flex-shrink-0">
          <Skeleton className="h-11 w-full md:w-44 rounded-md bg-zinc-800" />
        </div>
      </CardContent>
    </Card>
  );
}
