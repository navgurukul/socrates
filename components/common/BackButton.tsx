import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
  spacing?: "default" | "compact" | "none";
}

export function BackButton({
  href,
  label = "Back to Home",
  className,
  spacing = "default",
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 text-zinc-400 hover:text-white transition-colors",
        spacing === "default" && "mb-6",
        spacing === "compact" && "mb-4",
        className
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}
