"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeReviewProps {
  code: Record<string, string>;
  challengeId: string;
}

interface ReviewData {
  praise: string;
  critique?: string;
  tip: string;
}

export function CodeReview({ code, challengeId }: CodeReviewProps) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  console.log("Code:", code);

  useEffect(() => {
    // Fetch review immediately on mount
    fetch("/api/review", {
      method: "POST",
      body: JSON.stringify({ code, challengeId }),
    })
      .then((res) => res.json())
      .then((data) => setReview(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [code, challengeId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        <span className="text-xs">
          The Senior Dev is reviewing your code...
        </span>
      </div>
    );
  }

  if (!review) return null;

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="space-y-4 text-sm">
        {/* Positive Feedback */}
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-400">Great Code</p>
            <p className="text-zinc-400">{review.praise}</p>
          </div>
        </div>

        {/* Critique */}
        {review.critique && (
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-400">Watch Out</p>
              <p className="text-zinc-400">{review.critique}</p>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="flex gap-3">
          <Lightbulb className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <p className="font-semibold text-blue-400">Pro Tip</p>
            <p className="text-zinc-400">{review.tip}</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
