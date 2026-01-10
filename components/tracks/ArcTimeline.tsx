import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "./ProgressBar";
import { BattleNode } from "./BattleNode";
import { Lightbulb } from "lucide-react";
import type { ArcWithBattles } from "@/lib/actions/track-progress";

interface ArcTimelineProps {
  arc: ArcWithBattles;
  arcNumber: number;
}

export function ArcTimeline({ arc, arcNumber }: ArcTimelineProps) {
  const { battles, progress } = arc;

  return (
    <div className="space-y-6">
      {/* Arc Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-4">
          {/* Arc Number */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
            <span className="text-2xl font-bold text-zinc-500">
              {String(arcNumber).padStart(2, "0")}
            </span>
          </div>

          {/* Arc Title and Description */}
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold text-white">{arc.title}</h2>
            <p className="text-sm text-zinc-400">{arc.description}</p>
          </div>

          {/* Arc Progress */}
          {/* {progress.total > 0 && (
            <div className="flex-shrink-0 min-w-[120px]">
              <ProgressBar
                current={progress.completed}
                total={progress.total}
                variant="arc"
                showLabel={false}
                className="w-full"
              />
              <div className="text-xs text-zinc-500 text-right mt-1">
                {progress.completed}/{progress.total} battles
              </div>
            </div>
          )} */}
        </div>

        {/* Mental Model Tag */}
        <div className="flex items-center gap-2 ml-20">
          {/* <span className="text-xs text-zinc-500 font-medium">
            Mental Model:
          </span> */}
          <Lightbulb className="w-4 h-4 text-yellow-500" />

          <Badge
            variant="outline"
            className="text-xs bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          >
            {arc.mentalModel}
          </Badge>
        </div>
      </div>

      {/* Battle Nodes */}
      <div className="ml-20 space-y-4">
        {battles.length === 0 ? (
          <div className="text-sm text-zinc-500 italic p-4 border border-dashed border-zinc-700 rounded-lg">
            No battles available in this arc yet.
          </div>
        ) : (
          battles.map((battle, index) => (
            <BattleNode
              key={battle.id}
              battle={battle}
              isFirst={index === 0}
              isLast={index === battles.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
