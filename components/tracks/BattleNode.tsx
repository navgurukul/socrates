import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { CheckCircle2, Play, Circle } from "lucide-react";
import type { BattleWithStatus } from "@/lib/actions/track-progress";
import { cn } from "@/lib/utils";

interface BattleNodeProps {
  battle: BattleWithStatus;
  isFirst: boolean;
  isLast: boolean;
}

export function BattleNode({ battle, isFirst, isLast }: BattleNodeProps) {
  const isCompleted = battle.status === "completed";
  const inProgress = battle.status === "in_progress";

  return (
    <div className="relative">
      {/* Connection Line (Top) */}
      {!isFirst && (
        <div
          className={cn(
            "absolute left-5 top-0 w-0.5 h-6 -translate-y-full",
            isCompleted ? "bg-emerald-500" : "bg-zinc-700"
          )}
        />
      )}

      {/* Battle Node */}
      <Link href={`/battle/${battle.id}`}>
        <div
          className={cn(
            "relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 group cursor-pointer",
            "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700",
            isCompleted && "border-emerald-900/50 bg-emerald-950/20",
            inProgress && "border-blue-900/50 bg-blue-950/20"
          )}
          role="button"
          tabIndex={0}
          aria-label={`Battle: ${battle.title}, Status: ${battle.status}`}
        >
          {/* Status Icon */}
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : inProgress ? (
              <Circle className="w-10 h-10 text-blue-400 fill-blue-400/20" />
            ) : (
              <Circle className="w-10 h-10 text-zinc-600" />
            )}
          </div>

          {/* Battle Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3
                className={cn(
                  "text-xl font-semibold transition-colors",
                  isCompleted
                    ? "text-emerald-400"
                    : "text-white group-hover:text-emerald-400"
                )}
              >
                {battle.title}
              </h3>
              <DifficultyBadge difficulty={battle.difficulty} />
            </div>

            {/* Tech Stack */}
            <div className="flex gap-2 flex-wrap">
              {battle.tech.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-[10px] px-1.5 h-5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 uppercase tracking-wider"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Indicator */}
          <div className="flex-shrink-0">
            {isCompleted ? (
              <span className="text-sm text-emerald-400 font-medium">Replay</span>
            ) : inProgress ? (
              <span className="text-sm text-blue-400 font-medium">Continue</span>
            ) : (
              <Play className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            )}
          </div>
        </div>
      </Link>

      {/* Connection Line (Bottom) */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-5 bottom-0 w-0.5 h-6 translate-y-full",
            isCompleted ? "bg-emerald-500" : "bg-zinc-700"
          )}
        />
      )}
    </div>
  );
}
