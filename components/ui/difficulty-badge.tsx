import { Badge } from "@/components/ui/badge";
import { getDifficultyStyles } from "@/lib/utils";
import { Difficulty } from "@/lib/content/types";
import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-2 h-5 font-mono uppercase tracking-widest",
        getDifficultyStyles(difficulty),
        className
      )}
    >
      {difficulty}
    </Badge>
  );
}
