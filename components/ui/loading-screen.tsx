import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = "Loading...",
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-zinc-950 text-white",
        fullScreen ? "h-screen" : "h-full"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8 text-emerald-400" />
        <span className="text-zinc-400">{message}</span>
      </div>
    </div>
  );
}
