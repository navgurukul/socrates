import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  variant?: "track" | "arc";
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  current,
  total,
  variant = "track",
  className,
  showLabel = true,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">
            {current} of {total} completed
          </span>
          <span className="font-semibold text-emerald-400">{percentage}%</span>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(
          "h-2 bg-zinc-800",
          "[&>div]:transition-all [&>div]:duration-500 [&>div]:ease-out",
          variant === "track" ? "[&>div]:bg-emerald-500" : "[&>div]:bg-blue-500"
        )}
        aria-label={`${percentage}% complete`}
      />
    </div>
  );
}
