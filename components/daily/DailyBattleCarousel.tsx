"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Lock, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDailyBattlesForCarousel } from "@/lib/actions/daily-battles";
import type { DailyBattleCarouselItem } from "@/lib/actions/daily-battles";

export function DailyBattleCarousel() {
  const [items, setItems] = useState<DailyBattleCarouselItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCarouselData() {
      try {
        const timezoneOffset = new Date().getTimezoneOffset();
        // Fetch 2 past days, today, and 2 future days for better centering
        const data = await getDailyBattlesForCarousel(2, 2, timezoneOffset);
        setItems(data);
      } catch (error) {
        console.error("Error loading carousel data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCarouselData();
  }, []);

  // Determine which index is 'today' to set initial scroll
  const todayIndex = items.findIndex((d) => d.status === "today");

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="text-center text-zinc-500">
          Loading daily battles...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <Carousel
        opts={{
          align: "center",
          loop: false,
          startIndex: todayIndex !== -1 ? todayIndex : 0,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 md:-ml-8 cursor-grab active:cursor-grabbing">
          {items.map((item, index) => (
            <CarouselItem
              key={item.date}
              className="pl-4 md:pl-8 md:basis-1/2 lg:basis-1/3"
            >
              <div className="flex flex-col items-center gap-3 group">
                {/* Date Label */}
                <span
                  className={cn(
                    "text-xs font-bold tracking-wider uppercase px-2 py-1 rounded bg-zinc-900/50 backdrop-blur border border-zinc-800 transition-colors",
                    item.status === "today"
                      ? "text-zinc-100 border-zinc-700"
                      : "text-zinc-500"
                  )}
                >
                  {item.dateLabel}
                </span>

                {/* The Card */}
                <DailyCard item={item} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Buttons */}
        <div className="hidden md:block">
          <CarouselPrevious className="left-4 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" />
          <CarouselNext className="right-4 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" />
        </div>
      </Carousel>
    </div>
  );
}

// --- Sub-Component: The Individual Card ---
function DailyCard({ item }: { item: DailyBattleCarouselItem }) {
  const isToday = item.status === "today";
  const isFuture = item.status === "future";
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Countdown for future battles
  useEffect(() => {
    if (!isFuture) return;

    const calculateCountdown = () => {
      const now = new Date();
      const targetDate = new Date(item.date + "T00:00:00");
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timer);
  }, [isFuture, item.date]);

  return (
    <div
      className={cn(
        "relative w-full aspect-[4/3] rounded-xl transition-all duration-300",
        isToday
          ? "scale-105 ring-2 ring-yellow-400 shadow-[0_0_30px_-10px_rgba(250,204,21,0.3)]"
          : "opacity-80 hover:opacity-100 scale-95 hover:scale-100"
      )}
    >
      <Card className="h-full border-0 overflow-hidden bg-zinc-900">
        <CardContent
          className={cn(
            "h-full p-0 flex flex-col justify-between relative",
            item.themeColor
          )}
        >
          {/* Background Visuals */}
          <div className="absolute inset-0 w-full h-full">
            {isFuture ? (
              // "TV Static" / Test Pattern Effect
              <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            ) : (
              // Abstract Shapes for Past/Today
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2/3 h-1/2 bg-white/10 rounded-lg backdrop-blur-sm transform rotate-3 flex flex-col gap-2 p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded mt-2" />
                  <div className="h-2 w-3/4 bg-white/20 rounded" />
                  <div className="h-2 w-1/2 bg-white/20 rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Foreground Overlay for Future */}
          {isFuture && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4 z-10 backdrop-blur-[2px]">
              <Lock className="w-8 h-8 text-zinc-500 mb-2" />
              <span className="text-zinc-400 text-sm font-medium mb-4">
                Unlocks in
              </span>

              {/* Countdown UI */}
              <div className="flex gap-2 font-mono text-zinc-300 font-bold">
                <span className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700 min-w-[2.5rem] text-center">
                  {String(countdown.hours).padStart(2, "0")}
                </span>
                <span>:</span>
                <span className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700 min-w-[2.5rem] text-center">
                  {String(countdown.minutes).padStart(2, "0")}
                </span>
                <span>:</span>
                <span className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700 min-w-[2.5rem] text-center">
                  {String(countdown.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>
          )}

          {/* Content Footer (Bottom Area) */}
          <div className="mt-auto relative z-10 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            {/* Score / Status Text */}
            {item.userProgress && (
              <div className="mb-2">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  Your Score
                </p>
                <p className="text-sm font-bold text-white font-mono">
                  {item.userProgress.score}
                </p>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-between items-end">
              {isToday && item.battle ? (
                <Link
                  href={`/battle/${item.battle.id}?source=daily`}
                  className="w-full flex justify-end"
                >
                  <Button
                    size="icon"
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </Button>
                </Link>
              ) : item.status === "past" && item.battle ? (
                <Link
                  href={`/battle/${item.battle.id}?source=daily-archive`}
                  className="w-full flex justify-end"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
