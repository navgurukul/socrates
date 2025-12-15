import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "./ProgressBar";
import { ArrowLeft, Trophy } from "lucide-react";
import type { Track } from "@/lib/content/types";
import type { ProgressData } from "@/lib/actions/track-progress";

interface TrackHeaderProps {
  track: Track;
  progress: ProgressData;
}

export function TrackHeader({ track, progress }: TrackHeaderProps) {
  const isCompleted = progress.percentage === 100 && progress.total > 0;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link href="/tracks" className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Tracks
      </Link>

      {/* Track Title and Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-5xl font-extrabold tracking-tight text-white">
              {track.title}
            </h1>
            <p className="text-lg text-zinc-400 max-w-3xl">
              {track.description}
            </p>
          </div>

          {isCompleted && (
            <div className="flex flex-col items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
              <Trophy className="w-8 h-8 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">
                Completed!
              </span>
            </div>
          )}
        </div>

        {/* Primary Skill Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 font-medium">
            Primary Skill:
          </span>
          <Badge
            variant="outline"
            className="text-sm bg-zinc-800 border-zinc-700"
          >
            {track.primarySkill}
          </Badge>
        </div>

        {/* Overall Progress */}
        {progress.total > 0 && (
          <div className="max-w-2xl">
            <ProgressBar
              current={progress.completed}
              total={progress.total}
              variant="track"
              showLabel={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
