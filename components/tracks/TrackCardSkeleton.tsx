"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TrackCardSkeleton() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        {/* Empty header to maintain card spacing
            - Badge row (h-6 + mb-3): 30px
            - Title (text-2xl): 32px
            - Description (line-clamp-2 + mt-2): 40px
            - Gaps (gap-2 x2): 16px
            Total: ~118px */}
        <div className="h-[118px]" />
      </CardHeader>

      <CardContent>
        {/* Empty content to maintain card spacing
            - Primary skill row: 20px
            - Gap (space-y-4): 16px
            - Progress bar: 28px
            Total: ~64px */}
        <div className="h-[64px]" />
      </CardContent>

      <CardFooter>
        {/* Button Skeleton - h-10 to match actual button */}
        <Skeleton className="h-10 w-full rounded-md bg-zinc-800" />
      </CardFooter>
    </Card>
  );
}

// Grid wrapper component showing multiple skeleton cards
export function TrackCardSkeletonGrid() {
  // Show 6 skeleton cards (typical track count)
  const skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skeletonCards.map((index) => (
        <TrackCardSkeleton key={index} />
      ))}
    </div>
  );
}
