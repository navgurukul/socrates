"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  activity: Array<{
    date: string; // YYYY-MM-DD
    battleCount: number;
  }>;
}

// Generate last 365 days with activity data
function generateHeatmapData(
  activity: Array<{ date: string; battleCount: number }>
) {
  const today = new Date();
  const data: Array<{
    date: string;
    battleCount: number;
    level: 0 | 1 | 2 | 3 | 4;
  }> = [];

  // Create a map for quick lookup
  const activityMap = new Map(activity.map((a) => [a.date, a.battleCount]));

  // Generate 365 days of data
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const battleCount = activityMap.get(dateStr) || 0;

    // Map battle count to intensity level
    let level: 0 | 1 | 2 | 3 | 4;
    if (battleCount === 0) level = 0;
    else if (battleCount <= 2) level = 1;
    else if (battleCount <= 4) level = 2;
    else if (battleCount <= 6) level = 3;
    else level = 4;

    data.push({ date: dateStr, battleCount, level });
  }

  return data;
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const heatmapData = generateHeatmapData(activity);

  // Group by weeks for display
  const weeks: Array<Array<typeof heatmapData[0]>> = [];
  let currentWeek: Array<typeof heatmapData[0]> = [];

  // Start from the first day (which might not be a Sunday)
  const firstDate = new Date(heatmapData[0].date);
  const firstDayOfWeek = firstDate.getDay();

  // Add empty cells for days before the first date
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: "", battleCount: 0, level: 0 });
  }

  heatmapData.forEach((day, index) => {
    currentWeek.push(day);

    // If it's Saturday or the last day, start a new week
    const date = new Date(day.date);
    if (date.getDay() === 6 || index === heatmapData.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <Card className="border-zinc-800 bg-zinc-950/50">
      <CardHeader>
        <CardTitle className="text-lg text-zinc-100">Activity</CardTitle>
        <p className="text-xs text-zinc-500">
          Last 365 days of battle completions
        </p>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600">
            <div
              className="flex gap-[2px] min-w-max"
              role="grid"
              aria-label="Activity heatmap showing daily battle completions"
            >
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => {
                    // Skip empty cells
                    if (!day.date) {
                      return (
                        <div
                          key={dayIndex}
                          className="w-3 h-3 rounded-sm bg-transparent"
                        />
                      );
                    }

                    const date = new Date(day.date);
                    const formattedDate = date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-3 h-3 rounded-sm transition-all cursor-pointer hover:scale-110 hover:ring-1 hover:ring-zinc-500",
                              day.level === 0 && "bg-zinc-900",
                              day.level === 1 && "bg-emerald-950",
                              day.level === 2 && "bg-emerald-800",
                              day.level === 3 && "bg-emerald-600",
                              day.level === 4 && "bg-emerald-400"
                            )}
                            role="gridcell"
                            aria-label={`${day.battleCount} battles on ${formattedDate}`}
                            tabIndex={0}
                          />
                        </TooltipTrigger>
                        {day.battleCount > 0 && (
                          <TooltipContent>
                            <p className="text-xs">
                              {day.battleCount} battle
                              {day.battleCount !== 1 ? "s" : ""} on {formattedDate}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-zinc-900" />
              <div className="w-3 h-3 rounded-sm bg-emerald-950" />
              <div className="w-3 h-3 rounded-sm bg-emerald-800" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            </div>
            <span>More</span>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
