"use client";

import { useEffect, useRef, useCallback } from "react";
import { useVersusStore } from "@/lib/store/versus-store";
import { submitChallengeResult, finishMatch } from "@/lib/actions/versus";
import { BattleProvider } from "@/contexts/BattleContext";
import { BattleArenaContent } from "@/components/arena/BattleArenaContent";
import { VersusHeader } from "./VersusHeader";
import { VersusBattleList } from "./VersusBattleList";
import { VersusLiveLeaderboard } from "./VersusLiveLeaderboard";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface VersusArenaProps {
  channel: ReturnType<
    typeof import("@/hooks/useVersusChannel").useVersusChannel
  >;
  onMatchEnd: () => void;
}

export function VersusArena({ channel, onMatchEnd }: VersusArenaProps) {
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
  } = useVersusStore();

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
      <VersusHeader
        remainingSeconds={remainingSeconds}
        solvedCount={solvedCount}
        totalBattles={challengePool.length}
        onEarlySubmit={handleEarlySubmit}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Battle List Sidebar */}
        <ResizablePanel defaultSize={15} minSize={12} maxSize={20}>
          <VersusBattleList />
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        {/* Main Arena */}
        <ResizablePanel defaultSize={65} minSize={50}>
          <BattleProvider
            challengeId={currentBattleId}
            source="versus"
            isVersusMode={true}
            onVersusComplete={handleChallengeSolved}
          >
            <div className="h-full [&>main]:h-full [&>main>header]:hidden">
              <BattleArenaContent />
            </div>
          </BattleProvider>
        </ResizablePanel>

        <ResizableHandle className="bg-zinc-800" />

        {/* Live Leaderboard */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
          <VersusLiveLeaderboard />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
