import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "./ProgressBar";
import { CheckCircle2, Play, Code2, Brain, FlaskConical } from "lucide-react";
import type { TrackWithProgress } from "@/lib/actions/track-progress";
import { cn } from "@/lib/utils";

interface TrackCardProps {
  track: TrackWithProgress;
}

const executionTypeConfig = {
  code: { label: "Code", icon: Code2, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  analysis: { label: "Analysis", icon: Brain, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  hybrid: { label: "Hybrid", icon: FlaskConical, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

export function TrackCard({ track }: TrackCardProps) {
  const { progress, status, battleCount } = track;
  const isComingSoon = status === "coming_soon";
  const isCompleted = progress.percentage === 100 && battleCount > 0;
  const hasProgress = progress.completed > 0;

  const executionConfig = executionTypeConfig[track.executionType];
  const Icon = executionConfig.icon;

  const getCtaText = () => {
    if (isComingSoon) return "Coming Soon";
    if (isCompleted) return "Review Track";
    if (hasProgress) return "Continue Learning";
    return "Start Track";
  };

  return (
    <Card
      className={cn(
        "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 group relative",
        isCompleted && "border-emerald-900/50",
        isComingSoon && "opacity-60"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4 mb-3">
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 h-6 font-mono uppercase tracking-widest flex items-center gap-1",
              executionConfig.color
            )}
          >
            <Icon className="w-3 h-3" />
            {executionConfig.label}
          </Badge>

          {isCompleted && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-label="Track completed" />
          )}
          {isComingSoon && (
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          )}
        </div>

        <CardTitle className="text-2xl text-white group-hover:text-emerald-400 transition-colors">
          {track.title}
        </CardTitle>

        <CardDescription className="text-zinc-400 line-clamp-2 mt-2">
          {track.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 font-medium">Primary Skill:</span>
            <span className="text-zinc-300">{track.primarySkill}</span>
          </div>

          {!isComingSoon && battleCount > 0 && (
            <ProgressBar
              current={progress.completed}
              total={progress.total}
              variant="track"
            />
          )}

          {isComingSoon && (
            <div className="text-sm text-zinc-500 italic">
              Content in development
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        {isComingSoon ? (
          <Button
            className="w-full bg-zinc-800 text-zinc-500 cursor-not-allowed"
            disabled
          >
            {getCtaText()}
          </Button>
        ) : (
          <Link href={`/tracks/${track.id}`} className="w-full">
            <Button className="w-full bg-zinc-100 text-zinc-900 hover:bg-emerald-500 hover:text-white transition-all font-semibold gap-2">
              {getCtaText()}
              <Play className="w-4 h-4 fill-current" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
