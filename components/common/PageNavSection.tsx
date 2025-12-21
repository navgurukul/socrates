import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { cn } from "@/lib/utils";

interface PageNavSectionProps {
  backHref?: string;
  backLabel?: string;
  showAuth?: boolean;
  className?: string;
}

export function PageNavSection({
  backHref,
  backLabel = "Back to Home",
  showAuth = true,
  className,
}: PageNavSectionProps) {
  return (
    <div className={cn("space-y-6 mb-6", className)}>
      {/* Auth Button Row */}
      {showAuth && (
        <div className="w-full flex justify-end">
          <AuthButton />
        </div>
      )}

      {/* Back Button Row */}
      {backHref && (
        <Link
          href={backHref}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}
    </div>
  );
}
