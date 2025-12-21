import { AuthButton } from "@/components/auth/AuthButton";
import { cn } from "@/lib/utils";

interface PageAuthButtonProps {
  className?: string;
  spacing?: "default" | "compact" | "none";
}

export function PageAuthButton({
  className,
  spacing = "default",
}: PageAuthButtonProps) {
  return (
    <div
      className={cn(
        "w-full flex justify-end",
        spacing === "default" && "mb-6",
        spacing === "compact" && "mb-4",
        className
      )}
    >
      <AuthButton />
    </div>
  );
}
