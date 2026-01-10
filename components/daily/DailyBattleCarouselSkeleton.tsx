"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function DailyBattleCarouselSkeleton() {
  // Show 5 skeleton cards to match the typical carousel view (2 past, today, 2 future)
  const skeletonCards = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <Carousel
        opts={{
          align: "center",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 md:-ml-8 p-2">
          {skeletonCards.map((index) => (
            <CarouselItem
              key={index}
              className="pl-4 md:pl-8 md:basis-1/2 lg:basis-1/3"
            >
              <div className="flex flex-col items-center gap-3">
                {/* Date Label Skeleton */}
                <Skeleton className="h-6 w-20 rounded bg-zinc-800" />

                {/* Card Skeleton */}
                <DailyBattleCardSkeleton isToday={index === 1} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

// Sub-component for individual carousel card skeleton
function DailyBattleCardSkeleton({ isToday = false }: { isToday?: boolean }) {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl transition-all">
      <Card className="h-full border-0 bg-zinc-900">
        <CardContent className="h-full p-0 flex flex-col justify-between relative overflow-hidden">
          {/* Background shimmer effect */}
          <div className="absolute inset-0 w-full h-full">
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-2/3 h-1/2 bg-zinc-800 transform rotate-3" />
            </div>
          </div>

          {/* Content Footer Skeleton */}
          <div className="mt-auto relative z-10 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="mb-2 space-y-2">
              {/* Score label skeleton */}
              <Skeleton className="h-3 w-16 bg-zinc-700" />
              {/* Score value skeleton */}
              <Skeleton className="h-4 w-12 bg-zinc-700" />
            </div>

            {/* Action Button Skeleton */}
            <div className="flex justify-end">
              {isToday ? (
                <Skeleton className="w-10 h-10 rounded-full bg-emerald-500/30" />
              ) : (
                <Skeleton className="w-8 h-8 rounded-full bg-zinc-700" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
