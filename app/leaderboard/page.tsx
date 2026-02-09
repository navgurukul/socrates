import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import {
  getStreakLeaderboard,
  getSolvedLeaderboard,
} from "@/lib/actions/leaderboard";
import { getVersusLeaderboard } from "@/lib/actions/versus";
import { PageContainer, PageNavSection, PageHeader } from "@/components/common";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Trophy, Flame, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Leaderboard | Bug Battle Arena",
  description:
    "See where you stand among the debugging elite. Top streaks and solvers.",
};

export const dynamic = "force-dynamic";

async function LeaderboardContent() {
  // Fetch leaderboard data in parallel
  const [streakData, solvedData, versusData] = await Promise.all([
    getStreakLeaderboard(),
    getSolvedLeaderboard(),
    getVersusLeaderboard("wins"),
  ]);

  // Get current user ID for highlighting
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  return (
    <Tabs defaultValue="streaks" className="w-full">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <TabsList className="grid w-full max-w-[500px] grid-cols-3">
          <TabsTrigger value="streaks">
            <Flame className="w-4 h-4 mr-2 text-orange-500" />
            Streak Masters
          </TabsTrigger>
          <TabsTrigger value="solved">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            Top Solvers
          </TabsTrigger>
          <TabsTrigger value="versus">
            <Swords className="w-4 h-4 mr-2 text-purple-500" />
            Versus Champions
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Streak Leaderboard */}
      <TabsContent
        value="streaks"
        className="space-y-3 animate-in fade-in slide-in-from-bottom-2"
      >
        {streakData.length > 0 ? (
          streakData.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-500">
            No streak data available yet. Start your streak today!
          </div>
        )}
      </TabsContent>

      {/* Solved Leaderboard */}
      <TabsContent
        value="solved"
        className="space-y-3 animate-in fade-in slide-in-from-bottom-2"
      >
        {solvedData.length > 0 ? (
          solvedData.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-500">
            No solved challenges yet. Be the first!
          </div>
        )}
      </TabsContent>

      {/* Versus Champions Leaderboard */}
      <TabsContent
        value="versus"
        className="space-y-3 animate-in fade-in slide-in-from-bottom-2"
      >
        {versusData.length > 0 ? (
          versusData.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-500">
            No Versus matches played yet. Challenge your friends!
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default function LeaderboardPage() {
  return (
    <PageContainer withScrollArea>
      {/* Navigation Section */}
      <PageNavSection backHref="/" backLabel="Back to Home" showAuth />

      {/* Header */}
      <PageHeader
        title="Global"
        highlightText="Rankings"
        description="See where you stand among the debugging elite. Compete for the top spot in streaks and total challenges solved."
        align="center"
      />

      {/* Leaderboard Content */}
      <Suspense fallback={<LoadingScreen fullScreen={false} />}>
        <LeaderboardContent />
      </Suspense>
    </PageContainer>
  );
}
