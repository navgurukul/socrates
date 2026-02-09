"use client";

import { useEffect, useRef, useCallback } from "react";
import { useVersesStore } from "@/lib/store/verses-store";
import { submitChallengeResult, finishMatch } from "@/lib/actions/verses";
import { BattleProvider } from "@/contexts/BattleContext";
import { BattleArenaContent } from "@/components/arena/BattleArenaContent";
import { VersesHeader } from "./VersesHeader";
import { VersesBattleList } from "./VersesBattleList";
import { VersesLiveLeaderboard } from "./VersesLiveLeaderboard";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface VersesArenaProps {
  channel: ReturnType<typeof import("@/hooks/useVersesChannel").useVersesChannel>;
  onMatchEnd: () => void;
}

export function VersesArena({ channel, onMatchEnd }: VersesArenaProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef(false);

  const {
    roomId,
    currentBattleId,
    challengePool,
    remainingSeconds,
    startedAt,
    timeLimit,
    currentUserId,
    battleStates,
    solvedCount,
    totalTimeMs,
    currentBattleStartTime,
    setRemainingSeconds,
    markSolved,
    setRankings,
    setStatus,
  } = useVersesStore();

  // Timer countdown
  useEffect(() => {
    if (!startedAt || hasEndedRef.current) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);
      setRemainingSeconds(remaining);

      // Broadcast time sync every 5 seconds (host only)
      if (remaining % 5 === 0) {
        channel.broadcastTimeSync(remaining);
      }

      if (remaining <= 0 && !hasEndedRef.current) {
        hasEndedRef.current = true;
        handleMatchEnd();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startedAt, timeLimit, setRemainingSeconds, channel]);

  // Handle match end (time expired or early submit)
  const handleMatchEnd = useCallback(async () => {
    if (!roomId) return;

    const result = await finishMatch(roomId);

    if ("finalResults" in result) {
      const rankingsWithCurrentUser = result.finalResults.map((r) => ({
        ...r,
        isCurrentUser: r.userId === currentUserId,
      }));
      setRankings(rankingsWithCurrentUser);
      channel.broadcastMatchFinished(rankingsWithCurrentUser);
    }

    setStatus("finished");
    onMatchEnd();
  }, [roomId, currentUserId, setRankings, setStatus, channel, onMatchEnd]);

  // Handle challenge solved
  const handleChallengeSolved = useCallback(async () => {
    if (!roomId || !currentBattleId || !currentBattleStartTime) return;

    const completionTimeMs = Date.now() - currentBattleStartTime;

    // Submit result to server
    const result = await submitChallengeResult(
      roomId,
      currentBattleId,
      completionTimeMs
    );

    if ("rankings" in result) {
      const rankingsWithCurrentUser = result.rankings.map((r) => ({
        ...r,
        isCurrentUser: r.userId === currentUserId,
      }));
      setRankings(rankingsWithCurrentUser);
      channel.broadcastLeaderboardUpdate(result.rankings);

      // Broadcast challenge completed
      channel.broadcastChallengeCompleted({
        userId: currentUserId!,
        solved: solvedCount + 1,
        totalTimeMs: totalTimeMs + completionTimeMs,
        rank: rankingsWithCurrentUser.find((r) => r.isCurrentUser)?.rank || 0,
      });
    }

    // Mark as solved in local store (auto-advances to next battle)
    markSolved(currentBattleId, completionTimeMs);

    // Check if all battles completed
    const allSolved = challengePool.every(
      (id) => battleStates[id] === "solved" || id === currentBattleId
    );
    if (allSolved && !hasEndedRef.current) {
      hasEndedRef.current = true;
      handleMatchEnd();
    }
  }, [
    roomId,
    currentBattleId,
    currentBattleStartTime,
    currentUserId,
    solvedCount,
    totalTimeMs,
    challengePool,
    battleStates,
    markSolved,
    setRankings,
    channel,
    handleMatchEnd,
  ]);

  // Handle early submit
  const handleEarlySubmit = useCallback(() => {
    if (!hasEndedRef.current) {
      hasEndedRef.current = true;
      handleMatchEnd();
    }
  }, [handleMatchEnd]);

  if (!currentBattleId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">No battles available</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <VersesHeader
        remainingSeconds={remainingSeconds}
        solvedCount={solvedCount}
        totalBattles={challengePool.length}
        onEarlySubmit={handleEarlySubmit}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Battle List Sidebar */}
        <ResizablePanel defaultSize={15} minSize={12} maxSize={20}>
          <VersesBattleList />
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        {/* Main Arena */}
        <ResizablePanel defaultSize={65} minSize={50}>
          <BattleProvider
            challengeId={currentBattleId}
            source="verses"
            isVersesMode={true}
            onVersesComplete={handleChallengeSolved}
          >
            <div className="h-full [&>main]:h-full [&>main>header]:hidden">
              <BattleArenaContent />
            </div>
          </BattleProvider>
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        {/* Live Leaderboard */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
          <VersesLiveLeaderboard />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
