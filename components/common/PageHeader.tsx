import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  highlightText?: string;
  description: string | React.ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  highlightText,
  description,
  align = "left",
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-16 space-y-4",
        align === "center" ? "text-center" : "text-start",
        className
      )}
    >
      <h1 className="text-5xl font-extrabold tracking-tight text-white">
        {title}
        {highlightText && (
          <>
            {" "}
            <span className="text-emerald-400">{highlightText}</span>
          </>
        )}
      </h1>
      <p
        className={cn(
          "text-zinc-400 text-lg",
          align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
        )}
      >
        {description}
      </p>
      {children && (
        <div
          className={cn(
            "pt-4",
            align === "center" ? "flex justify-center gap-4" : "flex gap-4"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
