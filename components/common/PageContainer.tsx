import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl";
  withScrollArea?: boolean;
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = "6xl",
  withScrollArea = false,
  className,
}: PageContainerProps) {
  const content = (
    <div className="p-8">
      <div
        className={cn(
          "mx-auto relative z-10",
          maxWidth === "4xl" && "max-w-4xl",
          maxWidth === "5xl" && "max-w-5xl",
          maxWidth === "6xl" && "max-w-6xl",
          maxWidth === "7xl" && "max-w-7xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );

  if (withScrollArea) {
    return <ScrollArea className="h-screen">{content}</ScrollArea>;
  }

  return content;
}
