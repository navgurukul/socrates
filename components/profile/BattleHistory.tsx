import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { progress } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getBattle } from "@/lib/content/registry";
import { cn } from "@/lib/utils";

interface BattleHistoryProps {
  userId: string;
}

// Format relative time (e.g., "2 days ago")
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

export async function BattleHistory({ userId }: BattleHistoryProps) {
  try {
    // Fetch recent completed battles (limit 10)
    const recentBattles = await db.query.progress.findMany({
      where: and(eq(progress.userId, userId), eq(progress.status, "completed")),
      orderBy: [desc(progress.completedAt)],
      limit: 10,
    });

    // Load battle metadata for each
    const battlesWithMetadata = await Promise.all(
      recentBattles.map(async (battle) => {
        const metadata = await getBattle(battle.challengeId);
        return {
          ...battle,
          metadata,
        };
      })
    );

    return (
      <Card className="border-zinc-800 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">Recent Battles</CardTitle>
        </CardHeader>
        <CardContent>
          {battlesWithMetadata.length === 0 ? (
            <p className="text-sm text-zinc-500 italic text-center py-8">
              No completed battles yet. Start your journey!
            </p>
          ) : (
            <div className="space-y-2">
              {battlesWithMetadata.map((battle) => (
                <Link
                  key={battle.id}
                  href={`/battle/${battle.challengeId}`}
                  className={cn(
                    "block p-3 rounded-lg border border-zinc-800 bg-zinc-900/40",
                    "hover:bg-zinc-800/60 hover:border-zinc-700 transition-all",
                    "hover:scale-[1.01]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-zinc-200 truncate">
                        {battle.metadata?.title || battle.challengeId}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {battle.completedAt && (
                          <span>{formatRelativeTime(battle.completedAt)}</span>
                        )}
                        {battle.attempts !== null && battle.attempts > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {battle.attempts} attempt{battle.attempts !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("Error fetching battle history:", error);
    return (
      <Card className="border-zinc-800 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">Recent Battles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 italic text-center py-8">
            Unable to load battle history.
          </p>
        </CardContent>
      </Card>
    );
  }
}
